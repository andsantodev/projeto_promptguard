from textwrap import dedent

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.attack_catalog import ATTACKS, CatalogError, load_attacks

client = TestClient(app)

EXPECTED_KEYS = {"id", "category", "title", "description", "severity"}


def attack_yaml(**overrides: str | None) -> str:
    fields: dict[str, str | None] = {
        "id": "override-99",
        "category": "instruction_override",
        "title": "Título do ataque",
        "description": "Descrição do ataque.",
        "severity": "high",
        "goal": "Objetivo do ataque.",
        "payload": "Conteúdo do ataque.",
    }
    fields.update(overrides)
    lines = [
        f"- {key}: {value}" if key == "id" else f"  {key}: {value}"
        for key, value in fields.items()
        if value is not None
    ]
    return "\n".join(lines) + "\n"


def test_catalog_serves_ten_attacks() -> None:
    response = client.get("/api/attacks")

    assert response.status_code == 200
    assert len(response.json()) == 10


def test_catalog_covers_the_four_categories() -> None:
    categories = {entry["category"] for entry in client.get("/api/attacks").json()}

    assert categories == {
        "instruction_override",
        "role_play",
        "system_prompt_leakage",
        "obfuscation",
    }


def test_every_entry_has_metadata_and_severity() -> None:
    for entry in client.get("/api/attacks").json():
        assert set(entry) == EXPECTED_KEYS
        assert entry["title"]
        assert entry["description"]
        assert entry["severity"] in {"low", "medium", "high", "critical"}


def test_every_attack_documents_a_goal() -> None:
    for attack in ATTACKS:
        assert attack.goal.strip()
        assert attack.goal not in attack.description


def test_response_never_contains_a_payload() -> None:
    body = client.get("/api/attacks").text
    payload_markers = [attack.payload.splitlines()[0].strip() for attack in ATTACKS]

    assert all(marker not in body for marker in payload_markers)


def test_attacks_are_served_ordered_by_id() -> None:
    ids = [entry["id"] for entry in client.get("/api/attacks").json()]

    assert ids == sorted(ids)


def test_loader_orders_entries_by_id_regardless_of_file_order() -> None:
    text = dedent(
        """
        - id: z-01
          category: role_play
          title: Segunda
          description: Descrição.
          severity: low
          goal: Objetivo.
          payload: Conteúdo.
        - id: a-01
          category: obfuscation
          title: Primeira
          description: Descrição.
          severity: low
          goal: Objetivo.
          payload: Conteúdo.
        """
    )

    assert [attack.id for attack in load_attacks(text)] == ["a-01", "z-01"]


def test_loader_rejects_entry_with_missing_field() -> None:
    text = attack_yaml(title=None)

    with pytest.raises(CatalogError, match="invalid attack at position 0"):
        load_attacks(text)


def test_loader_rejects_duplicate_id() -> None:
    entry = attack_yaml()
    text = entry + entry

    with pytest.raises(CatalogError, match="duplicate attack id: override-99"):
        load_attacks(text)


def test_loader_rejects_content_that_is_not_a_list() -> None:
    with pytest.raises(CatalogError, match="non-empty list"):
        load_attacks("id: override-99\n")
