"""Versioned attack library: loading, validation and the public shape.

The YAML file is the source of truth. It is validated at import time, so a
malformed library stops the application at startup instead of at the first
request.
"""

from enum import StrEnum
from pathlib import Path

import yaml
from pydantic import BaseModel, ConfigDict, Field, ValidationError

ATTACKS_PATH = Path(__file__).resolve().parent.parent / "data" / "attacks.yaml"


class Category(StrEnum):
    INSTRUCTION_OVERRIDE = "instruction_override"
    ROLE_PLAY = "role_play"
    SYSTEM_PROMPT_LEAKAGE = "system_prompt_leakage"
    OBFUSCATION = "obfuscation"


class Severity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CatalogError(ValueError):
    """The versioned attack library is malformed."""


class Attack(BaseModel):
    """Full entry. Holds the payload, which never leaves the backend."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    category: Category
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    severity: Severity
    goal: str = Field(min_length=1)
    payload: str = Field(min_length=1)


class AttackSummary(BaseModel):
    """Public shape served by GET /api/attacks: everything except the payload."""

    id: str
    category: Category
    title: str
    description: str
    severity: Severity


def load_attacks(text: str) -> tuple[Attack, ...]:
    """Parse and validate the library, returning entries ordered by id."""
    try:
        raw = yaml.safe_load(text)
    except yaml.YAMLError as error:
        raise CatalogError(f"attack library is not valid YAML: {error}") from error

    if not isinstance(raw, list) or not raw:
        raise CatalogError("attack library must be a non-empty list of attacks")

    attacks: list[Attack] = []
    seen: set[str] = set()

    for index, entry in enumerate(raw):
        try:
            attack = Attack.model_validate(entry)
        except ValidationError as error:
            raise CatalogError(f"invalid attack at position {index}: {error}") from error

        if attack.id in seen:
            raise CatalogError(f"duplicate attack id: {attack.id}")

        seen.add(attack.id)
        attacks.append(attack)

    return tuple(sorted(attacks, key=lambda attack: attack.id))


def load_catalog_file(path: Path) -> tuple[Attack, ...]:
    return load_attacks(path.read_text(encoding="utf-8"))


ATTACKS = load_catalog_file(ATTACKS_PATH)
