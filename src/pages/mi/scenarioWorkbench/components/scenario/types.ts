export type ScenarioMethod = 'AI' | 'User'
export type PriceDirection = 'Up' | 'Down' | 'Neutral'
export type PriceImpactLevel = '높음' | '중간' | '낮음' | '없음'

export interface PriceStep {
  label: string
}

export interface ScenarioSummaryChart {
  months: string[]
  weeklyValues: number[]
}

export interface ScenarioSummaryData {
  priceFlowTitle: string
  priceSteps: PriceStep[]
  flowDescription: string
  forecastTitle: string
  forecastBody: string
  chartUnit: string
  chart: ScenarioSummaryChart
}

export type KeyPredictionDirection = 'up' | 'down' | 'none'

export interface KeyPrediction {
  title: string
  value: string
  direction?: KeyPredictionDirection
  description?: string
  hidden?: boolean
}

export interface SignpostItem {
  id: number
  coreEvent: string
  currentStatus: string
  marketImpact: string
  observationPoint: string
  source: string
}

export type RelatedEventDirection = 'up' | 'neutral'

export interface RelatedEvent {
  id: number
  name: string
  date: string
  category: string
  marketImpact: string
  marketImpactColor: string
  direction: RelatedEventDirection
  directionLabel: string
}

export interface RelatedScenario {
  id: number
  name: string
  isCurrent: boolean
  marketImpact: string
  marketImpactColor: string
  priceImpact: string
  priceImpactColor: string
  initialProbability: string
}

export interface ScenarioDetail {
  name: string
  tags: string[]
  summary: ScenarioSummaryData
  keyPredictions: KeyPrediction[]
  signposts: SignpostItem[]
  relatedEvents: RelatedEvent[]
  relatedScenarios: RelatedScenario[]
}
