import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { sampleAttacks } from '../../test/fixtures'
import InitialScreen from './InitialScreen'

function renderScreen(overrides: Partial<ComponentProps<typeof InitialScreen>> = {}) {
  const props: ComponentProps<typeof InitialScreen> = {
    status: 'success',
    attacks: sampleAttacks,
    onStart: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  }
  render(<InitialScreen {...props} />)
  return props
}

describe('InitialScreen', () => {
  it.each(['loading', 'success', 'error'] as const)(
    'renders the hero and the illustrative panel in the %s state',
    (status) => {
      renderScreen({ status })

      expect(screen.getByRole('heading', { name: 'Simule ataques de segurança no seu system prompt' })).toBeInTheDocument()
      expect(
        screen.getByText(/PromptGuard simula ataques reais/),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('complementary', { name: 'Exemplo de uso' }),
      ).toBeInTheDocument()
    },
  )

  it('disables the CTA while the catalog loads', () => {
    renderScreen({ status: 'loading' })

    expect(screen.getByRole('button', { name: 'Carregando biblioteca' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Iniciar auditoria' })).not.toBeInTheDocument()
  })

  it('enables the CTA and starts the audit when the catalog is ready', async () => {
    const user = userEvent.setup()
    const props = renderScreen()

    const cta = screen.getByRole('button', { name: 'Iniciar auditoria' })
    expect(cta).toBeEnabled()

    await user.click(cta)

    expect(props.onStart).toHaveBeenCalledTimes(1)
  })

  it('shows an explicit message and no primary action for an empty catalog', () => {
    renderScreen({ attacks: [] })

    expect(screen.getByText('A biblioteca de ataques está vazia.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar auditoria' })).not.toBeInTheDocument()
  })

  it('keeps the hero on error and retries the request', async () => {
    const user = userEvent.setup()
    const props = renderScreen({ status: 'error', attacks: [] })

    expect(screen.getByText('Catálogo indisponível')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Simule ataques de segurança no seu system prompt' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(props.onRetry).toHaveBeenCalledTimes(1)
  })
})
