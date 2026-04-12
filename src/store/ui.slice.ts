import type { StateCreator } from 'zustand'

export interface UISlice {
  selectedGroup: string
  setSelectedGroup: (group: string) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  selectedGroup: 'A',
  setSelectedGroup: (group) => set({ selectedGroup: group }),
})
