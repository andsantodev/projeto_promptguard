from fastapi import APIRouter

from backend.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Cheap readiness probe. Leaks nothing but model identifiers."""
    return {
        "status": "ok",
        "targetModel": settings.target_model,
        "evaluatorModel": settings.evaluator_model,
    }
