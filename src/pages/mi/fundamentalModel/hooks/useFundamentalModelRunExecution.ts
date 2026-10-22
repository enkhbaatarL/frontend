import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'

import useSnackbar from '@/hooks/useSnackbar'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

const isTerminalCaseStatus = (status: FundamentalModelCaseStatus) => status === 'COMPLETED' || status === 'FAILED'

/** 실행을 접수한 케이스와 현재 선택한 실행 중 케이스의 상태만 추적한다. */
export const useFundamentalModelRunExecution = (activeCaseId: string, caseStatus: FundamentalModelCaseStatus | undefined) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [requestedCaseIds, setRequestedCaseIds] = useState<string[]>([])
  const handledTerminalKeysRef = useRef(new Map<string, string>())
  const observedStatusRef = useRef(new Map<string, string>())

  const parsedCaseId = Number(activeCaseId)
  const isValidCaseId = Number.isFinite(parsedCaseId) && parsedCaseId > 0
  const trackedCaseIds = useMemo(
    () => [...new Set([...requestedCaseIds, ...(isValidCaseId && caseStatus === 'RUNNING' ? [activeCaseId] : [])])],
    [activeCaseId, caseStatus, isValidCaseId, requestedCaseIds],
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

  const handleRun = useCallback(async () => {
    if (!isValidCaseId || isRunPending || requestedCaseIds.includes(activeCaseId)) return
    await submitRun(parsedCaseId)
  }, [activeCaseId, isRunPending, isValidCaseId, parsedCaseId, requestedCaseIds, submitRun])

  return {
    handleRun,
    handleRetry: handleRun,
    isRunPending: isRunPending || requestedCaseIds.includes(activeCaseId),
    trackExecution,
  }
}
