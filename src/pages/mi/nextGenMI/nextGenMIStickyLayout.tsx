import { Box } from '@mui/material'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type { NextGenMITabKey } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

interface NextGenMIStickyLayoutContextValue {
  slotEl: HTMLElement | null
  activeTabKey: NextGenMITabKey | null
}

const NextGenMIStickyLayoutContext = createContext<NextGenMIStickyLayoutContextValue>({
  slotEl: null,
  activeTabKey: null,
})

export const useNextGenMIActiveTab = () => useContext(NextGenMIStickyLayoutContext).activeTabKey

interface NextGenMIStickyLayoutProviderProps {
  slotEl: HTMLElement | null
  activeTabKey: NextGenMITabKey | null
  children: ReactNode
}

export const NextGenMIStickyLayoutProvider = ({ slotEl, activeTabKey, children }: NextGenMIStickyLayoutProviderProps) => {
  const value = useMemo(() => ({ slotEl, activeTabKey }), [slotEl, activeTabKey])
  return <NextGenMIStickyLayoutContext.Provider value={value}>{children}</NextGenMIStickyLayoutContext.Provider>
}

interface NextGenMIStickySlotProps {
  tabKey: NextGenMITabKey
  children: ReactNode
}

/**
 * 자식을 페이지 sticky 헤더의 슬롯 div에 portal로 주입
 * - 활성 탭일 때만 마운트되어 비활성 탭의 sticky 컨텐츠가 중첩되지 않음
 * - 본문 탭패널의 fade-in과 같은 키프레임/타이밍을 적용해 헤더-본문 일체감 유지
 */
export const NextGenMIStickySlot = ({ tabKey, children }: NextGenMIStickySlotProps) => {
  const { slotEl, activeTabKey } = useContext(NextGenMIStickyLayoutContext)
  if (!slotEl || activeTabKey !== tabKey) return null

  return createPortal(
    <Box
      sx={{
        animation: 'nextGenMIFadeIn 0.15s ease-out',
        '@keyframes nextGenMIFadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {children}
    </Box>,
    slotEl,
  )
}
