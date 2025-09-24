import { ReactNode, useState, useMemo } from 'react'

import { StickyHeaderContext } from '@/contexts/StickyHeaderContext'

interface StickyHeaderProviderProps {
  children: ReactNode
}

export const StickyHeaderProvider = ({ children }: StickyHeaderProviderProps) => {
  const [stickyHeader, setStickyHeader] = useState<ReactNode | null>(null)

  const value = useMemo(() => ({ stickyHeader, setStickyHeader }), [stickyHeader])

  return <StickyHeaderContext.Provider value={value}>{children}</StickyHeaderContext.Provider>
}
