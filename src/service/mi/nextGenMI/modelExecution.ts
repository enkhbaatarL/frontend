import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export type ModelExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type FileModelExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface FileModelExecutionFile {
  fileNo: number
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
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

export interface ModelExecutionParameterTableRow {
  rowId: string
  target: string
  values: Record<string, number>
}

export interface ModelExecutionParameterTable {
  tableId: string
  tableLabel: string
  timeAxisType: string
  timePeriods: string[]
  rows: ModelExecutionParameterTableRow[]
}

export interface ModelExecutionParameter {
  scenarioId: number
  title: string
  tables: ModelExecutionParameterTable[]
}

export interface ModelExecutionTableRow {
  rowId: string
  values: Record<string, number>
}

export interface ModelExecutionTable {
  tableId: string
  rows: ModelExecutionTableRow[]
}

export interface ModelExecutionSubmit {
  tables: ModelExecutionTable[]
}

export interface ModelExecutionAccept {
  executionId: string
  scenarioId: number
  externalRunId: string
  status: ModelExecutionStatus
  requestedAt: string
  statusEndpoint?: string
}

export interface ModelExecutionStatusSnapshot {
  executionId: string
  scenarioId: number
  externalRunId: string
  status: ModelExecutionStatus
  requestedAt: string
  startedAt?: string
  finishedAt?: string
  errorMessage?: string
}

const createModelExecutionParameterMock = (scenarioId: number): ModelExecutionParameter => {
  const timePeriods = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035']
  const targets = [
    'United States',
    'Japan',
    'China',
    'India',
    'Singapore',
    'Qatar',
    'Australia',
    'Korea',
    'Taiwan',
    'Thailand',
    'Vietnam',
    'Malaysia',
  ]

  return {
    scenarioId,
    title: `시나리오 ${scenarioId}`,
    tables: Array.from({ length: 14 }, (_, tableIndex) => ({
      tableId: `table_${tableIndex + 1}`,
      tableLabel: `Table ${tableIndex + 1}`,
      timeAxisType: 'YEARLY',
      timePeriods,
      rows: targets.map((target, rowIndex) => ({
        rowId: `row_${tableIndex + 1}_${rowIndex + 1}`,
        target,
        values: Object.fromEntries(
          timePeriods.map((timePeriod, periodIndex) => [timePeriod, 100 + tableIndex * 3 + rowIndex + periodIndex * 0.5]),
        ),
      })),
    })),
  }
}

const nextGenMIModelExecutionService = {
  async getModelExecutionParameters(scenarioId: number): Promise<ModelExecutionParameter> {
    return createModelExecutionParameterMock(scenarioId)
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

  async getFileModelExecutionStatus(scenarioId: number, runId: string): Promise<FileModelExecutionStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<FileModelExecutionStatusSnapshot>> = await api.get(
      withCustomBaseUrl(`mi/next-gen/scenarios/${scenarioId}/model-executions/${encodeURIComponent(runId)}`),
    )

    return response.data.data
  },

  async submitModelExecution(scenarioId: number, payload: ModelExecutionSubmit): Promise<ModelExecutionAccept> {
    const response: AxiosResponse<ICommonResponse<ModelExecutionAccept>> = await api.post(
      withCustomBaseUrl(`mi/scenario-workbench/scenarios/${scenarioId}/model-executions`),
      payload,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )
    return response.data.data
  },

  async getModelExecutionStatus(scenarioId: number, executionId: string): Promise<ModelExecutionStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<ModelExecutionStatusSnapshot>> = await api.get(
      withCustomBaseUrl(`mi/scenario-workbench/scenarios/${scenarioId}/model-executions/${encodeURIComponent(executionId)}`),
    )

    return response.data.data
  },
}

export default nextGenMIModelExecutionService
