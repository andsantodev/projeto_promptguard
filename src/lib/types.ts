// The app is a single page with three screen states and no router.
export type Screen = 'initial' | 'config' | 'results'

export type AttackCategory =
  | 'instruction_override'
  | 'role_play'
  | 'system_prompt_leakage'
  | 'obfuscation'

export type AttackSeverity = 'low' | 'medium' | 'high' | 'critical'

// What the evaluator returns today. `not_evaluated` is added by the UI when a
// request fails and the attack could not be judged.
export type AuditVerdict = 'success' | 'partial' | 'failure'
export type ScoredVerdict = AuditVerdict | 'not_evaluated'

// Client-side classification of a failed audit request.
export type AuditErrorKind = 'quota' | 'provider' | 'unexpected'

// Public shape served by GET /api/attacks. The payload stays in the backend.
export type Attack = {
  id: string
  category: AttackCategory
  title: string
  description: string
  severity: AttackSeverity
}

// Response of POST /api/audit.
export type AuditResult = {
  verdict: AuditVerdict
  severity: AttackSeverity
  mitigation: string | null
  targetResponse: string
  latencyMs: number
  targetModel: string
  evaluatorModel: string
}
