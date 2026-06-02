import { AxiosResponse } from 'axios'

import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from './common'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type ScenarioWorkbenchEventSort = 'LATEST' | 'OLDEST'

export type ScenarioWorkbenchEventStatus = 'new' | 'updated' | 'closed'

export type ScenarioWorkbenchEventSignalType = 'signal' | 'noise'

export interface IScenarioWorkbenchImpactIndexSummary {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  direction: MarketDirection
}

export interface IScenarioWorkbenchEventListItem {
  eventId: string
  eventName: string
  status: ScenarioWorkbenchEventStatus
  statusLabel?: string
  signalType: ScenarioWorkbenchEventSignalType
  signalTypeLabel?: string
  eventCategoryLv1?: EventCategoryLv1
  eventCategoryLv1Label?: string
  occurredAt: string
  updatedAt: string
  indexImpacts: IScenarioWorkbenchImpactIndexSummary[]
}

export interface IScenarioWorkbenchEventSummaryNotice {
  newEventCount: number
  updatedEventCount: number
}

export interface IScenarioWorkbenchEventAppliedFilter {
  eventStatus?: ScenarioWorkbenchEventStatus[]
  eventCategoryLv1?: EventCategoryLv1[]
  startDate?: string
  endDate?: string
  sort?: ScenarioWorkbenchEventSort
  keyword?: string
}

export interface IScenarioWorkbenchEventListRes {
  summaryNotice: IScenarioWorkbenchEventSummaryNotice
  appliedFilter: IScenarioWorkbenchEventAppliedFilter
  events: IPaginationResponse<IScenarioWorkbenchEventListItem>
}

export interface IGetScenarioWorkbenchEventsParams {
  page?: number
  size?: number
  sort?: ScenarioWorkbenchEventSort
  eventStatus?: ScenarioWorkbenchEventStatus[]
  eventCategoryLv1?: EventCategoryLv1[]
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface IScenarioWorkbenchEventImpactAnalysis {
  indexImpacts: IScenarioWorkbenchImpactIndexSummary[]
  analysisText: string
  eventCategoryLv1?: EventCategoryLv1
  eventCategoryLv2?: string
  sources?: string[]
}

export interface IScenarioWorkbenchEventAiInsightDetailBlock {
  title: string
  body: string
}

export interface IScenarioWorkbenchEventAiInsights {
  keySummaries: string[]
  /** API 미연동 시 mock/레거시 단일 본문 */
  detailedAnalysis?: string
  /** 신규 상세분석 구조 (API 연동 전 mock) */
  detailedAnalysisBlocks?: IScenarioWorkbenchEventAiInsightDetailBlock[]
}

/** 이벤트 상세 - 관련 시나리오 그룹 행 (퍼블/mock) */
export interface IScenarioWorkbenchEventRelatedScenarioGroupRow {
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

export interface IScenarioWorkbenchEventRelatedScenarioGroup {
  groupId?: number
  groupName: string
  scenarios: IScenarioWorkbenchEventRelatedScenarioGroupRow[]
}

export interface IScenarioWorkbenchEventDriverTreeScoreboardItem {
  lv1Id?: string | number | null
  lv1Label?: string | null
  lv2Id?: string | number | null
  lv2Label?: string | null
  lv3Id?: string | number | null
  lv3Label?: string | null
  marketImpactLevel: MarketImpactLevel
  marketImpactLevelLabel?: string
  direction?: MarketDirection
  directionLabel?: string
  reason?: string | null
}

export interface IScenarioWorkbenchRelatedEventScenarioEvent {
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

export interface IScenarioWorkbenchRelatedEventScenarioScenario {
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

export interface IScenarioWorkbenchRelatedEventScenario {
  event?: IScenarioWorkbenchRelatedEventScenarioEvent
  scenarios?: IScenarioWorkbenchRelatedEventScenarioScenario[]
}

export interface IScenarioWorkbenchEventFundamentalDeepdive {
  metrics?: IScenarioWorkbenchFundamentalMetric[]
  indicators?: IScenarioWorkbenchFundamentalIndicator[]
}

export interface IScenarioWorkbenchFundamentalMetric {
  metricName: string
  currentValue: string
  interpretation: string
  source: string
}

export interface IScenarioWorkbenchFundamentalIndicator {
  indicatorName: string
  currentValue: string
  implication: string
  source: string
}

export interface IScenarioWorkbenchEventFundamental {
  metrics: IScenarioWorkbenchFundamentalMetric[]
  indicators: IScenarioWorkbenchFundamentalIndicator[]
}

export interface IScenarioWorkbenchEventDetailRes {
  eventId: string | number
  eventName: string
  status?: ScenarioWorkbenchEventStatus
  statusLabel?: string
  signalType: ScenarioWorkbenchEventSignalType
  signalTypeLabel?: string
  createdAt: string
  updatedAt: string
  impactAnalysis?: IScenarioWorkbenchEventImpactAnalysis
  aiInsights?: IScenarioWorkbenchEventAiInsights
  driverTreeScoreboard?: IScenarioWorkbenchEventDriverTreeScoreboardItem[]
  fundamentalDeepdive?: IScenarioWorkbenchEventFundamentalDeepdive | IScenarioWorkbenchEventFundamental
  relatedEventScenario?: IScenarioWorkbenchRelatedEventScenario
  /** 신규 관련 시나리오 그룹 (API 연동 전 mock) */
  relatedScenarioGroup?: IScenarioWorkbenchEventRelatedScenarioGroup
}

/** 이벤트 MI Records(getEventRecords) 페이지의 단일 row — EventRelatedRecordRes 스키마 정합 */
export interface IScenarioWorkbenchEventRelatedRecord {
  publishedAt: string
  /** Record 유형 (예: NEWS) */
  recordType?: string
  title: string
  summary: string
  goodsNo?: number
  fileName?: string
}

export interface IScenarioWorkbenchEventInstitutionOutlook {
  publishedAt: string
  institutionName: string
  outlookSummary: string
}

export interface IGetScenarioWorkbenchEventRecordsParams {
  page?: number
  size?: number
}

export interface IGetScenarioWorkbenchEventOutlooksParams {
  page?: number
  size?: number
}

const serializeScenarioWorkbenchEventsParams = (params: Record<string, unknown>): string => {
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

const scenarioWorkbenchEventService = {
  async getEvents(params: IGetScenarioWorkbenchEventsParams): Promise<IScenarioWorkbenchEventListRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioWorkbenchEventListRes>> = await api.get('mi/scenario-workbench/events', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        sort: params.sort,
        startDate: params.startDate,
        endDate: params.endDate,
        keyword: params.keyword,
        eventStatus: params.eventStatus,
        eventCategoryLv1: params.eventCategoryLv1,
      },
      paramsSerializer: (p) => serializeScenarioWorkbenchEventsParams(p as Record<string, unknown>),
    })

    return response.data.data
  },

  async getEventDetail(eventId: string): Promise<IScenarioWorkbenchEventDetailRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioWorkbenchEventDetailRes>> = await api.get(
      `mi/scenario-workbench/events/${encodeURIComponent(eventId)}`,
    )

    return response.data.data
  },

  async getEventRecords(
    eventId: string,
    params?: IGetScenarioWorkbenchEventRecordsParams,
  ): Promise<IPaginationResponse<IScenarioWorkbenchEventRelatedRecord>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IScenarioWorkbenchEventRelatedRecord>>> = await api.get(
      `mi/scenario-workbench/events/${encodeURIComponent(eventId)}/records`,
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
    params?: IGetScenarioWorkbenchEventOutlooksParams,
  ): Promise<IPaginationResponse<IScenarioWorkbenchEventInstitutionOutlook>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<IScenarioWorkbenchEventInstitutionOutlook>>> = await api.get(
      `mi/scenario-workbench/events/${encodeURIComponent(eventId)}/outlooks`,
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

export default scenarioWorkbenchEventService
