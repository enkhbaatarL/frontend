export const FUNDAMENTAL_MODEL_BASE_PATH = '/mi/fundamental-model'

export const buildFundamentalModelCasePath = (caseId: number) =>
  `${FUNDAMENTAL_MODEL_BASE_PATH}?caseId=${encodeURIComponent(String(caseId))}`

/** Volumes|Price 탭 라벨(클라이언트 state — URL과 무관) */
export const FUNDAMENTAL_MODEL_VIEW_TABS = [
  { key: 'volumes', label: 'Volumes' },
  { key: 'price', label: 'Price' },
] as const

export type FundamentalModelViewTabKey = (typeof FUNDAMENTAL_MODEL_VIEW_TABS)[number]['key']
