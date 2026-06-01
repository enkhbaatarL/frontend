import dayjs from 'dayjs'

import type {
  IScenarioWorkbenchEventListItem,
  IScenarioWorkbenchImpactIndexSummary,
  IScenarioWorkbenchEventListRes,
  ScenarioWorkbenchEventStatus,
} from '@/service/mi/scenarioWorkbench/event'
import type { IPaginationResponse } from '@/types/api'

import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'

export type MockEventRow = IScenarioWorkbenchEventListItem & {
  /** 이벤트명 좌측 추천 별 */
  recommended?: boolean
  recommendationReason?: string
  /** 지수 컬럼 기간(S/L) */
  termByIndex?: Partial<Record<'JKM' | 'TTF' | 'HH', 'short' | 'long'>>
}

const buildIndexImpact = (
  indexName: 'JKM' | 'TTF' | 'HH',
  level: MarketImpactLevel,
  direction: MarketDirection,
): IScenarioWorkbenchImpactIndexSummary => ({
  indexName,
  marketImpactLevel: level,
  direction,
})

const MOCK_ROWS: MockEventRow[] = [
  {
    eventId: '1001',
    eventName: '[카타르 LNG 차질] 설비 타격 및 12카고 취소로 TTF/JKM 강세',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '신호',
    eventCategoryLv1: EventCategoryLv1.SUPPLY_DEMAND_BALANCE,
    eventCategoryLv1Label: '수급 밸런스',
    occurredAt: dayjs().subtract(3, 'day').hour(17).minute(0).second(0).toISOString(),
    updatedAt: dayjs().subtract(3, 'day').hour(17).minute(0).second(0).toISOString(),
    indexImpacts: [
      buildIndexImpact('JKM', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      buildIndexImpact('TTF', MarketImpactLevel.HIGH, MarketDirection.BEARISH),
      buildIndexImpact('HH', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
    ],
    recommended: true,
    recommendationReason: '시장 영향도가 크고 주요 벤치마크에 동시 영향이 있어 추천되었습니다.',
    termByIndex: { JKM: 'short', TTF: 'short', HH: 'long' },
  },
  {
    eventId: '1002',
    eventName: '호르무즈 해협 LNG 선박 통과 제한으로 단기 공급 우려 확대',
    status: 'new',
    statusLabel: '신규',
    signalType: 'signal',
    signalTypeLabel: '신호',
    eventCategoryLv1: EventCategoryLv1.GEOPOLITICAL_RISK,
    eventCategoryLv1Label: '지정학적 리스크',
    occurredAt: dayjs().subtract(8, 'day').hour(0).minute(0).second(0).toISOString(),
    updatedAt: dayjs().subtract(8, 'day').hour(0).minute(0).second(0).toISOString(),
    indexImpacts: [
      buildIndexImpact('JKM', MarketImpactLevel.HIGH, MarketDirection.BULLISH),
      buildIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BULLISH),
      buildIndexImpact('HH', MarketImpactLevel.NONE, MarketDirection.NEGLIGIBLE),
    ],
    recommended: false,
    termByIndex: { JKM: 'short', TTF: 'short', HH: 'short' },
  },
  {
    eventId: '1003',
    eventName: '유럽 재고 예상 상회로 TTF 약세 전환',
    status: 'updated',
    statusLabel: '갱신',
    signalType: 'signal',
    signalTypeLabel: '신호',
    eventCategoryLv1: EventCategoryLv1.SUPPLY_DEMAND_BALANCE,
    eventCategoryLv1Label: '수급 밸런스',
    occurredAt: dayjs().subtract(10, 'day').hour(9).minute(30).second(0).toISOString(),
    updatedAt: dayjs().subtract(10, 'day').hour(9).minute(30).second(0).toISOString(),
    indexImpacts: [
      buildIndexImpact('JKM', MarketImpactLevel.LOW, MarketDirection.NEGLIGIBLE),
      buildIndexImpact('TTF', MarketImpactLevel.MEDIUM, MarketDirection.BEARISH),
      buildIndexImpact('HH', MarketImpactLevel.NONE, MarketDirection.NEGLIGIBLE),
    ],
    recommended: true,
    recommendationReason: '유럽 가격 변동성이 커 단기 대응 관점에서 중요합니다.',
    termByIndex: { JKM: 'short', TTF: 'short', HH: 'long' },
  },
]

const applyFilters = (rows: MockEventRow[], params: { eventStatus?: ScenarioWorkbenchEventStatus[]; keyword?: string }) => {
  const keyword = params.keyword?.trim()
  let out = rows
  if (params.eventStatus?.length) {
    const allowed = new Set(params.eventStatus)
    out = out.filter((r) => allowed.has(r.status))
  }
  if (keyword) {
    const lowered = keyword.toLowerCase()
    out = out.filter((r) => r.eventName.toLowerCase().includes(lowered))
  }
  return out
}

const toPagination = <T>(rows: T[], page: number, size: number): IPaginationResponse<T> => {
  const resolvedPage = page > 0 ? page : 1
  const resolvedSize = size > 0 ? size : 20
  const start = (resolvedPage - 1) * resolvedSize
  const detail = rows.slice(start, start + resolvedSize)
  const totalElements = rows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / resolvedSize))
  return {
    detail,
    totalElements,
    totalPages,
    currentPage: resolvedPage,
    numberOfElements: detail.length,
    size: resolvedSize,
    isFirst: resolvedPage === 1,
    isLast: resolvedPage >= totalPages,
    hasPrevious: resolvedPage > 1,
    hasNext: resolvedPage < totalPages,
  }
}

export const scenarioWorkbenchMockApi = {
  getEvents(params: {
    page?: number
    size?: number
    sort?: string
    eventStatus?: ScenarioWorkbenchEventStatus[]
    keyword?: string
  }): IScenarioWorkbenchEventListRes & { events: IPaginationResponse<MockEventRow> } {
    const filtered = applyFilters(MOCK_ROWS, { eventStatus: params.eventStatus, keyword: params.keyword })
    // 정렬은 퍼블리싱 검증 우선이라 단순 처리
    const sorted = [...filtered].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    const events = toPagination(sorted, params.page ?? 1, params.size ?? 20)
    return {
      summaryNotice: { newEventCount: 1, updatedEventCount: 2 },
      appliedFilter: {},
      events,
    }
  },
}
