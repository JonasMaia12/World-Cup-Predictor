import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTournamentSlice, TournamentSlice } from './tournament.slice'
import { createUISlice, UISlice } from './ui.slice'

export type StoreState = TournamentSlice & UISlice

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createTournamentSlice(...a),
      ...createUISlice(...a),
    }),
    { name: 'wcp2026-state' }
  )
)
