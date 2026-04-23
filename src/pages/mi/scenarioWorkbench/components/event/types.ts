export type EventClassification = '신규' | '갱신'

export type EventMarketImpactLevel = 0 | 1 | 2 | 3

export type EventMarketDirection = '상승' | '하락' | '보합'

export interface ScenarioWorkbenchEventRow {
  id: string
  classification: EventClassification
  occurredAtLabel: string
  category: string
  eventName: string
  marketImpact: EventMarketImpactLevel
  marketDirection: EventMarketDirection
  /** 이벤트 활성 여부 (워크벤치 목·필터 UI용) */
  isActive: boolean
}

export type EventsClassificationFilterValue = 'all' | EventClassification
