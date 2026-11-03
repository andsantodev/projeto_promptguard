"""Anonymous session: a server-minted cookie used only as a quota key."""

import secrets

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

SESSION_COOKIE = "promptg_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30


def new_session_id() -> str:
    return secrets.token_urlsafe(32)


class SessionMiddleware(BaseHTTPMiddleware):
    """Guarantee a session id for every API call without trusting the client."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        existing = request.cookies.get(SESSION_COOKIE)
        session_id = existing or new_session_id()
        request.state.session_id = session_id

        response = await call_next(request)

        if existing is None:
            response.set_cookie(
                SESSION_COOKIE,
                session_id,
                max_age=SESSION_MAX_AGE_SECONDS,
                httponly=True,
                secure=True,
                samesite="lax",
                path="/",
            )

        return response
