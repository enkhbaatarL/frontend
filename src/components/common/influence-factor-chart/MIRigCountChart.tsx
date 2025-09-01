/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box } from '@mui/material'
import Chart, { ChartType } from 'chart.js/auto'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'

import 'dayjs/locale/ko'
import MIRigCountChartTooltip, { MIRigCountChartTooltipProps } from './MIRigCountChartTooltip'
import verticalLinePlugin, { PointerMoveEventContext } from './plugins/verticalLinePlugin'
import loadImages, { createHoverDotSVG } from './utils/loadImage'

import theme from '@/theming'

Chart.defaults.font.family = 'Pretendard'

interface MIRigCountChartProps {
  height: number
  data: {
    labels: string[]
    values: number[]
  }
}

export default function MIRigCountChart(props: MIRigCountChartProps) {
  const { height, data: chartData } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [chartInstance, setChartInstance] = useState<Chart<'line'> | null>(null)
  // Add these refs and state for caching hover dot images (moved inside the component)
  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [hoverDotsLoaded, setHoverDotsLoaded] = useState(false)

  const [tooltip, setTooltip] = useState<MIRigCountChartTooltipProps>({
    minWidth: 180,
    visible: false,
    top: 0,
    left: 0,
    label: '',
    content: [],
    borderBottom: 0,
    borderRight: 0,
  })

  const externalTooltipHandler = useCallback((context: PointerMoveEventContext) => {
    const { tooltip: chartTooltip, chart } = context

    if (!chartTooltip) {
      setTooltip((prev) => ({ ...prev, visible: false }))

      return
    }

    setTooltip({
      minWidth: 180,
      visible: true,
      top: chartTooltip.y,
      left: chartTooltip.x + 20,
      label: chartTooltip.label,
      content: chartTooltip.content,
      borderBottom: chart.chartArea.bottom,
      borderRight: chart.chartArea.right,
    })
  }, [])

  useEffect(() => {
    const loadChartImages = async () => {
      const imagesInfo: Record<string, string> = {}

      imagesInfo['value'] = createHoverDotSVG('#153870')

      const images = await loadImages(imagesInfo)

      hoverDotImagesRef.current = images

      setHoverDotsLoaded(true)
    }

    loadChartImages()
  }, [])

  useEffect(() => {
    // Clean up previous chart instance
    if (chartInstance) {
      chartInstance.destroy()
    }

    const initChart = async () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d')

        if (ctx) {
          const newChartInstance = new Chart(ctx, {
            type: 'line' as ChartType,
            data: {
              labels: chartData.labels,
              datasets: [
                {
                  label: 'Rig Count',
                  data: chartData.values,
                  borderColor: '#153870',
                  backgroundColor: 'rgba(21, 56, 112, 0.1)',
                  tension: 0.4,
                  borderWidth: 2,
                  pointRadius: 0,
                  fill: false,
                },
              ],
            },
            plugins: [verticalLinePlugin],
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  enabled: false,
                  position: 'nearest',
                  mode: 'index',
                  intersect: false,
                },
                verticalLine: {
                  verticalLinedIndex: 12,
                  maxIndex: 12,
                  onPointerMove: externalTooltipHandler,
                  hoverImages: hoverDotImagesRef.current,
                },
              },
              scales: {
                x: {
                  ticks: {
                    font: {
                      family: 'Pretendard',
                      size: 12,
                      weight: 400,
                    },
                    color: theme.palette.gray[60],
                  },
                  afterTickToLabelConversion(axis: any) {
                    // Remove the first tick label
                    if (axis.ticks.length > 0) {
                      axis.ticks.forEach((item: { label: string }) => {
                        item.label = dayjs(item.label).format('YYYY년 M월')
                      })
                      axis.ticks[0].label = ''
                      axis.ticks[axis.ticks.length - 1].label = ''
                    }
                  },
                  border: {
                    dash: [2, 2],
                    width: 1,
                  },
                },
                y: {
                  ticks: {
                    font: {
                      family: 'Pretendard',
                      size: 12,
                      weight: 400,
                    },
                    color: theme.palette.gray[60],
                    callback: (value, index) => (index === 0 ? null : value.toLocaleString()),
                  },
                  min: 8000,
                  border: {
                    dash: [2, 2],
                    width: 1,
                  },
                },
              },
            },
          })

          setChartInstance(newChartInstance as Chart<'line'>)
        }
      }
    }

    if (hoverDotsLoaded) {
      initChart()
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    }
  }, [chartData, hoverDotsLoaded])

  return (
    <Box>
      <Box height={height} sx={{ position: 'relative' }}>
        <canvas ref={chartRef} />
        <MIRigCountChartTooltip {...tooltip} />
      </Box>
    </Box>
  )
}
