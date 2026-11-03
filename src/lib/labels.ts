import type { AttackCategory, AttackSeverity, AuditErrorKind, ScoredVerdict } from './types'

export const CATEGORY_LABELS: Record<AttackCategory, string> = {
  instruction_override: 'Sobrescrita de instrução',
  role_play: 'Role-play',
  system_prompt_leakage: 'Vazamento do system prompt',
  obfuscation: 'Ofuscação e encoding',
}

export const SEVERITY_LABELS: Record<AttackSeverity, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export const VERDICT_LABELS: Record<ScoredVerdict, string> = {
  success: 'Ataque bem-sucedido',
  partial: 'Obedeceu em parte',
  failure: 'Ataque resistido',
  not_evaluated: 'Não avaliado',
}

export const AUDIT_ERROR_MESSAGES: Record<AuditErrorKind, string> = {
  quota: 'Cota excedida. Tente novamente mais tarde.',
  provider: 'Falha do provedor de LLM. Tente novamente.',
  unexpected: 'Falha inesperada. Tente novamente.',
}
