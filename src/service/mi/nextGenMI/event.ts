import { AxiosResponse } from 'axios'

import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from './common'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type NextGenMIEventSort = 'latest' | 'oldest'

export type NextGenMIEventStatus = 'all' | 'new' | 'updated'

export type NextGenMIEventSignalType = 'signal' | 'noise'

export type NextGenMIEventImpactTerm = 'short' | 'mid_long'

export interface INextGenMIEventTypeL1 {
  eventTypeL1Id: number
  code: string
  label: string
}

export interface INextGenMIImpactIndexSummary {
  indexName: string
  marketImpactLevel?: MarketImpactLevel | null
  marketImpactLevelLabel?: string
  direction?: MarketDirection | null
  directionLabel?: string
  impactTerm?: NextGenMIEventImpactTerm | null
  impactTermLabel?: string
}

export interface INextGenMIEventListItem {
  eventId: number
  eventName: string
  status: NextGenMIEventStatus
  statusLabel?: string
  signalType: NextGenMIEventSignalType
  signalTypeLabel?: string
  eventTypeLv1?: string
  eventTypeLv1Label?: string
  updatedAt: string
  createdAt: string
  isScenarioSuggested?: boolean
  scenarioSuggestReason?: string | null
  indexImpacts: INextGenMIImpactIndexSummary[]
}

export interface INextGenMIEventAppliedFilter {
  eventStatus?: NextGenMIEventStatus
  eventTypeL1Id?: number[]
  startDate?: string
  endDate?: string
  sort?: NextGenMIEventSort
  keyword?: string
  suggestedOnly?: boolean
}

export interface INextGenMIEventListRes {
  appliedFilter: INextGenMIEventAppliedFilter
  events: IPaginationResponse<INextGenMIEventListItem>
}

export interface IGetNextGenMIEventsParams {
  page?: number
  size?: number
  sort?: NextGenMIEventSort
  eventStatus?: NextGenMIEventStatus
  eventTypeL1Id?: number[]
  startDate?: string
  endDate?: string
  keyword?: string
  suggestedOnly?: boolean
}

export interface INextGenMIEventImpactAnalysis {
  /**
   * 이벤트 상세 화면 전용 영향 테이블 row
   * - 목록 Events의 `indexImpacts`(INextGenMIImpactIndexSummary[])와는 별개
   */
  indexImpacts: INextGenMIEventImpactIndexRow[]
  analysisText: string
  eventTypeLv1?: string
  eventTypeLv1Label?: string
  eventTypeLv2?: string
  eventTypeLv2Label?: string
  eventCategoryLv1?: EventCategoryLv1
  eventCategoryLv2?: string
  sources?: string[]
}

/** 이벤트 상세 - 영향도 분석(대상별 단기/중장기) 테이블 row */
export interface INextGenMIEventImpactIndexRow {
  indexName: string
  /** 단기 영향 */
  shortTermImpactLevel?: MarketImpactLevel
  shortTermDirection?: MarketDirection
  /** 중장기 영향 */
  midLongTermImpactLevel?: MarketImpactLevel
  midLongTermDirection?: MarketDirection
}

export interface INextGenMIEventAiInsightDetailBlock {
  title: string
  body: string
}

export interface INextGenMIEventAiInsights {
  keySummaries: string[]
  /** API 미연동 시 mock/레거시 단일 본문 */
  detailedAnalysis?: string
  /** 신규 상세분석 구조 (API 연동 전 mock) */
  detailedAnalysisBlocks?: INextGenMIEventAiInsightDetailBlock[]
}

/** 이벤트 상세 - 관련 시나리오 그룹 행 (퍼블/mock) */
export interface INextGenMIEventRelatedScenarioGroupRow {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  feasibility: number
  duration: string
  transportDisruption: string
  supplyDisruptionIntensity: string
  supplyRecoveryPattern: string
  normalizationConfirmation: string
}

export interface INextGenMIEventRelatedScenarioGroup {
  groupId?: number
  groupName: string
  scenarios: INextGenMIEventRelatedScenarioGroupRow[]
}

export interface INextGenMIEventDriverTreeScoreboardItem {
  /** 대상 지수 (예: JKM/TTF/HH) */
  indexName?: string | null
  lv1Id?: string | number | null
  lv1Label?: string | null
  lv2Id?: string | number | null
  lv2Label?: string | null
  lv3Id?: string | number | null
  lv3Label?: string | null
  /** 단기 영향(기존 필드 유지) */
  marketImpactLevel: MarketImpactLevel
  marketImpactLevelLabel?: string
  direction?: MarketDirection
  directionLabel?: string
  /** 중장기 영향(신규) */
  midLongTermImpactLevel?: MarketImpactLevel
  midLongTermDirection?: MarketDirection
  reason?: string | null
}

export interface INextGenMIRelatedEventScenarioEvent {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1?: EventCategoryLv1
  eventCategoryLv1Label?: string
  indexImpacts?: Array<{
    indexName: string
    marketImpactLevel: MarketImpactLevel
    marketImpactLevelLabel?: string
    direction?: MarketDirection
    directionLabel?: string
  }>
}

export interface INextGenMIRelatedEventScenarioScenario {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  probability: number
  indexImpacts?: Array<{
    indexName: string
    marketImpactLevel: MarketImpactLevel
    marketImpactLevelLabel?: string
  }>
}

export interface INextGenMIRelatedEventScenario {
  event?: INextGenMIRelatedEventScenarioEvent
  scenarios?: INextGenMIRelatedEventScenarioScenario[]
}

export interface INextGenMIEventFundamentalDeepdive {
  metrics?: INextGenMIFundamentalMetric[]
  indicators?: INextGenMIFundamentalIndicator[]
}

export interface INextGenMIFundamentalMetric {
  metricName: string
  currentValue: string
  interpretation: string
  source: string
}

export interface INextGenMIFundamentalIndicator {
  indicatorName: string
  currentValue: string
  implication: string
  source: string
}

export interface INextGenMIEventFundamental {
  metrics: INextGenMIFundamentalMetric[]
  indicators: INextGenMIFundamentalIndicator[]
}

export interface INextGenMIEventDetailRes {
  eventId: string | number
  eventName: string
  status?: NextGenMIEventStatus
  statusLabel?: string
  signalType: NextGenMIEventSignalType
  signalTypeLabel?: string
  createdAt: string
  updatedAt: string
  impactAnalysis?: INextGenMIEventImpactAnalysis
  aiInsights?: INextGenMIEventAiInsights
  driverTreeScoreboard?: INextGenMIEventDriverTreeScoreboardItem[]
  fundamentalDeepdive?: INextGenMIEventFundamentalDeepdive | INextGenMIEventFundamental
  relatedEventScenario?: INextGenMIRelatedEventScenario
  /** 신규 관련 시나리오 그룹 (API 연동 전 mock) */
  relatedScenarioGroup?: INextGenMIEventRelatedScenarioGroup
}

/** 이벤트 MI Records(getEventRecords) 페이지의 단일 row — EventRelatedRecordRes 스키마 정합 */
export interface INextGenMIEventRelatedRecord {
  publishedAt: string
  /** Record 유형 (예: NEWS) */
  recordType?: string
  title: string
  summary: string
  goodsNo?: number
  fileName?: string
}

export interface INextGenMIEventInstitutionOutlook {
  publishedAt: string
  institutionName: string
  outlookSummary: string
}

export interface IGetNextGenMIEventRecordsParams {
  page?: number
  size?: number
}

export interface IGetNextGenMIEventOutlooksParams {
  page?: number
  size?: number
}

const serializeNextGenMIEventsParams = (params: Record<string, unknown>): string => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null && v !== '') usp.append(key, String(v))
      })
    } else {
      usp.append(key, String(value))
    }
  })
  return usp.toString()
}

const nextGenMIEventService = {
  async getEventTypesL1(): Promise<INextGenMIEventTypeL1[]> {
    const response: AxiosResponse<ICommonResponse<INextGenMIEventTypeL1[]>> = await api.get('mi/next-gen/events/event-types/lv1')

    return response.data.data
  },

  async getEvents(params: IGetNextGenMIEventsParams): Promise<INextGenMIEventListRes> {
    const response: AxiosResponse<ICommonResponse<INextGenMIEventListRes>> = await api.get('mi/next-gen/events', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        sort: params.sort,
        startDate: params.startDate,
        endDate: params.endDate,
        keyword: params.keyword,
        eventStatus: params.eventStatus,
        eventTypeL1Id: params.eventTypeL1Id,
        suggestedOnly: params.suggestedOnly,
      },
      paramsSerializer: (p) => serializeNextGenMIEventsParams(p as Record<string, unknown>),
    })

    return response.data.data
  },

  async getEventDetail(eventId: string): Promise<INextGenMIEventDetailRes> {
    const response: AxiosResponse<ICommonResponse<INextGenMIEventDetailRes>> = await api.get(
      `mi/next-gen/events/${encodeURIComponent(eventId)}`,
    )

    return response.data.data
  },

  async getEventRecords(
    eventId: string,
    params?: IGetNextGenMIEventRecordsParams,
  ): Promise<IPaginationResponse<INextGenMIEventRelatedRecord>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INextGenMIEventRelatedRecord>>> = await api.get(
      `mi/next-gen/events/${encodeURIComponent(eventId)}/records`,
      {
        params: {
          page: params?.page ?? 1,
          size: params?.size ?? 10,
        },
      },
    )

    return response.data.data
  },

  async getEventOutlooks(
    eventId: string,
    params?: IGetNextGenMIEventOutlooksParams,
  ): Promise<IPaginationResponse<INextGenMIEventInstitutionOutlook>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<INextGenMIEventInstitutionOutlook>>> = await api.get(
      `mi/next-gen/events/${encodeURIComponent(eventId)}/outlooks`,
      {
        params: {
          page: params?.page ?? 1,
          size: params?.size ?? 10,
        },
      },
    )

    return response.data.data
  },
}

export default nextGenMIEventService
