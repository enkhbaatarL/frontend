import { ReactNode, useMemo, useCallback } from 'react'

import ScrollContext from '@/contexts/ScrollContext'

interface MIAgentScrollProviderProps {
  children: ReactNode
}

const MIAgentScrollProvider = ({ children }: MIAgentScrollProviderProps) => {
  const scrollRef = useMemo(() => ({ current: null as HTMLDivElement | null }), [])
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const element = scrollRef.current
      if (!element) return

      requestAnimationFrame(() => {
        element.scrollTo({
          top: element.scrollHeight - element.clientHeight,
          behavior,
        })
      })
    },
    [scrollRef],
  )

  const value = useMemo(
    () => ({
      scrollRef,
      scrollToBottom,
    }),
    [scrollToBottom, scrollRef],
  )

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
}

export default MIAgentScrollProvider
