import { AxiosResponse } from 'axios'

import type {
  IScenarioDimension,
  IScenarioDimensionColumn,
  ScenarioJudgementStatus,
  ScenarioRole,
} from '@/service/mi/nextGenMI/scenarioGroup'

import api from '@/lib/axios'
import { MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type EventSort = 'latest' | 'oldest'

export type EventStatus = 'all' | 'new' | 'updated'

export type EventSignalType = 'signal' | 'noise'

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

export type ScenarioGroupLifecycleStatus = 'creating' | 'created' | 'realized'

/**
 * GET .../events/{eventId}/scenario-groups
 * - 그룹ID, 그룹명, 생성자, 생성일시, 상태, 단계(1/2), 본인 여부
 * - 생성일시 최신순은 화면에서 재정렬
 */
export interface EventLinkedScenarioGroup {
  scenarioGroupId: number
  title: string
  status?: ScenarioGroupLifecycleStatus | string
  statusLabel?: string
  stage?: string
  stageLabel?: string
  designStep?: EventDesignStep | string | null
  designStepLabel?: string | null
  /** 설계중 그룹 진행자가 로그인 사용자인지. false면 잠금. 설계중이 아니면 null */
  mine?: boolean | null
  /** 생성자 표시명 */
  createdByName?: string | null
  /** 생성일시 */
  createdAt?: string | null
  events?: string[]
}

/** BE 필드명 흔들림 대비 - 응답을 화면 타입으로 정규화 */
const normalizeEventLinkedScenarioGroup = (raw: Record<string, unknown>): EventLinkedScenarioGroup => {
  const scenarioGroupIdRaw = raw.scenarioGroupId ?? raw.id
  const scenarioGroupId = typeof scenarioGroupIdRaw === 'number' ? scenarioGroupIdRaw : Number(scenarioGroupIdRaw)

  const titleRaw = raw.title ?? raw.groupName ?? raw.scenarioGroupName
  const title = typeof titleRaw === 'string' ? titleRaw : ''

  const createdByNameRaw = raw.createdByName ?? raw.creatorName ?? raw.ownerName ?? raw.registrantName
  const createdByName =
    typeof createdByNameRaw === 'string'
      ? createdByNameRaw
      : createdByNameRaw === null || createdByNameRaw === undefined
        ? null
        : String(createdByNameRaw)

  const createdAtRaw = raw.createdAt
  const createdAt =
    typeof createdAtRaw === 'string' ? createdAtRaw : createdAtRaw === null || createdAtRaw === undefined ? null : String(createdAtRaw)

  const base = raw as unknown as EventLinkedScenarioGroup

  return {
    ...base,
    scenarioGroupId: Number.isFinite(scenarioGroupId) ? scenarioGroupId : 0,
    title,
    createdByName,
    createdAt,
  }
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
  /** 연결된 활성 시나리오 그룹 수. 1 이상이면 이벤트명 옆 펼침 버튼 표시 */
  scenarioGroupCount?: number
  /** 사용자가 직접 등록한 이벤트 */
  userRegistered?: boolean
  /** 로그인한 사용자가 등록한 이벤트 */
  registeredByMe?: boolean
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
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
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
  latestRecordFirstCreated?: string
  /** 사용자가 직접 등록한 이벤트 */
  userRegistered?: boolean
  /** 사용자 등록 이벤트의 등록자 이름 */
  registrantName?: string
  createdAt: string
  updatedAt: string
  aiInsights?: EventAiInsights | null
  impactAnalysis?: EventImpactAnalysis | null
  driverTreeScoreboard?: EventDriverTreeIndex[]
  institutionViewSynthesis?: string | null
  fundamentalDeepdive?: INextGenMIEventFundamentalDeepdive | INextGenMIEventFundamental
  relatedEventScenarios?: RelatedEventScenario[]
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
  mappingReason?: string | null
  mappingConfidence?: number | null
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
    const response: AxiosResponse<ICommonResponse<EventTypeL1[]>> = await api.get('mi/next-gen/events/event-types/lv1')

    return response.data.data
  },

  async getEvents(params: GetEventsParams): Promise<EventList> {
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
    })

    return response.data.data
  },

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const response: AxiosResponse<ICommonResponse<EventDetail>> = await api.get(`mi/next-gen/events/${encodeURIComponent(eventId)}`)

    return response.data.data
  },

  async getEventScenarioGroups(eventId: string | number): Promise<EventLinkedScenarioGroup[]> {
    const response: AxiosResponse<ICommonResponse<EventLinkedScenarioGroup[]>> = await api.get(
      `mi/next-gen/events/${encodeURIComponent(String(eventId))}/scenario-groups`,
    )

    const groups = response.data.data ?? []
    return groups.map((group) => normalizeEventLinkedScenarioGroup(group as unknown as Record<string, unknown>))
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
