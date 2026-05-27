import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import type { FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'

import useSnackbar from '@/hooks/useSnackbar'
import { caseStatusToPlaceholderMode } from '@/pages/mi/fundamentalModel/fundamentalModelCaseStatus'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

const STATUS_POLL_INTERVAL_MS = 3000

/** 실행 상태 -> 본문 자리표시자 모드 (COMPLETED 이면 null) */
export const runStatusToPlaceholderMode = caseStatusToPlaceholderMode

const isTerminalCaseStatus = (status: FundamentalModelCaseStatus) => status === 'COMPLETED' || status === 'FAILED'

interface UseFundamentalModelRunExecutionOptions {
  /** RUNNING -> terminal 전환 시 상세/목록 갱신 */
  onRunSettled?: () => void
}

/**
 * 수급 모델 실행 요청(runCase) 및 RUNNING 상태 폴링(getCaseStatus).
 */
export const useFundamentalModelRunExecution = (
  activeCaseId: string,
  caseStatus: FundamentalModelCaseStatus | undefined,
  options?: UseFundamentalModelRunExecutionOptions,
) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const handledTerminalKeyRef = useRef<string | null>(null)

  const parsedCaseId = Number(activeCaseId)
  const isValidCaseId = Number.isFinite(parsedCaseId) && parsedCaseId > 0
  const shouldPollStatus = isValidCaseId && caseStatus === 'RUNNING'

  const invalidateCaseQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
    if (activeCaseId) {
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseDetail', activeCaseId] })
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseStatus', activeCaseId] })
    }
    options?.onRunSettled?.()
  }, [activeCaseId, options, queryClient])

  const { mutateAsync: submitRun, isPending: isRunPending } = useMutation({
    mutationFn: () => fundamentalModelCaseService.runCase(parsedCaseId),
    onSuccess: () => {
      invalidateCaseQueries()
    },
    onError: () => {
      showSnackbar('실행 요청에 실패했습니다.', { variant: 'error' })
    },
  })

  const { data: polledCaseStatus } = useQuery({
    queryKey: ['fundamentalModel', 'caseStatus', activeCaseId],
    queryFn: () => fundamentalModelCaseService.getCaseStatus(parsedCaseId),
    enabled: shouldPollStatus,
    refetchInterval: shouldPollStatus ? STATUS_POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    handledTerminalKeyRef.current = null
  }, [activeCaseId])

  useEffect(() => {
    if (!polledCaseStatus) return

    const { status, caseId, updatedAt } = polledCaseStatus
    if (!isTerminalCaseStatus(status)) return

    const terminalKey = `${caseId}-${status}-${updatedAt}`
    if (handledTerminalKeyRef.current === terminalKey) return
    handledTerminalKeyRef.current = terminalKey

    if (status === 'COMPLETED') {
      showSnackbar('실행 완료되었습니다.', { variant: 'success' })
    } else {
      const errorMessage = polledCaseStatus.latestRun?.errorMessage
      showSnackbar(errorMessage || '실행 실패했습니다.', { variant: 'error' })
    }

    invalidateCaseQueries()
  }, [invalidateCaseQueries, polledCaseStatus, showSnackbar])

  const handleRun = useCallback(async () => {
    if (!isValidCaseId || isRunPending) return
    await submitRun()
  }, [isRunPending, isValidCaseId, submitRun])

  const handleRetry = useCallback(async () => {
    if (!isValidCaseId || isRunPending) return
    await submitRun()
  }, [isRunPending, isValidCaseId, submitRun])

  return {
    handleRun,
    handleRetry,
    isRunPending,
  }
}
