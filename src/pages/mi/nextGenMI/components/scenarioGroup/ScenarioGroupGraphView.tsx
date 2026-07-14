import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ScenarioGroupGraphFilter } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import type { ScenarioModelExecutionOption } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'
import type { NextGenMIIndexName } from '@/service/mi/nextGenMI/common'
import type { ScenarioGroupGraphPeriodUnit } from '@/service/mi/nextGenMI/scenarioGroup'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import NextGenMIDetailStickySectionHeader from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailStickySectionHeader'
import ScenarioSummaryChartGraph from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChartGraph'
import ScenarioGroupGraphDownloadMenu from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphDownloadMenu'
import ScenarioGroupGraphLegend from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphLegend'
import {
  buildScenarioGroupGraphRender,
  buildScenarioGroupGraphUnit,
  mergeScenarioGroupGraphCmeBenchmark,
  scenarioGroupGraphCmeBenchmarkQueryKey,
  scenarioGroupGraphQueryKey,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import ScenarioModelExecutionButton from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionButton'
import ScenarioModelExecutionPopup, {
  type ScenarioModelExecutionPopupRef,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopup'
import { useScenarioGroupGraphRunStatusPolling } from '@/pages/mi/nextGenMI/hooks/useScenarioGroupGraphRunStatusPolling'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const INDEX_OPTIONS: { value: NextGenMIIndexName; label: string }[] = [
  { value: 'JKM', label: 'JKM' },
  { value: 'TTF', label: 'TTF' },
  { value: 'HH', label: 'HH' },
]

const PERIOD_UNIT_OPTIONS: { value: ScenarioGroupGraphPeriodUnit; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

interface ScenarioGroupGraphViewProps {
  scenarioGroupId: number
  enabled: boolean
  height?: number
  defaultIndexName?: NextGenMIIndexName
  headingSlot?: ReactNode
  headingStickyTopPx?: number
  chartBackgroundColor?: string
}

const ScenarioGroupGraphView = ({
  scenarioGroupId,
  enabled,
  height = 480,
  defaultIndexName = 'JKM',
  headingSlot,
  headingStickyTopPx,
  chartBackgroundColor = 'commonColor.White',
}: ScenarioGroupGraphViewProps) => {
  const [indexName, setIndexName] = useState<NextGenMIIndexName>(defaultIndexName)
  const [periodUnit, setPeriodUnit] = useState<ScenarioGroupGraphPeriodUnit>('monthly')
  const [filter, setFilter] = useState<ScenarioGroupGraphFilter>({ showNonExecuted: true, showDiscarded: false })
  const [visibilityMap, setVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredKeys, setHoveredKeys] = useState<string[] | null>(null)
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)
  const realizedDefaultAppliedRef = useRef(false)
  const executionPopupRef = useRef<ScenarioModelExecutionPopupRef>(null)

  const graphQuery = useQuery({
    queryKey: scenarioGroupGraphQueryKey(scenarioGroupId, indexName, periodUnit),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraph(scenarioGroupId, indexName, periodUnit),
    enabled: enabled && Boolean(indexName),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const { executingScenarioIds, notifyExecutionAccepted, notifyExecutionCompleted } = useScenarioGroupGraphRunStatusPolling({
    scenarioGroupId,
    enabled,
    fallbackScenarioSeries: graphQuery.data?.scenarioSeries,
  })

  const cmeBenchmarkQuery = useQuery({
    queryKey: scenarioGroupGraphCmeBenchmarkQueryKey(indexName, periodUnit),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraphCmeBenchmark(indexName, periodUnit),
    enabled: enabled && Boolean(indexName),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  })

  const cmeBenchmarkData = useMemo(() => {
    if (!graphQuery.data || !cmeBenchmarkQuery.data) return undefined
    if (
      graphQuery.data.indexName !== cmeBenchmarkQuery.data.indexName ||
      graphQuery.data.periodUnit !== cmeBenchmarkQuery.data.periodUnit
    ) {
      return undefined
    }
    return cmeBenchmarkQuery.data
  }, [cmeBenchmarkQuery.data, graphQuery.data])

  const graphData = useMemo(
    () => (graphQuery.data ? mergeScenarioGroupGraphCmeBenchmark(graphQuery.data, cmeBenchmarkData) : undefined),
    [cmeBenchmarkData, graphQuery.data],
  )

  useEffect(() => {
    setVisibilityMap(new Map())
    setHoveredKeys(null)
  }, [graphData])

  useEffect(() => {
    if (!graphData || realizedDefaultAppliedRef.current) return
    realizedDefaultAppliedRef.current = true
    if (graphData.scenarioSeries.some((series) => series.status === 'realized')) {
      setFilter((prev) => ({ ...prev, showNonExecuted: false }))
    }
  }, [graphData])

  const render = useMemo(() => (graphData ? buildScenarioGroupGraphRender(graphData, filter) : null), [graphData, filter])

  const handleToggle = useCallback((toggleKeys: string[]) => {
    if (toggleKeys.length === 0) return
    setVisibilityMap((prev) => {
      const next = new Map(prev)
      const isCurrentlyHidden = toggleKeys.every((key) => prev.get(key) === false)
      toggleKeys.forEach((key) => next.set(key, isCurrentlyHidden))
      return next
    })
  }, [])

  const handleExecute = useCallback((scenarioId: number) => {
    executionPopupRef.current?.openFor(scenarioId)
  }, [])

  const handleExecuteNew = useCallback(() => {
    executionPopupRef.current?.open()
  }, [])

  const scenarioOptions = useMemo<ScenarioModelExecutionOption[]>(
    () =>
      (graphData?.scenarioSeries ?? []).map((series) => {
        const isDiscarded = series.status === 'discarded'
        return {
          scenarioId: series.scenarioId,
          scenarioName: series.scenarioName,
          executed: series.executed,
          disabled: isDiscarded,
          badgeLabel: isDiscarded ? '폐기' : series.executed ? '재실행' : undefined,
        }
      }),
    [graphData?.scenarioSeries],
  )

  const unitLabel = graphData ? buildScenarioGroupGraphUnit(graphData.currency, graphData.unit) : 'Unit: -'
  const hasChart = Boolean(render && render.charts.length > 0)

  return (
    <>
      <Stack gap="12px" width="100%" minWidth={0}>
        {headingSlot && (
          <NextGenMIDetailStickySectionHeader
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap="16px"
            stickyTopPx={headingStickyTopPx}
          >
            {headingSlot}
            <ScenarioModelExecutionButton
              options={scenarioOptions}
              executingScenarioIds={executingScenarioIds}
              onExecute={handleExecute}
              onExecuteNew={handleExecuteNew}
            />
          </NextGenMIDetailStickySectionHeader>
        )}
        <Box ref={chartWrapperRef} width="100%" minWidth={0}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="24px" width="100%" minWidth={0}>
            <Stack flex="1 1 0" minWidth={0} gap="8px">
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap="8px" width="100%">
                <Typography variant="body2SB14" color="contentText.Normal" sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
                  {unitLabel}
                </Typography>
                <Stack direction="row" alignItems="center" gap="8px">
                  <MISelectMenu<ScenarioGroupGraphPeriodUnit>
                    variant="text"
                    selectionIconPosition="left"
                    selected={periodUnit}
                    onSelected={setPeriodUnit}
                    items={PERIOD_UNIT_OPTIONS}
                    enableHoverBackground
                    sx={{ height: '36px', minWidth: '100px', backgroundColor: 'gray.10', color: 'contentText.Normal' }}
                  />
                  <ScenarioGroupGraphDownloadMenu
                    scenarioGroupId={scenarioGroupId}
                    indexName={indexName}
                    periodUnit={periodUnit}
                    chartRef={chartWrapperRef}
                  />
                </Stack>
              </Stack>
              <Box width="100%" height={`${height}px`} borderRadius="10px" bgcolor={hasChart ? chartBackgroundColor : 'gray.5'}>
                {graphQuery.isLoading || cmeBenchmarkQuery.isLoading ? (
                  <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: '10px' }} />
                ) : hasChart && render ? (
                  <ScenarioSummaryChartGraph
                    key={render.periodUnit}
                    height={height}
                    charts={render.charts}
                    chartVisibilityMap={visibilityMap}
                    hoveredChartKey={hoveredKeys}
                    chartColorMap={render.chartColorMap}
                    crosshairDateFormat={render.periodUnit === 'yearly' ? 'YYYY' : 'YYYY-MM'}
                    currentMarkerGranularity={render.periodUnit === 'yearly' ? 'YEAR' : 'MONTH'}
                    disableIntroAnimation
                    spanGaps
                  />
                ) : (
                  <Stack height="100%" alignItems="center" justifyContent="center" gap="10px" sx={{ userSelect: 'none' }}>
                    <ErrorOutlineOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
                    <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
                      그래프 데이터가 없습니다.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>

            <Stack flexShrink={0} width="348px" gap="20px">
              <MISlidingSegmented
                value={indexName}
                options={INDEX_OPTIONS}
                onChange={(value) => setIndexName(value as NextGenMIIndexName)}
                fullWidth
                equalWidth
              />

              {render && (
                <ScenarioGroupGraphLegend
                  baseItems={render.baseLegend}
                  scenarioItems={render.scenarioLegend}
                  visibilityMap={visibilityMap}
                  hoveredKey={hoveredKeys}
                  filter={filter}
                  onToggle={handleToggle}
                  onFilterChange={setFilter}
                  onHover={setHoveredKeys}
                  onExecute={handleExecute}
                  executingScenarioIds={executingScenarioIds}
                />
              )}
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {graphData && (
        <ScenarioModelExecutionPopup
          ref={executionPopupRef}
          scenarioOptions={scenarioOptions}
          parameterProposalTarget={graphData.parameterProposalTarget}
          executingScenarioIds={executingScenarioIds}
          onAccepted={notifyExecutionAccepted}
          onCompleted={notifyExecutionCompleted}
        />
      )}
    </>
  )
}

export default memo(ScenarioGroupGraphView)
