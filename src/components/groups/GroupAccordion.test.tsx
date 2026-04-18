import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupAccordion } from './GroupAccordion'

vi.mock('@/store', () => ({
  useStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      scores: {},
      setScore: vi.fn(),
      openGroups: ['A'],
      toggleGroup: vi.fn(),
    })
  ),
}))

vi.mock('@/engine/classifier', () => ({
  classifyGroup: () => [],
}))

vi.mock('@/engine/bracket-generator', () => ({
  generateBracket: () => ({
    roundOf32: Array.from({ length: 16 }, (_, i) => ({ id: `r32-${i+1}`, home: null, away: null })),
    roundOf16: Array.from({ length: 16 }, (_, i) => ({ id: `r16-${i+1}`, home: null, away: null })),
    quarterFinals: Array.from({ length: 8 }, (_, i) => ({ id: `qf-${i+1}`, home: null, away: null })),
    semiFinals: Array.from({ length: 4 }, (_, i) => ({ id: `sf-${i+1}`, home: null, away: null })),
    thirdPlace: { id: '3rd', home: null, away: null },
    final: { id: 'final', home: null, away: null },
  }),
}))

describe('GroupAccordion', () => {
  it('renders all 12 group headers', () => {
    render(<GroupAccordion />)
    for (const g of 'ABCDEFGHIJKL'.split('')) {
      expect(screen.getByText(`GRUPO ${g}`)).toBeInTheDocument()
    }
  })

  it('shows group A content expanded by default', () => {
    render(<GroupAccordion />)
    expect(screen.getByTestId('group-content-A')).toBeInTheDocument()
  })

  it('calls toggleGroup when a header is clicked', async () => {
    const toggleGroup = vi.fn()
    const { useStore } = await import('@/store')
    vi.mocked(useStore).mockImplementation(((sel: (s: unknown) => unknown) =>
      sel({ scores: {}, setScore: vi.fn(), openGroups: ['A'], toggleGroup })) as never)
    render(<GroupAccordion />)
    fireEvent.click(screen.getByText('GRUPO B'))
    expect(toggleGroup).toHaveBeenCalledWith('B')
  })

  it('renders bracket section', () => {
    render(<GroupAccordion />)
    expect(screen.getByText('FASE ELIMINATÓRIA')).toBeInTheDocument()
  })
})
