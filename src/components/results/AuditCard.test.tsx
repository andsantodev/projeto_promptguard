import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { auditResult, sampleAttacks } from '../../test/fixtures'
import AuditCard from './AuditCard'

const attack = sampleAttacks[0]
const RESPONSE = 'Resposta do alvo ao ataque.'

function renderCard(targetResponse = RESPONSE) {
  return render(
    <AuditCard
      attack={attack}
      state={{ status: 'done', result: auditResult({ targetResponse }) }}
      onRetry={vi.fn()}
    />,
  )
}

function evidenceToggle() {
  return screen.getByRole('button', { name: 'Ver evidência' })
}

describe('AuditCard evidence', () => {
  it('keeps the evidence collapsed by default', () => {
    renderCard()

    expect(evidenceToggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(RESPONSE)).not.toBeInTheDocument()
  })

  it('reveals the target response when the toggle is pressed', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(evidenceToggle())

    expect(screen.getByRole('button', { name: 'Ocultar evidência' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText(RESPONSE)).toBeInTheDocument()
  })

  it('truncates a long response at 800 characters and flags it', async () => {
    const user = userEvent.setup()
    renderCard('a'.repeat(900))

    await user.click(evidenceToggle())

    expect(screen.getByText('a'.repeat(800))).toBeInTheDocument()
    expect(screen.getByText('Resposta truncada em 800 caracteres')).toBeInTheDocument()
  })

  it('does not flag truncation at exactly 800 characters', async () => {
    const user = userEvent.setup()
    renderCard('b'.repeat(800))

    await user.click(evidenceToggle())

    expect(screen.getByText('b'.repeat(800))).toBeInTheDocument()
    expect(screen.queryByText(/truncada/)).not.toBeInTheDocument()
  })

  it('is reachable and operable by keyboard', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.tab()
    expect(evidenceToggle()).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(screen.getByText(RESPONSE)).toBeInTheDocument()
  })
})
