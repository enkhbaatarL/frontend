export type MarketItemType = 'positive' | 'neutral' | 'negative'

export interface SourceOption {
  name: string
  link: string
}

export interface MarketItem {
  id: string
  type: MarketItemType
  title: string
  summary: string[]
  sources: SourceOption[]
  impact?: string
}
