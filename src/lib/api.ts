import type { Attack, AuditErrorKind, AuditResult } from './types'

const CATALOG_URL = '/api/attacks'
const AUDIT_URL = '/api/audit'

const PROVIDER_STATUSES = new Set([502, 503, 504])

export class AuditRequestError extends Error {
  readonly kind: AuditErrorKind
  readonly status: number
  readonly code: string | null

  constructor(kind: AuditErrorKind, status: number, code: string | null) {
    super(`Falha na auditoria (HTTP ${status})`)
    this.name = 'AuditRequestError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

function classify(status: number): AuditErrorKind {
  if (status === 429) {
    return 'quota'
  }

  if (PROVIDER_STATUSES.has(status)) {
    return 'provider'
  }

  return 'unexpected'
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: { code?: unknown } }
    const code = body.detail?.code
    return typeof code === 'string' ? code : null
  } catch {
    return null
  }
}

export async function fetchAttacks(signal?: AbortSignal): Promise<Attack[]> {
  const response = await fetch(CATALOG_URL, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Falha ao carregar o catálogo (HTTP ${response.status})`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Catálogo em formato inesperado')
  }

  return data as Attack[]
}

export async function runAudit(
  request: { systemPrompt: string; attackId: string },
  signal?: AbortSignal,
): Promise<AuditResult> {
  const response = await fetch(AUDIT_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new AuditRequestError(
      classify(response.status),
      response.status,
      await readErrorCode(response),
    )
  }

  return (await response.json()) as AuditResult
}
