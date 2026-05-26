import { useCallback, useEffect, useRef, useState } from 'react'

import type { FundamentalModelRunPlaceholderMode } from '@/pages/mi/fundamentalModel/components/FundamentalModelRunPlaceholder'
import type {
  FundamentalModelDetail,
  FundamentalModelRunListItem,
  FundamentalModelRunStatus,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import useSnackbar from '@/hooks/useSnackbar'

/** 모의 실행 시 진행시간 (ms) -- API 미존재로 3초 임시 진행 */
const MOCK_RUN_DURATION_MS = 3000

/** 실행 상태 -> 본문 자리표시자 모드 (done 이면 null) */
export const runStatusToPlaceholderMode = (status: FundamentalModelRunStatus | undefined): FundamentalModelRunPlaceholderMode | null => {
  if (status === 'pending') return 'pending'
  if (status === 'in_progress') return 'running'
  if (status === 'error') return 'error'
  return null
}

/**
 * 수급 모델 실행 상태 오버라이드 및 모의 실행 흐름.
 * 헤더/좌측 리스트/본문 Placeholder 가 동일한 상태를 공유합니다.
 */
export const useFundamentalModelRunExecution = (activeRunId: string) => {
  const [runStatusOverride, setRunStatusOverride] = useState<Record<string, FundamentalModelRunStatus>>({})
  const runTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const timers = runTimers.current
    return () => {
      Object.values(timers).forEach((handle) => clearTimeout(handle))
    }
  }, [])

  /** 모의 실행 시작 -- 지정 시간 후 outcome 에 맞춰 done/error 로 전환 */
  const startMockRun = useCallback(
    (runId: string, outcome: 'success' | 'failure') => {
      if (!runId) return
      const existing = runTimers.current[runId]
      if (existing) clearTimeout(existing)

      setRunStatusOverride((prev) => ({ ...prev, [runId]: 'in_progress' }))

      runTimers.current[runId] = setTimeout(() => {
        delete runTimers.current[runId]
        if (outcome === 'success') {
          setRunStatusOverride((prev) => ({ ...prev, [runId]: 'done' }))
          showSnackbar('실행 완료되었습니다.', { variant: 'success' })
        } else {
          setRunStatusOverride((prev) => ({ ...prev, [runId]: 'error' }))
          showSnackbar('실행 실패했습니다.', { variant: 'error' })
        }
      }, MOCK_RUN_DURATION_MS)
    },
    [showSnackbar],
  )

  // 첫 실행은 실패 화면으로, 재실행은 성공 화면으로 (API 미존재 모의 흐름)
  const handleRun = useCallback(() => {
    startMockRun(activeRunId, 'failure')
  }, [activeRunId, startMockRun])

  const handleRetry = useCallback(() => {
    startMockRun(activeRunId, 'success')
  }, [activeRunId, startMockRun])

  const applyStatusOverride = useCallback(
    <T extends { id: string; status: FundamentalModelRunStatus }>(item: T): T => {
      const override = runStatusOverride[item.id]
      return override ? { ...item, status: override } : item
    },
    [runStatusOverride],
  )

  const applyStatusOverrideToDetail = useCallback(
    (detail: FundamentalModelDetail | null | undefined): FundamentalModelDetail | null => {
      if (!detail) return null
      return applyStatusOverride(detail)
    },
    [applyStatusOverride],
  )

  const applyStatusOverrideToRuns = useCallback(
    (runs: FundamentalModelRunListItem[]): FundamentalModelRunListItem[] => {
      if (!runs.length) return runs
      return runs.map((run) => applyStatusOverride(run))
    },
    [applyStatusOverride],
  )

  return {
    handleRun,
    handleRetry,
    applyStatusOverrideToDetail,
    applyStatusOverrideToRuns,
  }
}
