export type EventClassification = '신규' | '갱신' | '종료'

export type EventMarketImpactLevel = 0 | 1 | 2 | 3

export type EventMarketDirection = '상승' | '하락' | '보합'

export interface ScenarioWorkbenchEventRow {
  id: string
  classification: EventClassification
  occurredAtLabel: string
  category: string
  eventName: string
  /** JKM 지수별 영향도·가격 방향 (목록 JKM 열) */
  jkmImpact: EventMarketImpactLevel
  jkmDirection: EventMarketDirection
  /** TTF 지수별 영향도·가격 방향 (목록 TTF 열) */
  ttfImpact: EventMarketImpactLevel
  ttfDirection: EventMarketDirection
  /** HH 지수별 영향도·가격 방향 (목록 HH 열) */
  hhImpact: EventMarketImpactLevel
  hhDirection: EventMarketDirection
  /** 이벤트 활성 여부 (워크벤치 목·필터 UI용) */
  isActive: boolean
}

export type EventsClassificationFilterValue = 'all' | EventClassification

/** 이벤트 상세 — 영향도 분석 표 행 (Figma MI/ Canvas/ Event/ Impact Analysis) */
export interface EventDetailImpactTableRow {
  id: string
  target: string
  marketImpact: EventMarketImpactLevel
  direction: EventMarketDirection
}

/** 이벤트 상세 — KPI 카드 (카테고리·출처 등) */
export interface EventDetailImpactKpiItem {
  title: string
  content: string
  description?: string
}

/** MI Records 테이블 */
export interface EventDetailMiRecordRow {
  id: string
  atLabel: string
  kind: string
  title: string
  summary: string
}

/** 기관 전망 테이블 */
export interface EventDetailOutlookRow {
  id: string
  dateLabel: string
  institution: string
  summary: string
}

/** Fundamental — 상단 표 */
export interface EventDetailFundamentalMetricRow {
  id: string
  item: string
  currentValue: string
  criteria: string
  source: string
}

/** Fundamental — 하단 표 */
export interface EventDetailFundamentalIndicatorRow {
  id: string
  indicator: string
  currentValue: string
  implication: string
  source: string
}
