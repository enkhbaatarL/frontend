import { createContext, useContext, ReactNode } from 'react'

interface StickyHeaderContextType {
  stickyHeader: ReactNode | null
  setStickyHeader: (header: ReactNode | null) => void
}

const StickyHeaderContext = createContext<StickyHeaderContextType | undefined>(undefined)

export const useStickyHeader = () => {
  const context = useContext(StickyHeaderContext)
  if (context === undefined) {
    throw new Error('useStickyHeader must be used within a StickyHeaderProvider')
  }
  return context
}

export { StickyHeaderContext }
