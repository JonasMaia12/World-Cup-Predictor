import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as storeModule from '@/store'
import type { StoreState } from '@/store'
import { GroupPositionPicker } from './GroupPositionPicker'

vi.mock('@/store', () => ({ useStore: vi.fn() }))

const baseStore = {
  thirdQualifiers: [] as string[],
  pickGroupOrder: vi.fn(),
  addThirdQualifier: vi.fn(),
  removeThirdQualifier: vi.fn(),
}

function mockStore(overrides = {}) {
  const store = { ...baseStore, ...overrides }
  vi.mocked(storeModule.useStore).mockImplementation(
    (sel: (s: StoreState) => unknown) => sel(store as unknown as StoreState),
  )
}

describe('GroupPositionPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore()
  })

  it('renders 4 team rows for group A', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    expect(screen.getAllByTestId(/position-row-/)).toHaveLength(4)
  })

  it('up button on second row moves that team to first position', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    const rows = screen.getAllByTestId(/position-row-/)
    const secondTeamCode = rows[1].getAttribute('data-team')!
    fireEvent.click(screen.getAllByTestId(/up-btn-/)[1])
    const updatedRows = screen.getAllByTestId(/position-row-/)
    expect(updatedRows[0].getAttribute('data-team')).toBe(secondTeamCode)
  })

  it('down button on first row moves that team to second position', () => {
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    const rows = screen.getAllByTestId(/position-row-/)
    const firstTeamCode = rows[0].getAttribute('data-team')!
    fireEvent.click(screen.getAllByTestId(/down-btn-/)[0])
    const updatedRows = screen.getAllByTestId(/position-row-/)
    expect(updatedRows[1].getAttribute('data-team')).toBe(firstTeamCode)
  })

  it('"Simular com esta ordem" calls pickGroupOrder and closes', () => {
    const pickGroupOrder = vi.fn()
    const onClose = vi.fn()
    mockStore({ pickGroupOrder })
    render(<GroupPositionPicker groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('simulate-order'))
    expect(pickGroupOrder).toHaveBeenCalledWith('A', expect.any(Array))
    expect(onClose).toHaveBeenCalled()
  })

  it('3rd toggle calls addThirdQualifier when group not in pool', () => {
    const addThirdQualifier = vi.fn()
    mockStore({ addThirdQualifier })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toggle-third-A'))
    expect(addThirdQualifier).toHaveBeenCalledWith('A')
  })

  it('3rd toggle calls removeThirdQualifier when group is already in pool', () => {
    const removeThirdQualifier = vi.fn()
    mockStore({ thirdQualifiers: ['A'], removeThirdQualifier })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('toggle-third-A'))
    expect(removeThirdQualifier).toHaveBeenCalledWith('A')
  })

  it('3rd toggle is disabled when pool is full (8) and group not in pool', () => {
    mockStore({ thirdQualifiers: ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] })
    render(<GroupPositionPicker groupId="A" onClose={vi.fn()} />)
    expect(screen.getByTestId('toggle-third-A')).toBeDisabled()
  })

  it('"Cancelar" calls onClose without modifying store', () => {
    const pickGroupOrder = vi.fn()
    const onClose = vi.fn()
    mockStore({ pickGroupOrder })
    render(<GroupPositionPicker groupId="A" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('cancel-picker'))
    expect(onClose).toHaveBeenCalled()
    expect(pickGroupOrder).not.toHaveBeenCalled()
  })
})
