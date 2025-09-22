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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MIButton from '../button/MIButton'
import ChartDownloadIcon from './icons/ChartDownloadIcon'
import ChartNotificaitonIcon from './icons/ChartNotificationIcon'
import MIForecastChartTooltip, { MIForecastChartTooltipProps } from './MIForecastChartTooltip'
import MIForecastLegend from './MIForecastLegend'
import gridAndAxesPlugin from './plugins/gridAndAxesPlugin'
import verticalLineAndHighlightPlugin, { PointerMoveEventContext } from './plugins/verticalLineAndHighlightPlugin'
import loadImages, {
  createActiveDiamonSVG,
  createHoverDiamonSVG,
  createHoverDotSVG,
  createHoverPointDiamonSVG,
  createMakerSVG,
} from './utils/loadImage'

import useSnackbar from '@/hooks/useSnackbar'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import { SelectedReportChartContent } from '@/pages/mi/forecast/components/ReportComponent'
import theme from '@/theming'
import { convertToRgbaWithOpacity } from '@/utils/color'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, TooltipJS, Legend, Filler)

export interface ForecastDataset {
  data: (number | null)[]
  forecastData?: Array<(number | null)[]>
  color: string
  label: string
  hidePoint?: boolean
  type?: 'actualData' | 'future'
  yAxisID?: string
}

export interface MIForecastChartRef {
  closeTooltip: () => void
}

export interface MIForecastChartProps {
  height: number | string
  months: string[] | undefined
  forecastDatasets: Array<ForecastDataset>
  showForecastTrend?: boolean
  hidePoint?: boolean
  isMIAgent?: boolean
  bottomLabel?: string
  topLabel?: string
  lastUpdated?: string
  hideControl?: boolean
  hideLegend?: boolean
  inactive?: boolean
  showVerticalLine?: boolean
  onSelectedContent: (content: SelectedReportChartContent | null) => void
}

export default function MIForecastChart(props: Readonly<MIForecastChartProps>) {
  const {
    height,
    forecastDatasets,
    months,
    showForecastTrend = true,
    isMIAgent = false,
    bottomLabel = '',
    topLabel = '',
    lastUpdated = '',
    hideControl = false,
    hideLegend = false,
    inactive = false,
    showVerticalLine = true,
  } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart>(null)

  useSnackbar()
  const [tooltip, setTooltip] = useState<MIForecastChartTooltipProps>({
    minWidth: 293,
    visible: false,
    viewDetail: false,
    top: 0,
    left: 0,
    label: '',
    content: [],
    borderBottom: 0,
    borderRight: 0,
    onClose: () => {},
  })
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const externalTooltipHandler = useCallback((context: PointerMoveEventContext) => {
    const { tooltip: chartTooltip, plugin, chart } = context

    if (!chartTooltip) {
      setTooltip((prev) => ({ ...prev, visible: false }))

      return
    }

    if (chartTooltip.viewDetail) {
      // props.onViewDetail?.(chartTooltip.content[0], chartTooltip.label)
      // TODO: onSelectedContent로 대체 필요
    }

    setTooltip({
      minWidth: 293,
      visible: true,
      viewDetail: chartTooltip.viewDetail,
      top: chartTooltip.y,
      left: chartTooltip.x + 20 + 20,
      label: chartTooltip.label,
      content: chartTooltip.content,
      borderBottom: chart.chartArea.bottom,
      borderRight: chart.chartArea.right,
      onClose: () => {
        plugin.clearSelectedPoint()
      },
    })
  }, [])

  const viewForecastPointHanlder = (selectedDatasetIndex: number | null) => {
    const newDatasets = chartInstance?.current?.data.datasets ?? []

    if (selectedDatasetIndex) {
      const selectedDataset = newDatasets[selectedDatasetIndex]

      newDatasets.forEach((dataset) => {
        if (selectedDataset.label !== dataset.label && dataset.borderColor) {
          dataset.borderColor = convertToRgbaWithOpacity(dataset.borderColor as string, 0.3)
        }
      })
    } else {
      newDatasets.forEach((dataset) => {
        dataset.borderColor = convertToRgbaWithOpacity(dataset.borderColor as string, 1)
      })
    }
    chartInstance?.current?.update()
  }

  // Add these refs and state for caching hover dot images (moved inside the component)
  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [hoverDotsLoaded, setHoverDotsLoaded] = useState(false)
  const [datasets, setDatasets] = useState<Array<ChartDataset<'line'> & { category: string; yAxisID: string }>>([])
  // Handle toggling dataset visibility
  const handleToggleDataset = (index: number) => {
    const newDatasets = [...datasets]
    const dataset = newDatasets[index]

    dataset.hidden = !dataset.hidden

    const forecast = newDatasets.filter((item: any) => item.label === `${dataset.label}`)

    forecast.forEach((d) => {
      d.hidden = dataset.hidden
    })

    setDatasets(newDatasets)
  }

  useEffect(() => {
    if (forecastDatasets.length === 0) return
    const generateForecastDataSet = (rawDatasets: Array<ForecastDataset>) => {
      const datasets: Array<ChartDataset<'line'> & { category: string; yAxisID: string }> = []
      const imagesInfo: Record<string, string> = {}

      rawDatasets.forEach((dataset) => {
        const actualData = dataset.data
        const label = dataset.label
        const color = dataset.color
        const forecastData = dataset.forecastData ?? []
        const type = dataset.type ?? 'ACTUAL'
        const yAxisID = dataset.yAxisID ?? 'y'

        datasets.push({
          label,
          data: actualData,
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          tension: 0,
          category: type,
          pointRadius: dataset.hidePoint ? 0 : 3,
          yAxisID,
        })

        if (color) {
          imagesInfo[label] = createHoverDotSVG(color)
          imagesInfo[`${label}`] = createHoverDiamonSVG(color)
          imagesInfo[`${label} Active`] = createActiveDiamonSVG(color)
          imagesInfo[`${label} Hover`] = createHoverPointDiamonSVG(color)
        }

        if (type === 'ACTUAL') {
          forecastData.forEach((data) => {
            datasets.push({
              label: `${label}`,
              data,
              borderColor: color,
              backgroundColor: color,
              pointStyle: dataset.hidePoint ? 'circle' : 'rectRot',
              pointBackgroundColor: color,
              pointBorderColor: color,
              borderDash: [5, 5],
              tension: 0,
              borderWidth: 1.5,
              showLine: true,
              // Hide this dataset from the legend
              hidden: false,
              category: 'forecast',
              pointRadius: dataset.hidePoint ? 0 : 3,
              yAxisID,
            })
          })
        }
      })

      imagesInfo['marker'] = createMakerSVG('#868E96')

      return { datasets, imagesInfo }
    }
    const prepareData = async () => {
      const { datasets, imagesInfo } = generateForecastDataSet(forecastDatasets)

      setDatasets(datasets)

      hoverDotImagesRef.current = await loadImages(imagesInfo)

      setHoverDotsLoaded(true)
    }

    prepareData()
  }, [forecastDatasets])

  const axes = useMemo(() => {
    const color: Record<string, string> = {
      y1: '#EFA460',
      y2: '#7D68A4',
    }

    const axesSet = new Set<string>()

    datasets.forEach((dataset) => {
      axesSet.add(dataset.yAxisID ?? 'y')
    })

    const newAxes: Record<string, any> = {}

    axesSet.forEach((key: string) => {
      newAxes[key] = {
        display: true,
        position: key === 'y' ? 'left' : 'right',
        // min: 40,
        // max: 100,
        label: {
          display: true,
        },
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          // stepSize: 5,
          callback: (value: number) => Number(value).toFixed(1),
          font: {
            family: 'Pretendard',
            size: 14,
            weight: 400,
          },
          color: color[key] ?? theme.palette.gray[60],
        },
        title: {
          display: false,
        },
        border: {
          display: false,
        },
        afterFit(axis: { width: number }) {
          // Set a fixed width for the y-axis
          axis.width = 72 // Set to desired width in pixels
        },
        afterTickToLabelConversion(axis: any) {
          // Remove the first tick label
          if (axis.ticks.length > 0) {
            axis.ticks[0].label = ''
            axis.ticks[axis.ticks.length - 1].label = ''
          }
        },
      }
    })

    return newAxes
  }, [datasets])

  const createChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    if (!chartRef.current) return

    const ctx = chartRef.current

    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
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
        events: ['mouseup', 'mousedown', 'mousemove', 'mouseout'],
        layout: {
          padding: {
            top: 12,
          },
        },
        scales: {
          ...axes,
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
            showVerticalLine,
            enable: !inactive,
            verticalLinedIndex: 12,
            maxIndex: 12,
            onPointerMove: externalTooltipHandler,
            onViewForecastPoint: viewForecastPointHanlder,
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
  }

  useEffect(() => {
    if (forecastDatasets.length > 0 && hoverDotsLoaded && chartRef.current) {
      createChart()
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [forecastDatasets, hoverDotsLoaded, datasets, createChart])

  const handleDownload = () => {
    if (!chartRef.current) return

    const link = document.createElement('a')

    link.download = 'chart.png'

    link.href = chartRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Box width={'100%'} maxWidth={'100%'} sx={{ boxSizing: 'border-box' }}>
      {!hideControl && (
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
            {!isMIAgent && (
              <MIButton
                startIcon={<ChartNotificaitonIcon />}
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
            )}
            <MIButton
              startIcon={<ChartDownloadIcon />}
              onClick={handleDownload}
              contentType={'icon'}
              type={isMIAgent ? 'ghost' : 'outlined'}
            />
          </Box>
        </Box>
      )}

      {!isMIAgent && !hideLegend && <MIForecastLegend datasets={datasets} onToggleDataset={handleToggleDataset} />}
      <Box px="18px" height={height} sx={{ position: 'relative' }}>
        <canvas ref={chartRef} />
        <MIForecastChartTooltip {...tooltip} />
      </Box>
      {isMIAgent && <MIForecastLegend showActual={false} datasets={datasets} onToggleDataset={handleToggleDataset} />}
      <SettingModalComponent
        open={isOpenSetting}
        onClose={() => setIsOpenSetting(false)}
        goodsDataSourceNoList={[{ goodsDataSourceNm: '', goodsDataSourceNo: 1, type: 'ACTUAL' }]}
      />
    </Box>
  )
}
