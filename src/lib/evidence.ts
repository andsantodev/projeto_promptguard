export const EVIDENCE_LIMIT = 800

export type TruncatedEvidence = {
  text: string
  truncated: boolean
}

export function truncateEvidence(text: string, limit = EVIDENCE_LIMIT): TruncatedEvidence {
  if (text.length <= limit) {
    return { text, truncated: false }
  }

  return { text: text.slice(0, limit), truncated: true }
}
