import EastIcon from '@mui/icons-material/East'
import { Box, Stack, Typography } from '@mui/material'
import { Palette, useTheme } from '@mui/material/styles'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Plugin, Title, Tooltip } from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import {
  ScenarioForecastCard,
  ScenarioImpactRow,
  ScenarioImpactTarget,
  ScenarioSummaryData,
} from '@/pages/mi/scenarioWorkbench/components/scenario/types'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

const LEADING_PAD = 4
const TRAILING_PAD = 2
const X_AXIS_OVERSHOOT = 100
const Y_AXIS_OVERSHOOT = 12

const SERIES_COLOR_TOKENS: Record<ScenarioImpactTarget, keyof Palette['chart']> = {
  JKM: 'blue1',
  TTF: 'teal2',
  HH: 'amber3',
}

const SERIES_LABEL: Record<ScenarioImpactTarget, string> = {
  JKM: 'JKM',
  TTF: 'TTF',
  HH: 'HH',
}

const PriceFlowChain = ({ steps }: { steps: string[] }) => (
  <Stack direction="row" alignItems="center" gap="4px" justifyContent="center">
    {steps.map((step, i) => (
      <Stack key={`${step}-${i}`} direction="row" alignItems="center" gap="4px">
        <Box sx={{ bgcolor: 'commonColor.White', borderRadius: '8px', px: '8px', py: '4px' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>{step}</Typography>
        </Box>
        {i < steps.length - 1 && <EastIcon sx={{ fontSize: 14, color: 'contentText.Normal' }} />}
      </Stack>
    ))}
  </Stack>
)

const impactColumns: GridColDef<ScenarioImpactRow>[] = [
  {
    field: 'label',
    headerName: '대상',
    flex: 1,
    minWidth: 100,
    sortable: false,
    renderCell: (params: GridRenderCellParams<ScenarioImpactRow>) => (
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>{params.row.label}</Typography>
    ),
  },
  {
    field: 'marketImpact',
    headerName: '시장영향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<ScenarioImpactRow>) => <ImpactDotsCell level={params.row.marketImpact as 0 | 1 | 2 | 3} />,
  },
  {
    field: 'direction',
    headerName: '가격방향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<ScenarioImpactRow>) => (
      <Stack alignItems="center" justifyContent="center" width="100%" height="100%">
        <PriceDirectionIcon direction={params.row.direction} />
      </Stack>
    ),
  },
  {
    field: 'priceFlow',
    headerName: '가격 흐름',
    width: 232,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<ScenarioImpactRow>) => <PriceFlowChain steps={params.row.priceFlow} />,
  },
]

const ImpactTable = ({ rows }: { rows: ScenarioImpactRow[] }) => (
  <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '12px' }}>
    <ScenarioWorkbenchTableHeader<ScenarioImpactRow> columns={impactColumns} />
    <ScenarioWorkbenchDataList<ScenarioImpactRow> rowId="target" columns={impactColumns} rows={rows} rowHeight={48} hideLastRowBorder />
  </Box>
)

const ForecastCardItem = ({ card }: { card: ScenarioForecastCard }) => (
  <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '20px' }}>
    <Stack gap="6px">
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'contentText.Normal', lineHeight: 1.4 }}>{card.title}</Typography>
      <Stack gap="2px">
        <Typography sx={{ fontSize: 16, fontWeight: 500, color: 'contentText.Black', lineHeight: 1.6 }}>{card.body}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'contentText.Normal', lineHeight: 1.4 }}>{card.summary}</Typography>
      </Stack>
    </Stack>
  </Box>
)

interface ScenarioSummarySectionProps {
  data: ScenarioSummaryData
}

const ScenarioSummarySection = ({ data }: ScenarioSummarySectionProps) => {
  const theme = useTheme()
  const { impactRows, forecasts, chartUnit, chart } = data

  const weeksPerMonth = useMemo(() => {
    if (chart.months.length === 0) return 0
    const firstSeries = chart.series[0]
    if (!firstSeries) return 0
    return Math.floor(firstSeries.values.length / chart.months.length)
  }, [chart.months.length, chart.series])

  const { chartLabels, paddedSeries, realLabels } = useMemo(() => {
    const real = chart.months.flatMap((m) => {
      const slots: string[] = [m]
      for (let i = 1; i < weeksPerMonth; i += 1) slots.push('')
      return slots
    })
    const labels = [...Array(LEADING_PAD).fill(''), ...real, ...Array(TRAILING_PAD).fill('')]
    const padded = chart.series.map((s) => ({
      target: s.target,
      values: [...Array(LEADING_PAD).fill(null), ...s.values, ...Array(TRAILING_PAD).fill(null)] as (number | null)[],
    }))
    return { chartLabels: labels, paddedSeries: padded, realLabels: real }
  }, [chart.months, chart.series, weeksPerMonth])

  const chartDecorPlugin: Plugin<'line'> = useMemo(
    () => ({
      id: 'scenarioSummaryChartDecor',
      beforeDatasetsDraw(c) {
        const { ctx, chartArea, scales } = c
        if (!chartArea) return
        const { top, bottom, left, right } = chartArea
        const xScale = scales.x
        const yScale = scales.y
        if (!xScale || !yScale) return

        ctx.save()
        ctx.strokeStyle = theme.palette.gray[30]
        ctx.lineWidth = 1
        ctx.setLineDash([1.5, 1.5])

        yScale.ticks.forEach((tick) => {
          if (tick.value <= 0) return
          const y = Math.round(yScale.getPixelForValue(tick.value)) + 0.5
          if (Math.abs(y - bottom) < 1) return
          ctx.beginPath()
          ctx.moveTo(left - 16, y)
          ctx.lineTo(right, y)
          ctx.stroke()
        })

        // 월 경계선 대신 주 단위 보조선을 그려 점선을 더 촘촘하게 표시
        realLabels.forEach((_, i) => {
          if (i % 2 !== 0) return

          const x = Math.round(xScale.getPixelForValue(i + LEADING_PAD)) + 0.5
          if (Math.abs(x - left) < 1) return
          ctx.beginPath()
          ctx.moveTo(x, top)
          ctx.lineTo(x, bottom)
          ctx.stroke()
        })

        ctx.restore()

        ctx.save()
        ctx.strokeStyle = theme.palette.gray[80]
        ctx.lineWidth = 1
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.moveTo(left + 0.5, top - Y_AXIS_OVERSHOOT)
        ctx.lineTo(left + 0.5, bottom)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(left - X_AXIS_OVERSHOOT, bottom + 0.5)
        ctx.lineTo(right, bottom + 0.5)
        ctx.stroke()

        ctx.restore()
      },
    }),
    [realLabels, theme],
  )

  const chartData = useMemo(
    () => ({
      labels: chartLabels,
      datasets: paddedSeries.map((s) => ({
        label: SERIES_LABEL[s.target],
        data: s.values,
        borderColor: theme.palette.chart[SERIES_COLOR_TOKENS[s.target]],
        backgroundColor: theme.palette.chart[SERIES_COLOR_TOKENS[s.target]],
        fill: false,
        tension: 0,
        pointRadius: 0,
        borderWidth: 1.5,
      })),
    }),
    [chartLabels, paddedSeries, theme],
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          align: 'start' as const,
          labels: {
            boxWidth: 16,
            boxHeight: 2,
            // 범례 항목 간 가로 간격 유지
            padding: 40,
            font: { size: 13 },
            color: theme.palette.contentText.Normal,
            usePointStyle: false,
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: { title: () => '' },
        },
        title: {
          display: true,
          text: chartUnit,
          align: 'start' as const,
          color: theme.palette.contentText.Normal,
          font: { size: 14, weight: 500 },
          padding: { top: 0, bottom: 40 },
        },
      },
      layout: { padding: 0 },
      scales: {
        x: {
          offset: false,
          grid: { display: false, drawOnChartArea: false, drawTicks: false },
          ticks: {
            font: { size: 13 },
            color: theme.palette.contentText.Normal,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 4,
            callback(this: unknown, _value: number | string, index: number) {
              const adjusted = index - LEADING_PAD
              if (adjusted < 0 || adjusted >= realLabels.length) return ''
              return adjusted % weeksPerMonth === 0 ? chart.months[adjusted / weeksPerMonth] : ''
            },
          },
          border: { display: false },
        },
        y: {
          min: -2,
          max: 55,
          grid: { display: false, drawOnChartArea: false, drawTicks: false },
          ticks: {
            stepSize: 5,
            font: { size: 13 },
            color: theme.palette.contentText.Normal,
            padding: 36,
            callback: (value: number | string) => {
              const n = Number(value)
              if (n <= 0) return ''
              return String(n)
            },
          },
          border: { display: false },
        },
      },
    }),
    [chart.months, chartUnit, realLabels.length, theme, weeksPerMonth],
  )

  return (
    <Stack
      direction="row"
      gap="38px"
      px="12px"
      py="12px"
      alignItems="flex-start"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
      }}
    >
      <Stack flex="1" minWidth={0} gap="12px">
        <ImpactTable rows={impactRows} />
        {forecasts.map((card) => (
          <ForecastCardItem key={card.target} card={card} />
        ))}
      </Stack>

      <Box flex="1" minWidth={0} pt="24px">
        <Box height="590px">
          <Line data={chartData} options={chartOptions} plugins={[chartDecorPlugin]} />
        </Box>
      </Box>
    </Stack>
  )
}

export default ScenarioSummarySection
