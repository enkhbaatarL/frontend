import { useMemo } from 'react'

export interface MarketItem {
  name: string
  country: string
  product: string
  change: number // e.g. 0.035 = +0.035%
}

export const useMockDataDaily = (): MarketItem[] => useMemo(
  () => [
    { product: 'Wheat Flour', country: 'Ukraine', name: 'Wheat Flour in Ukraine', change: 0.0035 },
    { product: 'Maize (Corn)', country: 'Argentina', name: 'Maize (Corn) in Argentina', change: 0.0035 },
    { product: 'Maize (Corn)', country: 'China', name: 'Maize (Corn) in China', change: 0.0035 },
    { product: 'Maize (Corn)', country: 'Indonesia', name: 'Maize (Corn) in Indonesia', change: 0.0035 },
    { product: 'Rice', country: 'China', name: 'Rice in China', change: -0.237 },
    { product: 'Barley', country: 'Argentina', name: 'Barley in Argentina', change: 0.0035 },
    { product: 'Barley', country: 'Germany', name: 'Barley in Germany', change: -0.237 },
    { product: 'Barley', country: 'Argentina', name: 'Barley in Argentina', change: 0.0035 },
    { product: 'Barley', country: 'Argentina', name: 'Barley in Argentina', change: 0.0035 },
  ],
  [],
)
