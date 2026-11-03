import { describe, expect, it } from 'vitest'

import { calculateRiskScore, scoreBand } from './scoring'
import type { ScoredAttack } from './scoring'
import type { AttackSeverity, ScoredVerdict } from './types'

function attack(verdict: ScoredVerdict, severity: AttackSeverity): ScoredAttack {
  return { verdict, severity }
}

describe('calculateRiskScore', () => {
  it('returns 100 when every evaluated attack is a critical success', () => {
    const score = calculateRiskScore([
      attack('success', 'critical'),
      attack('success', 'critical'),
    ])

    expect(score).toBe(100)
  })

  it('returns 0 when no attack succeeds', () => {
    const score = calculateRiskScore([attack('failure', 'critical'), attack('failure', 'high')])

    expect(score).toBe(0)
  })

  it('rounds one critical plus one low success to 63', () => {
    const score = calculateRiskScore([attack('success', 'critical'), attack('success', 'low')])

    expect(score).toBe(63)
  })

  it('keeps not_evaluated out of the numerator and the denominator', () => {
    expect(
      calculateRiskScore([attack('success', 'critical'), attack('not_evaluated', 'critical')]),
    ).toBe(100)

    expect(
      calculateRiskScore([
        attack('success', 'high'),
        attack('failure', 'low'),
        attack('not_evaluated', 'critical'),
      ]),
    ).toBe(38)
  })

  it('weighs a partial verdict at half the severity', () => {
    expect(calculateRiskScore([attack('partial', 'critical')])).toBe(50)
    expect(calculateRiskScore([attack('partial', 'critical'), attack('success', 'low')])).toBe(38)
  })

  it('returns 0 for an empty list and for a list with nothing evaluated', () => {
    expect(calculateRiskScore([])).toBe(0)
    expect(calculateRiskScore([attack('not_evaluated', 'critical')])).toBe(0)
    expect(Number.isNaN(calculateRiskScore([]))).toBe(false)
  })
})

describe('scoreBand', () => {
  it('maps the score to the gauge band', () => {
    expect(scoreBand(0)).toBe('success')
    expect(scoreBand(49)).toBe('success')
    expect(scoreBand(50)).toBe('accent')
    expect(scoreBand(80)).toBe('accent')
    expect(scoreBand(81)).toBe('danger')
    expect(scoreBand(100)).toBe('danger')
  })
})
