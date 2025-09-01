import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react'

interface SkeletonConfig {
  globalMinDisplayTime: number
  globalDelayThreshold: number
  enablePerformanceMode: boolean
  enableSkeletonAnalytics: boolean
}

interface SkeletonContextType {
  config: SkeletonConfig
  updateConfig: (newConfig: Partial<SkeletonConfig>) => void
}

const defaultConfig: SkeletonConfig = {
  globalMinDisplayTime: 500,
  globalDelayThreshold: 300,
  enablePerformanceMode: false,
  enableSkeletonAnalytics: false,
}

const SkeletonContext = createContext<SkeletonContextType>({
  config: defaultConfig,
  updateConfig: () => {},
})

export const useSkeletonConfig = () => {
  const context = useContext(SkeletonContext)
  if (!context) {
    throw new Error('useSkeletonConfig must be used within SkeletonProvider')
  }
  return context
}

interface SkeletonProviderProps {
  children: ReactNode
  config?: Partial<SkeletonConfig>
}

export const SkeletonProvider = ({ children, config }: SkeletonProviderProps) => {
  const [skeletonConfig, setSkeletonConfig] = useState<SkeletonConfig>({
    ...defaultConfig,
    ...config,
  })

  const updateConfig = useCallback((newConfig: Partial<SkeletonConfig>) => {
    setSkeletonConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  const value = useMemo(
    () => ({
      config: skeletonConfig,
      updateConfig,
    }),
    [skeletonConfig, updateConfig],
  )

  return <SkeletonContext.Provider value={value}>{children}</SkeletonContext.Provider>
}
