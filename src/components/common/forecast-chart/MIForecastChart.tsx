/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Typography } from '@mui/material'
import Chart, {
  CategoryScale,
  ChartDataset,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip as TooltipJS,
} from 'chart.js/auto'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DATA_CATEGORIES } from './constants'
import MIButton from '../button/MIButton'
import ChartDownloadIcon from './icons/ChartDownloadIcon'
import ChartNotificationIcon from './icons/ChartNotificationIcon'
import MIForecastChartTooltip, { MIForecastChartTooltipProps } from './MIForecastChartTooltip'
import MIForecastLegend from './MIForecastLegend'
import gridAndAxesPlugin from './plugins/gridAndAxesPlugin'
import verticalLineAndHighlightPlugin, { PointerMoveEventContext } from './plugins/verticalLineAndHighlightPlugin'
import loadImages, { createHoverDiamonSVG, createHoverDotSVG, createMakerSVG } from './utils/loadImage'

import useSnackbar from '@/hooks/useSnackbar'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import theme from '@/theming'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, TooltipJS, Legend, Filler)

export interface MIForecastChartProps {
  height: number | string
  months: string[]
  actualData: {
    label: string
    data: (number | null)[]
    color: string
  }
  forecastData: Array<(number | null)[]>
  futureDatasets: Array<{
    label: string
    data: (number | null)[]
    color: string
  }>
  showForecastTrend?: boolean
  hidePoint?: boolean
  bottomLabel?: string
  topLabel?: string
  lastUpdated?: string
}

export default function MIForecastChart(props: Readonly<MIForecastChartProps>) {
  const {
    height,
    actualData,
    forecastData,
    futureDatasets,
    months,
    showForecastTrend = true,
    hidePoint = false,
    bottomLabel = '',
    topLabel = '',
    lastUpdated = '',
  } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const { showSnackbar } = useSnackbar()
  const [chartInstance, setChartInstance] = useState<Chart | null>(null)
  const [tooltip, setTooltip] = useState<MIForecastChartTooltipProps>({
    minWidth: 293,
    visible: false,
    top: 0,
    left: 0,
    label: '',
    content: [],
    borderBottom: 0,
    borderRight: 0,
  })
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const externalTooltipHandler = useCallback((context: PointerMoveEventContext) => {
    const { tooltip: chartTooltip, chart } = context

    if (!chartTooltip) {
      setTooltip((prev) => ({ ...prev, visible: false }))

      return
    }

    setTooltip({
      minWidth: 293,
      visible: true,
      top: chartTooltip.y,
      left: chartTooltip.x + 20,
      label: chartTooltip.label,
      content: chartTooltip.content,
      borderBottom: chart.chartArea.bottom,
      borderRight: chart.chartArea.right,
    })
  }, [])

  // Add these refs and state for caching hover dot images (moved inside the component)
  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [hoverDotsLoaded, setHoverDotsLoaded] = useState(false)
  const [datasets, setDatasets] = useState<Array<ChartDataset & { category: string; hidden?: boolean }>>([])
  // Handle toggling dataset visibility
  const handleToggleDataset = (index: number) => {
    const newDatasets = [...datasets]
    const dataset = newDatasets[index]

    dataset.hidden = !dataset.hidden

    if (dataset.category === DATA_CATEGORIES.ACTUAL) {
      const forecast = newDatasets.filter((item) => item.category === DATA_CATEGORIES.FORECAST)

      forecast.forEach((d) => {
        d.hidden = dataset.hidden
      })
    }

    setDatasets(newDatasets)
  }

  useEffect(() => {
    const forecastDatasets: Array<ChartDataset & { category: string; hidden?: boolean }> = []

    forecastData.forEach((data, i) => {
      forecastDatasets.push({
        label: `${months[i]} Forecast`,
        data,
        borderColor: actualData.color,
        backgroundColor: actualData.color,
        pointStyle: hidePoint ? 'circle' : 'rectRot',
        pointBackgroundColor: actualData.color,
        pointBorderColor: actualData.color,
        borderDash: [5, 5],
        tension: 0,
        borderWidth: 1.5,
        showLine: true,
        // Hide this dataset from the legend
        hidden: false,
        category: 'forecast',
        pointRadius: hidePoint ? 0 : 3,
      })
    })

    setDatasets([
      {
        label: actualData.label,
        data: actualData.data,
        borderColor: actualData.color,
        backgroundColor: actualData.color,
        pointBackgroundColor: actualData.color,
        pointBorderColor: actualData.color,
        tension: 0,
        category: 'actualData',
        pointRadius: hidePoint ? 0 : 3,
      },
      ...futureDatasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.color,
        backgroundColor: dataset.color,
        pointBackgroundColor: dataset.color,
        pointBorderColor: dataset.color,
        tension: 0,
        category: 'future',
        pointRadius: hidePoint ? 0 : 3,
      })),
      ...forecastDatasets,
    ])
  }, [hidePoint, futureDatasets, actualData, forecastData])

  const createChart = () => {
    if (chartInstance) {
      chartInstance.destroy()
    }
    if (!chartRef.current) return

    const ctx = chartRef.current

    if (!ctx) return

    const newChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [...datasets],
      },
      plugins: [verticalLineAndHighlightPlugin, gridAndAxesPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            left: 36,
            top: 12,
          },
        },
        scales: {
          y: {
            min: 50,
            max: 95,
            grid: {
              display: false,
            },
            ticks: {
              stepSize: 5,
              callback: (value) => Number(value).toFixed(1),
              font: {
                family: 'Pretendard',
                size: 14,
                weight: 400,
              },
              color: theme.palette.gray[60],
            },
            title: {
              display: false,
            },
            border: {
              display: false,
            },

            afterTickToLabelConversion(axis: any) {
              // Remove the first tick label
              if (axis.ticks.length > 0) {
                axis.ticks[0].label = ''
                axis.ticks[axis.ticks.length - 1].label = ''
              }
            },
          },
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              font: {
                family: 'Pretendard',
                size: 14,
                weight: 400,
              },
              color: theme.palette.gray[60],
            },

            afterTickToLabelConversion(axis: any) {
              // Remove the first tick label
              if (axis.ticks.length > 0) {
                axis.ticks.forEach((item: { label: string }) => {
                  item.label = dayjs(item.label, 'YYYY-MM').format('YY-MM')
                })
                axis.ticks[0].label = ''
                axis.ticks[axis.ticks.length - 1].label = ''
              }
            },
          },
        },
        plugins: {
          gridAndAxes: {
            bottomLabel,
            topLabel,
          },
          verticalLineAndHighlight: {
            verticalLinedIndex: 12,
            maxIndex: 12,
            onPointerMove: externalTooltipHandler,
            hoverImages: hoverDotImagesRef.current,
            showForecastTrend,
          },
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
            position: 'nearest',
            mode: 'index',
            intersect: false,
          },
          title: {
            display: false,
          },
        },
      },
    })

    setChartInstance(newChartInstance)
  }

  useEffect(() => {
    const loadChartImages = async () => {
      const imagesInfo: Record<string, string> = {}

      if (actualData.color) {
        imagesInfo[actualData.label] = createHoverDotSVG(actualData.color)
        imagesInfo['forecast'] = createHoverDiamonSVG(actualData.color)
        imagesInfo['forecastPositive'] = createHoverDiamonSVG('#498B47')
        imagesInfo['forecastNegative'] = createHoverDiamonSVG('#A9141A')
      }

      if (futureDatasets.length > 0) {
        futureDatasets.forEach((dataset) => {
          imagesInfo[dataset.label] = createHoverDotSVG(dataset.color)
        })
      }
      imagesInfo['marker'] = createMakerSVG('#868E96')

      const images = await loadImages(imagesInfo)

      hoverDotImagesRef.current = images

      setHoverDotsLoaded(true)
    }

    loadChartImages()
  }, [])

  useEffect(() => {
    if (actualData.data.length > 0 && hoverDotsLoaded) {
      createChart()
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    }
  }, [actualData.data, hoverDotsLoaded, datasets])

  const handleDownload = () => {
    if (!chartRef.current) return

    const link = document.createElement('a')

    link.download = 'chart.png'

    link.href = chartRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Box width={'100%'} maxWidth={'100%'} sx={{ boxSizing: 'border-box' }}>
      <Box
        px="24px"
        py="8px"
        display={'flex'}
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{ borderBottom: '1px solid', borderColor: theme.palette.gray[30] }}
      >
        <Box>
          {lastUpdated && (
            <Typography variant="body3M12" color="gray.60">
              Last Updated : {lastUpdated}
            </Typography>
          )}
        </Box>
        <Box display={'flex'} alignItems={'center'} gap="10px">
          <MIButton
            startIcon={<ChartNotificationIcon />}
            onClick={() => setIsOpenSetting(true)}
            contentType={'icon'}
            type="outlined"
            toolTipProps={{
              placement: 'bottom-start',
              slotProps: {
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [15, 0],
                      },
                    },
                  ],
                },
              },
            }}
            toolTip={
              <Typography
                variant={'subtext'}
                sx={{
                  whiteSpace: 'pre-line',
                  '& li': {
                    paddingLeft: '20px',
                    position: 'relative',
                  },
                  '& li:before': {
                    content: '"•"',
                    position: 'absolute',
                    left: 5,
                    color: '#FFFFFF',
                  },
                }}
              >
                오차율(%) = {'{'}(Forecast - Actual) / Actual{'}'} × 100
                <ul>
                  <li>오차율은 양수 : 예측이 더 높았음 (과대 예측)</li>
                  <li>오차율은 음수 : 예측이 더 낮았음 (과소 예측)</li>
                  <li>오차율 0% : 완벽 예측</li>
                </ul>
              </Typography>
            }
          />
          <MIButton startIcon={<ChartDownloadIcon />} onClick={handleDownload} contentType={'icon'} type="outlined" />
        </Box>
      </Box>
      <MIForecastLegend datasets={datasets} onToggleDataset={handleToggleDataset} />
      <Box px="18px" height={height} sx={{ position: 'relative' }}>
        <canvas ref={chartRef} />
        <MIForecastChartTooltip {...tooltip} />
      </Box>
      <SettingModalComponent
        open={isOpenSetting}
        onClose={() => setIsOpenSetting(false)}
        onRegister={() => showSnackbar('삭제되었습니다.', { variant: 'success' })}
      />
    </Box>
  )
}
