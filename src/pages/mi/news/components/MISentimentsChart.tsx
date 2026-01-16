import { Box, Divider, Fade, Stack, Typography } from '@mui/material'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Plugin, ScriptableContext } from 'chart.js'
import dayjs from 'dayjs'
import { useMemo, useRef, useState, useEffect } from 'react'
import { Chart } from 'react-chartjs-2'

import { SentimentData } from '@/service/mi/marketNews'

ChartJS.register(CategoryScale, LinearScale, BarElement)

const SENTIMENT_COLORS = {
  upward: {
    start: '#3386C2',
    end: '#1366A2',
  },
  neutral: {
    start: '#BFBFBF',
    end: '#969696',
  },
  downward: {
    start: '#A02A74',
    end: '#71134E',
  },
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const createGradient = (
  ctx: CanvasRenderingContext2D,
  area: { top: number; bottom: number },
  colors: { start: string; end: string },
  opacity: number = 1,
) => {
  if (!Number.isFinite(area.top) || !Number.isFinite(area.bottom)) {
    return opacity < 1 ? hexToRgba(colors.start, opacity) : colors.start
  }

  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom)

  const startColor = opacity < 1 ? hexToRgba(colors.start, opacity) : colors.start
  const endColor = opacity < 1 ? hexToRgba(colors.end, opacity) : colors.end

  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)

  return gradient
}

interface MISentimentsChartProps {
  data: SentimentData[]
}

const updatingCharts = new WeakMap<ChartJS<'bar'>, boolean>()

const gradientBarPlugin: Plugin<'bar'> = {
  id: 'gradientBar',
  afterLayout: (chart) => {
    if (updatingCharts.get(chart)) {
      return
    }

    updatingCharts.set(chart, true)

    requestAnimationFrame(() => {
      chart.update('none')
      updatingCharts.set(chart, false)
    })
  },
}

// 바 사이의 빈 공간을 같은 섹션으로 채워서 Stacked Area Chart처럼 보이게 하는 플러그인
const createStackedAreaFillPlugin = (hoveredIndex: number | null): Plugin<'bar'> => ({
  id: 'stackedAreaFill',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart
    if (!chartArea || !scales.x) return

    ctx.save()

    // 차트 영역으로 클리핑
    const { left, top, right, bottom } = chartArea
    ctx.beginPath()
    ctx.rect(left, top, right - left, bottom - top)
    ctx.clip()

    const datasets = chart.data.datasets
    if (datasets.length < 3) {
      ctx.restore()
      return
    }

    // 각 바 사이의 영역을 채우기
    for (let i = 0; i < chart.data.labels!.length - 1; i++) {
      const shouldApplyOpacity = hoveredIndex !== null && hoveredIndex !== i && hoveredIndex !== i + 1
      const opacity = shouldApplyOpacity ? 0.5 : 1

      // 바의 메타데이터를 사용하여 정확한 위치 가져오기
      // 순서: downward (0), neutral (1), upward (2) - 위에서 아래로 upward, neutral, downward가 되도록
      const downwardMeta = chart.getDatasetMeta(0)
      const neutralMeta = chart.getDatasetMeta(1)
      const upwardMeta = chart.getDatasetMeta(2)

      const currentDownwardBar = downwardMeta.data[i] as unknown as { x: number; y: number; base: number; width: number } | undefined
      const currentNeutralBar = neutralMeta.data[i] as unknown as { x: number; y: number; base: number; width: number } | undefined
      const currentUpwardBar = upwardMeta.data[i] as unknown as { x: number; y: number; base: number; width: number } | undefined

      const nextDownwardBar = downwardMeta.data[i + 1] as unknown as { x: number; y: number; base: number; width: number } | undefined
      const nextNeutralBar = neutralMeta.data[i + 1] as unknown as { x: number; y: number; base: number; width: number } | undefined
      const nextUpwardBar = upwardMeta.data[i + 1] as unknown as { x: number; y: number; base: number; width: number } | undefined

      if (!currentUpwardBar || !currentNeutralBar || !currentDownwardBar || !nextUpwardBar || !nextNeutralBar || !nextDownwardBar) {
        continue
      }

      // 바의 실제 너비
      const currentBarWidth = currentDownwardBar.width || 28
      const nextBarWidth = nextDownwardBar.width || 28

      // 현재 바의 각 섹션 경계 Y 좌표 (바의 오른쪽 가장자리)
      // 위에서 아래로: upward (top), neutral (middle), downward (bottom)
      const currentBarRightX = currentDownwardBar.x + currentBarWidth / 2
      const currentUpwardTop = currentUpwardBar.y // upward의 상단 (가장 위)
      const currentUpwardBottom = currentUpwardBar.base // upward의 하단
      const currentNeutralTop = currentNeutralBar.y // neutral의 상단
      const currentNeutralBottom = currentNeutralBar.base // neutral의 하단
      const currentDownwardTop = currentDownwardBar.y // downward의 상단
      const currentDownwardBottom = currentDownwardBar.base // downward의 하단 (가장 아래)

      // 다음 바의 각 섹션 경계 Y 좌표 (바의 왼쪽 가장자리)
      const nextBarLeftX = nextDownwardBar.x - nextBarWidth / 2
      const nextUpwardTop = nextUpwardBar.y
      const nextUpwardBottom = nextUpwardBar.base
      const nextNeutralTop = nextNeutralBar.y
      const nextNeutralBottom = nextNeutralBar.base
      const nextDownwardTop = nextDownwardBar.y
      const nextDownwardBottom = nextDownwardBar.base

      // Upward 섹션 영역
      ctx.globalAlpha = opacity
      ctx.fillStyle = '#ADCFE7'
      ctx.beginPath()
      ctx.moveTo(currentBarRightX, currentUpwardTop)
      ctx.lineTo(nextBarLeftX, nextUpwardTop)
      ctx.lineTo(nextBarLeftX, nextUpwardBottom)
      ctx.lineTo(currentBarRightX, currentUpwardBottom)
      ctx.closePath()
      ctx.fill()

      // Neutral 섹션 영역
      ctx.fillStyle = '#E5E5E5'
      ctx.beginPath()
      ctx.moveTo(currentBarRightX, currentNeutralTop)
      ctx.lineTo(nextBarLeftX, nextNeutralTop)
      ctx.lineTo(nextBarLeftX, nextNeutralBottom)
      ctx.lineTo(currentBarRightX, currentNeutralBottom)
      ctx.closePath()
      ctx.fill()

      // Downward 섹션 영역
      ctx.fillStyle = '#E3BFD5'
      ctx.beginPath()
      ctx.moveTo(currentBarRightX, currentDownwardTop)
      ctx.lineTo(nextBarLeftX, nextDownwardTop)
      ctx.lineTo(nextBarLeftX, nextDownwardBottom)
      ctx.lineTo(currentBarRightX, currentDownwardBottom)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  },
})

interface TooltipState {
  visible: boolean
  top: number
  left: number
  date: string
  upward: number
  neutral: number
  downward: number
  normalizedUpward: number
  normalizedNeutral: number
  normalizedDownward: number
}

const MISentimentsChart = ({ data }: MISentimentsChartProps) => {
  const chartRef = useRef<ChartJS<'bar'>>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    top: 0,
    left: 0,
    date: '',
    upward: 0,
    neutral: 0,
    downward: 0,
    normalizedUpward: 0,
    normalizedNeutral: 0,
    normalizedDownward: 0,
  })

  const hasNoData = useMemo(() => {
    if (!data || data.length === 0) return true
    const total = data.reduce((sum, item) => sum + item.upward + item.neutral + item.downward, 0)
    return total === 0
  }, [data])

  const chartData = useMemo(() => {
    const labels = data.map((item) => {
      const date = dayjs(item.date)
      return date.isValid() ? date.format('MM/DD') : item.date
    })

    // 100%가 되도록 보정
    const normalizedData = data.map((item) => {
      const total = item.upward + item.neutral + item.downward
      if (total === 0) {
        return {
          upward: 0,
          neutral: 0,
          downward: 0,
        }
      }
      return {
        upward: (item.upward / total) * 100,
        neutral: (item.neutral / total) * 100,
        downward: (item.downward / total) * 100,
      }
    })

    const upwardData = normalizedData.map((item) => item.upward)
    const neutralData = normalizedData.map((item) => item.neutral)
    const downwardData = normalizedData.map((item) => item.downward)

    return {
      labels,
      datasets: [
        {
          label: 'Downward',
          data: downwardData,
          backgroundColor: (context: ScriptableContext<'bar'>) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) {
              return SENTIMENT_COLORS.downward.start
            }
            const meta = chart.getDatasetMeta(context.datasetIndex)
            const bar = meta.data[context.dataIndex] as unknown as { x: number; y: number; base: number; width: number } | undefined
            if (!bar || !Number.isFinite(bar.y) || !Number.isFinite(bar.base)) {
              return SENTIMENT_COLORS.downward.start
            }
            const opacity = hoveredIndex !== null && hoveredIndex !== context.dataIndex ? 0.5 : 1
            return createGradient(ctx, { top: bar.y, bottom: bar.base }, SENTIMENT_COLORS.downward, opacity)
          },
          borderColor: SENTIMENT_COLORS.downward.start,
          borderWidth: 0,
          maxBarThickness: 50,
        },
        {
          label: 'Neutral',
          data: neutralData,
          backgroundColor: (context: ScriptableContext<'bar'>) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) {
              return SENTIMENT_COLORS.neutral.start
            }
            const meta = chart.getDatasetMeta(context.datasetIndex)
            const bar = meta.data[context.dataIndex] as unknown as { x: number; y: number; base: number; width: number } | undefined
            if (!bar || !Number.isFinite(bar.y) || !Number.isFinite(bar.base)) {
              return SENTIMENT_COLORS.neutral.start
            }
            const opacity = hoveredIndex !== null && hoveredIndex !== context.dataIndex ? 0.5 : 1
            return createGradient(ctx, { top: bar.y, bottom: bar.base }, SENTIMENT_COLORS.neutral, opacity)
          },
          borderColor: SENTIMENT_COLORS.neutral.start,
          borderWidth: 0,
          maxBarThickness: 50,
        },
        {
          label: 'Upward',
          data: upwardData,
          backgroundColor: (context: ScriptableContext<'bar'>) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) {
              return SENTIMENT_COLORS.upward.start
            }
            const meta = chart.getDatasetMeta(context.datasetIndex)
            const bar = meta.data[context.dataIndex] as unknown as { x: number; y: number; base: number; width: number } | undefined
            if (!bar || !Number.isFinite(bar.y) || !Number.isFinite(bar.base)) {
              return SENTIMENT_COLORS.upward.start
            }
            const opacity = hoveredIndex !== null && hoveredIndex !== context.dataIndex ? 0.5 : 1
            return createGradient(ctx, { top: bar.y, bottom: bar.base }, SENTIMENT_COLORS.upward, opacity)
          },
          borderColor: SENTIMENT_COLORS.upward.start,
          borderWidth: 0,
          maxBarThickness: 50,
        },
      ],
    }
  }, [data, hoveredIndex])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !containerRef.current) {
      return undefined
    }

    const canvas = chart.canvas

    const handleHover = (event: MouseEvent) => {
      const elements = chart.getElementsAtEventForMode(event, 'index', { intersect: true }, true)

      if (elements.length === 0) {
        setTooltip((prev) => ({ ...prev, visible: false }))
        setHoveredIndex(null)
        return
      }

      const element = elements[0]
      const dataIndex = element.index

      const sentimentData = data[dataIndex]
      if (!sentimentData) {
        setTooltip((prev) => ({ ...prev, visible: false }))
        setHoveredIndex(null)
        return
      }

      setHoveredIndex(dataIndex)

      const total = sentimentData.upward + sentimentData.neutral + sentimentData.downward
      const normalizedValues =
        total === 0
          ? { upward: 0, neutral: 0, downward: 0 }
          : {
            upward: (sentimentData.upward / total) * 100,
            neutral: (sentimentData.neutral / total) * 100,
            downward: (sentimentData.downward / total) * 100,
          }

      const rect = canvas.getBoundingClientRect()
      const containerRect = containerRef.current!.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setTooltip({
        visible: true,
        top: y + containerRect.top - 10,
        left: x + containerRect.left + 20,
        date: sentimentData.date,
        upward: sentimentData.upward,
        neutral: sentimentData.neutral,
        downward: sentimentData.downward,
        normalizedUpward: normalizedValues.upward,
        normalizedNeutral: normalizedValues.neutral,
        normalizedDownward: normalizedValues.downward,
      })
    }

    const handleLeave = () => {
      setTooltip((prev) => ({ ...prev, visible: false }))
      setHoveredIndex(null)
    }

    canvas.addEventListener('mousemove', handleHover)
    canvas.addEventListener('mouseleave', handleLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleHover)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [data])

  useEffect(() => {
    const chart = chartRef.current
    if (chart) {
      chart.update('none')
    }
  }, [hoveredIndex])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      indexAxis: 'x' as const,
      interaction: {
        mode: 'index' as const,
        intersect: true,
      },
      scales: {
        x: {
          stacked: true,
          display: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: '#495057',
            font: {
              size: 14,
              weight: 500,
              family: 'Pretendard, sans-serif',
              style: 'normal' as const,
            },
            padding: 1,
          },
          categoryPercentage: 0.8,
          barPercentage: 0.9,
        },
        y: {
          stacked: true,
          display: false,
          beginAtZero: true,
          max: 100,
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
        },
      },
    }),
    [],
  )

  const stackedAreaFillPlugin = useMemo(() => createStackedAreaFillPlugin(hoveredIndex), [hoveredIndex])

  if (hasNoData) {
    return (
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <Typography variant="body2SB14" color="gray.50">
          No data available to display.
        </Typography>
      </Box>
    )
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} plugins={[gradientBarPlugin, stackedAreaFillPlugin]} />
      <Fade in={tooltip.visible} timeout={200}>
        <Stack
          position="fixed"
          top={tooltip.top}
          left={tooltip.left}
          width="240px"
          padding="12px"
          gap="8px"
          borderRadius="10px"
          border="1px solid"
          borderColor="contentBorder.Active"
          bgcolor="commonColor.White"
          boxShadow="0px 0px 4px 0px rgba(0, 0, 0, 0.1)"
          sx={{
            pointerEvents: tooltip.visible ? 'auto' : 'none',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap="8px">
            <Typography variant="body2SB14" color="contentText.Normal">
              {tooltip.date}
            </Typography>
            <Typography variant="body3R12" color="contentText.Normal">
              {(tooltip.upward + tooltip.neutral + tooltip.downward).toLocaleString()} Items
            </Typography>
          </Stack>
          <Divider />
          <Stack padding="4px 6px" direction="row" justifyContent="space-between" alignItems="center" gap="8px">
            <Stack direction="row" alignItems="center" gap="4px" flex={1}>
              <Box margin="5px" width="12px" height="12px" borderRadius="2px" bgcolor={SENTIMENT_COLORS.upward.start} />
              <Typography variant="body2M14" color="contentText.Normal">
                Upward
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="center" alignItems="center" gap="6px">
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.upward.toLocaleString()}
              </Typography>
              <Divider orientation="vertical" sx={{ height: '6px', borderColor: 'contentBorder.Normal' }} />
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.normalizedUpward.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
          <Stack padding="4px 6px" direction="row" justifyContent="space-between" alignItems="center" gap="8px">
            <Stack direction="row" alignItems="center" gap="4px" flex={1}>
              <Box margin="5px" width="12px" height="12px" borderRadius="2px" bgcolor={SENTIMENT_COLORS.neutral.start} />
              <Typography variant="body2M14" color="contentText.Normal">
                Neutral
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="center" alignItems="center" gap="6px">
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.neutral.toLocaleString()}
              </Typography>
              <Divider orientation="vertical" sx={{ height: '6px', borderColor: 'contentBorder.Normal' }} />
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.normalizedNeutral.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
          <Stack padding="4px 6px" direction="row" justifyContent="space-between" alignItems="center" gap="8px">
            <Stack direction="row" alignItems="center" gap="4px" flex={1}>
              <Box margin="5px" width="12px" height="12px" borderRadius="2px" bgcolor={SENTIMENT_COLORS.downward.start} />
              <Typography variant="body2M14" color="contentText.Normal">
                Downward
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="center" alignItems="center" gap="6px">
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.downward.toLocaleString()}
              </Typography>
              <Divider orientation="vertical" sx={{ height: '6px', borderColor: 'contentBorder.Normal' }} />
              <Typography variant="body2M14" color="contentText.Normal">
                {tooltip.normalizedDownward.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Fade>
    </Box>
  )
}

export default MISentimentsChart
