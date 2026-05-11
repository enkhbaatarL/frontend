import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { IScenarioPriceForecast } from '@/service/mi/scenarioWorkbench/scenario'
import type { ChartData } from '@/types/dataDetailChart'

import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ScenarioSummaryChartGraph from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChartGraph'
import { ChartType } from '@/types/dataDetailChart'

const CHART_HEIGHT = 480
const DEFAULT_TARGETS = ['JKM', 'TTF', 'HH']
const SCENARIO_CHART_COLORS = ['#185FA5', '#0F8A72', '#E09A3A', '#C4407A', '#A32D2D', '#2B8EA6', '#7B52B8', '#B8960C', '#3D7D3F', '#6B6A65']

type ScenarioSummaryForecastChartData = ChartData & {
  dataType: 'FORECAST'
  resultDates: string[]
  startDates: string[]
}

const normalizeMonthDate = (dateLabel: string, fallbackMonthIndex: number): dayjs.Dayjs => {
  const value = dateLabel.trim()
  const compactMatch = value.match(/^(\d{4})(\d{2})$/)
  if (compactMatch) return dayjs(`${compactMatch[1]}-${compactMatch[2]}-01`)

  const separatedMatch = value.match(/^(\d{4})[./-](\d{1,2})/)
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

const buildTabLabels = (priceForecast: IScenarioPriceForecast): string[] => {
  const seriesNames = new Set(priceForecast.series.map((series) => series.indexName.toUpperCase()))
  const matchedDefaults = DEFAULT_TARGETS.filter((target) => seriesNames.has(target))
  if (matchedDefaults.length > 0) return matchedDefaults
  return priceForecast.series.slice(0, 3).map((series) => series.indexName)
}

interface ScenarioSummaryChartProps {
  priceForecast: IScenarioPriceForecast
  emptyMessage?: string
}

const ScenarioSummaryChart = ({ priceForecast, emptyMessage = 'MI 수급 모델 실행 후 차트가 생성됩니다.' }: ScenarioSummaryChartProps) => {
  const tabLabels = useMemo(() => buildTabLabels(priceForecast), [priceForecast])
  const [selectedTarget, setSelectedTarget] = useState<string>(tabLabels[0] ?? '')
  const [chartVisibilityMap, setChartVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredChartKey, setHoveredChartKey] = useState<string | null>(null)

  useEffect(() => {
    if (tabLabels.length === 0) {
      setSelectedTarget('')
      return
    }
    setSelectedTarget((prev) => (tabLabels.includes(prev) ? prev : tabLabels[0]))
  }, [tabLabels])

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
      priceForecast.series.map((series, index) => ({
        goodsDataSourceName: series.indexName,
        goodsDataSourceNo: index + 1,
        chartType: ChartType.LINE,
        timestamps,
        resultDates,
        startDates: timestamps.map((timestamp) => dayjs(timestamp).format('YYYYMMDD')),
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
      })),
    [priceForecast.series, priceForecast.unit, resultDates, timestamps],
  )

  const chartColorMap = useMemo(() => {
    const colorMap = new Map<string, string>()
    priceForecast.series.forEach((series, index) => {
      colorMap.set(series.indexName, SCENARIO_CHART_COLORS[index % SCENARIO_CHART_COLORS.length])
    })
    return colorMap
  }, [priceForecast.series])

  const handleLegendToggle = useCallback((label: string) => {
    const key = `${label}_FORECAST`
    setChartVisibilityMap((prev) => {
      const next = new Map(prev)
      next.set(key, prev.get(key) === false)
      return next
    })
  }, [])

  const chartUnit = useMemo(() => buildChartUnit(priceForecast), [priceForecast])
  const hasChartData = charts.length > 0 && maxValueCount > 0

  const targetSegmentOptions = useMemo(() => tabLabels.map((label) => ({ value: label, label })), [tabLabels])

  return (
    <Stack width="100%" minWidth={0} gap="8px" py="12px">
      <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" minWidth={0}>
        <Typography variant="body2SB14" color="contentText.Normal" sx={{ fontVariantNumeric: 'lining-nums tabular-nums' }}>
          {chartUnit}
        </Typography>

        {targetSegmentOptions.length > 0 && (
          <MISlidingSegmented
            options={targetSegmentOptions}
            value={selectedTarget}
            onChange={setSelectedTarget}
            sx={{ flexShrink: 0, '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
          />
        )}
      </Stack>

      <Box bgcolor="commonColor.White" borderRadius="10px" width="100%" height={CHART_HEIGHT}>
        {hasChartData ? (
          <ScenarioSummaryChartGraph
            height={CHART_HEIGHT}
            charts={charts}
            targetLabel={selectedTarget}
            chartVisibilityMap={chartVisibilityMap}
            hoveredChartKey={hoveredChartKey}
            chartColorMap={chartColorMap}
            spanGaps
          />
        ) : (
          <Stack height="100%" alignItems="center" justifyContent="center" sx={{ userSelect: 'none' }}>
            <Typography variant="body2SB14" color="gray.50">
              {emptyMessage}
            </Typography>
          </Stack>
        )}
      </Box>

      {hasChartData && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '0 8px',
            width: '100%',
          }}
        >
          {charts.map((chart, index) => {
            const visibilityKey = `${chart.goodsDataSourceName}_FORECAST`
            const isShow = chartVisibilityMap.get(visibilityKey) !== false
            const color = chartColorMap.get(chart.goodsDataSourceName) ?? SCENARIO_CHART_COLORS[index % SCENARIO_CHART_COLORS.length]

            return (
              <Stack
                key={chart.goodsDataSourceName}
                direction="row"
                alignItems="center"
                gap="8px"
                minWidth={0}
                px="10px"
                py="4px"
                onMouseEnter={() => setHoveredChartKey(isShow ? visibilityKey : null)}
                onMouseLeave={() => setHoveredChartKey(null)}
                onClick={() => handleLegendToggle(chart.goodsDataSourceName)}
                sx={{
                  cursor: 'pointer',
                  opacity: isShow ? 1 : 0.35,
                  transition: 'opacity 0.2s ease-in-out',
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 4,
                    borderRadius: '100px',
                    bgcolor: color,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body3M12"
                  sx={{
                    color: isShow ? 'commonColor.Black' : 'contentText.Disabled',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {chart.goodsDataSourceName}
                </Typography>
              </Stack>
            )
          })}
        </Box>
      )}
    </Stack>
  )
}

export default ScenarioSummaryChart
