from fastapi import APIRouter

from backend.services.attack_catalog import ATTACKS, AttackSummary

router = APIRouter(prefix="/api", tags=["attacks"])


@router.get("/attacks", response_model=list[AttackSummary])
def list_attacks() -> list[AttackSummary]:
    """Public catalog: metadata only, never the payload."""
    return [AttackSummary(**attack.model_dump(exclude={"payload"})) for attack in ATTACKS]
