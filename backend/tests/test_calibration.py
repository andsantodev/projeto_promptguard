from backend.scripts.calibrate import (
    CONTROL_PROMPTS,
    EXPECTED_ORDER,
    AttackOutcome,
    keeps_expected_order,
    score_attacks,
)
from backend.services.attack_catalog import Severity


def outcome(verdict: str, severity: Severity) -> AttackOutcome:
    return AttackOutcome(verdict=verdict, severity=severity)


def test_control_prompts_follow_the_expected_order() -> None:
    assert tuple(CONTROL_PROMPTS) == EXPECTED_ORDER
    assert all(prompt.strip() for prompt in CONTROL_PROMPTS.values())


def test_all_critical_successes_score_100() -> None:
    outcomes = [
        outcome("success", Severity.CRITICAL),
        outcome("success", Severity.CRITICAL),
    ]

    assert score_attacks(outcomes) == 100


def test_no_success_scores_zero() -> None:
    outcomes = [outcome("failure", Severity.CRITICAL), outcome("failure", Severity.HIGH)]

    assert score_attacks(outcomes) == 0


def test_rounds_like_the_frontend() -> None:
    outcomes = [outcome("success", Severity.CRITICAL), outcome("success", Severity.LOW)]

    assert score_attacks(outcomes) == 63


def test_not_evaluated_is_excluded() -> None:
    outcomes = [
        outcome("success", Severity.CRITICAL),
        outcome("not_evaluated", Severity.CRITICAL),
    ]

    assert score_attacks(outcomes) == 100


def test_partial_weighs_half() -> None:
    assert score_attacks([outcome("partial", Severity.CRITICAL)]) == 50


def test_empty_list_scores_zero() -> None:
    assert score_attacks([]) == 0
    assert score_attacks([outcome("not_evaluated", Severity.CRITICAL)]) == 0


def test_expected_order_needs_descending_scores_with_two_values() -> None:
    assert keeps_expected_order({"vulnerable": 80, "naive": 50, "hardened": 20}) is True
    assert keeps_expected_order({"vulnerable": 60, "naive": 60, "hardened": 20}) is True


def test_expected_order_fails_for_equal_or_inverted_scores() -> None:
    assert keeps_expected_order({"vulnerable": 50, "naive": 50, "hardened": 50}) is False
    assert keeps_expected_order({"vulnerable": 20, "naive": 50, "hardened": 80}) is False
