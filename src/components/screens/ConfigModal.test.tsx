import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { manyAttacks, sampleAttacks } from '../../test/fixtures'
import ConfigModal from './ConfigModal'

function renderModal(overrides: Partial<ComponentProps<typeof ConfigModal>> = {}) {
  const props: ComponentProps<typeof ConfigModal> = {
    attacks: manyAttacks,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  }
  render(<ConfigModal {...props} />)
  return props
}

function promptField() {
  return screen.getByLabelText('System prompt')
}

function confirmButton() {
  return screen.getByRole('button', { name: 'Confirmar auditoria' })
}

describe('ConfigModal', () => {
  it('accepts pasted text in the system prompt field', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(promptField())
    await user.paste('Você é um assistente de suporte.')

    expect(promptField()).toHaveValue('Você é um assistente de suporte.')
  })

  it('keeps confirmation disabled until there is a prompt and at least one attack', async () => {
    const user = userEvent.setup()
    renderModal()

    expect(confirmButton()).toBeDisabled()

    await user.type(promptField(), 'Você é um assistente.')
    expect(confirmButton()).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: /Ataque 1/ }))
    expect(confirmButton()).toBeEnabled()
  })

  it('blocks the seventh attack and shows 6/6', async () => {
    const user = userEvent.setup()
    renderModal()

    for (const index of [1, 2, 3, 4, 5, 6]) {
      await user.click(screen.getByRole('checkbox', { name: new RegExp(`Ataque ${index} `) }))
    }

    expect(screen.getByText('6/6')).toBeInTheDocument()

    const seventh = screen.getByRole('checkbox', { name: /Ataque 7/ })
    expect(seventh).toBeDisabled()

    await user.click(seventh)

    expect(screen.getByText('6/6')).toBeInTheDocument()
    expect(seventh).not.toBeChecked()
  })

  it('warns and blocks confirmation above 4000 characters', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('checkbox', { name: /Ataque 1/ }))

    fireEvent.change(promptField(), { target: { value: 'a'.repeat(4001) } })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O prompt passa de 4000 caracteres. Reduza para continuar.',
    )
    expect(confirmButton()).toBeDisabled()
  })

  it('closes with Escape', async () => {
    const user = userEvent.setup()
    const props = renderModal()

    await user.keyboard('{Escape}')

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop click but not on a click inside the dialog', async () => {
    const user = userEvent.setup()
    const props = renderModal()

    await user.click(screen.getByRole('heading', { name: 'Configurar auditoria' }))
    expect(props.onClose).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog')
    await user.click(dialog.parentElement as HTMLElement)

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps every control reachable by keyboard with a visible focus style', async () => {
    const user = userEvent.setup()
    renderModal({ attacks: sampleAttacks })

    await user.type(promptField(), 'Você é um assistente.')
    await user.click(screen.getByRole('checkbox', { name: /Repetição do texto acima/ }))
    await user.click(promptField())

    expect(promptField()).toHaveFocus()

    await user.tab()
    const firstAttack = screen.getByRole('checkbox', { name: /Repetição do texto acima/ })
    expect(firstAttack).toHaveFocus()
    expect(firstAttack).toHaveClass('focus-visible:outline-2')

    await user.tab()
    expect(screen.getByRole('checkbox', { name: /Falso bloco de sistema/ })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await user.tab()
    expect(confirmButton()).toHaveFocus()
  })

  it('keeps Tab inside the modal when leaving the last element', async () => {
    const user = userEvent.setup()
    renderModal({ attacks: sampleAttacks })
    await user.type(promptField(), 'Você é um assistente.')
    await user.click(screen.getByRole('checkbox', { name: /Repetição do texto acima/ }))

    confirmButton().focus()
    await user.tab()

    expect(promptField()).toHaveFocus()
  })

  it('sends the trimmed prompt and the attack ids in click order', async () => {
    const user = userEvent.setup()
    const props = renderModal({ attacks: sampleAttacks })

    await user.click(promptField())
    await user.paste('  Você é um assistente.  ')
    await user.click(screen.getByRole('checkbox', { name: /Falso bloco de sistema/ }))
    await user.click(screen.getByRole('checkbox', { name: /Repetição do texto acima/ }))
    await user.click(confirmButton())

    expect(props.onConfirm).toHaveBeenCalledWith('Você é um assistente.', [
      'override-01',
      'leak-01',
    ])
  })
})
