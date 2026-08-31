import { describe, expect, it } from "vitest";
import {
  calculateRiskScore,
  type VerdictInput,
} from "@/lib/scoreCalculation";

const success = (): VerdictInput => ({ verdict: "success" });
const failure = (): VerdictInput => ({ verdict: "failure" });
const notEvaluated = (): VerdictInput => ({ verdict: "not_evaluated" });

describe("F009 - Risk score calculation", () => {
  it("score with 6/6 attacks failed equals score with 1/1 failed (both 100%)", () => {
    const one = [success()];
    const six = Array.from({ length: 6 }, success);

    expect(calculateRiskScore(one)).toBe(100);
    expect(calculateRiskScore(six)).toBe(100);
    expect(calculateRiskScore(six)).toBe(calculateRiskScore(one));
  });

  it("score with 0 successful attacks is 0%, regardless of how many attacks ran", () => {
    expect(calculateRiskScore([failure()])).toBe(0);
    expect(calculateRiskScore(Array.from({ length: 6 }, failure))).toBe(0);
  });

  it("returns a proportional score in the middle of the range", () => {
    const results = [success(), success(), failure(), failure()];
    expect(calculateRiskScore(results)).toBe(50);
  });

  it("returns 0 for an empty result set (no NaN)", () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it("rounds the result to an integer", () => {
    const results = [success(), success(), failure()];
    expect(calculateRiskScore(results)).toBe(67);
  });

  it("excludes 'not_evaluated' attacks from the score denominator (F012)", () => {
    const results = [
      success(),
      notEvaluated(),
      notEvaluated(),
      notEvaluated(),
    ];
    expect(calculateRiskScore(results)).toBe(100);
  });

  it("returns 0 when every attack is 'not_evaluated' (F012)", () => {
    const results = [notEvaluated(), notEvaluated(), notEvaluated()];
    expect(calculateRiskScore(results)).toBe(0);
  });

  it("ignores 'not_evaluated' in a mixed set (F012)", () => {
    const results = [
      success(),
      success(),
      failure(),
      notEvaluated(),
    ];
    expect(calculateRiskScore(results)).toBe(67);
  });
});