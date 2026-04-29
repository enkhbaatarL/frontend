import { createContext, useContext, ReactNode } from 'react'

export interface StickyHeaderRegisterOptions {
  pinMariPosition?: boolean // true -> 플로팅 버튼 `top`에 헤더 높이를 더하지 않음
  stickyHeightsPx?: { expanded: number; collapsed: number } // ResizeObserver 없이 본문 padding이 `isScrolled`와 동시에 전환되어 Collapse·GNB와 같은 타이밍으로 동작
}

interface StickyHeaderContextType {
  stickyHeader: ReactNode | null
  stickyHeaderOptions: StickyHeaderRegisterOptions
  setStickyHeader: (header: ReactNode | null, options?: StickyHeaderRegisterOptions) => void
  patchStickyHeaderOptions: (patch: Partial<StickyHeaderRegisterOptions>) => void
  setStickyHeaderPinMari: (header: ReactNode | null) => void
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
