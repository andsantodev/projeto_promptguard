import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ConfigModal from '../components/screens/ConfigModal'
import InitialScreen from '../components/screens/InitialScreen'
import ResultsScreen from '../components/screens/ResultsScreen'
import { sampleAttacks, stubFetchRoutes } from './fixtures'

// Portuguese words that must always carry their accent in the interface.
const UNACCENTED_WORDS = [
  'nao',
  'voce',
  'sera',
  'tambem',
  'instrucoes',
  'configuracao',
  'seguranca',
  'catalogo',
  'indisponivel',
  'avaliacao',
  'concluida',
  'possivel',
  'proximo',
  'ultimo',
  'endereco',
  'usuario',
  'padrao',
  'opcao',
  'numero',
]

function expectAccentedCopy() {
  const text = document.body.textContent ?? ''

  for (const word of UNACCENTED_WORDS) {
    expect(text, `"${word}" sem acento no texto da interface`).not.toMatch(
      new RegExp(`\\b${word}\\b`, 'i'),
    )
  }
}

describe('interface copy', () => {
  it('keeps the initial screen accented while loading and when empty', () => {
    const { unmount } = render(
      <InitialScreen status="loading" attacks={[]} onStart={vi.fn()} onRetry={vi.fn()} />,
    )
    expectAccentedCopy()
    unmount()

    render(
      <InitialScreen status="success" attacks={[]} onStart={vi.fn()} onRetry={vi.fn()} />,
    )
    expectAccentedCopy()
  })

  it('keeps the configuration modal accented', () => {
    render(<ConfigModal attacks={sampleAttacks} onClose={vi.fn()} onConfirm={vi.fn()} />)

    expectAccentedCopy()
  })

  it('keeps the results screen accented', async () => {
    stubFetchRoutes()
    render(
      <ResultsScreen systemPrompt="Você é o assistente da Acme." attacks={sampleAttacks} onRestart={vi.fn()} />,
    )

    await screen.findAllByText('Ataque resistido')

    expectAccentedCopy()
  })
})
