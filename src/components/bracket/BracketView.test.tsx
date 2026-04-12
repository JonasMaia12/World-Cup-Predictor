import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BracketView } from './BracketView'
import type { Bracket } from '@/engine/types'

function makeEmptyBracket(): Bracket {
  const emptyMatch = (id: string) => ({ id, home: null, away: null })
  return {
    roundOf32: Array.from({ length: 16 }, (_, i) => emptyMatch(`r32-${i + 1}`)),
    roundOf16: Array.from({ length: 16 }, (_, i) => emptyMatch(`r16-${i + 1}`)),
    quarterFinals: Array.from({ length: 8 }, (_, i) => emptyMatch(`qf-${i + 1}`)),
    semiFinals: Array.from({ length: 4 }, (_, i) => emptyMatch(`sf-${i + 1}`)),
    thirdPlace: emptyMatch('3rd'),
    final: emptyMatch('final'),
  }
}

describe('BracketView', () => {
  it('renders round section headings', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    expect(screen.getByText('Oitavas de Final')).toBeInTheDocument()
    expect(screen.getByText('Quartas de Final')).toBeInTheDocument()
    expect(screen.getByText('Semifinais')).toBeInTheDocument()
    expect(screen.getByText('Final')).toBeInTheDocument()
  })

  it('renders "?" for null team slots', () => {
    render(<BracketView bracket={makeEmptyBracket()} />)
    const placeholders = screen.getAllByText('?')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('renders team codes when slots are filled', () => {
    const bracket = makeEmptyBracket()
    bracket.roundOf32[0].home = 'BRA'
    bracket.roundOf32[0].away = 'ARG'
    render(<BracketView bracket={bracket} />)
    expect(screen.getByText('BRA')).toBeInTheDocument()
    expect(screen.getByText('ARG')).toBeInTheDocument()
  })
})
