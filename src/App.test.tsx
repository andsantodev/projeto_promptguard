import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'
import { stubFetchRoutes } from './test/fixtures'

describe('App shell', () => {
  it('renders the initial screen and enables the CTA once the catalog loads', async () => {
    stubFetchRoutes()
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Simule ataques de segurança no seu system prompt' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Iniciar auditoria' })).toBeEnabled()
  })

  it('opens the modal on the prompt field and returns focus to the CTA on Escape', async () => {
    stubFetchRoutes()
    const user = userEvent.setup()
    render(<App />)

    const cta = await screen.findByRole('button', { name: 'Iniciar auditoria' })
    await user.click(cta)

    expect(screen.getByRole('dialog', { name: 'Configurar auditoria' })).toBeInTheDocument()
    expect(screen.getByLabelText('System prompt')).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cta).toHaveFocus()
  })

  it('starts the audit and shows the selected attacks on the results screen', async () => {
    stubFetchRoutes()
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Iniciar auditoria' }))
    await user.click(screen.getByLabelText('System prompt'))
    await user.paste('Você é um assistente.')
    await user.click(screen.getByRole('checkbox', { name: /Repetição do texto acima/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar auditoria' }))

    expect(screen.getByRole('heading', { name: 'Resultado da auditoria' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Repetição do texto acima' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nova auditoria' }))

    expect(screen.getByRole('heading', { name: 'Simule ataques de segurança no seu system prompt' })).toBeInTheDocument()
  })
})
