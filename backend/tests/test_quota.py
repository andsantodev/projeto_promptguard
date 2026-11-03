import json

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from backend.config import settings
from backend.main import app
from backend.services.quota import current_day, hash_session

QUOTA_URL = f"{settings.supabase_url.rstrip('/')}/rest/v1/rpc/promptg_consume_quota"
COMPLETIONS_URL = f"{settings.openrouter_base_url}/chat/completions"
PROMPT = "Você é o assistente da Acme."
VALID_EVALUATION = json.dumps({"verdict": "failure", "severity": "low", "mitigation": None})


@pytest.fixture
def api_client() -> TestClient:
    # HTTPS base URL so the Secure session cookie is stored and sent back.
    return TestClient(app, base_url="https://testserver")


def quota(allowed: bool) -> httpx.Response:
    return httpx.Response(200, json=allowed)


def completion(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


def post_audit(client: TestClient) -> httpx.Response:
    return client.post(
        "/api/audit",
        json={"systemPrompt": PROMPT, "attackId": "leak-01"},
    )


def quota_calls() -> list[httpx.Request]:
    return [call.request for call in respx.calls if str(call.request.url) == QUOTA_URL]


def completion_calls() -> list[httpx.Request]:
    return [call.request for call in respx.calls if str(call.request.url) == COMPLETIONS_URL]


def quota_payloads(route: respx.Route) -> list[dict[str, object]]:
    return [json.loads(call.request.content) for call in route.calls]


@respx.mock
def test_hour_scope_returns_429_before_any_model_call(api_client: TestClient) -> None:
    respx.post(QUOTA_URL).mock(return_value=quota(False))

    response = post_audit(api_client)

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["code"] == "QUOTA_EXCEEDED"
    assert detail["scope"] == "session_hour"
    assert len(quota_calls()) == 1
    assert completion_calls() == []


@respx.mock
def test_day_scope_returns_429_before_any_model_call(api_client: TestClient) -> None:
    respx.post(QUOTA_URL).mock(side_effect=[quota(True), quota(False)])

    response = post_audit(api_client)

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["code"] == "QUOTA_EXCEEDED"
    assert detail["scope"] == "session_day"
    assert len(quota_calls()) == 2
    assert completion_calls() == []


@respx.mock
def test_global_scope_returns_429_before_any_model_call(api_client: TestClient) -> None:
    respx.post(QUOTA_URL).mock(side_effect=[quota(True), quota(True), quota(False)])

    response = post_audit(api_client)

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["code"] == "QUOTA_EXCEEDED"
    assert detail["scope"] == "global"
    assert len(quota_calls()) == 3
    assert completion_calls() == []


@respx.mock
def test_limits_and_day_come_from_settings(
    api_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "session_hour_limit", 7)
    monkeypatch.setattr(settings, "session_day_limit", 9)
    monkeypatch.setattr(settings, "global_day_limit", 11)

    quota_route = respx.post(QUOTA_URL).mock(return_value=quota(True))
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("alvo"), completion(VALID_EVALUATION)]
    )

    response = post_audit(api_client)

    assert response.status_code == 200
    payloads = quota_payloads(quota_route)
    assert [payload["p_scope"] for payload in payloads] == [
        "session_hour",
        "session_day",
        "global",
    ]
    assert [payload["p_limit"] for payload in payloads] == [7, 9, 11]
    assert {payload["p_day"] for payload in payloads} == {current_day().isoformat()}


@respx.mock
def test_store_failure_returns_503_without_calling_the_model(api_client: TestClient) -> None:
    respx.post(QUOTA_URL).mock(return_value=httpx.Response(500, json={"message": "boom"}))

    response = post_audit(api_client)

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "QUOTA_UNAVAILABLE"
    assert completion_calls() == []


@respx.mock
def test_quota_is_consumed_before_the_model_and_sets_the_cookie(
    api_client: TestClient,
) -> None:
    quota_route = respx.post(QUOTA_URL).mock(return_value=quota(True))
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("alvo"), completion(VALID_EVALUATION)]
    )

    response = post_audit(api_client)

    assert response.status_code == 200
    assert quota_route.call_count == 3

    urls = [str(call.request.url) for call in respx.calls]
    assert urls[:3] == [QUOTA_URL, QUOTA_URL, QUOTA_URL]

    set_cookie = response.headers["set-cookie"]
    assert "promptg_session=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie


@respx.mock
def test_quota_key_is_a_truncated_hash_of_the_session(api_client: TestClient) -> None:
    quota_route = respx.post(QUOTA_URL).mock(return_value=quota(True))
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[completion("alvo"), completion(VALID_EVALUATION)]
    )

    post_audit(api_client)

    cookie = api_client.cookies.get("promptg_session")
    payloads = quota_payloads(quota_route)

    assert cookie
    assert len(payloads[0]["p_scope_key"]) == 16
    assert payloads[0]["p_scope_key"] == hash_session(cookie)
    assert cookie not in str(payloads[0]["p_scope_key"])


@respx.mock
def test_second_request_reuses_the_same_session(api_client: TestClient) -> None:
    quota_route = respx.post(QUOTA_URL).mock(return_value=quota(True))
    respx.post(COMPLETIONS_URL).mock(
        side_effect=[
            completion("alvo"),
            completion(VALID_EVALUATION),
            completion("alvo"),
            completion(VALID_EVALUATION),
        ]
    )

    assert post_audit(api_client).status_code == 200
    assert post_audit(api_client).status_code == 200

    payloads = quota_payloads(quota_route)
    assert len(payloads) == 6
    assert payloads[0]["p_scope_key"] == payloads[3]["p_scope_key"]


@respx.mock
def test_unknown_attack_does_not_consume_quota(api_client: TestClient) -> None:
    response = api_client.post(
        "/api/audit",
        json={"systemPrompt": PROMPT, "attackId": "does-not-exist"},
    )

    assert response.status_code == 422
    assert quota_calls() == []
