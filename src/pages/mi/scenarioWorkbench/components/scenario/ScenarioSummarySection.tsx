import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Plugin, Title, Tooltip } from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'

import { ScenarioSummaryData } from './types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

// 양 끝에 dummy slot 을 둬서 첫/마지막 데이터 포인트가 축 경계에서 한 칸 떨어지게 함
const LEADING_PAD = 4
const TRAILING_PAD = 2
const X_AXIS_OVERSHOOT = 100
const Y_AXIS_OVERSHOOT = 12

interface PriceStepChipProps {
  label: string
}

const PriceStepChip = ({ label }: PriceStepChipProps) => (
  <Box sx={{ bgcolor: 'commonColor.White', borderRadius: '10px', px: '8px', py: '4px' }}>
    <Typography variant="titleBox" sx={{ color: 'gray.80', letterSpacing: '-0.2px' }}>
      {label}
    </Typography>
  </Box>
)

interface ScenarioSummarySectionProps {
  data: ScenarioSummaryData
}

const ScenarioSummarySection = ({ data }: ScenarioSummarySectionProps) => {
  const theme = useTheme()
  const { priceFlowTitle, priceSteps, flowDescription, forecastTitle, forecastBody, chartUnit, chart } = data

  const weeksPerMonth = useMemo(() => {
    if (chart.months.length === 0) return 0
    return Math.floor(chart.weeklyValues.length / chart.months.length)
  }, [chart.months.length, chart.weeklyValues.length])

  const { chartLabels, chartValues, realLabels } = useMemo(() => {
    const real = chart.months.flatMap((m) => {
      const slots: string[] = [m]
      for (let i = 1; i < weeksPerMonth; i += 1) slots.push('')
      return slots
    })
    const labels = [...Array(LEADING_PAD).fill(''), ...real, ...Array(TRAILING_PAD).fill('')]
    const values: (number | null)[] = [...Array(LEADING_PAD).fill(null), ...chart.weeklyValues, ...Array(TRAILING_PAD).fill(null)]
    return { chartLabels: labels, chartValues: values, realLabels: real }
  }, [chart.months, chart.weeklyValues, weeksPerMonth])

  // 점선 그리드 + 돌출된 축 실선을 직접 그리는 plugin
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

        chart.months.forEach((_, i) => {
          const x = Math.round(xScale.getPixelForValue(i * weeksPerMonth + LEADING_PAD)) + 0.5
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
    [chart.months, weeksPerMonth, theme],
  )

  const chartData = useMemo(
    () => ({
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          borderColor: theme.palette.primary.main,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          pointRadius: 0,
          borderWidth: 1.5,
        },
      ],
    }),
    [chartLabels, chartValues, theme.palette.primary.main],
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            title: () => '',
          },
        },
        title: {
          display: true,
          text: chartUnit,
          align: 'start' as const,
          color: theme.palette.contentText.Normal,
          font: {
            size: 14,
            weight: 500,
          },
          padding: { top: 0, bottom: 40 },
        },
      },
      layout: {
        padding: 0,
      },
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
            padding: 8,
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
          max: 45,
          grid: { display: false, drawOnChartArea: false, drawTicks: false },
          ticks: {
            stepSize: 5,
            font: { size: 13 },
            color: theme.palette.contentText.Normal,
            padding: 36,
            callback: (value: number | string) => {
              const n = Number(value)
              if (n <= 0) return ''
              return n.toFixed(1)
            },
          },
          border: { display: false },
        },
      },
    }),
    [chart.months, chartUnit, realLabels.length, theme.palette.contentText.Normal, weeksPerMonth],
  )

  return (
    <Stack direction="row" gap="38px" px="12px" py="12px" alignItems="flex-start">
      <Stack flex="0 0 50%" minWidth={0} gap="38px" py="30px" sx={{ borderTop: 1, borderColor: 'primary.main' }}>
        <Stack gap="10px">
          <Typography variant="body1SB16" sx={{ color: 'contentText.Normal' }}>
            {priceFlowTitle}
          </Typography>

          <Stack>
            <Stack
              direction="row"
              alignItems="center"
              gap="4px"
              mb="10px"
              flexWrap="wrap"
              sx={{ bgcolor: 'gray.10', borderRadius: '10px', p: '8px', width: 'fit-content' }}
            >
              {priceSteps.map((step, index) => (
                <Stack key={`${step.label}-${index}`} direction="row" alignItems="center" gap="4px">
                  <PriceStepChip label={step.label} />
                  {index < priceSteps.length - 1 && <ArrowForwardIcon sx={{ fontSize: '20px', color: 'contentText.Normal' }} />}
                </Stack>
              ))}
            </Stack>

            <Typography variant="body2M14" sx={{ color: 'contentText.Normal', lineHeight: 1.6 }}>
              {flowDescription}
            </Typography>
          </Stack>
        </Stack>

        <Stack gap="10px">
          <Typography variant="body1SB16" sx={{ color: 'contentText.Normal' }}>
            {forecastTitle}
          </Typography>
          <Typography variant="subtext0" sx={{ color: 'contentText.Black', fontWeight: 500 }}>
            {forecastBody}
          </Typography>
        </Stack>
      </Stack>

      <Box flex="1" minWidth={0} pt="24px" sx={{ borderTop: 1, borderColor: 'primary.main' }}>
        <Stack py="12px">
          <Box height="390px">
            <Line data={chartData} options={chartOptions} plugins={[chartDecorPlugin]} />
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}

export default ScenarioSummarySection
