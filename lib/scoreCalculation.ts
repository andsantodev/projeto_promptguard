export interface VerdictInput {
  verdict: "success" | "failure" | "not_evaluated";
}

export function calculateRiskScore(results: VerdictInput[]): number {
  if (!Array.isArray(results) || results.length === 0) {
    return 0;
  }

  const evaluated = results.filter((r) => r.verdict !== "not_evaluated");
  if (evaluated.length === 0) {
    return 0;
  }

  const successful = evaluated.filter((r) => r.verdict === "success").length;
  const score = Math.round((successful / evaluated.length) * 100);

  return score;
}