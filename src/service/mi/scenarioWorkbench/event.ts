import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

/** Swagger: EventAppliedFilterRes.period */
export type ScenarioWorkbenchEventPeriod =
  | 'RECENT_7_DAYS'
  | 'ONE_MONTH'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'TWELVE_MONTHS'
  | 'ALL'
  | 'CUSTOM'

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

/** Swagger: ImpactIndexSummaryRes */
export type ScenarioWorkbenchImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'

export type ScenarioWorkbenchPriceDirection = 'UP' | 'FLAT' | 'DOWN' | 'NONE'

export interface IScenarioWorkbenchImpactIndexSummary {
  indexName: string
  impactLevel: ScenarioWorkbenchImpactLevel
  priceDirection: ScenarioWorkbenchPriceDirection
}

export interface IScenarioWorkbenchEventListItem {
  eventId: string
  title: string
  eventStatus: ScenarioWorkbenchEventStatus
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
  period?: ScenarioWorkbenchEventPeriod
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
  period?: ScenarioWorkbenchEventPeriod
  startDate?: string
  endDate?: string
  keyword?: string
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
    const response: AxiosResponse<ICommonResponse<IScenarioWorkbenchEventListRes>> = await api.get(
      'mi/scenario-workbench/events',
      {
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
      },
    )

    return response.data.data
  },
}

export default scenarioWorkbenchEventService
