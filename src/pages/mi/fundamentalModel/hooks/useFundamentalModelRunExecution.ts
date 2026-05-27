import { useCallback, useEffect, useRef, useState } from 'react'

import type { FundamentalModelCaseStatus, IFundamentalModelCaseDetail } from '@/service/mi/fundamentalModel/case'

import useSnackbar from '@/hooks/useSnackbar'
import { caseStatusToPlaceholderMode } from '@/pages/mi/fundamentalModel/fundamentalModelCaseStatus'

/** 모의 실행 시 진행시간 (ms) -- API 미존재로 3초 임시 진행 */
const MOCK_RUN_DURATION_MS = 3000

/** 실행 상태 -> 본문 자리표시자 모드 (COMPLETED 이면 null) */
export const runStatusToPlaceholderMode = caseStatusToPlaceholderMode

/**
 * 수급 모델 실행 상태 오버라이드 및 모의 실행 흐름.
 * 헤더/본문 Placeholder 가 동일한 Case API status 를 공유합니다.
 */
export const useFundamentalModelRunExecution = (activeCaseId: string) => {
  const [runStatusOverride, setRunStatusOverride] = useState<Record<string, FundamentalModelCaseStatus>>({})
  const runTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const timers = runTimers.current
    return () => {
      Object.values(timers).forEach((handle) => clearTimeout(handle))
    }
  }, [])

  /** 모의 실행 시작 -- 지정 시간 후 outcome 에 맞춰 COMPLETED/FAILED 로 전환 */
  const startMockRun = useCallback(
    (caseId: string, outcome: 'success' | 'failure') => {
      if (!caseId) return
      const existing = runTimers.current[caseId]
      if (existing) clearTimeout(existing)

      setRunStatusOverride((prev) => ({ ...prev, [caseId]: 'RUNNING' }))

      runTimers.current[caseId] = setTimeout(() => {
        delete runTimers.current[caseId]
        if (outcome === 'success') {
          setRunStatusOverride((prev) => ({ ...prev, [caseId]: 'COMPLETED' }))
          showSnackbar('실행 완료되었습니다.', { variant: 'success' })
        } else {
          setRunStatusOverride((prev) => ({ ...prev, [caseId]: 'FAILED' }))
          showSnackbar('실행 실패했습니다.', { variant: 'error' })
        }
      }, MOCK_RUN_DURATION_MS)
    },
    [showSnackbar],
  )

  // 첫 실행은 실패 화면으로, 재실행은 성공 화면으로 (API 미존재 모의 흐름)
  const handleRun = useCallback(() => {
    startMockRun(activeCaseId, 'failure')
  }, [activeCaseId, startMockRun])

  const handleRetry = useCallback(() => {
    startMockRun(activeCaseId, 'success')
  }, [activeCaseId, startMockRun])

  const applyStatusOverrideToCaseDetail = useCallback(
    (detail: IFundamentalModelCaseDetail | null | undefined): IFundamentalModelCaseDetail | null => {
      if (!detail) return null
      const override = runStatusOverride[String(detail.caseId)]
      return override ? { ...detail, status: override } : detail
    },
    [runStatusOverride],
  )

  return {
    handleRun,
    handleRetry,
    applyStatusOverrideToCaseDetail,
  }
}
