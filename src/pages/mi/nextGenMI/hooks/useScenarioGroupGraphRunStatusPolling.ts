import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IScenarioGraphSeries, IScenarioGroupRunStatusRes } from '@/service/mi/nextGenMI/scenarioGroup'

import useSnackbar from '@/hooks/useSnackbar'
import {
  scenarioGroupDetailQueryKey,
  scenarioGroupGraphRunStatusQueryKey,
  scenarioGroupPriceInterpretationsQueryKey,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const STATUS_POLL_INTERVAL_MS = 3000
const POLL_AFTER_EXECUTION_TIMEOUT_MS = 120_000

interface RunStatusSnapshot {
  anyRunning: boolean
  runningScenarioIds: number[]
}

interface UseScenarioGroupGraphRunStatusPollingOptions {
  scenarioGroupId: number
  enabled: boolean
  fallbackScenarioSeries?: IScenarioGraphSeries[]
}

const buildRunStatusSnapshot = (runStatus: IScenarioGroupRunStatusRes): RunStatusSnapshot => ({
  anyRunning: runStatus.anyRunning,
  runningScenarioIds: runStatus.scenarios
    .filter((scenario) => scenario.modelRunning)
    .map((scenario) => scenario.scenarioId)
    .sort((a, b) => a - b),
})

const isSameRunStatusSnapshot = (prev: RunStatusSnapshot, next: RunStatusSnapshot): boolean =>
  prev.anyRunning === next.anyRunning &&
  prev.runningScenarioIds.length === next.runningScenarioIds.length &&
  prev.runningScenarioIds.every((scenarioId, index) => scenarioId === next.runningScenarioIds[index])

/**
 * 시나리오 그룹 그래프 수급모델 실행 상태 폴링.
 * run-status 스냅샷을 기록하고, 상태가 바뀔 때마다 graph API를 재조회한다.
 * modelRunning true -> false 전환 시 완료 스낵바를 표시한다.
 */
export const useScenarioGroupGraphRunStatusPolling = ({
  scenarioGroupId,
  enabled,
  fallbackScenarioSeries,
}: UseScenarioGroupGraphRunStatusPollingOptions) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const prevSnapshotRef = useRef<RunStatusSnapshot | null>(null)
  const handledCompletionKeyRef = useRef<string | null>(null)
  const optimisticExecutingIdsRef = useRef<Set<number>>(new Set())
  const pollAfterExecutionRef = useRef(false)
  const [pollAfterExecution, setPollAfterExecution] = useState(false)

  const isQueryEnabled = enabled && scenarioGroupId > 0

  useEffect(() => {
    pollAfterExecutionRef.current = pollAfterExecution
  }, [pollAfterExecution])

  const { data: runStatus } = useQuery({
    queryKey: scenarioGroupGraphRunStatusQueryKey(scenarioGroupId),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraphRunStatus(scenarioGroupId),
    enabled: isQueryEnabled,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.anyRunning || pollAfterExecutionRef.current) return STATUS_POLL_INTERVAL_MS
      return false
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    prevSnapshotRef.current = null
    handledCompletionKeyRef.current = null
    optimisticExecutingIdsRef.current = new Set()
    pollAfterExecutionRef.current = false
    setPollAfterExecution(false)
  }, [scenarioGroupId])

  const refetchGraphQueries = useCallback(() => {
    void queryClient.refetchQueries({ queryKey: ['nextGenMIScenarioGroupGraph', scenarioGroupId] })
  }, [queryClient, scenarioGroupId])

  const refetchExecutionRelatedQueries = useCallback(() => {
    refetchGraphQueries()
    void queryClient.refetchQueries({ queryKey: scenarioGroupDetailQueryKey(scenarioGroupId), type: 'active' })
  }, [queryClient, refetchGraphQueries, scenarioGroupId])

  const refetchPriceInterpretations = useCallback(() => {
    void queryClient.refetchQueries({ queryKey: scenarioGroupPriceInterpretationsQueryKey(scenarioGroupId), type: 'active' })
  }, [queryClient, scenarioGroupId])

  useEffect(() => {
    if (!pollAfterExecution) return undefined
    const timer = setTimeout(() => {
      setPollAfterExecution(false)
      refetchGraphQueries()
    }, POLL_AFTER_EXECUTION_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [pollAfterExecution, refetchGraphQueries])

  const settleExecution = useCallback(
    (completionKey: string) => {
      if (handledCompletionKeyRef.current === completionKey) return
      handledCompletionKeyRef.current = completionKey
      showSnackbar('실행 완료되었습니다.', { variant: 'success' })
      refetchExecutionRelatedQueries()
      refetchPriceInterpretations()
      setPollAfterExecution(false)
    },
    [refetchExecutionRelatedQueries, refetchPriceInterpretations, showSnackbar],
  )

  useEffect(() => {
    if (!runStatus) return

    const nextSnapshot = buildRunStatusSnapshot(runStatus)
    const prevSnapshot = prevSnapshotRef.current

    if (prevSnapshot && !isSameRunStatusSnapshot(prevSnapshot, nextSnapshot)) {
      refetchExecutionRelatedQueries()

      const nextRunningSet = new Set(nextSnapshot.runningScenarioIds)
      prevSnapshot.runningScenarioIds.forEach((scenarioId) => {
        if (!nextRunningSet.has(scenarioId)) {
          settleExecution(`scenario-${scenarioId}`)
        }
      })
    }

    prevSnapshotRef.current = nextSnapshot
  }, [refetchExecutionRelatedQueries, runStatus, settleExecution])

  const executingScenarioIds = useMemo(() => {
    const ids = new Set<number>()

    if (runStatus?.scenarios) {
      runStatus.scenarios.forEach((scenario) => {
        if (scenario.modelRunning) ids.add(scenario.scenarioId)
        else optimisticExecutingIdsRef.current.delete(scenario.scenarioId)
      })
    } else {
      ;(fallbackScenarioSeries ?? []).filter((series) => series.modelRunning).forEach((series) => ids.add(series.scenarioId))
    }

    optimisticExecutingIdsRef.current.forEach((scenarioId) => ids.add(scenarioId))
    return ids
  }, [fallbackScenarioSeries, runStatus?.scenarios])

  const notifyExecutionAccepted = useCallback(
    (scenarioId?: number) => {
      if (scenarioId !== undefined) {
        optimisticExecutingIdsRef.current.add(scenarioId)
      }
      handledCompletionKeyRef.current = null
      setPollAfterExecution(true)
      void queryClient.invalidateQueries({ queryKey: scenarioGroupGraphRunStatusQueryKey(scenarioGroupId) })
      void queryClient.refetchQueries({ queryKey: scenarioGroupDetailQueryKey(scenarioGroupId), type: 'active' })
    },
    [queryClient, scenarioGroupId],
  )

  const notifyExecutionCompleted = useCallback(
    (scenarioId: number) => {
      optimisticExecutingIdsRef.current.delete(scenarioId)
      settleExecution(`scenario-${scenarioId}`)
    },
    [settleExecution],
  )

  return {
    executingScenarioIds,
    notifyExecutionAccepted,
    notifyExecutionCompleted,
  }
}
