/** Fundamental Model 영역 기준 URL prefix(미선택 진입) */
export const FUNDAMENTAL_MODEL_BASE_PATH = '/mi/fundamental-model'

/** 실행별 상세 경로(`/mi/fundamental-model/:runId`) */
export const getFundamentalModelRunPath = (runId: string) => `${FUNDAMENTAL_MODEL_BASE_PATH}/${encodeURIComponent(runId)}`

/** Volumes|Price 탭 라벨(클라이언트 state — URL과 무관) */
export const FUNDAMENTAL_MODEL_VIEW_TABS = [
  { key: 'volumes', label: 'Volumes' },
  { key: 'price', label: 'Price' },
] as const

export type FundamentalModelViewTabKey = (typeof FUNDAMENTAL_MODEL_VIEW_TABS)[number]['key']
