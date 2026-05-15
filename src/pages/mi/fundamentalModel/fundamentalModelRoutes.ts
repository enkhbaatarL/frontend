/** Fundamental Model 영역 기준 URL prefix */
export const FUNDAMENTAL_MODEL_BASE_PATH = '/mi/fundamental-model'

/** 목록 없이 진입 시 리다이렉트에 쓰는 기본 실행 ID(목업, URL `/mi/fundamental-model/1`) */
export const FUNDAMENTAL_MODEL_DEFAULT_RUN_ID = '1'

/** 실행별 상세 경로 */
export const getFundamentalModelRunPath = (runId: string) => `${FUNDAMENTAL_MODEL_BASE_PATH}/${encodeURIComponent(runId)}`

/** Volumes|Price 탭 라벨(클라이언트 state — URL과 무관) */
export const FUNDAMENTAL_MODEL_VIEW_TABS = [
  { key: 'volumes', label: 'Volumes' },
  { key: 'price', label: 'Price' },
] as const

export type FundamentalModelViewTabKey = (typeof FUNDAMENTAL_MODEL_VIEW_TABS)[number]['key']
