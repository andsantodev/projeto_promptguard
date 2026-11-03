import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from backend.services.attack_catalog import ATTACKS, Severity
from backend.services.audit import EvaluatorInvalidJSON, run_audit
from backend.services.openrouter import ProviderError, ProviderTimeout
from backend.services.quota import QuotaExceeded, QuotaStoreError, consume_quota, hash_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["audit"])

ATTACKS_BY_ID = {attack.id: attack for attack in ATTACKS}


class AuditRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    system_prompt: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)
    ] = Field(alias="systemPrompt")
    attack_id: str = Field(alias="attackId", min_length=1)


class AuditResponse(BaseModel):
    verdict: str
    severity: Severity
    mitigation: str | None
    target_response: str = Field(serialization_alias="targetResponse")
    latency_ms: int = Field(serialization_alias="latencyMs")
    target_model: str = Field(serialization_alias="targetModel")
    evaluator_model: str = Field(serialization_alias="evaluatorModel")


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


@router.post("/audit", response_model=AuditResponse)
async def audit(payload: AuditRequest, http_request: Request) -> AuditResponse:
    """Run one attack against the target model and evaluate the answer.

    Stateless by design: nothing is stored, so repeating the call just runs again.
    """
    attack = ATTACKS_BY_ID.get(payload.attack_id)

    if attack is None:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["body", "attackId"],
                    "msg": "Ataque desconhecido",
                    "type": "value_error",
                }
            ],
        )

    session_id: str = http_request.state.session_id
    session_hash = hash_session(session_id)

    # Quota is consumed before any paid model call.
    try:
        await consume_quota(session_id)
    except QuotaExceeded as error:
        logger.warning(
            "quota_exceeded",
            extra={"scope": error.scope, "session": session_hash},
        )
        raise HTTPException(
            status_code=429,
            detail={
                "code": "QUOTA_EXCEEDED",
                "scope": error.scope,
                "message": "Cota excedida. Tente novamente mais tarde.",
            },
        ) from error
    except QuotaStoreError as error:
        logger.error(
            "quota_unavailable",
            extra={"session": session_hash},
        )
        raise _error(
            503,
            "QUOTA_UNAVAILABLE",
            "Não foi possível verificar a cota agora.",
        ) from error

    try:
        result = await run_audit(attack=attack, system_prompt=payload.system_prompt)
    except ProviderTimeout as error:
        logger.warning(
            "audit_failed",
            extra={"attack_id": attack.id, "code": "PROVIDER_TIMEOUT", "session": session_hash},
        )
        raise _error(504, "PROVIDER_TIMEOUT", str(error)) from error
    except EvaluatorInvalidJSON as error:
        logger.warning(
            "audit_failed",
            extra={
                "attack_id": attack.id,
                "code": "EVALUATOR_INVALID_JSON",
                "session": session_hash,
            },
        )
        raise _error(502, "EVALUATOR_INVALID_JSON", str(error)) from error
    except ProviderError as error:
        logger.warning(
            "audit_failed",
            extra={"attack_id": attack.id, "code": "PROVIDER_ERROR", "session": session_hash},
        )
        raise _error(502, "PROVIDER_ERROR", str(error)) from error

    return AuditResponse(
        verdict=result.verdict,
        severity=result.severity,
        mitigation=result.mitigation,
        target_response=result.target_response,
        latency_ms=result.latency_ms,
        target_model=result.target_model,
        evaluator_model=result.evaluator_model,
    )
