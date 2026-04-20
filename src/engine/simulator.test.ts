import { describe, it, expect } from 'vitest'
import { poissonRandom, simulateMatch, simulateMissingMatches, simulateKnockoutMatch } from './simulator'
import type { ScoreMap } from './types'
import { FIXTURES, TEAMS } from '@/data/wc2026'

describe('poissonRandom', () => {
  it('retorna inteiro não-negativo para lambda típico', () => {
    const results = Array.from({ length: 100 }, () => poissonRandom(1.35))
    expect(results.every((r) => Number.isInteger(r) && r >= 0)).toBe(true)
  })

  it('média amostral aproxima lambda para N grande', () => {
    const N = 5000
    const lambda = 1.5
    const sum = Array.from({ length: N }, () => poissonRandom(lambda)).reduce((a, b) => a + b, 0)
    const mean = sum / N
    expect(mean).toBeGreaterThan(lambda - 0.15)
    expect(mean).toBeLessThan(lambda + 0.15)
  })
})

describe('simulateMatch', () => {
  it('retorna objeto com home e away inteiros não-negativos', () => {
    const result = simulateMatch(10, 50)
    expect(Number.isInteger(result.home)).toBe(true)
    expect(Number.isInteger(result.away)).toBe(true)
    expect(result.home).toBeGreaterThanOrEqual(0)
    expect(result.away).toBeGreaterThanOrEqual(0)
  })

  it('favorito (rank baixo) vence azarão (rank alto) mais de 50% das vezes', () => {
    let favoriteWins = 0
    const N = 2000
    for (let i = 0; i < N; i++) {
      const { home, away } = simulateMatch(5, 150)
      if (home > away) favoriteWins++
    }
    expect(favoriteWins / N).toBeGreaterThan(0.50)
  })

  it('times de ranking igual têm win rate próximo de 50% (entre 35% e 65%)', () => {
    let homeWins = 0
    const N = 2000
    for (let i = 0; i < N; i++) {
      const { home, away } = simulateMatch(20, 20)
      if (home > away) homeWins++
    }
    const winRate = homeWins / N
    expect(winRate).toBeGreaterThan(0.35)
    expect(winRate).toBeLessThan(0.65)
  })
})

describe('simulateMissingMatches', () => {
  it('preenche os jogos em branco e preserva os já preenchidos', () => {
    const existingScores: ScoreMap = {
      A1: { home: 2, away: 0 },
      A2: { home: 1, away: 1 },
    }
    const result = simulateMissingMatches(FIXTURES, existingScores, TEAMS)
    expect(result.A1).toEqual({ home: 2, away: 0 })
    expect(result.A2).toEqual({ home: 1, away: 1 })
    expect(Object.keys(result)).toHaveLength(72)
  })

  it('com ScoreMap vazio, preenche todos os 72 jogos', () => {
    const result = simulateMissingMatches(FIXTURES, {}, TEAMS)
    expect(Object.keys(result)).toHaveLength(72)
  })

  it('com ScoreMap completo, não altera nada', () => {
    const full: ScoreMap = {}
    FIXTURES.forEach((f) => { full[f.id] = { home: 1, away: 0 } })
    const result = simulateMissingMatches(FIXTURES, full, TEAMS)
    FIXTURES.forEach((f) => {
      expect(result[f.id]).toEqual({ home: 1, away: 0 })
    })
  })
})

describe('simulateKnockoutMatch', () => {
  it('never returns a draw (100 tries)', () => {
    for (let i = 0; i < 100; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS)
      expect(r.home).not.toBe(r.away)
    }
  })

  it('with forcedWinner as home team, home wins every time (50 tries)', () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS, 'ARG')
      expect(r.home).toBeGreaterThan(r.away)
    }
  })

  it('with forcedWinner as away team, away wins every time (50 tries)', () => {
    for (let i = 0; i < 50; i++) {
      const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS, 'BRA')
      expect(r.away).toBeGreaterThan(r.home)
    }
  })

  it('returns non-negative integers', () => {
    const r = simulateKnockoutMatch('ARG', 'BRA', TEAMS)
    expect(Number.isInteger(r.home)).toBe(true)
    expect(Number.isInteger(r.away)).toBe(true)
    expect(r.home).toBeGreaterThanOrEqual(0)
    expect(r.away).toBeGreaterThanOrEqual(0)
  })

  it('falls back gracefully when team codes are unknown', () => {
    const r = simulateKnockoutMatch('XXX', 'YYY', TEAMS)
    expect(r).toEqual({ home: 1, away: 0 })
    const r2 = simulateKnockoutMatch('XXX', 'YYY', TEAMS, 'YYY')
    expect(r2).toEqual({ home: 0, away: 1 })
  })
})
