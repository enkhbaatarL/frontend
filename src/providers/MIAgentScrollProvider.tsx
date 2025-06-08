import { ReactNode, useMemo, useCallback } from 'react'

import ScrollContext from '@/contexts/ScrollContext'

interface MIAgentScrollProviderProps {
  children: ReactNode
}

const MIAgentScrollProvider = ({ children }: MIAgentScrollProviderProps) => {
  const scrollRef = useMemo(() => ({ current: null as HTMLDivElement | null }), [])

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return

    const element = scrollRef.current
    const scrollTop = element.scrollHeight - element.clientHeight

    element.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    })
  }, [scrollRef])

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
