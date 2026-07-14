import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import useAuthStore, { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

class ModelParamProposalStreamFatalError extends Error {}

export type FileModelExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface FileModelExecutionFile {
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

export interface FileModelExecutionAccept {
  caseId: number
  scenarioId: number
  runId: string
  status: FileModelExecutionStatus
  files: FileModelExecutionFile[]
  requestedAt: string
  startedAt?: string
  statusEndpoint?: string
}

export interface FileModelExecutionStatusSnapshot {
  caseId: number
  scenarioId: number
  runId: string
  status: FileModelExecutionStatus
  files: FileModelExecutionFile[]
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
  modelExecutionStatus?: FileModelExecutionStatus
  executionInputFiles?: ModelExecutionInputFiles | null
  modelFiles: CurrentModelParamFile[]
  failureReason?: string
  requestedAt?: string
  completedAt?: string
  confirmedAt?: string
}

export interface ModelParamProposalAccept {
  modelParamProposalId?: number
  scenarioId?: number
  status?: ModelParamProposalAcceptStatus
  requestedAt?: string
  statusEndpoint?: string
}

export interface ModelParamPayloadItem {
  parameterName?: string
  modelTarget?: ModelParamTarget
  rationale?: string
  values?: Array<Record<string, unknown>>
}

export interface ModelParamProposalExecution {
  modelParamProposalId: number
  confirmationParameters: ModelParamPayloadItem[]
}

export interface LatestModelParamProposalParameters {
  scenarioId?: number
  caseId?: number
  execPrepId?: number
  modelParamProposalId?: number
  parameterSource?: ModelParamParameterSource
  modelFiles: CurrentModelParamFile[]
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

const getModelParamProposalStreamUrl = (scenarioId: number) => {
  const url = withCustomBaseUrl(`mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-param-proposals/stream`)

  if (/^https?:\/\//i.test(url)) return url
  return `/api/v1${url.startsWith('/') ? url : `/${url}`}`
}

const nextGenMIModelExecutionService = {
  async getCurrentModelParamProposal(scenarioId: number): Promise<CurrentModelParamProposal> {
    const response: AxiosResponse<ICommonResponse<CurrentModelParamProposal>> = await api.get(
      withCustomBaseUrl(`mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-param-proposals`),
    )

    return response.data.data
  },

  async getLatestConfirmedParameters(scenarioId: number): Promise<LatestModelParamProposalParameters> {
    const response: AxiosResponse<ICommonResponse<LatestModelParamProposalParameters>> = await api.get(
      withCustomBaseUrl(
        `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/latest/model-param-proposal/confirmed-parameters`,
      ),
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async getLatestProposedParameters(scenarioId: number): Promise<LatestModelParamProposalParameters> {
    const response: AxiosResponse<ICommonResponse<LatestModelParamProposalParameters>> = await api.get(
      withCustomBaseUrl(
        `mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/latest/model-param-proposal/proposed-parameters`,
      ),
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.get>[1] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async createModelParamProposal(scenarioId: number): Promise<ModelParamProposalAccept> {
    const response: AxiosResponse<ICommonResponse<ModelParamProposalAccept>> = await api.post(
      withCustomBaseUrl(`mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-param-proposals`),
      undefined,
      {
        suppressGlobalErrorHandler: true,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async streamModelParamProposal(scenarioId: number, onMessage: (event: EventSourceMessage) => void, signal: AbortSignal): Promise<void> {
    await fetchEventSource(getModelParamProposalStreamUrl(scenarioId), {
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

  async submitModelExecutionFiles(scenarioId: number, files: File[]): Promise<FileModelExecutionAccept> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response: AxiosResponse<ICommonResponse<FileModelExecutionAccept>> = await api.post(
      withCustomBaseUrl(`mi/next-gen/scenarios/${scenarioId}/model-executions`),
      formData,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async submitModelParamProposalExecution(scenarioId: number, payload: ModelParamProposalExecution): Promise<FileModelExecutionAccept> {
    const response: AxiosResponse<ICommonResponse<FileModelExecutionAccept>> = await api.post(
      withCustomBaseUrl(`mi/next-gen/scenarios/${encodeURIComponent(String(scenarioId))}/model-executions/from-parameters`),
      payload,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )

    return response.data.data
  },

  async getModelExecutionStatus(scenarioId: number, runId: string): Promise<FileModelExecutionStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<FileModelExecutionStatusSnapshot>> = await api.get(
      withCustomBaseUrl(`mi/next-gen/scenarios/${scenarioId}/model-executions/${encodeURIComponent(runId)}`),
    )

    return response.data.data
  },
}

export default nextGenMIModelExecutionService
