import { create } from 'zustand'

type PageState = Record<string, unknown>

interface PageStore {
  pageState: PageState
  setPageState: (pageKey: string, value: PageState) => void
  getPageState: (pageKey: string) => PageState
}

export const usePageState = create<PageStore>((set, get) => ({
  pageState: {} as PageState,
  setPageState: (pageKey, value) =>
    set((state) => ({
      pageState: { ...state.pageState, [pageKey]: value },
    })),
  getPageState: (pageKey) => get().pageState[pageKey] as PageState,
}))
