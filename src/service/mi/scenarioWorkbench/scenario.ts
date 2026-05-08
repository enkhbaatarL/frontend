import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import {
  EventCategoryLv1,
  MarketDirection,
  MarketImpactLevel,
  ListPeriod,
  ListSort,
  SignpostImpactLevel,
  ScenarioWorkbenchStatus,
} from '@/service/mi/scenarioWorkbench/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export interface IScenarioImpact {
  indexName: string
  marketImpactLevel: MarketImpactLevel
}

export interface IScenarioListItem {
  scenarioId: number
  scenarioName: string
  status: ScenarioWorkbenchStatus
  createdAt: string
  updatedAt: string
  indexImpacts: IScenarioImpact[]
  probability: number
}

export interface IScenarioAppliedFilter {
  scenarioStatus: ScenarioWorkbenchStatus
  period: ListPeriod
  startDate?: string
  endDate?: string
  sort: ListSort
  keyword?: string
}

export interface IScenarioListRes {
  appliedFilter: IScenarioAppliedFilter
  scenarios: IPaginationResponse<IScenarioListItem>
}

export interface IGetScenariosParams {
  page?: number
  size?: number
  scenarioStatus?: ScenarioWorkbenchStatus
  period?: ListPeriod
  startDate?: string
  endDate?: string
  sort?: ListSort
  keyword?: string
}

export interface IScenarioPriceFlowStep {
  from: number
  to: number
}

export interface IScenarioIndexOutlook {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  direction: MarketDirection
  priceFlow: IScenarioPriceFlowStep[]
  trendText: string
  trendSummary: string
}

export interface IScenarioPriceSeries {
  indexName: string
  values: number[]
}

export interface IScenarioPriceForecast {
  currency: string
  unit: string
  dates: string[]
  series: IScenarioPriceSeries[]
}

export interface IScenarioSummary {
  indexOutlooks: IScenarioIndexOutlook[]
  priceForecast: IScenarioPriceForecast
}

export interface IScenarioAssumption {
  label: string
  value: string
}

export interface IScenarioSignpostDefinition {
  category: string
  label: string
  direction: MarketDirection
  signpostImpactLevel: SignpostImpactLevel
  rationale: string
}

export interface IScenarioSignpost {
  keyEvent: string
  currentStatusSummary: string
  marketImpactInterpretation: string
  observationTrigger: string
  sources: string[]
}

export interface IRelatedEventIndexImpact {
  indexName: string
  marketImpactLevel: MarketImpactLevel
  direction: MarketDirection
}

export interface IRelatedEvent {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1: EventCategoryLv1
  indexImpacts: IRelatedEventIndexImpact[]
}

export interface IRelatedScenario {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  indexImpacts: IScenarioImpact[]
  probability: number
}

export interface IRelatedEventScenario {
  event: IRelatedEvent
  scenarios: IRelatedScenario[]
}

export interface IScenarioDetailRes {
  scenarioId: number
  scenarioName: string
  status: ScenarioWorkbenchStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  summary: IScenarioSummary
  assumptions: IScenarioAssumption[]
  signpostDefinitions: IScenarioSignpostDefinition[]
  signposts: IScenarioSignpost[]
  relatedEventScenario: IRelatedEventScenario
}

/**
 * 시나리오 목록 조회
 * @param params - 시나리오 목록 조회 파라미터
 * @returns 시나리오 목록
 */
const scenarioWorkbenchScenarioService = {
  async getScenarios(params: IGetScenariosParams): Promise<IScenarioListRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioListRes>> = await api.get('mi/scenario-workbench/scenarios', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        scenarioStatus: params.scenarioStatus,
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        sort: params.sort,
        keyword: params.keyword,
      },
    })

    return response.data.data
  },

  /**
   * 시나리오 상세 조회
   * @param scenarioId - 시나리오 ID
   * @returns 시나리오 상세
   */
  async getScenarioDetail(scenarioId: string | number): Promise<IScenarioDetailRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioDetailRes>> = await api.get(
      `mi/scenario-workbench/scenarios/${encodeURIComponent(String(scenarioId))}`,
    )
    return response.data.data
  },
}

export default scenarioWorkbenchScenarioService
