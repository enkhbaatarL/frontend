import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Plugin } from 'chart.js'
import { useMemo, useRef } from 'react'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement)

interface SentimentData {
  date: string
  upward: number
  neutral: number
  downward: number
}

const SENTIMENT_COLORS = {
  upward: '#3386C2',
  neutral: '#A8A8A8',
  downward: '#A02A74',
}

interface MISentimentsChartProps {
  data: SentimentData[]
}

// 바 사이의 빈 공간을 같은 섹션으로 채워서 Stacked Area Chart처럼 보이게 하는 플러그인
const stackedAreaFillPlugin: Plugin<'bar'> = {
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
    }

    ctx.restore()
  },
}

const MISentimentsChart = ({ data }: MISentimentsChartProps) => {
  const chartRef = useRef<ChartJS<'bar'>>(null)

  const chartData = useMemo(() => {
    const labels = data.map((item) => item.date)
    const upwardData = data.map((item) => item.upward)
    const neutralData = data.map((item) => item.neutral)
    const downwardData = data.map((item) => item.downward)

    return {
      labels,
      datasets: [
        {
          label: 'Downward',
          data: downwardData,
          backgroundColor: SENTIMENT_COLORS.downward,
          borderColor: SENTIMENT_COLORS.downward,
          borderWidth: 0,
          maxBarThickness: 28,
        },
        {
          label: 'Neutral',
          data: neutralData,
          backgroundColor: SENTIMENT_COLORS.neutral,
          borderColor: SENTIMENT_COLORS.neutral,
          borderWidth: 0,
          maxBarThickness: 28,
        },
        {
          label: 'Upward',
          data: upwardData,
          backgroundColor: SENTIMENT_COLORS.upward,
          borderColor: SENTIMENT_COLORS.upward,
          borderWidth: 0,
          maxBarThickness: 28,
        },
      ],
    }
  }, [data])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      indexAxis: 'x' as const,
      events: [],
      onHover: () => {},
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
          left: 6,
          right: 6,
        },
      },
    }),
    [],
  )

  return <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} plugins={[stackedAreaFillPlugin]} />
}

export default MISentimentsChart
export type { SentimentData }
