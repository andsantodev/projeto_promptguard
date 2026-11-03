"""Quota consumption against the Supabase RPC, before any paid model call.

Only a truncated hash of the session id is written to the database. A quota
store failure fails closed: the request is rejected instead of running free.
"""

import hashlib
from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx

from backend.config import settings

QUOTA_SCOPE_SESSION_HOUR = "session_hour"
QUOTA_SCOPE_SESSION_DAY = "session_day"
QUOTA_SCOPE_GLOBAL = "global"

GLOBAL_SCOPE_KEY = "global"
QUOTA_TIMEZONE = ZoneInfo("America/Sao_Paulo")

QUOTA_RPC_PATH = "/rest/v1/rpc/promptg_consume_quota"


class QuotaExceeded(Exception):
    def __init__(self, scope: str) -> None:
        super().__init__(f"quota excedida: {scope}")
        self.scope = scope


class QuotaStoreError(Exception):
    """The quota store is unreachable or answered something unexpected."""


def hash_session(session_id: str) -> str:
    return hashlib.sha256(session_id.encode("utf-8")).hexdigest()[:16]


def current_day() -> date:
    return datetime.now(QUOTA_TIMEZONE).date()


def _rpc_url() -> str:
    return f"{settings.supabase_url.rstrip('/')}{QUOTA_RPC_PATH}"


async def _consume(scope: str, scope_key: str, day: date, limit: int) -> bool:
    payload = {
        "p_scope": scope,
        "p_scope_key": scope_key,
        "p_day": day.isoformat(),
        "p_limit": limit,
    }
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.quota_timeout_seconds) as client:
            response = await client.post(_rpc_url(), headers=headers, json=payload)
    except httpx.HTTPError as error:
        raise QuotaStoreError("Falha ao consultar a cota") from error

    if response.status_code != 200:
        raise QuotaStoreError(f"Falha ao consultar a cota (HTTP {response.status_code})")

    try:
        allowed = response.json()
    except ValueError as error:
        raise QuotaStoreError("Resposta da cota em formato inesperado") from error

    if not isinstance(allowed, bool):
        raise QuotaStoreError("Resposta da cota em formato inesperado")

    return allowed


async def consume_quota(session_id: str) -> None:
    """Consume session and global counters, raising on the first exhausted scope.

    Order matters: the global counter is consumed last, so a request blocked by
    a session limit never burns the shared daily budget.
    """
    scope_key = hash_session(session_id)
    day = current_day()

    checks = (
        (QUOTA_SCOPE_SESSION_HOUR, scope_key, settings.session_hour_limit),
        (QUOTA_SCOPE_SESSION_DAY, scope_key, settings.session_day_limit),
        (QUOTA_SCOPE_GLOBAL, GLOBAL_SCOPE_KEY, settings.global_day_limit),
    )

    for scope, key, limit in checks:
        if not await _consume(scope, key, day, limit):
            raise QuotaExceeded(scope)
