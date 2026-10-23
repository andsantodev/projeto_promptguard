from fastapi import FastAPI

from backend.config import settings
from backend.routers import health

app = FastAPI(
    title="PromptGuard API",
    version="2.0.0",
    docs_url=None,
    redoc_url=None,
)

app.include_router(health.router)

# In production the Vite build is served by the same function (single origin).
if settings.frontend_dist.is_dir():
    app.frontend("/", directory=str(settings.frontend_dist), fallback="index.html")
