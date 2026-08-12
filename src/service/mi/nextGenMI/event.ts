import { AxiosResponse } from 'axios'

import type { IScenarioDimension, IScenarioDimensionColumn, ScenarioJudgementStatus } from '@/service/mi/nextGenMI/scenarioGroup'

import api from '@/lib/axios'
import { MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'
// #DELETE: API 적용후엔 목데이터 삭제
import {
  buildMockEventDesignAvailability,
  buildMockEventDetail,
  buildMockEventList,
  MOCK_EVENT_TYPE_L1_LIST,
} from '@/service/mi/nextGenMI/eventListMock'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type EventSort = 'latest' | 'oldest'

export type EventStatus = 'all' | 'new' | 'updated'

export type EventSignalType = 'signal' | 'noise'

export type EventScenarioDesignStatus = 'designable' | 'creating' | 'created' | 'unavailable'

export type EventDesignStep = 'step1' | 'step2'

export type EventImpactTerm = 'short' | 'mid_long'

export type EventImpactMarketImpactLevel = MarketImpactLevel.LOW | MarketImpactLevel.MEDIUM | MarketImpactLevel.HIGH

export interface EventTypeL1 {
  eventTypeL1Id: number
  code: string
  label: string
}

export interface EventImpactIndex {
  indexName: string
  marketImpactLevel?: EventImpactMarketImpactLevel | null
  marketImpactLevelLabel?: string
  direction?: MarketDirection | null
  directionLabel?: string
  impactTerm?: EventImpactTerm | null
  impactTermLabel?: string
}

export interface EventConnectedScenarioGroupEvent {
  eventId: number
  eventName: string
}

export interface EventConnectedScenarioGroup {
  scenarioGroupId: number
  groupName: string
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
  /** creating이면 N단계 배지, created이면 보기(>) */
  scenarioDesignStatus?: EventScenarioDesignStatus | string | null
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  events: EventConnectedScenarioGroupEvent[]
}

export interface EventListItem {
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
  latestRecordFirstCreated: string
  isScenarioSuggested?: boolean
  scenarioSuggestReason?: string | null
  scenarioDesignStatus?: EventScenarioDesignStatus
  scenarioDesignStatusLabel?: string
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
  scenarioGroupId?: number | null
  /** 이벤트에 연결된 시나리오 그룹 목록 (다중 연결 시) */
  connectedScenarioGroups?: EventConnectedScenarioGroup[]
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  indexImpacts: EventImpactIndex[]
}

export interface EventAppliedFilter {
  eventStatus?: EventStatus
  eventTypeL1Id?: number[]
  startDate?: string
  endDate?: string
  sort?: EventSort
  keyword?: string
  suggestedOnly?: boolean
}

export interface EventList {
  appliedFilter: EventAppliedFilter
  events: IPaginationResponse<EventListItem>
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

export interface EventDesignAvailability {
  eventId?: number
  scenarioDesignStatus?: EventScenarioDesignStatus | string
  scenarioDesignStatusLabel?: string
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
  occupied?: boolean
  occupantUserId?: number | null
  occupantUserName?: string | null
  scenarioGroupId?: number | null
}

export interface GetEventDesignAvailabilityParams {
  eventIds?: number[]
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

export interface RelatedScenario {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
  dimensions?: IScenarioDimension[]
  probability: number
  adjustedProbability?: number
  status?: ScenarioJudgementStatus
  statusLabel?: string
}

export interface RelatedEventScenario {
  scenarioGroupId?: number | null
  groupName?: string
  dimensionColumns?: IScenarioDimensionColumn[]
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
  isScenarioSuggested?: boolean
  scenarioSuggestReason?: string | null
  scenarioDesignStatus?: EventScenarioDesignStatus
  scenarioDesignStatusLabel?: string | null
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
  latestRecordFirstCreated?: string
  createdAt: string
  updatedAt: string
  aiInsights?: EventAiInsights | null
  impactAnalysis?: EventImpactAnalysis | null
  driverTreeScoreboard?: EventDriverTreeIndex[]
  institutionViewSynthesis?: string | null
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
  isPermitted?: boolean
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
  async getEventTypesL1(): Promise<EventTypeL1[]> {
    try {
      const response: AxiosResponse<ICommonResponse<EventTypeL1[]>> = await api.get('mi/next-gen/events/event-types/lv1', {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean })

      return response.data.data
    } catch {
      // #DELETE: API 적용후엔 목데이터 삭제 - 카테고리 필터 확인용 더미
      return MOCK_EVENT_TYPE_L1_LIST
    }
  },

  async getEvents(params: GetEventsParams): Promise<EventList> {
    try {
      const response: AxiosResponse<ICommonResponse<EventList>> = await api.get('mi/next-gen/events', {
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
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean })

      return response.data.data
    } catch {
      // #DELETE: API 적용후엔 목데이터 삭제 - Event List 화면 확인용 더미
      return buildMockEventList(params)
    }
  },

  async getEventDetail(eventId: string): Promise<EventDetail> {
    try {
      const response: AxiosResponse<ICommonResponse<EventDetail>> = await api.get(`mi/next-gen/events/${encodeURIComponent(eventId)}`, {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean })

      return response.data.data
    } catch {
      // #DELETE: API 적용후엔 목데이터 삭제 - 시나리오 설계/상세 화면 확인용 더미
      return buildMockEventDetail(eventId)
    }
  },

  async getEventDesignAvailability(params?: GetEventDesignAvailabilityParams): Promise<EventDesignAvailability[]> {
    try {
      const response: AxiosResponse<ICommonResponse<EventDesignAvailability[]>> = await api.get('mi/next-gen/events/design-availability', {
        params: {
          eventIds: params?.eventIds,
        },
        paramsSerializer: (p) => serializeNextGenMIEventsParams(p as Record<string, unknown>),
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean })

      return response.data.data ?? []
    } catch {
      // #DELETE: API 적용후엔 목데이터 삭제 - 시나리오 설계 상태 확인용 더미
      return buildMockEventDesignAvailability(params?.eventIds)
    }
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
