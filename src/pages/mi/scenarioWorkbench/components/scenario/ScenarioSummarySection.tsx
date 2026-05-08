import EastIcon from '@mui/icons-material/East'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { Palette, useTheme } from '@mui/material/styles'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LegendItem,
  LinearScale,
  LineElement,
  PointElement,
  Plugin,
  Title,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { IScenarioIndexOutlook, IScenarioPriceFlowStep, IScenarioSummary } from '@/service/mi/scenarioWorkbench/scenario'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

const LEADING_PAD = 2
const TRAILING_PAD = 2
const X_AXIS_OVERSHOOT = 100
const Y_AXIS_OVERSHOOT = 12
const LEGEND_LABEL_GAP_SPACES = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'

type ChartColorToken = keyof Palette['chart']

// 지수명별 차트 색상 토큰 — JKM/TTF/HH 외 지수명이 들어와도 fallback 색상으로 처리
const CHART_COLOR_TOKEN_BY_INDEX: Record<string, ChartColorToken> = {
  JKM: 'blue1',
  TTF: 'teal2',
  HH: 'amber3',
}

const FALLBACK_CHART_COLOR_TOKEN: ChartColorToken = 'purple3'

const extractYear = (dateLabel: string): string => dateLabel.slice(0, 4)

const formatPriceFlowStep = (step: IScenarioPriceFlowStep, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency ? `${currency} ` : ''
  if (step.from === step.to) return `${symbol}${step.from}`
  return `${symbol}${step.from}~${step.to}`
}

const PriceFlowChain = ({ steps, currency }: { steps: IScenarioPriceFlowStep[]; currency: string }) => (
  <Stack direction="row" alignItems="center" gap="4px" justifyContent="center">
    {steps.map((step, i) => (
      <Stack key={i} direction="row" alignItems="center" gap="4px">
        <Box sx={{ bgcolor: 'commonColor.White', borderRadius: '8px', px: '8px', py: '4px' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>
            {formatPriceFlowStep(step, currency)}
          </Typography>
        </Box>
        {i < steps.length - 1 && <EastIcon sx={{ fontSize: 14, color: 'contentText.Normal' }} />}
      </Stack>
    ))}
  </Stack>
)

const buildImpactColumns = (currency: string): GridColDef<IScenarioIndexOutlook>[] => [
  {
    field: 'indexName',
    headerName: '대상',
    flex: 1,
    minWidth: 100,
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: 'contentText.Black', lineHeight: 1.4 }}>{params.row.indexName}</Typography>
    ),
  },
  {
    field: 'impactLevel',
    headerName: '시장영향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => <ImpactDotsCell level={params.row.marketImpactLevel} />,
  },
  {
    field: 'direction',
    headerName: '가격방향',
    width: 90,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
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
    renderCell: (params: GridRenderCellParams<IScenarioIndexOutlook>) => (
      <PriceFlowChain steps={params.row.priceFlow} currency={currency} />
    ),
  },
]

const ImpactTable = ({ rows, currency }: { rows: IScenarioIndexOutlook[]; currency: string }) => {
  const columns = useMemo(() => buildImpactColumns(currency), [currency])
  return (
    <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '12px' }}>
      <ScenarioWorkbenchTableHeader<IScenarioIndexOutlook> columns={columns} />
      <ScenarioWorkbenchDataList<IScenarioIndexOutlook> rowId="indexName" columns={columns} rows={rows} rowHeight={48} hideLastRowBorder />
    </Box>
  )
}

const ForecastCardItem = ({ outlook }: { outlook: IScenarioIndexOutlook }) => (
  <Box sx={{ bgcolor: 'gray.5', borderRadius: '10px', p: '20px' }}>
    <Stack gap="6px">
      <Typography variant="body1M16" sx={{ color: 'contentText.Black' }}>
        {outlook.trendText}
      </Typography>
    </Stack>
  </Box>
)

const ScenarioSummaryEmpty = () => (
  <Box
    sx={{
      bgcolor: 'gray.5',
      height: 387,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Stack alignItems="center" gap="10px">
      <ErrorOutlineIcon />
      <Typography variant="body3SB12" sx={{ color: 'gray.60' }}>
        MI 수급 모델 실행 후 차트가 생성됩니다.
      </Typography>
    </Stack>
  </Box>
)

interface ScenarioSummarySectionProps {
  summary?: IScenarioSummary
  loading?: boolean
}

const ScenarioSummarySection = ({ summary, loading = false }: ScenarioSummarySectionProps) => {
  const theme = useTheme()
  const indexOutlooks = summary?.indexOutlooks ?? []
  const priceForecast = summary?.priceForecast ?? { currency: '', unit: '', dates: [], series: [] }
  const chartUnit = priceForecast.currency && priceForecast.unit ? `Unit: ${priceForecast.currency}/${priceForecast.unit}` : ''

  // 한 월에 들어가는 데이터 포인트(주) 수 — series 길이 / 월 수
  const weeksPerMonth = useMemo(() => {
    if (priceForecast.dates.length === 0) return 0
    const firstSeries = priceForecast.series[0]
    if (!firstSeries) return 0
    return Math.floor(firstSeries.values.length / priceForecast.dates.length)
  }, [priceForecast.dates.length, priceForecast.series])

  const { chartLabels, paddedSeries, realLabels } = useMemo(() => {
    const real = priceForecast.dates.flatMap((m) => {
      const slots: string[] = [m]
      for (let i = 1; i < weeksPerMonth; i += 1) slots.push('')
      return slots
    })
    const labels = [...Array(LEADING_PAD).fill(''), ...real, ...Array(TRAILING_PAD).fill('')]
    const padded = priceForecast.series.map((s) => ({
      indexName: s.indexName,
      values: [...Array(LEADING_PAD).fill(null), ...s.values, ...Array(TRAILING_PAD).fill(null)] as (number | null)[],
    }))
    return { chartLabels: labels, paddedSeries: padded, realLabels: real }
  }, [priceForecast.dates, priceForecast.series, weeksPerMonth])

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

        // 월 경계선 대신 주 단위 보조선을 그려 세로 가이드를 촘촘하게 표시
        realLabels.forEach((_, i) => {
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
      datasets: paddedSeries.map((s) => {
        const colorToken = CHART_COLOR_TOKEN_BY_INDEX[s.indexName.toUpperCase()] ?? FALLBACK_CHART_COLOR_TOKEN
        const color = theme.palette.chart[colorToken]
        return {
          label: s.indexName,
          data: s.values,
          borderColor: color,
          backgroundColor: color,
          fill: false,
          tension: 0,
          pointRadius: 0,
          borderWidth: 1.5,
        }
      }),
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
            padding: 20,
            font: { size: 13 },
            color: theme.palette.contentText.Normal,
            usePointStyle: false,
            generateLabels(chart: ChartJS<'line'>) {
              const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart)
              const lastIndex = labels.length - 1
              return labels.map((item: LegendItem, index: number) => ({
                ...item,
                text: index < lastIndex ? `${item.text}${LEGEND_LABEL_GAP_SPACES}` : item.text,
              }))
            },
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: { title: () => '' },
        },
        title: {
          display: Boolean(chartUnit),
          text: chartUnit,
          align: 'start' as const,
          color: theme.palette.contentText.Normal,
          font: { size: 14, weight: 500 },
          padding: { top: 12, bottom: 40 },
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
              if (weeksPerMonth <= 0) return ''
              const adjusted = index - LEADING_PAD
              if (adjusted < 0 || adjusted >= realLabels.length) return ''
              if (adjusted % weeksPerMonth !== 0) return ''

              const monthIndex = adjusted / weeksPerMonth
              const currentDate = priceForecast.dates[monthIndex]
              if (!currentDate) return ''

              const currentYear = extractYear(currentDate)
              const prevDate = priceForecast.dates[monthIndex - 1]
              const prevYear = prevDate ? extractYear(prevDate) : ''

              return currentYear !== prevYear ? currentYear : ''
            },
          },
          border: { display: false },
        },
        y: {
          min: 0,
          max: 50,
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
    [priceForecast.dates, chartUnit, realLabels.length, theme, weeksPerMonth],
  )

  if (loading) {
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
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px' }} />
        </Stack>
        <Box flex="1" minWidth={0}>
          <Skeleton variant="rounded" height={590} sx={{ borderRadius: '10px' }} />
        </Box>
      </Stack>
    )
  }

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
        <ImpactTable rows={indexOutlooks} currency={priceForecast.currency} />
        {indexOutlooks.map((outlook) => (
          <ForecastCardItem key={outlook.indexName} outlook={outlook} />
        ))}
      </Stack>

      <Box flex="1" minWidth={0}>
        {priceForecast.series.length > 0 ? (
          <Box height="590px">
            <Line data={chartData} options={chartOptions} plugins={[chartDecorPlugin]} />
          </Box>
        ) : (
          <ScenarioSummaryEmpty />
        )}
      </Box>
    </Stack>
  )
}

export default ScenarioSummarySection
