import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ListSort, NextGenMIIndexName } from '@/service/mi/nextGenMI/common'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

/** 시나리오 판정 상태 (대기/실현/폐기) */
export type ScenarioJudgementStatus = 'pending' | 'realized' | 'discarded'

/** 동적 표 헤더 (차원 칼럼) */
export interface IScenarioDimensionColumn {
  key: string
  label: string
}

/** 차원값 (dimensionColumns의 key와 매칭) */
export interface IScenarioDimension {
  key: string
  label: string
  value: string
  valueLabel: string
}

/** 그룹 목록 표 본문의 시나리오 행 */
export interface IScenarioRow {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  dimensions: IScenarioDimension[]
  probability: number
}

export interface IScenarioGroupListItem {
  scenarioGroupId: number
  groupName: string
  createdAt: string
  summary: string
  scenarioCount: number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioRow[]
}

export interface IScenarioGroupAppliedFilter {
  startDate?: string
  endDate?: string
  sort: ListSort
  keyword?: string
}

export interface IScenarioGroupListRes {
  appliedFilter: IScenarioGroupAppliedFilter
  scenarioGroups: IPaginationResponse<IScenarioGroupListItem>
}

/** 개별 모드 - 부모 그룹 참조 */
export interface IScenarioGroupRef {
  scenarioGroupId: number
  groupName: string
  createdAt: string
}

export interface IScenarioIndividualItem {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  createdAt: string
  group: IScenarioGroupRef
  dimensions: IScenarioDimension[]
  probability: number
}

export interface IScenarioIndividualListRes {
  appliedFilter: IScenarioGroupAppliedFilter
  scenarios: IPaginationResponse<IScenarioIndividualItem>
}

export interface IGetScenarioGroupListParams {
  page?: number
  size?: number
  startDate?: string
  endDate?: string
  sort?: ListSort
  keyword?: string
}

/** 그룹 상세 - 기반 이벤트 */
export interface IScenarioBaseEvent {
  eventId: number
  eventName: string
  eventTypeLv1: string
  eventTypeLv1Label: string
  updatedAt: string
}

/** 그룹 상세 - 가정 및 실행 가능성 표 행 (판정 상태 포함) */
export interface IScenarioGroupDetailRow {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  dimensions: IScenarioDimension[]
  probability: number
  status: ScenarioJudgementStatus
  statusLabel: string
}

export interface IScenarioGroupDetailRes {
  scenarioGroupId: number
  groupName: string
  createdAt: string
  baseEvent: IScenarioBaseEvent
  summary: string
  scenarioCount: number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioGroupDetailRow[]
}

/** 시나리오 상세 - Signpost 정의 */
export interface IScenarioSignpostDefinition {
  label: string
  direction: 'sup'
  directionLabel: string
  probabilityImpact: number
  rationale: string
}

/** 시나리오 상세 - Signpost 모니터링 이력 */
export interface IScenarioSignpostMonitoring {
  updatedAt: string
  eventSummary: string
  probability: number
  probabilityDelta: number
  rationale: string
}

export interface IScenarioDetailViewRes {
  scenarioId: number
  scenarioGroupId: number
  scenarioName: string
  baseCase: boolean
  narrative: string
  probability: number
  dimensions: IScenarioDimension[]
  signpostDefinitions: IScenarioSignpostDefinition[]
  signpostMonitorings: IScenarioSignpostMonitoring[]
}

/** 그래프 - 기준선 시리즈 (CME, MI Base) */
export interface IScenarioBaseSeries {
  seriesId: string
  seriesName: string
  values: number[]
}

/** 그래프 - 시나리오별 예측 시리즈 */
export interface IScenarioGraphSeries {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  executed: boolean
  /** 수급모델 실행 전이면 null */
  values: number[] | null
}

export interface IScenarioGroupGraphRes {
  scenarioGroupId: number
  indexName: NextGenMIIndexName
  currency: string
  unit: string
  dates: string[]
  baseSeries: IScenarioBaseSeries[]
  scenarioSeries: IScenarioGraphSeries[]
}

export interface IScenarioStatusUpdateReq {
  status: ScenarioJudgementStatus
}

export interface IScenarioStatusRes {
  scenarioId: number
  status: ScenarioJudgementStatus
  statusLabel: string
  /** '폐기'로 자동 변경된 시나리오 ID 목록 (실현 변경 시에만, 그 외 빈 배열) */
  discardedScenarioIds?: number[]
}

const nextGenMIScenarioGroupService = {
  /**
   * Scenario Group 목록 조회 (그룹 모드, 페이지네이션)
   */
  async getScenarioGroups(params: IGetScenarioGroupListParams): Promise<IScenarioGroupListRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupListRes>> = await api.get('mi/next-gen/scenario-groups', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        sort: params.sort,
        keyword: params.keyword,
      },
    })

    return response.data.data
  },

  /**
   * 개별 Scenario 목록 조회 (개별 모드, 페이지네이션)
   */
  async getScenarioGroupScenarios(params: IGetScenarioGroupListParams): Promise<IScenarioIndividualListRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioIndividualListRes>> = await api.get('mi/next-gen/scenario-groups/scenarios', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        startDate: params.startDate,
        endDate: params.endDate,
        sort: params.sort,
        keyword: params.keyword,
      },
    })

    return response.data.data
  },

  /**
   * Scenario Group 상세 조회
   * @param scenarioGroupId - 시나리오 그룹 ID
   */
  async getScenarioGroupDetail(scenarioGroupId: string | number): Promise<IScenarioGroupDetailRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupDetailRes>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}`,
    )

    return response.data.data
  },

  /**
   * Scenario Group 그래프 데이터 조회 (단일 인덱스)
   * @param scenarioGroupId - 시나리오 그룹 ID
   * @param indexName - 조회 인덱스 (기본 JKM)
   */
  async getScenarioGroupGraph(scenarioGroupId: string | number, indexName?: NextGenMIIndexName): Promise<IScenarioGroupGraphRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupGraphRes>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/graph`,
      {
        params: { indexName },
      },
    )

    return response.data.data
  },

  /**
   * Scenario Group 그래프 엑셀(.xlsx) 다운로드 (전 인덱스 시트 묶음)
   * @param scenarioGroupId - 시나리오 그룹 ID
   */
  async exportScenarioGroupGraph(scenarioGroupId: string | number): Promise<AxiosResponse<Blob>> {
    return api.get(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/graph/export`, {
      responseType: 'blob',
    })
  },

  /**
   * 그룹 내 개별 Scenario 상세 조회
   * @param scenarioGroupId - 시나리오 그룹 ID
   * @param scenarioId - 시나리오 ID
   */
  async getScenarioDetail(scenarioGroupId: string | number, scenarioId: string | number): Promise<IScenarioDetailViewRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioDetailViewRes>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/scenarios/${encodeURIComponent(String(scenarioId))}`,
    )

    return response.data.data
  },

  /**
   * Scenario Group 삭제 (그룹 및 그룹 내 모든 시나리오 제거)
   * @param scenarioGroupId - 시나리오 그룹 ID
   */
  async deleteScenarioGroup(scenarioGroupId: string | number): Promise<void> {
    await api.delete(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}`)
  },

  /**
   * Scenario 판정 상태 변경 (대기 -> 실현/폐기)
   * @param scenarioGroupId - 시나리오 그룹 ID
   * @param scenarioId - 시나리오 ID
   * @param payload - 변경할 판정 상태
   */
  async updateScenarioStatus(
    scenarioGroupId: string | number,
    scenarioId: string | number,
    payload: IScenarioStatusUpdateReq,
  ): Promise<IScenarioStatusRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioStatusRes>> = await api.patch(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/scenarios/${encodeURIComponent(
        String(scenarioId),
      )}/status`,
      payload,
    )

    return response.data.data
  },

  /**
   * 마지막 남은 시나리오 폐기 후 시나리오 그룹 삭제
   */
  async discardLastScenarioAndDeleteGroup(scenarioGroupId: string | number, scenarioId: number): Promise<void> {
    await this.updateScenarioStatus(scenarioGroupId, scenarioId, { status: 'discarded' })
    await this.deleteScenarioGroup(scenarioGroupId)
  },
}

export default nextGenMIScenarioGroupService
