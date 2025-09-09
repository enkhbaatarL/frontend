export interface SourceOption {
  name: string
  link: string
}

export interface MarketItem {
  id: string
  title: string
  summary: string[]
  sources: SourceOption[]
  impact?: string
}
