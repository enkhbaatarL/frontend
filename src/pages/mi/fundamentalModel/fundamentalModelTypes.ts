/** 수급 모델 시뮬레이션 실행 상태 */
export type FundamentalModelRunStatus = 'pending' | 'in_progress' | 'done' | 'error'

/** 좌측 목록 한 행 */
export interface FundamentalModelRunListItem {
  id: string
  status: FundamentalModelRunStatus
  title: string
  createdAtLabel: string
  updatedAtLabel: string
  managerName: string
}

/** 우측 상세 mock 데이터 - Price/Global/LNG Volumes는 API 직결, Trade는 mock 유지 */
export interface FundamentalModelDetail extends FundamentalModelRunListItem {
  subtitle: string
  scenarioYearLabel: string
  /** Trade 본문 표 - 별도 API 미정으로 mock 유지 */
  tradeVolumes: FundamentalModelTradeVolumesData
  attachmentNames: string[]
  durationLabel: string
}

/** 상단 세그먼트(Global/LNG/Trade) 값 */
export type FundamentalModelScopeKey = 'global' | 'lng' | 'trade'

/** Trade 표 행/열 종류 */
export type FundamentalModelTradeRowKind = 'region' | 'country' | 'total'

/** Trade 필터 옵션(가스 유형, 연도) */
export interface FundamentalModelTradeFilterOption {
  id: string
  label: string
}

/** Trade From country 컬럼 */
export interface FundamentalModelTradeFromColumn {
  id: string
  label: string
  kind: FundamentalModelTradeRowKind
}

/** Trade To country 행 */
export interface FundamentalModelTradeVolumeRow {
  id: string
  label: string
  kind: FundamentalModelTradeRowKind
  values: (string | null)[]
}

/** Trade 본문 표 데이터 */
export interface FundamentalModelTradeVolumesData {
  productOptions: FundamentalModelTradeFilterOption[]
  yearOptions: FundamentalModelTradeFilterOption[]
  selectedProductId: string
  selectedYearId: string
  unitLabel: string
  fromColumns: FundamentalModelTradeFromColumn[]
  toRows: FundamentalModelTradeVolumeRow[]
}
