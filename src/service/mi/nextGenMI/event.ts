import { AxiosResponse } from 'axios'

import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from './common'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type EventSort = 'latest' | 'oldest'

export type EventStatus = 'all' | 'new' | 'updated'

export type EventSignalType = 'signal' | 'noise'

export type EventImpactTerm = 'short' | 'mid_long'

export type EventImpactMarketImpactLevel = MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH

export interface EventTypeL1Res {
  eventTypeL1Id: number
  code: string
  label: string
}

export interface EventImpactIndexRes {
  indexName: string
  marketImpactLevel?: EventImpactMarketImpactLevel | null
  marketImpactLevelLabel?: string
  direction?: MarketDirection | null
  directionLabel?: string
  impactTerm?: EventImpactTerm | null
  impactTermLabel?: string
}

export interface EventListItemRes {
  eventId: number
  eventName: string
  status: EventStatus
  statusLabel?: string
  signalType: EventSignalType
  signalTypeLabel?: string
  eventTypeLv1?: string
  eventTypeLv1Label?: string
  updatedAt: string
  createdAt: string
  isScenarioSuggested?: boolean
  scenarioSuggestReason?: string | null
  indexImpacts: EventImpactIndexRes[]
}

export interface EventAppliedFilterRes {
  eventStatus?: EventStatus
  eventTypeL1Id?: number[]
  startDate?: string
  endDate?: string
  sort?: EventSort
  keyword?: string
  suggestedOnly?: boolean
}

export interface EventListRes {
  appliedFilter: EventAppliedFilterRes
  events: IPaginationResponse<EventListItemRes>
}

export interface GetEventsParams {
  page?: number
  size?: number
  sort?: EventSort
  eventStatus?: EventStatus
  eventTypeL1Id?: number[]
  startDate?: string
  endDate?: string
  keyword?: string
  suggestedOnly?: boolean
}

export interface INextGenMIEventImpactAnalysis {
  /**
   * 이벤트 상세 화면 전용 영향 테이블 row
   * - 목록 Events의 `indexImpacts`(EventImpactIndexRes[])와는 별개
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
  /** 레거시 단일 본문 */
  detailedAnalysis?: string
  /** 상세분석 블록 구조 */
  detailedAnalysisBlocks?: INextGenMIEventAiInsightDetailBlock[]
}

/** 이벤트 상세 - 관련 시나리오 그룹 행 */
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
  status?: EventStatus
  statusLabel?: string
  signalType: EventSignalType
  signalTypeLabel?: string
  createdAt: string
  updatedAt: string
  impactAnalysis?: INextGenMIEventImpactAnalysis
  aiInsights?: INextGenMIEventAiInsights
  driverTreeScoreboard?: INextGenMIEventDriverTreeScoreboardItem[]
  fundamentalDeepdive?: INextGenMIEventFundamentalDeepdive | INextGenMIEventFundamental
  relatedEventScenario?: INextGenMIRelatedEventScenario
  /** 관련 시나리오 그룹 */
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

type EventQueryParamValue = string | number | boolean

const appendNextGenMIEventsParam = (usp: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '') return
  if (typeof value === 'string') {
    usp.append(key, value)
    return
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    usp.append(key, value.toString())
  }
}

const serializeNextGenMIEventsParams = (params: Record<string, unknown>): string => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v: EventQueryParamValue) => appendNextGenMIEventsParam(usp, key, v))
      return
    }
    appendNextGenMIEventsParam(usp, key, value)
  })
  return usp.toString()
}

const nextGenMIEventService = {
  async getEventTypesL1(): Promise<EventTypeL1Res[]> {
    const response: AxiosResponse<ICommonResponse<EventTypeL1Res[]>> = await api.get('mi/next-gen/events/event-types/lv1')

    return response.data.data
  },

  async getEvents(params: GetEventsParams): Promise<EventListRes> {
    const response: AxiosResponse<ICommonResponse<EventListRes>> = await api.get('mi/next-gen/events', {
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
