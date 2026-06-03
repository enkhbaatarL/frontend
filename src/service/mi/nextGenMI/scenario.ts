import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import {
  EventCategoryLv1,
  MarketDirection,
  MarketImpactLevel,
  ListSort,
  SignpostImpactLevel,
  NextGenMIStatus,
} from '@/service/mi/nextGenMI/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

export interface IScenarioImpact {
  indexName: string
  marketImpactLevel: MarketImpactLevel
}

export interface IScenarioListItem {
  scenarioId: number
  scenarioName: string
  status: NextGenMIStatus
  statusLabel?: string
  createdAt: string
  updatedAt: string
  indexImpacts: IScenarioImpact[]
  probability: number
}

export interface IScenarioAppliedFilter {
  scenarioStatus: NextGenMIStatus
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
  scenarioStatus?: NextGenMIStatus
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
  scenarioId?: number
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

export type ModelExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface IModelExecutionParameterTableRow {
  rowId: string
  target: string
  values: Record<string, number>
}

export interface IModelExecutionParameterTable {
  tableId: string
  tableLabel: string
  timeAxisType?: string
  timePeriods: string[]
  rows: IModelExecutionParameterTableRow[]
}

export interface IModelExecutionParameterRes {
  scenarioId: number
  title: string
  tables: IModelExecutionParameterTable[]
}

export interface IModelExecutionTableRowReq {
  rowId: string
  values: Record<string, number>
}

export interface IModelExecutionTableReq {
  tableId: string
  rows: IModelExecutionTableRowReq[]
}

export interface IModelExecutionSubmitReq {
  tables: IModelExecutionTableReq[]
}

export interface IModelExecutionAcceptRes {
  executionId: string
  scenarioId: number
  externalRunId?: string
  status: ModelExecutionStatus
  requestedAt?: string
  statusEndpoint?: string
}

export interface IModelExecutionStatusRes {
  executionId: string
  scenarioId: number
  externalRunId?: string
  status: ModelExecutionStatus
  requestedAt?: string
  startedAt?: string
  finishedAt?: string
  errorMessage?: string
}

export interface IScenarioDetailRes {
  scenarioId: number
  scenarioName: string
  status: NextGenMIStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  probability?: number
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
const nextGenMIScenarioService = {
  async getScenarios(params: IGetScenariosParams): Promise<IScenarioListRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioListRes>> = await api.get('mi/next-gen/scenarios', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        scenarioStatus: params.scenarioStatus,
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
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}`,
    )
    return response.data.data
  },

  async getModelExecutionParameters(scenarioId: string | number): Promise<IModelExecutionParameterRes> {
    const response: AxiosResponse<ICommonResponse<IModelExecutionParameterRes>> = await api.get(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-execution-parameters`,
    )
    return response.data.data
  },

  async submitModelExecution(scenarioId: string | number, payload: IModelExecutionSubmitReq): Promise<IModelExecutionAcceptRes> {
    const response: AxiosResponse<ICommonResponse<IModelExecutionAcceptRes>> = await api.post(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions`,
      payload,
    )
    return response.data.data
  },

  async getModelExecutionStatus(scenarioId: string | number, executionId: string): Promise<IModelExecutionStatusRes> {
    const response: AxiosResponse<ICommonResponse<IModelExecutionStatusRes>> = await api.get(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/${encodeURIComponent(executionId)}`,
    )
    return response.data.data
  },
}

export default nextGenMIScenarioService
