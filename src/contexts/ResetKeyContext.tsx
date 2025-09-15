import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'

import { setTriggerResetFn } from '@/utils/resetLayout'
interface ResetKeyContextType {
  resetKey: number
  triggerReset: () => void
}

const ResetKeyContext = createContext<ResetKeyContextType>({
  resetKey: 0,
  triggerReset: () => {},
})

export const ResetKeyProvider = ({ children }: { children: ReactNode }) => {
  const [resetKey, setResetKey] = useState(0)

  const triggerReset = useCallback(() => {
    setResetKey((prev) => prev + 1)
  }, [])
  useEffect(() => {
    setTriggerResetFn(triggerReset)
  }, [])

  return <ResetKeyContext.Provider value={{ resetKey, triggerReset }}>{children}</ResetKeyContext.Provider>
}

export const useResetKeyContext = () => useContext(ResetKeyContext)
