export type PriceDirection = 'up' | 'flat' | 'down' | 'none'

export type ScenarioImpactTarget = 'JKM' | 'TTF' | 'HH'

export interface ScenarioImpactRow {
  target: ScenarioImpactTarget
  /** 표 첫 컬럼 라벨 (e.g., 'Henry Hub') */
  label: string
  marketImpact: number
  direction: PriceDirection
  /** 가격 단계 칩 시퀀스 (예: ['$21~23', '$19~20', '$19']) */
  priceFlow: string[]
}

export interface ScenarioForecastCard {
  target: ScenarioImpactTarget
  /** 카드 제목 (e.g., 'JKM 영향 전망') */
  title: string
  body: string
  /** 카드 하단 요약 한 줄 */
  summary: string
}

export interface ScenarioChartSeries {
  target: ScenarioImpactTarget
  values: (number | null)[]
}

export interface ScenarioSummaryChart {
  months: string[]
  series: ScenarioChartSeries[]
}

export interface ScenarioSummaryData {
  impactRows: ScenarioImpactRow[]
  forecasts: ScenarioForecastCard[]
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
  marketImpactSummary: string
  observationPoint: string
  source: string
}

export interface RelatedEvent {
  id: number
  name: string
  date: string
  category: string
  jkm: number
  ttf: number
  hh: number
  jkmDirection: PriceDirection
  ttfDirection: PriceDirection
  hhDirection: PriceDirection
}

export interface RelatedScenario {
  id: number
  name: string
  /** 현재 시나리오 강조 (BC 배지 노출) */
  isCurrent: boolean
  type?: 'BC' | 'NOISE'
  jkm: number
  ttf: number
  hh: number
  probability: number
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
