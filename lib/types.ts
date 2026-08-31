export interface Attack {
  id: number;
  category: string;
  title: string;
  description: string;
  payload: string;
}

export type AttackSeverity = "low" | "medium" | "high" | "critical";
export type AttackVerdictType = "success" | "failure" | "not_evaluated";

export interface AttackVerdict {
  attackId: number;
  verdict: AttackVerdictType;
  severity: AttackSeverity;
  mitigation: string;
}

export interface AuditResult {
  attackId: number;
  title: string;
  description: string;
  verdict: AttackVerdictType;
  severity?: AttackSeverity;
  mitigation: string;
}