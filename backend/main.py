from fastapi import FastAPI, HTTPException

from backend.config import settings
from backend.routers import attacks, audit, health
from backend.services.security_headers import SecurityHeadersMiddleware
from backend.services.session import SessionMiddleware

app = FastAPI(
    title="PromptGuard API",
    version="2.0.0",
    docs_url=None,
    redoc_url=None,
)

app.include_router(health.router)
app.include_router(attacks.router)
app.include_router(audit.router)

app.add_middleware(SessionMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    include_in_schema=False,
)
async def unknown_api_route(path: str) -> None:
    """Answer API misses with 404 instead of the SPA fallback."""
    raise HTTPException(status_code=404, detail="Not Found")

# In production the Vite build is served by the same function (single origin).
if settings.frontend_dist.is_dir():
    app.frontend("/", directory=str(settings.frontend_dist), fallback="index.html")
