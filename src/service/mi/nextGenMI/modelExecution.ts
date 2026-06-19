import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { withCustomBaseUrl } from '@/store/useAuthStore'
import { ICommonResponse } from '@/types/api'

export type ModelExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface ModelExecutionFile {
  fileNo: number
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
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

const nextGenMIModelExecutionService = {
  async submitModelExecution(scenarioId: number, files: File[]): Promise<ModelExecutionAccept> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response: AxiosResponse<ICommonResponse<ModelExecutionAccept>> = await api.post(
      withCustomBaseUrl(`mi/next-gen/scenarios/${scenarioId}/model-executions`),
      formData,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )
    return response.data.data
  },

  async getModelExecutionStatus(scenarioId: number, runId: string): Promise<ModelExecutionStatusSnapshot> {
    const response: AxiosResponse<ICommonResponse<ModelExecutionStatusSnapshot>> = await api.get(
      withCustomBaseUrl(`mi/next-gen/scenarios/${scenarioId}/model-executions/${encodeURIComponent(runId)}`),
    )

    return response.data.data
  },
}

export default nextGenMIModelExecutionService
