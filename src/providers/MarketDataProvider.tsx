import { ReactNode, useState, useMemo } from 'react'

import { MarketDataContext } from '@/contexts/MarketDataContext'
import { MarketDataItemInfo } from '@/service/mi/dashboardData'

interface MarketDataProviderProps {
  children: ReactNode
}

export const MarketDataProvider = ({ children }: MarketDataProviderProps) => {
  const [marketDataList, setMarketDataList] = useState<MarketDataItemInfo[]>([])
  const [marketDataIsLoading, setMarketDataIsLoading] = useState(false)

  const value = useMemo(
    () => ({
      marketDataList,
      setMarketDataList,
      marketDataIsLoading,
      setMarketDataIsLoading,
    }),
    [marketDataList, marketDataIsLoading],
  )

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>
}
