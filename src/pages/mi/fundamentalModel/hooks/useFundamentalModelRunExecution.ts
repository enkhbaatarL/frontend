import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'
import type { ModelInputFinalization } from '@/service/mi/fundamentalModel/inputDraft'

import useSnackbar from '@/hooks/useSnackbar'
import { getModelInputExecution } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'
import inputDraftService from '@/service/mi/fundamentalModel/inputDraft'

const isTerminalCaseStatus = (status: FundamentalModelCaseStatus) => status === 'COMPLETED' || status === 'FAILED'

/** 실행을 접수한 케이스와 현재 선택한 실행 중 케이스의 상태만 추적한다. */
export const useFundamentalModelRunExecution = (activeCaseId: string, caseStatus: FundamentalModelCaseStatus | undefined) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [requestedCaseIds, setRequestedCaseIds] = useState<string[]>([])
  const [pendingFinalizations, setPendingFinalizations] = useState<ModelInputFinalization[]>([])
  const handledFinalizationIdsRef = useRef(new Set<string>())
  const handledTerminalKeysRef = useRef(new Map<string, string>())
  const observedStatusRef = useRef(new Map<string, string>())

  const parsedCaseId = Number(activeCaseId)
  const isValidCaseId = Number.isFinite(parsedCaseId) && parsedCaseId > 0
  const trackedCaseIds = useMemo(
    () =>
      [...new Set([...requestedCaseIds, ...(isValidCaseId && caseStatus === 'RUNNING' ? [activeCaseId] : [])])].filter(
        (caseId) => !pendingFinalizations.some((operation) => String(operation.finalizedCaseId) === caseId),
      ),
    [activeCaseId, caseStatus, isValidCaseId, pendingFinalizations, requestedCaseIds],
  )

  const invalidateCaseQueries = useCallback(
    (caseId: string) => {
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseDetail', caseId] })
    },
    [queryClient],
  )

  const trackExecution = useCallback(
    (caseId: string) => {
      if (!Number.isFinite(Number(caseId)) || Number(caseId) <= 0) return
      handledTerminalKeysRef.current.delete(caseId)
      observedStatusRef.current.delete(caseId)
      // 재실행 시 이전 실행의 완료 캐시를 새 실행 결과로 처리하지 않는다.
      void queryClient.resetQueries({ queryKey: ['fundamentalModel', 'caseStatus', caseId], exact: true })
      setRequestedCaseIds((current) => (current.includes(caseId) ? current : [...current, caseId]))
    },
    [queryClient],
  )

  const trackFinalization = useCallback((operation: ModelInputFinalization) => {
    if (getModelInputExecution(operation)?.status !== 'QUEUED' || !operation.finalizedCaseId) return
    handledFinalizationIdsRef.current.delete(operation.operationId)
    setPendingFinalizations((current) =>
      current.some((item) => item.operationId === operation.operationId) ? current : [...current, operation],
    )
  }, [])

  const finalizationQueries = useQueries({
    queries: pendingFinalizations.map((operation) =>
      queryOptions({
        queryKey: ['fundamentalModel', 'finalizationExecution', operation.draftId, operation.operationId],
        queryFn: async () => {
          const result = await inputDraftService.getFinalization(operation.draftId, operation.operationId)
          const execution = getModelInputExecution(result)
          if (
            result.draftId !== operation.draftId ||
            result.operationId !== operation.operationId ||
            result.finalizedCaseId !== operation.finalizedCaseId ||
            result.status !== 'SUCCEEDED' ||
            !execution ||
            ((execution.status === 'RUNNING' || execution.status === 'COMPLETED') && !execution.runId)
          ) {
            throw new Error('자동 실행 접수 상태를 확인할 수 없습니다.')
          }
          return result
        },
        refetchInterval: (query) => (!query.state.data || getModelInputExecution(query.state.data)?.status === 'QUEUED' ? 2000 : false),
        refetchOnWindowFocus: false,
      }),
    ),
  })

  useEffect(() => {
    const settledOperationIds: string[] = []
    for (const query of finalizationQueries) {
      if (!query.data || query.isFetching || query.isError) continue
      const operation = query.data
      const execution = getModelInputExecution(operation)
      if (!execution || execution.status === 'QUEUED' || handledFinalizationIdsRef.current.has(operation.operationId)) continue
      handledFinalizationIdsRef.current.add(operation.operationId)
      settledOperationIds.push(operation.operationId)
      const caseId = String(operation.finalizedCaseId)
      if (execution.status !== 'FAILED' || execution.runId !== null) {
        // 실행 이력이 생성된 이후에만 케이스 상태 조회로 전환한다.
        trackExecution(caseId)
      }
      // 자동 실행 접수에 실패하면 기본 실행 대기 화면으로 돌아가 수동 실행을 허용한다.
      invalidateCaseQueries(caseId)
    }
    if (settledOperationIds.length) {
      setPendingFinalizations((current) => current.filter((operation) => !settledOperationIds.includes(operation.operationId)))
    }
  }, [finalizationQueries, invalidateCaseQueries, trackExecution])

  const { mutateAsync: submitRun, isPending: isRunPending } = useMutation({
    mutationFn: async (caseId: number) => {
      const current = await fundamentalModelCaseService.getCaseStatus(caseId)
      if (current.status === 'RUNNING') return current
      if (current.status !== 'PENDING' && current.status !== 'FAILED') return null
      return fundamentalModelCaseService.runCase(caseId)
    },
    onSuccess: (result, caseId) => {
      if (result) {
        trackExecution(String(caseId))
        invalidateCaseQueries(String(caseId))
      } else {
        void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseDetail', String(caseId)] })
      }
    },
    onError: () => {
      showSnackbar('실행 요청에 실패했습니다.', { variant: 'error' })
    },
  })

  const statusQueries = useQueries({
    queries: trackedCaseIds.map((caseId) =>
      queryOptions({
        queryKey: ['fundamentalModel', 'caseStatus', caseId],
        queryFn: () => fundamentalModelCaseService.getCaseStatus(Number(caseId)),
        refetchInterval: (query) => (query.state.data && isTerminalCaseStatus(query.state.data.status) ? false : 3000),
        refetchOnWindowFocus: false,
      }),
    ),
  })

  useEffect(() => {
    const settledCaseIds: string[] = []
    for (const query of statusQueries) {
      if (!query.data || query.isFetching || query.isError) continue
      const { status, caseId, updatedAt } = query.data
      const id = String(caseId)
      if (!isTerminalCaseStatus(status)) {
        // 대기 → 실행 전환은 상세만 갱신한다. 같은 상태의 반복 응답은 목록을 재조회하지 않는다.
        const statusKey = `${status}:${caseStatus}`
        if (id === activeCaseId && status !== caseStatus && observedStatusRef.current.get(id) !== statusKey) {
          observedStatusRef.current.set(id, statusKey)
          void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseDetail', id] })
        }
        continue
      }

      const terminalKey = `${query.data.latestRun?.runId ?? ''}:${status}:${updatedAt}`
      if (handledTerminalKeysRef.current.get(id) === terminalKey) continue
      handledTerminalKeysRef.current.set(id, terminalKey)
      settledCaseIds.push(id)
      showSnackbar(status === 'COMPLETED' ? '실행 완료되었습니다.' : query.data.latestRun?.errorMessage || '실행 실패했습니다.', {
        variant: status === 'COMPLETED' ? 'success' : 'error',
      })
      invalidateCaseQueries(id)
    }
    if (settledCaseIds.length) setRequestedCaseIds((current) => current.filter((id) => !settledCaseIds.includes(id)))
  }, [activeCaseId, caseStatus, invalidateCaseQueries, queryClient, showSnackbar, statusQueries])

  const isExecutionQueued = pendingFinalizations.some((operation) => String(operation.finalizedCaseId) === activeCaseId)

  const handleRun = useCallback(async () => {
    if (!isValidCaseId || isRunPending || isExecutionQueued || requestedCaseIds.includes(activeCaseId)) return
    await submitRun(parsedCaseId)
  }, [activeCaseId, isExecutionQueued, isRunPending, isValidCaseId, parsedCaseId, requestedCaseIds, submitRun])

  return {
    handleRun,
    handleRetry: handleRun,
    isRunPending: isRunPending || isExecutionQueued || requestedCaseIds.includes(activeCaseId),
    trackFinalization,
    trackExecution,
  }
}
