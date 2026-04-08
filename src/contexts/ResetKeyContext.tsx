import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react'
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

  const value = useMemo(() => ({ resetKey, triggerReset }), [resetKey, triggerReset])

  return <ResetKeyContext.Provider value={value}>{children}</ResetKeyContext.Provider>
}

export const useResetKeyContext = () => useContext(ResetKeyContext)
