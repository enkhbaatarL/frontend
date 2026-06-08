import { AxiosResponse } from 'axios'

import { MarketDirection, MarketImpactLevel } from './common'

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

export interface EventImpactIndexTerm {
  marketImpactLevel?: EventImpactMarketImpactLevel | null
  marketImpactLevelLabel?: string | null
  direction?: MarketDirection | null
  directionLabel?: string | null
}

export interface EventDetailImpactIndex {
  indexName?: string | null
  shortTerm?: EventImpactIndexTerm | null
  midLongTerm?: EventImpactIndexTerm | null
}

export interface EventImpactAnalysis {
  indexImpacts?: EventDetailImpactIndex[]
  analysisText?: string | null
  eventTypeLv1?: string | null
  eventTypeLv1Label?: string | null
  eventTypeLv2?: string | null
  eventTypeLv2Label?: string | null
  sources?: string[]
}

export interface EventAiInsights {
  keySummaries?: string[]
  detailedAnalysis?: string | null
}

export interface DriverTreeScoreboard {
  lv1Id?: string | null
  lv1Label?: string | null
  lv2Id?: string | null
  lv2Label?: string | null
  lv3Id?: string | null
  lv3Label?: string | null
  shortTerm?: EventImpactIndexTerm | null
  midLongTerm?: EventImpactIndexTerm | null
  reason?: string | null
}

export interface EventDriverTreeIndex {
  indexName?: string | null
  drivers?: DriverTreeScoreboard[]
}

export interface RelatedEvent {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventTypeLv1?: string | null
  eventTypeLv1Label?: string | null
  indexImpacts?: EventImpactIndexRes[]
}

export interface RelatedScenarioImpactIndex {
  indexName: string
  marketImpactLevel: EventImpactMarketImpactLevel
  marketImpactLevelLabel?: string | null
}

export interface RelatedScenario {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  indexImpacts?: RelatedScenarioImpactIndex[]
  probability: number
  period?: string | null
  transportDisruption?: string | null
  supplyDisruptionIntensity?: string | null
  supplyRecoveryPattern?: string | null
  normalizationCheck?: string | null
}

export interface RelatedEventScenario {
  event?: RelatedEvent | null
  scenarios?: RelatedScenario[]
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

export interface EventDetail {
  eventId: number
  eventName: string
  status?: EventStatus
  statusLabel?: string | null
  signalType?: EventSignalType
  signalTypeLabel?: string | null
  createdAt: string
  updatedAt: string
  aiInsights?: EventAiInsights | null
  impactAnalysis?: EventImpactAnalysis | null
  driverTreeScoreboard?: EventDriverTreeIndex[]
  fundamentalDeepdive?: INextGenMIEventFundamentalDeepdive | INextGenMIEventFundamental
  relatedEventScenario?: RelatedEventScenario | null
}

export interface EventRelatedRecord {
  publishedAt?: string
  recordType?: string | null
  title?: string | null
  summary?: string | null
  goodsNo?: number | null
  goodsDataNo?: number | null
  sourceObjId?: number | null
}

export interface EventInstitutionOutlook {
  viewDate?: string
  institutionName?: string | null
  outlookSummary?: string | null
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

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const response: AxiosResponse<ICommonResponse<EventDetail>> = await api.get(`mi/next-gen/events/${encodeURIComponent(eventId)}`)

    return response.data.data
  },

  async getEventRecords(eventId: string, params?: IGetNextGenMIEventRecordsParams): Promise<IPaginationResponse<EventRelatedRecord>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<EventRelatedRecord>>> = await api.get(
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
  ): Promise<IPaginationResponse<EventInstitutionOutlook>> {
    const response: AxiosResponse<ICommonResponse<IPaginationResponse<EventInstitutionOutlook>>> = await api.get(
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
