import type { ModelInputFinalization } from '@/service/mi/fundamentalModel/inputDraft'

import { isModelInputObject } from '@/pages/mi/fundamentalModel/components/modelInputEditing'

// 과거 저장 건도 execution: null을 반환한다. 필드 누락은 완료로 취급하지 않는다.
export const getModelInputExecution = (operation: ModelInputFinalization) => {
  if (operation.execution === null) return null
  const execution = operation.execution
  if (
    !isModelInputObject(execution) ||
    !['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'].includes(String(execution.status)) ||
    typeof execution.statusLabel !== 'string' ||
    (execution.runId !== null && typeof execution.runId !== 'string') ||
    typeof execution.statusEndpoint !== 'string' ||
    (execution.failureReason !== null &&
      !['EXECUTION_REQUEST_FAILED', 'JOB_SUBMIT_FAILED', 'MODEL_EXECUTION_FAILED'].includes(String(execution.failureReason)))
  ) {
    return undefined
  }
  return execution
}

export const getModelInputExecutionFailure = (reason: unknown) => {
  switch (reason) {
    case 'EXECUTION_REQUEST_FAILED':
      return '저장 완료, 모델 실행 접수 실패'
    case 'JOB_SUBMIT_FAILED':
      return '저장 완료, 모델 작업 요청 실패'
    default:
      return '저장 완료, 모델 실행 실패'
  }
}
