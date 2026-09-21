import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import useAuthStore, { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

class ModelParamProposalStreamFatalError extends Error {}

export type ModelExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface ModelExecutionFile {
  fileNo: number
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
}

export type ModelExecutionInputFileRole = 'DEMAND' | 'SUPPLY' | 'TRADE'

export interface ModelExecutionInputFile {
  fileRole?: ModelExecutionInputFileRole
  fileNo?: number
  fileNm?: string
  fileSize?: number
}

export interface ModelExecutionInputFiles {
  complete?: boolean
  missingFileRoles?: ModelExecutionInputFileRole[]
  files?: ModelExecutionInputFile[]
}

export interface ModelExecutionAccept {
  caseId: number
  scenarioId: number
  runId: string
  status: ModelExecutionStatus
  files: ModelExecutionFile[]
  requestedAt: string
  startedAt?: string
  statusEndpoint?: string
}

export interface ModelExecutionStatusSnapshot {
  caseId: number
  scenarioId: number
  runId: string
  status: ModelExecutionStatus
  files: ModelExecutionFile[]
  requestedAt: string
  startedAt?: string
  finishedAt?: string
  failureReason?: string
  errorMessage?: string
}

export type ModelParamProposalCurrentState =
  | 'NOT_REQUESTED'
  | 'GENERATING'
  | 'PROPOSAL_READY'
  | 'CONFIRMED_PENDING_EXECUTION'
  | 'EXECUTING'
  | 'EXECUTED_CONFIRMED'
  | 'PROPOSAL_FAILED'
  | 'PROPOSAL_NO_CHANGES'
  | 'PROPOSAL_RETRYABLE'
  | 'EXECUTION_FAILED'

export type ModelParamProposalAcceptStatus = 'PROCESSING' | 'PROPOSED' | 'CONFIRMED' | 'FAILED'

export type ModelParamParameterSource = 'NONE' | 'PROPOSAL_PARAMETERS' | 'CONFIRMATION_PARAMETERS'

export interface ModelParamColumn {
  column?: string
  role?: string
  kind?: 'SLOT' | 'TIME_AXIS' | 'VALUE'
  align?: 'LEFT' | 'CENTER' | 'RIGHT'
}

export interface ModelParamTarget {
  modelFile?: string
  modelSheet?: string
  tableName?: string
  valueFieldNames?: string[]
  slotAxesFieldNames?: string[]
}

export interface ModelParamPayloadItem {
  parameterName?: string
  modelTarget?: ModelParamTarget
  rationale?: string
  values?: Array<Record<string, unknown>>
}

/** 단건 proposal 트리 (PopupContent 타입 호환용) */
export interface CurrentModelParameter {
  parameterName?: string
  modelTarget: ModelParamTarget
  rationale?: string
  groupedRationales: Array<Record<string, unknown>>
  values: Array<Record<string, unknown>>
}

export interface CurrentModelParamRendering {
  readMode?: 'FIXED_COLUMNS' | 'MATRIX_TIME_COLUMNS'
  columns: ModelParamColumn[]
  semanticAxes?: string
}

export interface CurrentModelParamLeaf {
  parameter: CurrentModelParameter
  rendering: CurrentModelParamRendering
}

export interface CurrentModelParamTable {
  tableName?: string
  parameters: CurrentModelParamLeaf[]
}

export interface CurrentModelParamSheet {
  modelSheet?: string
  modelTables: CurrentModelParamTable[]
}

export interface CurrentModelParamFile {
  modelFile?: string
  modelSheets: CurrentModelParamSheet[]
}

export interface CurrentModelParamProposal {
  scenarioId?: number
  currentState?: ModelParamProposalCurrentState
  parameterSource?: ModelParamParameterSource
  execPrepId?: number
  modelParamProposalId?: number
  scenarioGroupId?: number
  eventId?: number
  caseId?: number
  runId?: string
  modelExecutionStatus?: ModelExecutionStatus
  executionInputFiles?: ModelExecutionInputFiles | null
  modelFiles: CurrentModelParamFile[]
  failureReason?: string
  requestedAt?: string
  completedAt?: string
  confirmedAt?: string
}

/** 그룹 제안 현황 - 시나리오 행 */
export interface ScenarioGroupModelParamProposalScenario {
  scenarioId: number
  scenarioName?: string
  displayOrder?: number
  probability?: number
  adjustedProbability?: number
  scenarioStatus?: string
  scenarioStatusLabel?: string
  currentState?: ModelParamProposalCurrentState
  modelParamProposalId?: number | null
  execPrepId?: number | null
  executionInputFiles?: ModelExecutionInputFiles | null
  failureReason?: string | null
  requestedAt?: string | null
  completedAt?: string | null
  confirmedAt?: string | null
}

/** GET .../scenario-groups/{id}/model-param-proposals */
export interface ScenarioGroupModelParamProposals {
  scenarioGroupId: number
  groupName?: string
  groupCreatedAt?: string
  scenarios: ScenarioGroupModelParamProposalScenario[]
}

export interface ModelParamCompareScenario {
  scenarioId: number
  scenarioName?: string
  displayOrder?: number
  modelParamProposalId?: number
  status?: string
}

export interface ModelParamCompareCell {
  scenarioId?: number
  proposedValue?: number
  rationale?: string
}

export type ModelParamCompareValue = Record<string, unknown> & {
  basecaseValue?: number | null
  /** 시나리오별 제안 셀. 해당 시나리오에 값이 없으면 null */
  cells?: Array<ModelParamCompareCell | null>
}

export interface ModelParamCompareScenarioRationale {
  scenarioId: number
  rationale?: string
  groupedRationales?: Array<Record<string, unknown>>
}

export interface ModelParamCompareParameter {
  parameterName?: string
  modelTarget?: ModelParamTarget
  scenarioRationales?: ModelParamCompareScenarioRationale[]
  values?: ModelParamCompareValue[]
}

export interface ModelParamCompareShape {
  parameterName?: string
  modelFile?: string
  modelSheet?: string
  modelTable?: string
  readMode?: 'FIXED_COLUMNS' | 'MATRIX_TIME_COLUMNS'
  columns?: ModelParamColumn[]
  semanticAxes?: string
}

export interface ModelParamCompareModelSheet {
  modelSheet?: string
  tableNames?: string[]
}

export interface ModelParamCompareModelFile {
  modelFile?: string
  modelSheets?: ModelParamCompareModelSheet[]
}

/** GET .../model-param-proposals/compare */
export interface ScenarioGroupModelParamCompare {
  scenarioGroupId: number
  scenarios: ModelParamCompareScenario[]
  parameters: ModelParamCompareParameter[]
  parameterShapes: ModelParamCompareShape[]
  modelFiles: ModelParamCompareModelFile[]
}

export interface ModelParamProposalAccept {
  modelParamProposalId?: number
  scenarioId?: number
  status?: ModelParamProposalAcceptStatus
  requestedAt?: string
  statusEndpoint?: string
}

/** 그룹 일괄 수급모델 실행 항목 */
export interface ScenarioGroupModelExecutionItem {
  scenarioId: number
  modelParamProposalId: number
  confirmationParameters: ModelParamPayloadItem[]
}

export interface ScenarioGroupModelExecutionRequest {
  executions: ScenarioGroupModelExecutionItem[]
}

export interface GroupModelExecutionResultItem {
  scenarioId: number
  success: boolean
  execution?: ModelExecutionAccept | null
  errorCode?: string
  errorMessage?: string
}

/** POST .../scenario-groups/{id}/model-executions */
export interface GroupModelExecutionAccept {
  scenarioGroupId: number
  totalCount: number
  successCount: number
  failureCount: number
  results: GroupModelExecutionResultItem[]
}

export interface LatestModelParamProposalParameters {
  scenarioId?: number
  caseId?: number
  execPrepId?: number
  modelParamProposalId?: number
  parameterSource?: ModelParamParameterSource
  modelFiles: Array<{
    modelFile?: string
    modelSheets: Array<{
      modelSheet?: string
      modelTables: Array<{
        tableName?: string
        parameters: Array<{
          parameter: {
            parameterName?: string
            modelTarget: ModelParamTarget
            rationale?: string
            groupedRationales: Array<Record<string, unknown>>
            values: Array<Record<string, unknown>>
          }
          rendering: {
            readMode?: 'FIXED_COLUMNS' | 'MATRIX_TIME_COLUMNS'
            columns: ModelParamColumn[]
            semanticAxes?: string
          }
        }>
      }>
    }>
  }>
}

const createModelParamProposalStreamHeaders = () => {
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

const getGroupModelParamProposalStreamUrl = (scenarioGroupId: number) =>
  `/api/v1/mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/model-param-proposals/stream`

const nextGenMIModelExecutionService = {
  /** 팝업 진입 시 그룹 내 시나리오 전체 제안 현황 */
  async getGroupModelParamProposals(scenarioGroupId: number): Promise<ScenarioGroupModelParamProposals> {
    const response: AxiosResponse<ICommonResponse<ScenarioGroupModelParamProposals>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/model-param-proposals`,
    )

    return response.data.data
  },

  /** 비교 그리드 */
  async getGroupModelParamProposalsCompare(scenarioGroupId: number): Promise<ScenarioGroupModelParamCompare> {
    const response: AxiosResponse<ICommonResponse<ScenarioGroupModelParamCompare>> = await api.get(
      `mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/model-param-proposals/compare`,
    )

    return response.data.data
  },

  /**
   * 그룹 INPUT 파일 일괄 다운로드
   * - 실행 완료(EXECUTED_CONFIRMED) 시나리오들의 실행 입력 엑셀을 zip으로 반환
   * - 실행 완료 시나리오가 없으면 404
   */
  async downloadGroupInputFiles(scenarioGroupId: number): Promise<AxiosResponse<Blob>> {
    return api.get(
      withCustomBaseUrl(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/model-executions/input-files/download`),
      {
        responseType: 'blob',
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.get>[1] & { responseType: 'blob'; suppressGlobalErrorHandler: boolean },
    )
  },

  async getLatestConfirmedParameters(scenarioId: number): Promise<LatestModelParamProposalParameters> {
    const response: AxiosResponse<ICommonResponse<LatestModelParamProposalParameters>> = await api.get(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/latest/model-param-proposal/confirmed-parameters`,
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async getLatestProposedParameters(scenarioId: number): Promise<LatestModelParamProposalParameters> {
    const response: AxiosResponse<ICommonResponse<LatestModelParamProposalParameters>> = await api.get(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/latest/model-param-proposal/proposed-parameters`,
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async createModelParamProposal(scenarioId: number): Promise<ModelParamProposalAccept> {
    const response: AxiosResponse<ICommonResponse<ModelParamProposalAccept>> = await api.post(
      `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-param-proposals`,
      undefined,
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )

    if (!response.data.status) {
      const failureReason = (response.data.data as { failureReason?: string } | null)?.failureReason?.trim()
      throw new Error(failureReason || response.data.message)
    }

    return response.data.data
  },

  /** 그룹 SSE - 팝업당 1연결 */
  async streamGroupModelParamProposals(
    scenarioGroupId: number,
    onMessage: (event: EventSourceMessage) => void,
    signal: AbortSignal,
  ): Promise<void> {
    await fetchEventSource(getGroupModelParamProposalStreamUrl(scenarioGroupId), {
      method: 'GET',
      headers: createModelParamProposalStreamHeaders(),
      credentials: 'include',
      openWhenHidden: true,
      signal,
      onmessage: onMessage,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) return
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new ModelParamProposalStreamFatalError(`수급모델 파라미터 제안 스트림 연결 실패: ${response.status} ${response.statusText}`)
        }
        throw new Error(`수급모델 파라미터 제안 스트림 연결 실패: ${response.status} ${response.statusText}`)
      },
      onerror(error) {
        if (error instanceof ModelParamProposalStreamFatalError) throw error
      },
    })
  },

  /** 선택된 시나리오 N개 일괄 수급모델 실행 */
  async submitGroupModelExecutions(
    scenarioGroupId: number,
    payload: ScenarioGroupModelExecutionRequest,
  ): Promise<GroupModelExecutionAccept> {
    const response: AxiosResponse<ICommonResponse<GroupModelExecutionAccept>> = await api.post(
      withCustomBaseUrl(`mi/next-gen/scenario-groups/${encodeURIComponent(String(scenarioGroupId))}/model-executions`),
      payload,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async getModelExecutionStatus(scenarioId: number, runId: string): Promise<ModelExecutionStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<ModelExecutionStatusSnapshot>> = await api.get(
      `mi/next-gen/scenarios/${scenarioId}/model-executions/${encodeURIComponent(runId)}`,
    )

    return response.data.data
  },
}

export default nextGenMIModelExecutionService
