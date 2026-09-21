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
 * 팝업이 실행 중인 시나리오는 완료/실패 콜백이 결과를 알려 줄 때까지 스냅샷에서 완료 토스트를 치지 않는다.
 */
export const useScenarioGroupGraphRunStatusPolling = ({
  scenarioGroupId,
  enabled,
  fallbackScenarioSeries,
}: UseScenarioGroupGraphRunStatusPollingOptions) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const prevSnapshotRef = useRef<RunStatusSnapshot | null>(null)
  const handledSettlementKeysRef = useRef<Set<string>>(new Set())
  const popupOwnedExecutionIdsRef = useRef<Set<number>>(new Set())
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
    handledSettlementKeysRef.current = new Set()
    popupOwnedExecutionIdsRef.current = new Set()
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
    (completionKey: string, options?: { success?: boolean }) => {
      if (handledSettlementKeysRef.current.has(completionKey)) return
      handledSettlementKeysRef.current.add(completionKey)
      if (options?.success !== false) {
        showSnackbar('실행 완료되었습니다.', { variant: 'success' })
      }
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
        if (nextRunningSet.has(scenarioId)) return
        // 팝업이 실행 결과를 알고 있으면 여기서 완료 토스트를 치지 않는다. 실패 콜백 직후 modelRunning false가 성공으로 보이던 경로.
        if (popupOwnedExecutionIdsRef.current.has(scenarioId)) return
        settleExecution(`scenario-${scenarioId}`)
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
        popupOwnedExecutionIdsRef.current.add(scenarioId)
        handledSettlementKeysRef.current.delete(`scenario-${scenarioId}`)
      }
      setPollAfterExecution(true)
      void queryClient.invalidateQueries({ queryKey: scenarioGroupGraphRunStatusQueryKey(scenarioGroupId) })
      void queryClient.refetchQueries({ queryKey: scenarioGroupDetailQueryKey(scenarioGroupId), type: 'active' })
    },
    [queryClient, scenarioGroupId],
  )

  const notifyExecutionCompleted = useCallback(
    (scenarioId: number) => {
      optimisticExecutingIdsRef.current.delete(scenarioId)
      popupOwnedExecutionIdsRef.current.delete(scenarioId)
      settleExecution(`scenario-${scenarioId}`)
    },
    [settleExecution],
  )

  const notifyExecutionFailed = useCallback(
    (scenarioId: number) => {
      optimisticExecutingIdsRef.current.delete(scenarioId)
      popupOwnedExecutionIdsRef.current.delete(scenarioId)
      settleExecution(`scenario-${scenarioId}`, { success: false })
    },
    [settleExecution],
  )

  return {
    executingScenarioIds,
    notifyExecutionAccepted,
    notifyExecutionCompleted,
    notifyExecutionFailed,
  }
}
