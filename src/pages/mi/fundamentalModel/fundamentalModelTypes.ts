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
  /** 하단 스크롤 가능한 상세 표(LNG/Trade) */
  detailRows: FundamentalModelMetricRow[]
  annualPriceRows: FundamentalModelAnnualPriceRow[]
  monthlyPriceRows: FundamentalModelMonthlyPriceRow[]
  /** Global 세부 표 */
  globalVolumes: FundamentalModelGlobalVolumesData
  /** LNG 세부 표 */
  lngVolumes: FundamentalModelLngVolumesData
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

export interface FundamentalModelAnnualPriceRow {
  id: string
  year: string
  priceRegion: string
  baseCasePrice: string
  userAdjustedPrice: string
}

export interface FundamentalModelMonthlyPriceRow {
  id: string
  year: string
  month: string
  priceRegion: string
  baseCasePrice: string
  userAdjustedPrice: string
}

/** Global 본문 표 행 종류 */
export type FundamentalModelGlobalRowKind = 'region' | 'country' | 'total'

/** Global 본문 표 한 행 */
export interface FundamentalModelGlobalVolumeRow {
  id: string
  label: string
  kind: FundamentalModelGlobalRowKind
  values: (string | null)[]
}

/** Global 본문 표 섹션(Demand, Production 등) */
export interface FundamentalModelGlobalVolumeSection {
  id: string
  label: string
  rows: FundamentalModelGlobalVolumeRow[]
}

/** Global 본문 표 데이터 */
export interface FundamentalModelGlobalVolumesData {
  monthLabels: string[]
  sections: FundamentalModelGlobalVolumeSection[]
}

/** LNG 본문 표 데이터(Global과 동일 구조) */
export type FundamentalModelLngVolumesData = FundamentalModelGlobalVolumesData
