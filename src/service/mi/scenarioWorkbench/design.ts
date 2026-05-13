import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import {
  EventCategoryLv1,
  ListSort,
  MarketDirection,
  MarketImpactLevel,
  ScenarioWorkbenchStatus,
} from '@/service/mi/scenarioWorkbench/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export type ScenarioGenStatus = 'ready' | 'processing' | 'completed'

export interface IDesignImpactIndex {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  marketImpactLevelLabel?: string
  direction?: MarketDirection
  directionLabel?: string
}

export interface IDesignEventItem {
  eventId: number
  eventName: string
  status: ScenarioWorkbenchStatus
  statusLabel?: string
  eventCategoryLv1: EventCategoryLv1
  eventCategoryLv1Label?: string
  createdAt: string
  updatedAt: string
  indexImpacts: IDesignImpactIndex[]
  scenarioGenStatus: ScenarioGenStatus
  scenarioGenStatusLabel?: string
  requestId?: number | null
  scenarioGenStartedAt?: string | null
}

export interface IDesignAppliedFilter {
  eventStatus?: ScenarioWorkbenchStatus
  eventCategoryLv1?: EventCategoryLv1[]
  startDate?: string
  endDate?: string
  sort?: ListSort
  keyword?: string
  hideCompleted?: boolean
}

export interface IDesignEventListRes {
  appliedFilter: IDesignAppliedFilter
  events: IPaginationResponse<IDesignEventItem>
}

export interface IGetDesignEventsParams {
  page?: number
  size?: number
  eventStatus?: ScenarioWorkbenchStatus
  eventCategoryLv1?: EventCategoryLv1[]
  startDate?: string
  endDate?: string
  sort?: ListSort
  keyword?: string
  hideCompleted?: boolean
}

export interface IScenarioGenAcceptRes {
  requestId?: number | null
  status: ScenarioGenStatus
  statusLabel?: string
  scenarioGenStartedAt?: string | null
}

export interface IScenarioGenStatusRes {
  requestId?: number | null
  eventId: number
  status: ScenarioGenStatus
  statusLabel?: string
}

export interface IGeneratedScenarioRes {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  tags: string[]
  createdAt: string
  indexImpacts: IDesignImpactIndex[]
  probability: number
}

const serializeScenarioWorkbenchDesignParams = (params: Record<string, unknown>): string => {
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

const normalizeRequestIds = (requestIds: Array<number | null | undefined>): number[] =>
  Array.from(new Set(requestIds.map((requestId) => Number(requestId)).filter((requestId) => Number.isFinite(requestId) && requestId > 0)))

const scenarioWorkbenchDesignService = {
  async getEvents(params: IGetDesignEventsParams): Promise<IDesignEventListRes> {
    const response: AxiosResponse<ICommonResponse<IDesignEventListRes>> = await api.get('mi/scenario-workbench/design/events', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        sort: params.sort,
        startDate: params.startDate,
        endDate: params.endDate,
        keyword: params.keyword,
        eventStatus: params.eventStatus,
        eventCategoryLv1: params.eventCategoryLv1,
        hideCompleted: params.hideCompleted,
      },
      paramsSerializer: (p) => serializeScenarioWorkbenchDesignParams(p as Record<string, unknown>),
    })

    return response.data.data
  },

  async generateScenarios(eventIds: number[]): Promise<IScenarioGenAcceptRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGenAcceptRes>> = await api.post('mi/scenario-workbench/design/generate', {
      eventIds,
    })

    return response.data.data
  },

  async getGenerateStatuses(requestIds: Array<number | null | undefined>): Promise<IScenarioGenStatusRes[]> {
    const validRequestIds = normalizeRequestIds(requestIds)
    if (validRequestIds.length === 0) return []

    const response: AxiosResponse<ICommonResponse<IScenarioGenStatusRes[]>> = await api.get(
      'mi/scenario-workbench/design/generate/status',
      {
        params: { requestIds: validRequestIds },
        paramsSerializer: (p) => serializeScenarioWorkbenchDesignParams(p as Record<string, unknown>),
      },
    )

    return response.data.data
  },

  async getGeneratedScenarios(requestId: number): Promise<IGeneratedScenarioRes[]> {
    const response: AxiosResponse<ICommonResponse<IGeneratedScenarioRes[]>> = await api.get(
      `mi/scenario-workbench/design/generate/${encodeURIComponent(String(requestId))}/scenarios`,
    )

    return response.data.data
  },

  async reset(): Promise<void> {
    await api.post('mi/scenario-workbench/design/reset')
  },
}

export default scenarioWorkbenchDesignService
