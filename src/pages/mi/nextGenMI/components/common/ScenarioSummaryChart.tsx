import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import type { IScenarioPriceForecast } from '@/service/mi/nextGenMI/scenario'
import type { ChartData } from '@/types/dataDetailChart'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import ScenarioSummaryChartGraph from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChartGraph'
import ScenarioModelExecutionGeneratingState from '@/pages/mi/nextGenMI/components/scenario/ScenarioModelExecutionGeneratingState'
import { ChartType } from '@/types/dataDetailChart'

const CHART_HEIGHT = 480
const SCENARIO_CHART_COLORS = ['#185FA5', '#0F8A72', '#E09A3A', '#C4407A', '#A32D2D', '#2B8EA6', '#7B52B8', '#B8960C', '#3D7D3F', '#6B6A65']
const EMPTY_CHART_HOVER_SX = {
  '&:hover': {
    bgcolor: 'contentBG.Hover',
  },
} as const

export const scenarioForecastVisibilityKey = (scenarioId: number): string => `scenario:${scenarioId}_FORECAST`

type ScenarioSummaryForecastChartData = ChartData & {
  dataType: 'FORECAST'
  resultDates: string[]
  startDates: string[]
  visibilityKey?: string
}

const normalizeMonthDate = (dateLabel: string, fallbackMonthIndex: number): dayjs.Dayjs => {
  const value = dateLabel.trim()
  const compactMatch = new RegExp(/^(\d{4})(\d{2})$/).exec(value)
  if (compactMatch) return dayjs(`${compactMatch[1]}-${compactMatch[2]}-01`)

  const separatedMatch = new RegExp(/^(\d{4})[./-](\d{1,2})/).exec(value)
  if (separatedMatch) return dayjs(`${separatedMatch[1]}-${separatedMatch[2].padStart(2, '0')}-01`)

  const parsed = dayjs(value)
  if (parsed.isValid()) return parsed.startOf('month')

  return dayjs('2000-01-01').add(fallbackMonthIndex, 'month')
}

const buildTimestamps = (dates: string[], valueCount: number): string[] => {
  if (valueCount === 0) return []

  const weeksPerMonth = dates.length > 0 ? Math.max(1, Math.floor(valueCount / dates.length)) : 1

  return Array.from({ length: valueCount }, (_, index) => {
    const monthIndex = dates.length > 0 ? Math.min(Math.floor(index / weeksPerMonth), dates.length - 1) : index
    const weekIndex = dates.length > 0 ? index - monthIndex * weeksPerMonth : 0
    const baseDate = normalizeMonthDate(dates[monthIndex] ?? '', monthIndex)
    return baseDate.add(weekIndex, 'week').format('YYYY-MM-DDTHH:mm:ss')
  })
}

const buildChartUnit = (priceForecast: IScenarioPriceForecast): string => {
  if (priceForecast.currency && priceForecast.unit) return `Unit: ${priceForecast.currency}/${priceForecast.unit}`
  if (priceForecast.currency) return `Unit: ${priceForecast.currency}`
  if (priceForecast.unit) return `Unit: ${priceForecast.unit}`
  return 'Unit: -'
}

type LegendEllipsisLabelProps = {
  label: string
  isShow: boolean
  isHighlighted: boolean
  legendDimmed: boolean
}

const LegendEllipsisLabel = ({ label, isShow, isHighlighted, legendDimmed }: LegendEllipsisLabelProps) => {
  const { ref, isEllipsis } = useEllipsisDetection(label)

  const typography = (
    <Typography
      ref={ref}
      className="legend-label"
      variant={isHighlighted ? 'body3SB12' : 'body3M12'}
      sx={{
        color: !isShow ? 'contentText.Disabled' : legendDimmed ? 'contentText.Subtext' : 'commonColor.Black',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        flex: '1 1 0%',
        transition: 'color 0.15s ease-in-out',
      }}
    >
      {label}
    </Typography>
  )

  if (!isEllipsis) return typography
  return <NextGenMIFollowCursorTooltip title={label}>{typography}</NextGenMIFollowCursorTooltip>
}

interface ScenarioSummaryChartProps {
  priceForecast: IScenarioPriceForecast
  suppressChartHeader?: boolean
  headerStart?: ReactNode
  headerEnd?: ReactNode
  showHeaderLegend?: boolean
  hideLegend?: boolean
  linkedHighlightIndexName?: string | null
  linkedHighlightVisibilityKey?: string | null
  chartColorMap?: Map<string, string>
  emptyMessage?: string
  modelExecutionGenerating?: boolean
  disableIntroAnimation?: boolean
}

const ScenarioSummaryChart = ({
  priceForecast,
  suppressChartHeader = false,
  headerStart,
  headerEnd,
  showHeaderLegend = false,
  hideLegend = false,
  linkedHighlightIndexName = null,
  linkedHighlightVisibilityKey = null,
  chartColorMap: chartColorMapProp,
  emptyMessage = 'MI 수급 모델 실행 후 차트가 생성됩니다.',
  modelExecutionGenerating = false,
  disableIntroAnimation = false,
}: ScenarioSummaryChartProps) => {
  const [chartVisibilityMap, setChartVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredChartKey, setHoveredChartKey] = useState<string | null>(null)

  useEffect(() => {
    setChartVisibilityMap(new Map())
    setHoveredChartKey(null)
  }, [priceForecast.series])

  const maxValueCount = useMemo(
    () => priceForecast.series.reduce((max, series) => Math.max(max, series.values.length), 0),
    [priceForecast.series],
  )

  const timestamps = useMemo(() => buildTimestamps(priceForecast.dates, maxValueCount), [priceForecast.dates, maxValueCount])

  const resultDates = useMemo(() => timestamps.map((timestamp) => dayjs(timestamp).format('YYYY')), [timestamps])

  const charts = useMemo<ScenarioSummaryForecastChartData[]>(
    () =>
      priceForecast.series.map((series, index) => {
        const visibilityKey =
          typeof series.scenarioId === 'number' ? scenarioForecastVisibilityKey(series.scenarioId) : `${series.indexName}_FORECAST`
        return {
          goodsDataSourceName: series.indexName,
          goodsDataSourceNo: index + 1,
          chartType: ChartType.LINE,
          timestamps,
          resultDates,
          startDates: timestamps.map((timestamp) => dayjs(timestamp).format('YYYYMMDD')),
          visibilityKey,
          series: [
            {
              seriesId: 'main',
              label: series.indexName,
              renderAs: 'MAIN',
              values: series.values,
              isVisible: true,
            },
          ],
          unitCd: priceForecast.unit,
          goodsDataName: series.indexName,
          dataType: 'FORECAST',
        }
      }),
    [priceForecast.series, priceForecast.unit, resultDates, timestamps],
  )

  const legendSwatchFallbackColors = useMemo(() => buildDistinctSeriesColors(SCENARIO_CHART_COLORS, charts.length), [charts.length])

  const chartColorMap = useMemo(() => {
    if (chartColorMapProp) return chartColorMapProp
    const distinct = buildDistinctSeriesColors(SCENARIO_CHART_COLORS, priceForecast.series.length)
    const colorMap = new Map<string, string>()
    priceForecast.series.forEach((series, index) => {
      colorMap.set(series.indexName, distinct[index] ?? SCENARIO_CHART_COLORS[0])
    })
    return colorMap
  }, [chartColorMapProp, priceForecast.series])

  const resolvedLinkedHighlightKey = useMemo(() => {
    const direct = linkedHighlightVisibilityKey?.trim()
    if (direct) return direct
    const raw = linkedHighlightIndexName?.trim()
    if (!raw) return null
    const needle = raw.toUpperCase()
    const match = charts.find((c) => (c.goodsDataSourceName ?? '').toUpperCase() === needle)
    if (!match) return null
    return match.visibilityKey ?? `${match.goodsDataSourceName}_FORECAST`
  }, [charts, linkedHighlightIndexName, linkedHighlightVisibilityKey])

  const highlightVisibilityKey = hoveredChartKey ?? resolvedLinkedHighlightKey

  const handleLegendToggle = useCallback((visibilityKey: string) => {
    setChartVisibilityMap((prev) => {
      const next = new Map(prev)
      next.set(visibilityKey, prev.get(visibilityKey) === false)
      return next
    })
  }, [])

  const chartUnit = useMemo(() => buildChartUnit(priceForecast), [priceForecast])
  const hasChartData = charts.length > 0 && maxValueCount > 0
  const showGeneratingState = modelExecutionGenerating
  const emptyChartHoverSx = !hasChartData && !showGeneratingState ? EMPTY_CHART_HOVER_SX : {}

  const renderLegendItem = (chart: ScenarioSummaryForecastChartData, index: number, placement: 'header' | 'bottom') => {
    const visibilityKey = chart.visibilityKey ?? `${chart.goodsDataSourceName}_FORECAST`
    const isShow = chartVisibilityMap.get(visibilityKey) !== false
    const color = chartColorMap.get(chart.goodsDataSourceName) ?? legendSwatchFallbackColors[index] ?? SCENARIO_CHART_COLORS[0]
    const isHighlighted = highlightVisibilityKey === visibilityKey
    const hasActiveHighlight = highlightVisibilityKey !== null && highlightVisibilityKey !== undefined
    const legendDimmed = hasActiveHighlight && isShow && !isHighlighted
    const isHeader = placement === 'header'

    return (
      <Stack
        key={`${placement}-${visibilityKey}`}
        direction="row"
        alignItems="center"
        gap={isHeader ? '6px' : '8px'}
        minWidth={0}
        px={isHeader ? '4px' : '10px'}
        py={isHeader ? '2px' : '4px'}
        onMouseEnter={() => setHoveredChartKey(isShow ? visibilityKey : null)}
        onMouseLeave={() => setHoveredChartKey(null)}
        onClick={() => handleLegendToggle(visibilityKey)}
        sx={{
          cursor: 'pointer',
          borderRadius: isHeader ? '4px' : '8px',
          boxSizing: 'border-box',
          transition: 'background-color 0.15s ease, opacity 0.2s ease-in-out',
          opacity: !isShow ? 0.35 : legendDimmed ? 0.45 : 1,
          ...(isShow && {
            ...(isHighlighted ? { bgcolor: 'gray.10' } : {}),
            '&:hover': {
              bgcolor: 'gray.10',
              '& .legend-label': {
                color: 'contentText.Normal',
              },
            },
          }),
        }}
      >
        <Box
          sx={{
            width: 18,
            height: isHighlighted ? 5 : 4,
            borderRadius: '100px',
            bgcolor: color,
            flexShrink: 0,
            opacity: legendDimmed ? 0.5 : 1,
            transition: 'height 0.15s ease-in-out, opacity 0.2s ease-in-out',
          }}
        />
        <LegendEllipsisLabel label={chart.goodsDataSourceName} isShow={isShow} isHighlighted={isHighlighted} legendDimmed={legendDimmed} />
      </Stack>
    )
  }

  return (
    <Stack width="100%" minWidth={0} gap="8px">
      {hasChartData && !showGeneratingState && !suppressChartHeader && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="8px" width="100%" minWidth={0}>
          <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
            {headerStart ?? (
              <Typography variant="body2SB14" color="contentText.Normal" sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
                {chartUnit}
              </Typography>
            )}
          </Box>

          {showHeaderLegend ? (
            <Box sx={{ flex: '0 1 auto', minWidth: 0, maxWidth: '100%' }}>
              <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="18px" flexWrap="wrap" minWidth={0}>
                {charts.map((chart, index) => renderLegendItem(chart, index, 'header'))}
              </Stack>
            </Box>
          ) : null}

          {headerEnd ? <Box sx={{ flex: '0 0 auto', maxWidth: '100%' }}>{headerEnd}</Box> : null}
        </Stack>
      )}

      <Box
        borderRadius="10px"
        width="100%"
        height={CHART_HEIGHT}
        sx={[
          {
            bgcolor: hasChartData && !showGeneratingState ? 'commonColor.White' : 'gray.5',
            transition: 'background-color 0.2s ease-in-out',
          },
          emptyChartHoverSx,
        ]}
      >
        {showGeneratingState ? (
          <ScenarioModelExecutionGeneratingState />
        ) : hasChartData ? (
          <ScenarioSummaryChartGraph
            height={CHART_HEIGHT}
            charts={charts}
            chartVisibilityMap={chartVisibilityMap}
            hoveredChartKey={highlightVisibilityKey}
            chartColorMap={chartColorMap}
            spanGaps
            disableIntroAnimation={disableIntroAnimation}
          />
        ) : (
          <Stack height="100%" alignItems="center" justifyContent="center" gap="10px" sx={{ userSelect: 'none' }}>
            <ErrorOutlineOutlinedIcon sx={{ fontSize: 24, color: 'gray.60' }} aria-hidden />
            <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
              {emptyMessage}
            </Typography>
          </Stack>
        )}
      </Box>

      {hasChartData && !showGeneratingState && !hideLegend && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '0 8px',
            width: '100%',
            boxSizing: 'border-box',
            pl: '24px',
            pr: '12px',
          }}
        >
          {charts.map((chart, index) => renderLegendItem(chart, index, 'bottom'))}
        </Box>
      )}
    </Stack>
  )
}

export default ScenarioSummaryChart
