import type { StateCreator } from 'zustand'

export interface UISlice {
  openGroups: string[]
  toggleGroup: (groupId: string) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  openGroups: ['A'],
  toggleGroup: (groupId) =>
    set((state) => ({
      openGroups: state.openGroups.includes(groupId)
        ? state.openGroups.filter((g) => g !== groupId)
        : [...state.openGroups, groupId],
    })),
})
