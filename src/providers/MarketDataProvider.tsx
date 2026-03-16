import { ReactNode, useState, useMemo, useCallback } from 'react'

import { MarketDataContext } from '@/contexts/MarketDataContext'
import { MarketDataItemInfo, ExtendedMarketDataItemInfo } from '@/service/mi/forecast'

interface MarketDataProviderProps {
  children: ReactNode
}

export const MarketDataProvider = ({ children }: MarketDataProviderProps) => {
  const [marketDataList, setMarketDataList] = useState<ExtendedMarketDataItemInfo[]>([])
  const [marketDataIsLoading, setMarketDataIsLoading] = useState(false)

  const handleSetMarketDataList = useCallback((data: MarketDataItemInfo[]) => {
    const getChangeData = (item: MarketDataItemInfo) => {
      const { dodChangeValue, dodChangeRate, wowChangeValue, wowChangeRate, momChangeValue, momChangeRate } = item.marketMetaDataSummary

      if (dodChangeValue !== null && dodChangeValue !== undefined && dodChangeRate !== null && dodChangeRate !== undefined) {
        return { change: dodChangeValue, changePercent: dodChangeRate, period: 'DoD' }
      }
      if (wowChangeValue !== null && wowChangeValue !== undefined && wowChangeRate !== null && wowChangeRate !== undefined) {
        return { change: wowChangeValue, changePercent: wowChangeRate, period: 'WoW' }
      }
      if (momChangeValue !== null && momChangeValue !== undefined && momChangeRate !== null && momChangeRate !== undefined) {
        return { change: momChangeValue, changePercent: momChangeRate, period: 'MoM' }
      }
      return { change: undefined, changePercent: undefined, period: undefined }
    }

    const getChangeColor = (value?: number) => {
      const targetValue = value ?? 0

      if (targetValue > 0) return 'increase'
      if (targetValue < 0) return 'decrease'
      return 'gray.70'
    }

    setMarketDataList(
      data.map((item) => {
        const changeData = getChangeData(item)
        const { currency, currentUnitCd, previousValue, providerName, goodsDataSourceExpn } = item.marketMetaDataSummary
        const unitParts = [currency, currentUnitCd].filter(Boolean)

        return {
          ...item,
          marketMetaDataSummary: {
            ...item.marketMetaDataSummary,
            change: changeData.change,
            changeColor: getChangeColor(changeData.change),
            changePercent: changeData.changePercent,
            changePercentColor: getChangeColor(changeData.changePercent),
            period: changeData.period ?? '-',
            unit: unitParts.length > 0 ? unitParts.join('/') : '-',
            previousValue: previousValue ?? '-',
            providerName: providerName ?? '-',
            ...(goodsDataSourceExpn && { goodsDataSourceExpn }),
          },
        }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({
      marketDataList,
      setMarketDataList: handleSetMarketDataList,
      marketDataIsLoading,
      setMarketDataIsLoading,
    }),
    [marketDataList, marketDataIsLoading, handleSetMarketDataList],
  )

  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>
}
