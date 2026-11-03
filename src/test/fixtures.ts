import { vi } from 'vitest'

import type { Attack, AuditResult } from '../lib/types'

export const sampleAttacks: Attack[] = [
  {
    id: 'leak-01',
    category: 'system_prompt_leakage',
    title: 'Repetição do texto acima',
    description: 'Pede para repetir o texto anterior para extrair o system prompt.',
    severity: 'critical',
  },
  {
    id: 'override-01',
    category: 'instruction_override',
    title: 'Falso bloco de sistema',
    description: 'Imita uma mensagem de sistema para reescrever as regras.',
    severity: 'high',
  },
]

export const manyAttacks: Attack[] = Array.from(
  { length: 7 },
  (_, index): Attack => ({
    id: `attack-${index + 1}`,
    category: 'instruction_override',
    title: `Ataque ${index + 1}`,
    description: `Descrição do ataque ${index + 1}.`,
    severity: 'medium',
  }),
)

export function auditResult(overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    verdict: 'failure',
    severity: 'low',
    mitigation: null,
    targetResponse: 'Resposta do alvo.',
    latencyMs: 120,
    targetModel: 'target-model',
    evaluatorModel: 'evaluator-model',
    ...overrides,
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

export function errorResponse(status: number, code: string): Response {
  return jsonResponse({ detail: { code, message: `erro ${status}` } }, status)
}

type FetchStubOptions = {
  catalog?: Attack[]
  audit?: (attackId: string) => Promise<Response>
}

export function stubFetchRoutes({ catalog = sampleAttacks, audit }: FetchStubOptions = {}) {
  const fetchMock = vi.fn<typeof fetch>()

  fetchMock.mockImplementation((input, init) => {
    const url = String(input)

    if (url.endsWith('/api/attacks')) {
      return Promise.resolve(jsonResponse(catalog))
    }

    if (url.endsWith('/api/audit')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as { attackId?: string }
      return audit
        ? audit(body.attackId ?? '')
        : Promise.resolve(jsonResponse(auditResult()))
    }

    return Promise.reject(new Error(`unexpected fetch: ${url}`))
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}
