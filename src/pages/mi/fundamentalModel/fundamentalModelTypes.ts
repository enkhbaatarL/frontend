/** 수급 모델 시뮬레이션 실행 상태 */
export type FundamentalModelRunStatus = 'in_progress' | 'done' | 'error'

/** 좌측 목록 한 행 */
export interface FundamentalModelRunListItem {
  id: string
  status: FundamentalModelRunStatus
  title: string
  createdAtLabel: string
  updatedAtLabel: string
  managerName: string
}

/** 우측 상세(헤더 + 표 데이터) */
export interface FundamentalModelDetail extends FundamentalModelRunListItem {
  subtitle: string
  scenarioYearLabel: string
  monthLabels: string[]
  /** 상단 요약 Volumes 표(짧은 블록) */
  summaryRows: FundamentalModelMetricRow[]
  /** 하단 스크롤 가능한 상세 표 */
  detailRows: FundamentalModelMetricRow[]
  attachmentNames: string[]
  durationLabel: string
}

/** Volumes/Price 매트릭스의 한 행 */
export interface FundamentalModelMetricRow {
  id: string
  label: string
  /** 월 컬럼 순서와 동일한 길이, 빈 셀은 null */
  values: (string | null)[]
}

/** 상단 세그먼트(Global/LNG/Trade) 값 */
export type FundamentalModelScopeKey = 'global' | 'lng' | 'trade'
