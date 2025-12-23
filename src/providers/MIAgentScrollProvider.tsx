import { ReactNode, useMemo, useRef, useCallback } from 'react'

import ScrollContext from '@/contexts/ScrollContext'

interface MIAgentScrollProviderProps {
  children: ReactNode
}

const MIAgentScrollProvider = ({ children }: MIAgentScrollProviderProps) => {
  const scrollRef = useMemo(() => ({ current: null as HTMLDivElement | null }), [])
  const prevScrollHeightRef = useRef<number>(0)

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return

    const element = scrollRef.current
    const scrollTop = element.scrollHeight - element.clientHeight

    element.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    })
  }, [scrollRef])

  const scrollToNewMessage = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const currentHeight = element.scrollHeight
    const prevHeight = prevScrollHeightRef.current

    const delta = currentHeight - prevHeight

    if (delta > 0) {
      element.scrollBy({
        top: delta,
        behavior: 'smooth',
      })
    }

    prevScrollHeightRef.current = currentHeight
  }, [scrollRef])

  const value = useMemo(
    () => ({
      scrollRef,
      scrollToBottom,
      scrollToNewMessage,
    }),
    [scrollToBottom, scrollToNewMessage, scrollRef],
  )

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
}

export default MIAgentScrollProvider
