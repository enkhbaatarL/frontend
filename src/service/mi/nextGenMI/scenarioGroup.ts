import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import { type EventSourceType, ListSort, NextGenMIIndexName } from '@/service/mi/nextGenMI/common'
import useAuthStore, { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse, IPaginationResponse } from '@/types/api'

/** 시나리오 판정 상태 (대기/실현/폐기) */
export type ScenarioJudgementStatus = 'pending' | 'realized' | 'discarded'

/** 시나리오 상대 역할 배지 (v4 대표 시나리오 3종만, 그 외 null) */
export type ScenarioRole = 'ceiling' | 'floor' | 'mixed'

export type ScenarioSignpostStrength = 'verystrong' | 'strong' | 'medium' | 'weak' | 'veryweak'

export type ScenarioGroupGraphPeriodUnit = 'monthly' | 'yearly'

/** 동적 표 헤더 (차원 칼럼) */
export interface IScenarioDimensionColumn {
  key: string
  label: string
  /** 분기 항목 선정 근거 (헤더 인포 툴팁) */
  description?: string | null
  /** 분기 항목 선정 근거 (v4 헤더) */
  rationale?: string | null
}

/** 차원값 (dimensionColumns의 key와 매칭) */
export interface IScenarioDimension {
  key: string
  label: string
  value: string
  valueLabel: string
  /** 분기 기준값 ID (dimensionValueOptions 매칭) */
  valueId?: string | null
  /** 해당 시나리오에 기준값이 적용된 사유 (셀 인포 툴팁) */
  rationale?: string | null
}

/** 그룹 목록 표 본문의 시나리오 행 */
export interface IScenarioRow {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
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
  /** 시나리오 그룹 생성 시 포함된 이벤트 수 */
  eventCount: number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioRow[]
}

export interface IScenarioGroupAppliedFilter {
  startDate?: string
  endDate?: string
  sort: ListSort
  keyword?: string
  /** 내가 만든 그룹만 조회 여부 */
  mineOnly?: boolean
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
  displayOrder: number
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
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
  /** 내가 만든 그룹만 조회 (그룹 모드: 그룹 소유자 / 개별 모드: 부모 그룹 소유자 기준) */
  mineOnly?: boolean
}

/** 그룹 상세 - 기반 이벤트 (v1 단건) */
export interface IScenarioBaseEvent {
  eventId: number
  eventName: string
  eventTypeLv1: string
  eventTypeLv1Label: string
  updatedAt: string
  /** 출처. user면 사용자 등록 배지 */
  sourceType?: EventSourceType | null
  sourceTypeLabel?: string | null
}

/** 그룹 상세 - 구성 이벤트 (v4 멀티 이벤트) */
export interface IScenarioEventBundle {
  eventId: number
  eventName: string
  eventTypeLv1?: string
  eventTypeLv1Label?: string
  isScenarioSuggested?: boolean
  latestRecordFirstCreated?: string
  /** 출처. user면 사용자 등록 배지 */
  sourceType?: EventSourceType | null
  sourceTypeLabel?: string | null
}

/** 그룹 생성 근거 마크다운 ('근거 보기') */
export interface IScenarioGroupEvidence {
  eventAnalysisMarkdown?: string | null
  roleSelectionMarkdown?: string | null
}

/** 그룹 상세 - 가정 및 실행 가능성 표 행 (판정 상태 포함) */
export interface IScenarioGroupDetailRow {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
  dimensions: IScenarioDimension[]
  probability: number
  adjustedProbability: number
  status: ScenarioJudgementStatus
  statusLabel: string
}

export type PriceInterpretationStatus = 'generating' | 'generated' | 'failed'

export interface IPriceInterpretationItem {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
  status: PriceInterpretationStatus
  statusLabel: string
  content: string
  revision?: number
  updatedAt?: string
}

export interface IPriceInterpretationSection {
  generatable: boolean
  interpretations: IPriceInterpretationItem[]
}

export interface IPriceInterpretationGenerateTarget {
  scenarioId: number
  status: PriceInterpretationStatus
  statusLabel: string
}

export interface IPriceInterpretationGenerate {
  scenarioGroupId: number
  targetScenarios: IPriceInterpretationGenerateTarget[]
}

export interface IPriceInterpretationEdit {
  content: string
}

export interface IPriceInterpretation {
  scenarioId: number
  status: PriceInterpretationStatus
  statusLabel: string
  content: string
  revision?: number
  updatedAt?: string
}

export type PriceInterpretationStreamEventType = 'connected' | 'generation'

export interface PriceInterpretationStreamEventData {
  scenarioGroupId?: number
  type?: 'generation'
  result?: 'success' | 'failure'
  reason?: string | null
}

export interface IScenarioGroupDetailRes {
  scenarioGroupId: number
  groupName: string
  createdAt: string
  updatedAt: string
  /** v1 단건 기반 이벤트. v4는 eventBundles 사용 */
  baseEvent?: IScenarioBaseEvent
  eventBundles?: IScenarioEventBundle[]
  evidence?: IScenarioGroupEvidence | null
  summary: string
  scenarioCount: number
  dimensionColumns: IScenarioDimensionColumn[]
  scenarios: IScenarioGroupDetailRow[]
  priceInterpretation?: IPriceInterpretationSection
}

/** 시나리오 상세 - Signpost 정의 */
export interface IScenarioSignpostDefinition {
  signpostId?: number | null
  label: string
  direction: 'sup'
  directionLabel: string
  probabilityImpact: number
  strength: ScenarioSignpostStrength
  strengthLabel: string
  rationale: string
  displayOrder: number
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
  displayOrder: number
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
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
  /** MI Base 케이스 타이틀. CME 기준선은 null */
  seriesTitle?: string | null
  values: (number | null)[]
}

/** 그래프 - 시나리오별 예측 시리즈 */
export interface IScenarioGraphSeries {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  displayOrder: number
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

/** 그래프 수급모델 실행 상태 - 시나리오별 */
export interface IScenarioRunStatus {
  scenarioId: number
  modelRunning: boolean
}

/** 그래프 수급모델 실행 상태 - 그룹 단위 */
export interface IScenarioGroupRunStatusRes {
  scenarioGroupId: number
  anyRunning: boolean
  scenarios: IScenarioRunStatus[]
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

const createPriceInterpretationStreamHeaders = () => {
  const { token, user, accessCompanyInfo } = useAuthStore.getState()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Accept-Language': i18n.language || 'ko',
  }

  if (token) headers.Authorization = `Bearer ${token}`
  if (user?.isOtherServiceAccessPossible && accessCompanyInfo?.customerCompanyNo) {
    headers['X-Company-No'] = accessCompanyInfo.customerCompanyNo.toString()
  }

  return headers
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
        mineOnly: params.mineOnly,
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
        mineOnly: params.mineOnly,
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
   * Scenario Group 그래프 수급모델 진행상태 조회 (폴링용)
   * @param scenarioGroupId - 시나리오 그룹 ID
   */
  async getScenarioGroupGraphRunStatus(scenarioGroupId: string | number): Promise<IScenarioGroupRunStatusRes> {
    const response: AxiosResponse<ICommonResponse<IScenarioGroupRunStatusRes>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/graph/run-status`,
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

  /**
   * 시나리오별 가격전망 해석 section 조회 (SSE 수신 후 재조회 용도)
   */
  async getPriceInterpretations(scenarioGroupId: string | number): Promise<IPriceInterpretationSection> {
    const response: AxiosResponse<ICommonResponse<IPriceInterpretationSection>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/price-interpretations`,
    )

    return response.data.data
  },

  /**
   * 가격전망 해석 생성 요청 (비동기 - 결과는 SSE generation 수신 후 재조회)
   */
  async generatePriceInterpretations(scenarioGroupId: string | number): Promise<IPriceInterpretationGenerate> {
    const response: AxiosResponse<ICommonResponse<IPriceInterpretationGenerate>> = await api.post(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/price-interpretations`,
    )

    return response.data.data
  },

  /**
   * 가격전망 해석 수정
   */
  async updatePriceInterpretation(
    scenarioGroupId: string | number,
    scenarioId: string | number,
    payload: IPriceInterpretationEdit,
  ): Promise<IPriceInterpretation> {
    const response: AxiosResponse<ICommonResponse<IPriceInterpretation>> = await api.patch(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/scenarios/${encodeURIComponent(
        String(scenarioId),
      )}/price-interpretation`,
      payload,
    )

    return response.data.data
  },

  /**
   * 가격전망 해석 초기화 (최초 생성본으로 복원)
   */
  async resetPriceInterpretation(scenarioGroupId: string | number, scenarioId: string | number): Promise<IPriceInterpretation> {
    const response: AxiosResponse<ICommonResponse<IPriceInterpretation>> = await api.patch(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/scenarios/${encodeURIComponent(
        String(scenarioId),
      )}/price-interpretation/reset`,
    )

    return response.data.data
  },

  /**
   * 가격전망 해석 생성 진행 SSE 구독
   */
  async streamPriceInterpretations(
    scenarioGroupId: string | number,
    onMessage: (event: EventSourceMessage) => void,
    signal: AbortSignal,
  ): Promise<void> {
    await fetchEventSource(
      `/api/v1/mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/price-interpretations/stream`,
      {
        method: 'GET',
        headers: createPriceInterpretationStreamHeaders(),
        credentials: 'include',
        openWhenHidden: true,
        signal,
        onmessage: onMessage,
        async onopen(response) {
          if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) return
          throw new Error(`가격전망 해석 스트림 연결 실패: ${response.status} ${response.statusText}`)
        },
      },
    )
  },
}

export default nextGenMIScenarioGroupService
