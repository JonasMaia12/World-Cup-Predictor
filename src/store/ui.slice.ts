import type { StateCreator } from 'zustand'

export interface UISlice {
  selectedGroup: string
  setSelectedGroup: (group: string) => void
  openGroups: string[]
  toggleGroup: (groupId: string) => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  selectedGroup: 'A',
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  openGroups: ['A'],
  toggleGroup: (groupId) =>
    set((state) => ({
      openGroups: state.openGroups.includes(groupId)
        ? state.openGroups.filter((g) => g !== groupId)
        : [...state.openGroups, groupId],
    })),
})
