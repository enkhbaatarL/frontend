import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { IScenarioGraphSeries } from '@/service/mi/nextGenMI/scenarioGroup'

import useSnackbar from '@/hooks/useSnackbar'
import { scenarioGroupGraphRunStatusQueryKey } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const STATUS_POLL_INTERVAL_MS = 3000
const POLL_AFTER_EXECUTION_TIMEOUT_MS = 120_000

interface UseScenarioGroupGraphRunStatusPollingOptions {
  scenarioGroupId: number
  enabled: boolean
  fallbackScenarioSeries?: IScenarioGraphSeries[]
}

/**
 * 시나리오 그룹 그래프 수급모델 실행 상태 폴링.
 * run-status API로 modelRunning을 추적하고, true -> false 전환 시 graph API를 재조회한다.
 */
export const useScenarioGroupGraphRunStatusPolling = ({
  scenarioGroupId,
  enabled,
  fallbackScenarioSeries,
}: UseScenarioGroupGraphRunStatusPollingOptions) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const prevModelRunningRef = useRef<Map<number, boolean>>(new Map())
  const prevAnyRunningRef = useRef<boolean | undefined>(undefined)
  const handledCompletionKeyRef = useRef<string | null>(null)
  const optimisticExecutingIdsRef = useRef<Set<number>>(new Set())
  const [pollAfterExecution, setPollAfterExecution] = useState(false)

  const isQueryEnabled = enabled && scenarioGroupId > 0

  const { data: runStatus } = useQuery({
    queryKey: scenarioGroupGraphRunStatusQueryKey(scenarioGroupId),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraphRunStatus(scenarioGroupId),
    enabled: isQueryEnabled,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.anyRunning || pollAfterExecution) return STATUS_POLL_INTERVAL_MS
      return false
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    prevModelRunningRef.current = new Map()
    prevAnyRunningRef.current = undefined
    handledCompletionKeyRef.current = null
    optimisticExecutingIdsRef.current = new Set()
    setPollAfterExecution(false)
  }, [scenarioGroupId])

  const invalidateGraphQueries = useCallback(() => {
    void queryClient.refetchQueries({ queryKey: ['nextGenMIScenarioGroupGraph', scenarioGroupId] })
  }, [queryClient, scenarioGroupId])

  useEffect(() => {
    if (!pollAfterExecution) return undefined
    const timer = setTimeout(() => {
      setPollAfterExecution(false)
      invalidateGraphQueries()
    }, POLL_AFTER_EXECUTION_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [invalidateGraphQueries, pollAfterExecution])

  const settleExecution = useCallback(
    (completionKey: string) => {
      if (handledCompletionKeyRef.current === completionKey) return
      handledCompletionKeyRef.current = completionKey
      showSnackbar('실행 완료되었습니다.', { variant: 'success' })
      invalidateGraphQueries()
      setPollAfterExecution(false)
    },
    [invalidateGraphQueries, showSnackbar],
  )

  useEffect(() => {
    if (!runStatus) return

    let completionKey: string | null = null

    runStatus.scenarios.forEach((scenario) => {
      const prevRunning = prevModelRunningRef.current.get(scenario.scenarioId)
      if (prevRunning === true && scenario.modelRunning === false) {
        completionKey = `scenario-${scenario.scenarioId}`
      }
      prevModelRunningRef.current.set(scenario.scenarioId, scenario.modelRunning)
    })

    const prevAnyRunning = prevAnyRunningRef.current
    prevAnyRunningRef.current = runStatus.anyRunning
    if (!completionKey && prevAnyRunning === true && !runStatus.anyRunning) {
      completionKey = `group-${scenarioGroupId}`
    }

    if (
      !completionKey &&
      pollAfterExecution &&
      !runStatus.anyRunning &&
      optimisticExecutingIdsRef.current.size > 0 &&
      runStatus.scenarios.some((scenario) => optimisticExecutingIdsRef.current.has(scenario.scenarioId) && scenario.modelRunning === false)
    ) {
      const settledScenarioId = [...optimisticExecutingIdsRef.current].find((scenarioId) =>
        runStatus.scenarios.some((scenario) => scenario.scenarioId === scenarioId && !scenario.modelRunning),
      )
      if (settledScenarioId !== undefined) {
        completionKey = `scenario-${settledScenarioId}`
      }
    }

    if (completionKey) settleExecution(completionKey)
  }, [pollAfterExecution, runStatus, scenarioGroupId, settleExecution])

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
      invalidateGraphQueries()
    },
    [invalidateGraphQueries, queryClient, scenarioGroupId],
  )

  return {
    executingScenarioIds,
    notifyExecutionAccepted,
  }
}
