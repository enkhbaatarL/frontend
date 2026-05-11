import { Box } from '@mui/material'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import type { ScenarioWorkbenchTabKey } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchRoutes'

interface WorkbenchStickyLayoutContextValue {
  slotEl: HTMLElement | null
  activeTabKey: ScenarioWorkbenchTabKey | null
}

const WorkbenchStickyLayoutContext = createContext<WorkbenchStickyLayoutContextValue>({
  slotEl: null,
  activeTabKey: null,
})

interface WorkbenchStickyLayoutProviderProps {
  slotEl: HTMLElement | null
  activeTabKey: ScenarioWorkbenchTabKey | null
  children: ReactNode
}

export const WorkbenchStickyLayoutProvider = ({ slotEl, activeTabKey, children }: WorkbenchStickyLayoutProviderProps) => {
  const value = useMemo(() => ({ slotEl, activeTabKey }), [slotEl, activeTabKey])
  return <WorkbenchStickyLayoutContext.Provider value={value}>{children}</WorkbenchStickyLayoutContext.Provider>
}

interface WorkbenchStickySlotProps {
  tabKey: ScenarioWorkbenchTabKey
  children: ReactNode
}

/**
 * 자식을 페이지 sticky 헤더의 슬롯 div에 portal로 주입
 * - 활성 탭일 때만 마운트되어 비활성 탭의 sticky 컨텐츠가 중첩되지 않음
 * - 본문 탭패널의 fade-in과 같은 키프레임/타이밍을 적용해 헤더-본문 일체감 유지
 */
export const WorkbenchStickySlot = ({ tabKey, children }: WorkbenchStickySlotProps) => {
  const { slotEl, activeTabKey } = useContext(WorkbenchStickyLayoutContext)
  if (!slotEl || activeTabKey !== tabKey) return null

  return createPortal(
    <Box
      sx={{
        animation: 'scenarioWorkbenchFadeIn 0.15s ease-out',
        '@keyframes scenarioWorkbenchFadeIn': {
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
