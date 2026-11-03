/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const TOKENS = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

function colorToken(name: string): string {
  const match = TOKENS.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))

  if (!match) {
    throw new Error(`token --color-${name} not found`)
  }

  return match[1]
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(colorToken(foreground)),
    relativeLuminance(colorToken(background)),
  ].sort((left, right) => right - left)

  return (lighter + 0.05) / (darker + 0.05)
}

// Every text on surface combination actually used by the UI.
const BODY_TEXT_PAIRS: [string, string][] = [
  ['ink-400', 'base-900'],
  ['ink-400', 'base-950'],
  ['ink-500', 'base-900'],
  ['ink-500', 'base-950'],
  ['ink-600', 'base-900'],
  ['ink-700', 'base-900'],
  ['ink-900', 'base-900'],
  ['ink-900', 'base-950'],
  ['danger-300', 'base-900'],
  ['accent-300', 'base-900'],
  ['base-950', 'accent-400'],
]

describe('body text contrast', () => {
  it.each(BODY_TEXT_PAIRS)('%s on %s reaches 4.5:1', (foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })
})
