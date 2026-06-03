import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { EventCategoryLv1, ListSort, MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type OverviewPriceIndexName = 'JKM' | 'TTF' | 'HH'

export type OverviewEventSignalType = 'signal' | 'noise'

export interface IOverviewEventImpactIndex {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  marketImpactLevelLabel?: string
  direction?: MarketDirection
  directionLabel?: string
}

export interface IOverviewScenarioBrief {
  scenarioId: number
  scenarioName: string
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  baseCase: boolean
  indexImpacts: IOverviewScenarioImpactIndex[]
  probability: number
}

export interface IOverviewScenarioImpactIndex {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  marketImpactLevelLabel?: string
}

export interface IOverviewEventItem {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1: EventCategoryLv1
  eventCategoryLv1Label?: string
  signalType: OverviewEventSignalType
  signalTypeLabel?: string
  indexImpacts: IOverviewEventImpactIndex[]
  scenarios: IOverviewScenarioBrief[]
}

export interface IOverviewEventListRes {
  events: IPaginationResponse<IOverviewEventItem>
}

export interface IOverviewEventBrief {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1: EventCategoryLv1
  eventCategoryLv1Label?: string
  indexImpacts: IOverviewEventImpactIndex[]
}

export interface IOverviewScenarioItem {
  scenarioId: number
  scenarioName: string
  createdAt: string
  updatedAt: string
  tags: string[]
  baseCase: boolean
  indexImpacts: IOverviewScenarioImpactIndex[]
  probability: number
  events: IOverviewEventBrief[]
}

export interface IOverviewScenarioListRes {
  scenarios: IPaginationResponse<IOverviewScenarioItem>
}

export interface IOverviewScenarioForecastLine {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  values: number[]
}

export interface IOverviewPriceForecastRes {
  indexName: OverviewPriceIndexName
  currency: string
  unit: string
  dates: string[]
  series: IOverviewScenarioForecastLine[]
}

export interface IGetOverviewEventsParams {
  page?: number
  size?: number
  sort?: ListSort
  startDate?: string
  endDate?: string
  period?: string
}

export interface IGetOverviewScenariosParams {
  page?: number
  size?: number
  sort?: ListSort
  startDate?: string
  endDate?: string
  period?: string
}

export interface IGetOverviewPriceForecastParams {
  indexName: OverviewPriceIndexName
  eventId?: number
  scenarioIds?: number[]
}

const serializeOverviewParams = (params: Record<string, unknown>): string => {
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

const nextGenMIOverviewService = {
  async getEvents(params: IGetOverviewEventsParams): Promise<IOverviewEventListRes> {
    const response: AxiosResponse<ICommonResponse<IOverviewEventListRes>> = await api.get('mi/next-gen/overview/events', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 10,
        sort: params.sort,
        startDate: params.startDate,
        endDate: params.endDate,
        period: params.period,
      },
    })
    return response.data.data
  },

  async getScenarios(params: IGetOverviewScenariosParams): Promise<IOverviewScenarioListRes> {
    const response: AxiosResponse<ICommonResponse<IOverviewScenarioListRes>> = await api.get('mi/next-gen/overview/scenarios', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 10,
        sort: params.sort,
        startDate: params.startDate,
        endDate: params.endDate,
        period: params.period,
      },
    })
    return response.data.data
  },

  async getPriceForecast(params: IGetOverviewPriceForecastParams): Promise<IOverviewPriceForecastRes> {
    const response: AxiosResponse<ICommonResponse<IOverviewPriceForecastRes>> = await api.get('mi/next-gen/overview/price-forecasts', {
      params: {
        indexName: params.indexName,
        eventId: params.eventId,
        scenarioIds: params.scenarioIds,
      },
      paramsSerializer: (p) => serializeOverviewParams(p as Record<string, unknown>),
    })
    return response.data.data
  },
}

export default nextGenMIOverviewService
