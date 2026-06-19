import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ListSort, NextGenMIIndexName } from '@/service/mi/nextGenMI/common'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

/** 시나리오 판정 상태 (대기/실현/폐기) */
export type ScenarioJudgementStatus = 'pending' | 'realized' | 'discarded'

export type ScenarioSignpostStrength = 'verystrong' | 'strong' | 'medium' | 'weak' | 'veryweak'

export type ScenarioGroupGraphPeriodUnit = 'monthly' | 'yearly'

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
  adjustedProbability: number
  status: ScenarioJudgementStatus
  statusLabel: string
}

export interface IScenarioGroupListItem {
  scenarioGroupId: number
  groupName: string
  createdAt: string
  updatedAt: string
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
  updatedAt: string
  group: IScenarioGroupRef
  dimensions: IScenarioDimension[]
  probability: number
  adjustedProbability: number
  status: ScenarioJudgementStatus
  statusLabel: string
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
  adjustedProbability: number
  status: ScenarioJudgementStatus
  statusLabel: string
}

export interface IScenarioGroupDetailRes {
  scenarioGroupId: number
  groupName: string
  createdAt: string
  updatedAt: string
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
  strength: ScenarioSignpostStrength
  strengthLabel: string
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
  createdAt: string
  updatedAt: string
  narrative: string
  probability: number
  adjustedProbability: number
  dimensions: IScenarioDimension[]
  signpostDefinitions: IScenarioSignpostDefinition[]
  signpostMonitorings: IScenarioSignpostMonitoring[]
}

/** 그래프 - 기준선 시리즈 (CME, MI Base) */
export interface IScenarioBaseSeries {
  seriesId: string
  seriesName: string
  values: (number | null)[]
}

/** 그래프 - 시나리오별 예측 시리즈 */
export interface IScenarioGraphSeries {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  executed: boolean
  modelRunning: boolean
  /** 판정 상태 (대기/실현/폐기). 폐기 필터 기준 */
  status: ScenarioJudgementStatus
  statusLabel: string
  /** 베이스케이스 가격 (dates 순서, 빠진 구간 null). 미실행이면 null */
  baseCaseValues: (number | null)[] | null
  /** 사용자조정 가격 (dates 순서, 빠진 구간 null). 미실행이면 null */
  userAdjustedValues: (number | null)[] | null
}

export interface IScenarioGroupGraphRes {
  scenarioGroupId: number
  indexName: NextGenMIIndexName
  periodUnit: ScenarioGroupGraphPeriodUnit
  periodUnitLabel: string
  currency: string
  unit: string
  dates: string[]
  baseSeries: IScenarioBaseSeries[]
  scenarioSeries: IScenarioGraphSeries[]
}

export interface IScenarioGroupGraphCmeBenchmark {
  indexName: NextGenMIIndexName
  periodUnit: ScenarioGroupGraphPeriodUnit
  periodUnitLabel: string
  currency: string
  unit: string
  dates: string[]
  baseSeries: IScenarioBaseSeries[]
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
   * Scenario Group 그래프 데이터 조회 (단일 인덱스 × 단일 기간단위)
   * @param scenarioGroupId - 시나리오 그룹 ID
   * @param indexName - 조회 인덱스 (기본 JKM)
   * @param periodUnit - 기간 단위 (기본 monthly)
   */
  async getScenarioGroupGraph(
    scenarioGroupId: string | number,
    indexName?: NextGenMIIndexName,
    periodUnit?: ScenarioGroupGraphPeriodUnit,
  ): Promise<IScenarioGroupGraphRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupGraphRes>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/graph`,
      {
        params: { indexName, periodUnit },
      },
    )

    return response.data.data
  },

  /**
   * Scenario Group 그래프 CME 벤치마크 기준선 조회 (단일 인덱스 × 단일 기간단위)
   * @param indexName - 조회 인덱스 (기본 JKM)
   * @param periodUnit - 기간 단위 (기본 monthly)
   */
  async getScenarioGroupGraphCmeBenchmark(
    indexName?: NextGenMIIndexName,
    periodUnit?: ScenarioGroupGraphPeriodUnit,
  ): Promise<IScenarioGroupGraphCmeBenchmark> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupGraphCmeBenchmark>> = await api.get(
      withCustomBaseUrl('mi/next-gen/scenario-groups/graph/cme-benchmark'),
      {
        params: { indexName, periodUnit },
      },
    )

    return response.data.data
  },

  /**
   * Scenario Group 그래프 엑셀(.xlsx) 다운로드 (전 인덱스 시트 묶음)
   * @param scenarioGroupId - 시나리오 그룹 ID
   * @param periodUnit - 기간 단위 (기본 monthly)
   */
  async exportScenarioGroupGraph(
    scenarioGroupId: string | number,
    periodUnit?: ScenarioGroupGraphPeriodUnit,
  ): Promise<AxiosResponse<Blob>> {
    return api.get(withCustomBaseUrl(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/graph/export`), {
      params: { periodUnit },
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
