/**
 * 가격 전망 해석 - UI 상수 + 목/DEV 미리보기.
 * #DELETE: MOCK_*, fetch/generate/save/resetMock*, DEV/PREVIEW_* 는 API 연동 완료 후 삭제.
 * 유지: PRICE_FORECAST_INTERPRETATION_MAX_LENGTH, SAVED_MESSAGE_DURATION_MS, PriceForecastInterpretationMap,
 *       getOrderedActiveScenarios / sortInterpreted* / buildInterpretationOrderAfterGenerate (실사용 유틸)
 */
import type { IScenarioGraphSeries } from '@/service/mi/nextGenMI/scenarioGroup'

export const PRICE_FORECAST_INTERPRETATION_MAX_LENGTH = 2000

/** #DELETE: 목 생성 지연 (generateMock* 전용) */
export const PRICE_FORECAST_INTERPRETATION_GENERATE_DELAY_MS = 2000

export const PRICE_FORECAST_INTERPRETATION_SAVED_MESSAGE_DURATION_MS = 5000

/** #DELETE: API 연동 전 목 응답 - 시나리오별 해석 본문 */
export const MOCK_PRICE_FORECAST_INTERPRETATION_TEXT =
  '단기 외교 해결 시나리오에서는 카타르 Ras Laffan 관련 공급 차질이 외교 협의와 운영 정상화 조치로 비교적 빠르게 완화되는 흐름을 가정합니다. 초기 구간에서는 공급 불확실성에 따른 리스크 프리미엄이 JKM 가격에 일부 반영되지만, 생산 및 선적 일정이 정상화되면서 가격은 점진적으로 MI Base 전망선에 수렴합니다. 다만 단기 지연 물량과 구매자 재고 보충 수요가 남아 있어 하방 전환보다는 제한적인 상승 압력과 완만한 안정화가 병행되는 흐름으로 해석됩니다.'

export type PriceForecastInterpretationMap = Record<number, string>

/** #DELETE: DEV 미리보기 모드 타입 (publishing 제외) */
export type PriceForecastInterpretationPreviewMode =
  | 'publishing'
  | 'auto'
  | 'empty'
  | 'ready'
  | 'loading'
  | 'complete'
  | 'complete-toast'
  | 'regeneratable'
  | 'interpreted-one'
  | 'editing'
  | 'saved'
  | 'reset-dialog'
  | 'disabled'

/** #DELETE: DEV 상태 미리보기 툴바 옵션 */
export const PRICE_FORECAST_INTERPRETATION_PREVIEW_OPTIONS: { value: PriceForecastInterpretationPreviewMode; label: string }[] = [
  { value: 'publishing', label: '퍼블리싱' },
  { value: 'auto', label: '실데이터' },
  { value: 'empty', label: '미실행' },
  { value: 'ready', label: '생성 가능' },
  { value: 'loading', label: '생성 중' },
  { value: 'complete', label: '생성 완료' },
  { value: 'complete-toast', label: '생성 완료+토스트' },
  { value: 'regeneratable', label: '재생성 가능' },
  { value: 'interpreted-one', label: '2번만 해석' },
  { value: 'editing', label: '수정 중' },
  { value: 'saved', label: '저장됨' },
  { value: 'reset-dialog', label: '초기화 확인' },
  { value: 'disabled', label: '비활성' },
]

/** #DELETE: DEV 미리보기용 시나리오 */
export const PREVIEW_INTERPRETATION_SCENARIOS = [
  { scenarioId: 901, scenarioName: 'Scenario', displayOrder: 1, baseCase: false },
  { scenarioId: 902, scenarioName: 'Scenario', displayOrder: 2, baseCase: false },
  { scenarioId: 903, scenarioName: 'Scenario', displayOrder: 3, baseCase: true },
] as const

/** #DELETE: DEV 페이지네이션 미리보기용 시나리오 (displayOrder 1~12) */
export const PREVIEW_INTERPRETATION_PAGINATION_SCENARIOS = Array.from({ length: 12 }, (_, index) => ({
  scenarioId: 901 + index,
  scenarioName: 'Scenario',
  displayOrder: index + 1,
  baseCase: index + 1 === 3,
}))

/** #DELETE: DEV 퍼블리싱 - 페이지네이션 확인용 해석 시나리오 개수 */
export const DEV_PUBLISHING_PAGINATION_SCENARIO_COUNT = 9

/** #DELETE: DEV 합성 시나리오 ID 베이스 */
const DEV_SYNTHETIC_SCENARIO_ID_BASE = 990_000

/** 폐기 제외 시나리오를 displayOrder 오름차순으로 반환 */
export const getOrderedActiveScenarios = (scenarioSeries: IScenarioGraphSeries[]) =>
  [...scenarioSeries].filter((series) => series.status !== 'discarded').sort((a, b) => a.displayOrder - b.displayOrder)

/** #DELETE: DEV 퍼블리싱 - displayOrder 1~N 시나리오 (실데이터 없으면 합성) */
export const buildDevPublishingPaginationScenarios = (scenarioSeries: IScenarioGraphSeries[]): IScenarioGraphSeries[] => {
  const ordered = getOrderedActiveScenarios(scenarioSeries)
  if (ordered.length === 0) return []

  const template = ordered[0]
  const byDisplayOrder = new Map(ordered.map((series) => [series.displayOrder, series]))

  return Array.from({ length: DEV_PUBLISHING_PAGINATION_SCENARIO_COUNT }, (_, index) => {
    const displayOrder = index + 1
    const existing = byDisplayOrder.get(displayOrder)
    if (existing) return { ...existing, executed: true, scenarioName: 'Scenario' }

    return {
      ...template,
      scenarioId: DEV_SYNTHETIC_SCENARIO_ID_BASE + displayOrder,
      scenarioName: 'Scenario',
      baseCase: displayOrder === 3,
      displayOrder,
      executed: true,
      modelRunning: false,
      status: 'pending' as const,
      statusLabel: '대기',
      baseCaseValues: null,
      userAdjustedValues: null,
    }
  })
}

/** 해석이 2개 이상이면 displayOrder 오름차순, 1개면 그대로 */
export const sortInterpretedScenarioItems = <T extends { displayOrder: number }>(items: T[]): T[] => {
  if (items.length <= 1) return items
  return [...items].sort((a, b) => a.displayOrder - b.displayOrder)
}

/** 해석이 2개 이상이면 displayOrder 오름차순, 1개면 그대로 */
export const sortInterpretedScenarioIds = (scenarioIds: number[], displayOrderById: ReadonlyMap<number, number>): number[] => {
  if (scenarioIds.length <= 1) return scenarioIds
  return [...scenarioIds].sort(
    (a, b) => (displayOrderById.get(a) ?? Number.MAX_SAFE_INTEGER) - (displayOrderById.get(b) ?? Number.MAX_SAFE_INTEGER),
  )
}

/**
 * 해석 생성 후 칩 정렬 - displayOrder 오름차순 (1, 2, 3, 5 ...)
 */
export const buildInterpretationOrderAfterGenerate = (
  previousOrder: number[],
  generatedScenarioIds: number[],
  displayOrderById: ReadonlyMap<number, number>,
): number[] => {
  const allIds = [...new Set([...previousOrder, ...generatedScenarioIds])]
  return sortInterpretedScenarioIds(allIds, displayOrderById)
}

/** #DELETE: DEV 퍼블리싱 - displayOrder 2, 3번을 수급모델 실행된 것으로 가정 (slice 인덱스) */
export const DEV_ASSUMED_EXECUTED_SCENARIO_SLICE = { start: 1, end: 3 } as const

/** #DELETE: API 연동 전 목 조회 응답 */
export const fetchMockPriceForecastInterpretations = async (_scenarioGroupId: number): Promise<PriceForecastInterpretationMap> => {
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0)
  })
  return {}
}

/** #DELETE: API 연동 전 목 생성 응답 */
export const generateMockPriceForecastInterpretations = async (
  scenarios: IScenarioGraphSeries[],
): Promise<PriceForecastInterpretationMap> => {
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, PRICE_FORECAST_INTERPRETATION_GENERATE_DELAY_MS)
  })

  return scenarios.reduce<PriceForecastInterpretationMap>((acc, scenario) => {
    acc[scenario.scenarioId] = MOCK_PRICE_FORECAST_INTERPRETATION_TEXT
    return acc
  }, {})
}

/** #DELETE: API 연동 전 목 수정 응답 */
export const saveMockPriceForecastInterpretation = (_scenarioGroupId: number, _scenarioId: number, _text: string): Promise<void> =>
  Promise.resolve()

/** #DELETE: API 연동 전 목 초기화 응답 - 서버에 저장된 본문을 최초 생성본으로 되돌림 */
export const resetMockPriceForecastInterpretation = async (_scenarioGroupId: number, _scenarioId: number): Promise<void> => {
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, 200)
  })
}
