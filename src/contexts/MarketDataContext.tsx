import { createContext, useContext } from 'react'

import { MarketDataItemInfo } from '@/service/mi/forecast'

interface MarketDataContextType {
  marketDataList: MarketDataItemInfo[]
  setMarketDataList: (data: MarketDataItemInfo[]) => void
  marketDataIsLoading: boolean
  setMarketDataIsLoading: (loading: boolean) => void
}

export const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined)

export const useMarketData = () => {
  const context = useContext(MarketDataContext)
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider')
  }
  return context
}
