import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  auditResult,
  deferred,
  errorResponse,
  jsonResponse,
  sampleAttacks,
  stubFetchRoutes,
} from '../../test/fixtures'
import ResultsScreen from './ResultsScreen'

const PROMPT = 'Você é o assistente da Acme.'
const PROVIDER_MESSAGE = 'Falha do provedor de LLM. Tente novamente.'
const QUOTA_MESSAGE = 'Cota excedida. Tente novamente mais tarde.'

function renderResults() {
  return render(
    <ResultsScreen systemPrompt={PROMPT} attacks={sampleAttacks} onRestart={vi.fn()} />,
  )
}

function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
}

function lastAuditId(fetchMock: ReturnType<typeof stubFetchRoutes>): string | undefined {
  const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
  const body = JSON.parse(String(lastCall?.[1]?.body ?? '{}')) as { attackId?: string }
  return body.attackId
}

describe('ResultsScreen', () => {
  it('shows one loading card per selected attack in selection order', () => {
    stubFetchRoutes({ audit: () => new Promise<Response>(() => undefined) })

    renderResults()

    expect(cardTitles()).toEqual(['Repetição do texto acima', 'Falso bloco de sistema'])
    expect(screen.getAllByText('Avaliando')).toHaveLength(2)
    expect(screen.getByText('Calculando score')).toBeInTheDocument()
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
  })

  it('fills each card as its own response arrives and keeps the selection order', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    stubFetchRoutes({
      audit: (attackId) => (attackId === 'leak-01' ? first.promise : second.promise),
    })

    renderResults()

    second.resolve(jsonResponse(auditResult({ verdict: 'success', severity: 'high' })))

    expect(await screen.findByText('Ataque bem-sucedido')).toBeInTheDocument()
    expect(screen.getAllByText('Avaliando')).toHaveLength(1)

    first.resolve(jsonResponse(auditResult({ verdict: 'failure', severity: 'low' })))

    await waitFor(() => expect(screen.queryByText('Avaliando')).not.toBeInTheDocument())
    expect(cardTitles()).toEqual(['Repetição do texto acima', 'Falso bloco de sistema'])
    expect(screen.getByText('Ataque resistido')).toBeInTheDocument()
  })

  it('shows the score only when every card has resolved', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    stubFetchRoutes({
      audit: (attackId) => (attackId === 'leak-01' ? first.promise : second.promise),
    })

    renderResults()

    expect(screen.getByText('Calculando score')).toBeInTheDocument()

    first.resolve(
      jsonResponse(
        auditResult({
          verdict: 'success',
          severity: 'critical',
          mitigation: 'Delimite o system prompt.',
        }),
      ),
    )

    expect(await screen.findByText('Delimite o system prompt.')).toBeInTheDocument()
    expect(screen.queryByText('63% de risco')).not.toBeInTheDocument()

    second.resolve(jsonResponse(auditResult({ verdict: 'success', severity: 'low' })))

    expect(await screen.findByText('63% de risco')).toBeInTheDocument()
  })

  it('retries only the failed attack and replaces its card', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetchRoutes({
      audit: (attackId) =>
        Promise.resolve(
          attackId === 'leak-01'
            ? errorResponse(502, 'PROVIDER_ERROR')
            : jsonResponse(auditResult({ verdict: 'failure', severity: 'low' })),
        ),
    })

    renderResults()

    expect(await screen.findByText(PROVIDER_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText('Ataque resistido')).toBeInTheDocument()

    const callsBefore = fetchMock.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(callsBefore + 1))
    expect(lastAuditId(fetchMock)).toBe('leak-01')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('fills the retried card and updates the score when the retry succeeds', async () => {
    const user = userEvent.setup()
    let attempts = 0
    stubFetchRoutes({
      audit: (attackId) => {
        if (attackId === 'leak-01') {
          attempts += 1
          return Promise.resolve(
            attempts === 1
              ? errorResponse(502, 'PROVIDER_ERROR')
              : jsonResponse(auditResult({ verdict: 'success', severity: 'critical' })),
          )
        }

        return Promise.resolve(jsonResponse(auditResult({ verdict: 'success', severity: 'low' })))
      },
    })

    renderResults()

    expect(await screen.findByText(PROVIDER_MESSAGE)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('63% de risco')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })

  it('shows the quota message on 429 and keeps the completed cards', async () => {
    stubFetchRoutes({
      audit: (attackId) =>
        Promise.resolve(
          attackId === 'leak-01'
            ? errorResponse(429, 'QUOTA_EXCEEDED')
            : jsonResponse(auditResult({ verdict: 'success', severity: 'high' })),
        ),
    })

    renderResults()

    expect(await screen.findByText(QUOTA_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText('Ataque bem-sucedido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it.each([502, 503, 504])('shows the provider failure message with retry on %i', async (status) => {
    stubFetchRoutes({ audit: () => Promise.resolve(errorResponse(status, 'PROVIDER_ERROR')) })

    renderResults()

    expect(await screen.findAllByText(PROVIDER_MESSAGE)).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Tentar novamente' })).toHaveLength(2)
  })

  it('shows the unexpected failure message on an unmapped status', async () => {
    stubFetchRoutes({ audit: () => Promise.resolve(errorResponse(500, 'INTERNAL_ERROR')) })

    renderResults()

    expect(await screen.findAllByText('Falha inesperada. Tente novamente.')).toHaveLength(2)
  })

  it.each([429, 500, 502, 504])('keeps the results view rendered after HTTP %i', async (status) => {
    stubFetchRoutes({ audit: () => Promise.resolve(errorResponse(status, 'ANY_CODE')) })

    renderResults()

    await waitFor(() => expect(screen.getAllByText('Não avaliado')).toHaveLength(2))

    expect(screen.getByRole('heading', { name: 'Resultado da auditoria' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    expect(screen.getByText('Sem score')).toBeInTheDocument()
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
  })

  it('shows the audited and evaluating models returned by the API', async () => {
    stubFetchRoutes()

    renderResults()

    expect(await screen.findByText('target-model')).toBeInTheDocument()
    expect(screen.getByText('evaluator-model')).toBeInTheDocument()
  })

  it('announces the progress and the final score', async () => {
    const first = deferred<Response>()
    const second = deferred<Response>()
    stubFetchRoutes({
      audit: (attackId) => (attackId === 'leak-01' ? first.promise : second.promise),
    })

    renderResults()

    expect(screen.getByRole('status')).toHaveTextContent('Avaliando 0 de 2 ataques')

    first.resolve(jsonResponse(auditResult({ verdict: 'success', severity: 'critical' })))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Avaliando 1 de 2 ataques'),
    )

    second.resolve(jsonResponse(auditResult({ verdict: 'success', severity: 'low' })))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Auditoria concluída. Score 63 de 100',
      ),
    )
  })

  it('keeps the results controls reachable by keyboard', async () => {
    stubFetchRoutes()
    const user = userEvent.setup()

    renderResults()
    await screen.findAllByText('Ataque resistido')

    await user.tab()
    expect(screen.getByRole('button', { name: 'Nova auditoria' })).toHaveFocus()

    await user.tab()
    expect(screen.getAllByRole('button', { name: 'Ver evidência' })[0]).toHaveFocus()
  })

  it('aborts in-flight requests when the screen unmounts', async () => {
    const pending = deferred<Response>()
    const fetchMock = stubFetchRoutes({ audit: () => pending.promise })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { unmount } = renderResults()

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    const signal = init?.signal as AbortSignal | undefined
    expect(signal).toBeDefined()

    expect(signal?.aborted).toBe(false)

    unmount()
    expect(signal?.aborted).toBe(true)

    pending.resolve(jsonResponse(auditResult()))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
