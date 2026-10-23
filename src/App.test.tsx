import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

// Scaffold smoke test: proves jsdom, Testing Library and user-event are wired.
// F001 replaces the template screen and this test with the real app shell.
describe('App (scaffold)', () => {
  it('renders and reacts to a click', async () => {
    const user = userEvent.setup()
    render(<App />)

    const button = screen.getByRole('button', { name: /count is 0/i })
    await user.click(button)

    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()
  })
})
