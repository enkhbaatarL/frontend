import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { NextGenMIIndexName } from '@/service/mi/nextGenMI/common'

import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ScenarioSummaryChartGraph from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChartGraph'
import ScenarioGroupGraphDownloadMenu from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphDownloadMenu'
import ScenarioGroupGraphLegend from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphLegend'
import {
  buildScenarioGroupGraphRender,
  buildScenarioGroupGraphUnit,
  scenarioGroupGraphQueryKey,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const INDEX_OPTIONS: { value: NextGenMIIndexName; label: string }[] = [
  { value: 'JKM', label: 'JKM' },
  { value: 'TTF', label: 'TTF' },
  { value: 'HH', label: 'HH' },
]

interface ScenarioGroupGraphViewProps {
  scenarioGroupId: number
  enabled: boolean
  height?: number
  defaultIndexName?: NextGenMIIndexName
}

const ScenarioGroupGraphView = ({ scenarioGroupId, enabled, height = 480, defaultIndexName = 'JKM' }: ScenarioGroupGraphViewProps) => {
  const [indexName, setIndexName] = useState<NextGenMIIndexName>(defaultIndexName)
  const [visibilityMap, setVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)

  const graphQuery = useQuery({
    queryKey: scenarioGroupGraphQueryKey(scenarioGroupId, indexName),
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupGraph(scenarioGroupId, indexName),
    enabled: enabled && Boolean(indexName),
    refetchOnWindowFocus: false,
  })

  const graphData = graphQuery.data

  useEffect(() => {
    setVisibilityMap(new Map())
    setHoveredKey(null)
  }, [graphData])

  const render = useMemo(() => (graphData ? buildScenarioGroupGraphRender(graphData) : null), [graphData])

  const chartVisibilityMap = useMemo(() => {
    const merged = new Map(visibilityMap)
    render?.forcedHiddenKeys.forEach((key) => merged.set(key, false))
    return merged
  }, [visibilityMap, render])

  const handleToggle = useCallback((visibilityKey: string) => {
    setVisibilityMap((prev) => {
      const next = new Map(prev)
      next.set(visibilityKey, prev.get(visibilityKey) === false)
      return next
    })
  }, [])

  const unitLabel = graphData ? buildScenarioGroupGraphUnit(graphData.currency, graphData.unit) : 'Unit: -'
  const hasChart = Boolean(render && render.charts.length > 0)

  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="24px" width="100%" minWidth={0}>
      <Stack flex="1 1 0" minWidth={0}>
        <Typography variant="body2SB14" color="contentText.Normal" sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
          {unitLabel}
        </Typography>
        <Box
          ref={chartWrapperRef}
          width="100%"
          height={`${height}px`}
          borderRadius="10px"
          bgcolor={hasChart ? 'commonColor.White' : 'gray.5'}
        >
          {graphQuery.isLoading ? (
            <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: '10px' }} />
          ) : hasChart && render ? (
            <ScenarioSummaryChartGraph
              height={height}
              charts={render.charts}
              chartVisibilityMap={chartVisibilityMap}
              hoveredChartKey={hoveredKey}
              chartColorMap={render.chartColorMap}
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
        <Stack direction="row" alignItems="center" gap="8px" width="100%">
          <MISlidingSegmented
            value={indexName}
            options={INDEX_OPTIONS}
            onChange={(value) => setIndexName(value as NextGenMIIndexName)}
            fullWidth
            sx={{ flex: '1 1 0' }}
          />
          <ScenarioGroupGraphDownloadMenu scenarioGroupId={scenarioGroupId} indexName={indexName} chartRef={chartWrapperRef} />
        </Stack>

        {hasChart && render && (
          <ScenarioGroupGraphLegend
            baseItems={render.baseLegend}
            scenarioItems={render.scenarioLegend}
            visibilityMap={visibilityMap}
            hoveredKey={hoveredKey}
            onToggle={handleToggle}
            onHover={setHoveredKey}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default memo(ScenarioGroupGraphView)
