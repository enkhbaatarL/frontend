/** Fundamental Model 고정 URL(선택 caseId는 페이지 state) */
export const FUNDAMENTAL_MODEL_BASE_PATH = '/mi/fundamental-model'

/** Volumes|Price 탭 라벨(클라이언트 state — URL과 무관) */
export const FUNDAMENTAL_MODEL_VIEW_TABS = [
  { key: 'volumes', label: 'Volumes' },
  { key: 'price', label: 'Price' },
] as const

export type FundamentalModelViewTabKey = (typeof FUNDAMENTAL_MODEL_VIEW_TABS)[number]['key']
