import { AxiosResponse } from 'axios'

import { ListPeriod, MarketDirection, MarketImpactLevel } from './common'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

/** Swagger: EventAppliedFilterRes.sort */
export type ScenarioWorkbenchEventSort = 'LATEST' | 'OLDEST'

/** Swagger: EventListItemRes.eventStatus */
export type ScenarioWorkbenchEventStatus = 'NEW' | 'UPDATED' | 'CLOSED'

/** Swagger: EventListItemRes.eventCategoryLv1 */
export type ScenarioWorkbenchEventCategoryLv1 =
  | 'GEOPOLITICAL_RISK'
  | 'WEATHER_CLIMATE'
  | 'INFRASTRUCTURE_FACILITY'
  | 'SUPPLY_DEMAND_BALANCE'
  | 'LOGISTICS_SHIPPING'
  | 'ENERGY_MIX_TRANSITION'
  | 'MACROECONOMY_POLICY'
  | 'MARKET_TRADING_STRUCTURE'

/** 이벤트 유형 Lv1 한글 라벨 (목록·상세 KPI 등 공통) */
export const SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO: Record<ScenarioWorkbenchEventCategoryLv1, string> = {
  GEOPOLITICAL_RISK: '지정학적 리스크',
  WEATHER_CLIMATE: '기상/기후',
  INFRASTRUCTURE_FACILITY: '인프라/설비',
  SUPPLY_DEMAND_BALANCE: '수급밸런스',
  LOGISTICS_SHIPPING: '물류/해운',
  ENERGY_MIX_TRANSITION: '에너지 믹스 전환',
  MACROECONOMY_POLICY: '거시경제/정책',
  MARKET_TRADING_STRUCTURE: '시장/거래 구조',
}

export interface IScenarioWorkbenchImpactIndexSummary {
  indexName: string
  /** Swagger는 low/medium/high(소문자) 260508: impactLevel -> marketImpactLevel */
  marketImpactLevel: MarketImpactLevel | string
  /** 260506: 상세 API에서 bullish/bearish/negligible(소문자)로 내려오는 케이스 대응 */
  direction: MarketDirection | string
}

/** 이벤트 목록 한 줄 (indexImpacts는 JKM·TTF·HH 등 지수별 요약) */
export interface IScenarioWorkbenchEventListItem {
  eventId: string
  // 260506: title -> eventName
  eventName: string
  // 260506: eventStatus -> status
  status: ScenarioWorkbenchEventStatus
  eventCategoryLv1: ScenarioWorkbenchEventCategoryLv1
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
  eventCategoryLv1?: ScenarioWorkbenchEventCategoryLv1[]
  period?: ListPeriod
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
  eventCategoryLv1?: ScenarioWorkbenchEventCategoryLv1[]
  period?: ListPeriod
  startDate?: string
  endDate?: string
  keyword?: string
}

/** Swagger: EventImpactAnalysisRes */
export interface IScenarioWorkbenchEventImpactAnalysis {
  indexImpacts: IScenarioWorkbenchImpactIndexSummary[]
  analysisText: string
  /** 260506: categoryLv1 -> eventCategoryLv1 */
  eventCategoryLv1?: ScenarioWorkbenchEventCategoryLv1
  /** 260506: categoryLv2 -> eventCategoryLv2 */
  eventCategoryLv2?: string
  /** 하위호환: 구 응답 필드 */
  categoryLv1?: ScenarioWorkbenchEventCategoryLv1
  /** 하위호환: 구 응답 필드 */
  categoryLv2?: string
  sources?: string[]
}

/** Swagger: EventAiInsightsRes */
export interface IScenarioWorkbenchEventAiInsights {
  keySummaries: string[]
  detailedAnalysis: string
}

/** Swagger: RelatedEventScenarioEventRes */
export interface IScenarioWorkbenchRelatedEventScenarioEvent {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1?: string
  eventCategoryLv1Label?: string
  indexImpacts?: Array<{
    indexName: string
    marketImpactLevel: string
    marketImpactLevelLabel?: string
    direction?: string
    directionLabel?: string
  }>
}

/** Swagger: RelatedEventScenarioScenarioRes */
export interface IScenarioWorkbenchRelatedEventScenarioScenario {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  probability?: number
  indexImpacts?: Array<{
    indexName: string
    marketImpactLevel: string
    marketImpactLevelLabel?: string
  }>
}

/** Swagger: RelatedEventScenarioRes */
export interface IScenarioWorkbenchRelatedEventScenario {
  event?: IScenarioWorkbenchRelatedEventScenarioEvent
  scenarios?: IScenarioWorkbenchRelatedEventScenarioScenario[]
}

/** Swagger: FundamentalDeepdiveRes */
export interface IScenarioWorkbenchEventFundamentalDeepdive {
  /** 260506: 테이블 미준비 상태로 null/빈값 가능 */
  metrics?: IScenarioWorkbenchFundamentalMetric[]
  indicators?: IScenarioWorkbenchFundamentalIndicator[]
  /** 260506: 임시 items 배열로 내려오는 케이스 */
  items?: string[]
}

/** Swagger: FundamentalMetricRes */
export interface IScenarioWorkbenchFundamentalMetric {
  metricName: string
  currentValue: string
  interpretation: string
  source: string
}

/** Swagger: FundamentalIndicatorRes */
export interface IScenarioWorkbenchFundamentalIndicator {
  indicatorName: string
  currentValue: string
  implication: string
  source: string
}

/** Swagger: EventFundamentalRes */
export interface IScenarioWorkbenchEventFundamental {
  metrics: IScenarioWorkbenchFundamentalMetric[]
  indicators: IScenarioWorkbenchFundamentalIndicator[]
}

/** Swagger: EventDetailRes */
export interface IScenarioWorkbenchEventDetailRes {
  eventId: string | number
  /** 260506: title -> eventName */
  eventName?: string
  /** 하위호환: 구 응답 필드 */
  title?: string
  /** 260506: eventStatus -> status */
  status?: ScenarioWorkbenchEventStatus
  /** 하위호환: 구 응답 필드 */
  eventStatus?: ScenarioWorkbenchEventStatus
  statusLabel?: string
  createdAt: string
  updatedAt: string
  impactAnalysis?: IScenarioWorkbenchEventImpactAnalysis
  aiInsights?: IScenarioWorkbenchEventAiInsights
  fundamentalDeepdive?: IScenarioWorkbenchEventFundamentalDeepdive | IScenarioWorkbenchEventFundamental
  relatedEventScenario?: IScenarioWorkbenchRelatedEventScenario
}

/** Swagger: EventRelatedRecordRes */
export interface IScenarioWorkbenchEventRelatedRecord {
  publishedAt: string
  title: string
  summary: string
  source: string
}

/** Swagger: EventInstitutionOutlookRes */
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
        period: params.period,
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
