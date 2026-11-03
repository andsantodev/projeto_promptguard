import json
import logging

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from backend.config import settings
from backend.main import app
from backend.routers.audit import ATTACKS_BY_ID

client = TestClient(app)

COMPLETIONS_URL = f"{settings.openrouter_base_url}/chat/completions"
QUOTA_URL = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/promptg_consume_quota"
PROMPT = "Você é o assistente da Acme."
ATTACK = ATTACKS_BY_ID["leak-01"]
VALID_EVALUATION = json.dumps(
    {
        "verdict": "success",
        "severity": "critical",
        "mitigation": "Delimite o system prompt e recuse pedidos de repetição.",
    }
)


def completion(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


def allow_quota() -> None:
    respx.post(QUOTA_URL).mock(return_value=httpx.Response(200, json=True))


def post_audit(**overrides: str) -> httpx.Response:
    payload = {"systemPrompt": PROMPT, "attackId": ATTACK.id}
    payload.update(overrides)
    return client.post("/api/audit", json=payload)


@respx.mock
def test_audit_returns_the_full_result() -> None:
    allow_quota()
    route = respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("ACESSO CONCEDIDO"), completion(VALID_EVALUATION)]
    )

    response = post_audit()

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "verdict",
        "severity",
        "mitigation",
        "targetResponse",
        "latencyMs",
        "targetModel",
        "evaluatorModel",
    }
    assert body["verdict"] == "success"
    assert body["severity"] == "critical"
    assert body["mitigation"] == "Delimite o system prompt e recuse pedidos de repetição."
    assert body["targetResponse"] == "ACESSO CONCEDIDO"
    assert body["targetModel"] == settings.target_model
    assert body["evaluatorModel"] == settings.evaluator_model
    assert isinstance(body["latencyMs"], int)

    target_request = json.loads(route.calls[0].request.content)
    assert target_request["model"] == settings.target_model
    assert target_request["messages"] == [
        {"role": "system", "content": PROMPT},
        {"role": "user", "content": ATTACK.payload},
    ]
    assert "response_format" not in target_request

    evaluator_request = json.loads(route.calls[1].request.content)
    assert evaluator_request["model"] == settings.evaluator_model
    assert evaluator_request["response_format"]["type"] == "json_schema"
    evaluator_prompt = evaluator_request["messages"][1]["content"]
    assert ATTACK.goal in evaluator_prompt
    assert ATTACK.payload.splitlines()[0] not in evaluator_prompt
    assert "ACESSO CONCEDIDO" in evaluator_prompt
    assert f"INICIO_SEVERIDADE_DECLARADA\n{ATTACK.severity}" in evaluator_prompt
    assert evaluator_request["messages"][0]["role"] == "system"
    assert PROMPT not in evaluator_request["messages"][0]["content"]
    assert ATTACK.payload.splitlines()[0] not in evaluator_request["messages"][0]["content"]


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"systemPrompt": ""}, "systemPrompt"),
        ({"systemPrompt": "   "}, "systemPrompt"),
        ({"systemPrompt": "a" * 4001}, "systemPrompt"),
    ],
)
def test_invalid_prompt_returns_field_level_422(
    overrides: dict[str, str], field: str
) -> None:
    response = post_audit(**overrides)

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(field in error["loc"] for error in detail)


@respx.mock
def test_unknown_attack_returns_field_level_422_without_calling_the_provider() -> None:
    response = post_audit(attackId="does-not-exist")

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["body", "attackId"]
    assert len(respx.calls) == 0


@respx.mock
def test_invalid_evaluator_json_twice_returns_502() -> None:
    allow_quota()
    route = respx.post(COMPLETIONS_URL).mock(
        side_effect=[
            completion("Resposta do alvo."),
            completion("isto não é json"),
            completion('{"verdict": "talvez", "severity": "critical", "mitigation": null}'),
        ]
    )

    response = post_audit()

    assert response.status_code == 502
    assert response.json()["detail"] == {
        "code": "EVALUATOR_INVALID_JSON",
        "message": "O avaliador não devolveu JSON válido",
    }
    assert "Traceback" not in response.text
    assert route.call_count == 3


@respx.mock
def test_invalid_evaluator_json_is_retried_once() -> None:
    allow_quota()
    route = respx.post(COMPLETIONS_URL).mock(
        side_effect=[
            completion("Resposta do alvo."),
            completion("isto não é json"),
            completion(VALID_EVALUATION),
        ]
    )

    response = post_audit()

    assert response.status_code == 200
    assert response.json()["verdict"] == "success"
    assert route.call_count == 3


@respx.mock
def test_provider_timeout_returns_504() -> None:
    allow_quota()
    respx.post(COMPLETIONS_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    response = post_audit()

    assert response.status_code == 504
    assert response.json()["detail"]["code"] == "PROVIDER_TIMEOUT"
    assert "Traceback" not in response.text


@respx.mock
def test_provider_failure_returns_502() -> None:
    allow_quota()
    respx.post(COMPLETIONS_URL).mock(
        return_value=httpx.Response(500, json={"error": "boom"})
    )

    response = post_audit()

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "PROVIDER_ERROR"
    assert "Traceback" not in response.text


@respx.mock
def test_empty_target_response_skips_the_evaluator() -> None:
    allow_quota()
    route = respx.post(COMPLETIONS_URL).mock(
        return_value=httpx.Response(200, json={"choices": [{"message": {"content": None}}]})
    )

    response = post_audit()

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "failure"
    assert body["severity"] == "low"
    assert body["targetResponse"] == ""
    assert route.call_count == 1


@respx.mock
def test_partial_verdict_is_returned_intact() -> None:
    allow_quota()
    partial = json.dumps(
        {"verdict": "partial", "severity": "medium", "mitigation": "Reforce a regra."}
    )
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("Resposta do alvo."), completion(partial)]
    )

    response = post_audit()

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "partial"
    assert body["severity"] == "medium"
    assert body["mitigation"] == "Reforce a regra."


@respx.mock
def test_logs_never_contain_the_prompt_or_the_payload(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO)
    allow_quota()
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("Resposta do alvo."), completion(VALID_EVALUATION)]
    )

    post_audit()

    logged = " ".join(
        f"{record.getMessage()} {record.__dict__}" for record in caplog.records
    )
    assert "audit_completed" in logged
    assert PROMPT not in logged
    assert ATTACK.payload.splitlines()[0] not in logged
