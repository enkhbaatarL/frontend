import { createContext, useContext } from 'react'

export interface ScrollContextType {
  scrollRef: { current: HTMLDivElement | null }
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

const ScrollContext = createContext<ScrollContextType | null>(null)

export const useScroll = () => {
  const context = useContext(ScrollContext)
  if (!context) {
    throw new Error('useScroll must be used within a MIAgentScrollProvider')
  }
  return context
}

export default ScrollContext
