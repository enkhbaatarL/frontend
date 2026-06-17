import { AxiosResponse } from 'axios'

import api from '@/lib/axios'
import { ICommonResponse } from '@/types/api'

export type ModelExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface ModelExecutionFile {
  fileNo: number
  fileIndex: number
  originalFileName: string
  contentType?: string
  size?: number
}

export interface ModelExecutionAccept {
  executionId: string
  scenarioId: number
  externalRunId: string
  status: ModelExecutionStatus
  files: ModelExecutionFile[]
  requestedAt: string
  statusEndpoint?: string
}

const nextGenMIModelExecutionService = {
  async submitModelExecution(scenarioId: number, files: File[]): Promise<ModelExecutionAccept> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response: AxiosResponse<ICommonResponse<ModelExecutionAccept>> = await api.post(
      `mi/next-gen/scenarios/${scenarioId}/model-executions`,
      formData,
      {
        suppressGlobalErrorHandler: true,
        timeout: 0,
      } as Parameters<typeof api.post>[2] & { suppressGlobalErrorHandler: boolean },
    )
    return response.data.data
  },
}

export default nextGenMIModelExecutionService
