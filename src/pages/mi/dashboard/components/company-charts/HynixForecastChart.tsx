import { Box, Typography } from '@mui/material'
import { Chart as ChartJS, ChartDataset } from 'chart.js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import MIButton from '@/components/common/button/MIButton.tsx'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon.tsx'
import ChartNotificationIcon from '@/components/common/forecast-chart/icons/ChartNotificationIcon.tsx'
import MIForecastChartTooltip, { MIForecastChartTooltipProps } from '@/components/common/forecast-chart/MIForecastChartTooltip.tsx'
import MIForecastLegend from '@/components/common/forecast-chart/MIForecastLegend.tsx'
import gridAndAxesPlugin from '@/components/common/forecast-chart/plugins/gridAndAxesPlugin.ts'
import verticalLineAndHighlightPlugin, {
  PointerMoveEventContext,
} from '@/components/common/forecast-chart/plugins/verticalLineAndHighlightPlugin.ts'
import loadImages, {
  createActiveDiamonSVG,
  createHoverDiamonSVG,
  createHoverDotSVG,
  createHoverPointDiamonSVG,
} from '@/components/common/forecast-chart/utils/loadImage.ts'
import RefreshIcon from '@/components/common/icons/RefreshIcon.tsx'
import { generateYAxis } from '@/lib/chart/utils/chartUtils.ts'
import { SelectedReportChartContent } from '@/pages/mi/dashboard/components/ReportComponent'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent.tsx'
import { IDashboardChartData } from '@/service/mi/dashboardData'
import theme from '@/theming'
import { convertToRgbaWithOpacity } from '@/utils/color.ts'

interface HynixForecastChartProps {
  data: IDashboardChartData
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
}

export interface ForecastDataset {
  data: (number | null)[]
  forecastData?: Array<(number | null)[]>
  color: string
  label: string
  hidePoint?: boolean
  type?: string
  yAxisID?: string
  metadata?: Record<string, unknown>
  permission?: boolean
}

export interface ForecastChartProps {
  height: number | string
  months: (string | null)[]
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
  selectedContent: SelectedReportChartContent | null
  onSelectedContent: (content: SelectedReportChartContent | null) => void
  goodsDataSourceNoList: { goodsDataSourceNm: string; goodsDataSourceNo: number; type: string }[]
}

const initialTooltip: MIForecastChartTooltipProps = {
  minWidth: 293,
  visible: false,
  viewDetail: false,
  top: 0,
  left: 0,
  label: '',
  content: [],
  onClose: () => {},
}

const ForecastChart = (props: ForecastChartProps) => {
  const {
    height,
    forecastDatasets,
    months,
    showForecastTrend = false,
    isMIAgent = false,
    bottomLabel = '',
    topLabel,
    lastUpdated = '',
    hideControl = false,
    hideLegend = false,
    inactive = false,
    showVerticalLine = true,
    selectedContent,
    goodsDataSourceNoList = [],
  } = props
  const chartRef = useRef<ChartJS | null>(null)

  const [tooltip, setTooltip] = useState<MIForecastChartTooltipProps>(initialTooltip)
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const lastSelectedContentRef = useRef<SelectedReportChartContent | null>(null)

  useEffect(() => {
    lastSelectedContentRef.current = selectedContent
  }, [selectedContent])

  useEffect(() => {
    if (selectedContent === null) {
      verticalLineAndHighlightPlugin.reset()
    }
  }, [selectedContent])

  const externalTooltipHandler = useCallback(
    (context: PointerMoveEventContext) => {
      const { tooltip: chartTooltip, plugin } = context

      if (!chartTooltip) {
        setTooltip((prev) => ({ ...prev, visible: false }))
        return
      }

      if (chartTooltip.viewDetail) {
        const newContent = {
          label: chartTooltip.content[0].label ?? '',
          date: chartTooltip.label,
          value: Number((chartTooltip.content[0].value ?? 0).toFixed(2)),
          goodsDataSourceNo: chartTooltip.content[0].goodsDataSourceNo,
        }

        const currentContent = lastSelectedContentRef.current

        const isSameContent =
          currentContent &&
          currentContent.label === newContent.label &&
          currentContent.date === newContent.date &&
          currentContent.value === newContent.value &&
          currentContent.goodsDataSourceNo === newContent.goodsDataSourceNo

        if (!isSameContent) {
          props.onSelectedContent(newContent)
        }
      }

      setTooltip({
        minWidth: 293,
        visible: true,
        viewDetail: chartTooltip.viewDetail,
        top: chartTooltip.y,
        left: chartTooltip.x + 20 + 20,
        label: chartTooltip.label,
        content: chartTooltip.content,
        onClose: () => {
          plugin.clearSelectedPoint()
          props.onSelectedContent(null)
        },
      })
    },
    [props.onSelectedContent],
  )
  const viewForecastPointHandler = useCallback((selectedDatasetIndex: number | null) => {
    const newDatasets = chartRef?.current?.data.datasets ?? []

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
    chartRef?.current?.update()
  }, [])

  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [datasets, setDatasets] = useState<Array<ChartDataset<'line'> & { category: string; yAxisID: string; permission: boolean }>>([])

  const handleToggleDataset = useCallback(
    (index: number) => {
      if (selectedContent) return

      setDatasets((prevDatasets) => {
        const newDatasets = [...prevDatasets]
        const dataset = newDatasets[index]

        if (!dataset.permission) return prevDatasets

        dataset.hidden = !dataset.hidden

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const forecast = newDatasets.filter((item: any) => item.label === `${dataset.label} Forecast`)

        forecast.forEach((d) => {
          d.hidden = dataset.hidden
        })

        return newDatasets
      })
    },
    [selectedContent],
  )

  const handleRefresh = useCallback((resetChart?: boolean) => {
    if (resetChart) {
      setDatasets((prevDatasets) => {
        const newDatasets = [...prevDatasets]
        newDatasets.forEach((dataset) => {
          if (dataset.hidden) {
            dataset.hidden = false
          }
        })
        return newDatasets
      })
    }
    setTooltip((prev) => ({ ...prev, visible: false }))
    verticalLineAndHighlightPlugin.reset()
  }, [])

  const handleDownload = useCallback(() => {
    if (!chartRef.current) return

    const legendItems = datasets
      .filter((dataset) => !dataset.hidden)
      .map((dataset) => ({
        label: dataset.label,
        color: dataset.borderColor as string,
      }))

    const canvas = chartRef.current.canvas

    const legendCanvas = document.createElement('canvas')
    const legendCtx = legendCanvas.getContext('2d')
    if (!legendCtx) return

    const padding = 20
    const legendItemHeight = 20
    const legendHeight = legendItems.length * legendItemHeight + padding * 2

    legendCanvas.width = canvas.width
    legendCanvas.height = canvas.height + legendHeight

    legendCtx.fillStyle = '#FFFFFF'
    legendCtx.fillRect(0, 0, legendCanvas.width, legendCanvas.height)

    legendCtx.drawImage(canvas, 0, 0)

    legendCtx.font = '12px Pretendard'
    legendItems.forEach((item, index) => {
      const y = canvas.height + padding + index * legendItemHeight

      legendCtx.fillStyle = item.color
      legendCtx.fillRect(padding, y, 12, 12)

      legendCtx.fillStyle = '#000000'
      legendCtx.fillText(item.label ?? '', padding + 20, y + 10)
    })

    const link = document.createElement('a')
    link.download = 'chart.png'
    link.href = legendCanvas.toDataURL('image/png')
    link.click()
  }, [datasets])

  useEffect(() => {
    if (forecastDatasets.length === 0) return

    const generateForecastDataSet = (rawDatasets: Array<ForecastDataset>) => {
      const datasets: Array<ChartDataset<'line'> & { category: string; yAxisID: string; permission: boolean }> = []
      const imagesInfo: Record<string, string> = {}

      rawDatasets.forEach((dataset) => {
        const actualData = dataset.data
        const label = dataset.label
        const color = dataset.color
        const type = dataset.type ?? 'actualData'
        const yAxisID = dataset.yAxisID ?? 'y'
        const permission = dataset.permission ?? true

        datasets.push({
          label,
          data: actualData.length > 0 ? [null, ...actualData, null] : [],
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          tension: 0,
          category: type,
          pointRadius: dataset.hidePoint ? 0 : 3,
          yAxisID,
          spanGaps: true,
          metadata: dataset.metadata,
          permission,
        })

        if (color) {
          imagesInfo[label] = createHoverDotSVG(color)
          imagesInfo[`${label} Forecast`] = createHoverDiamonSVG(color)
          imagesInfo[`${label} Forecast Active`] = createActiveDiamonSVG(color)
          imagesInfo[`${label} Forecast Hover`] = createHoverPointDiamonSVG(color)
        }

        if (type === 'forecast') {
          const filteredDatasets = datasets.filter((d) => !d.category?.includes('forecast'))
          datasets.length = 0
          datasets.push(...filteredDatasets)

          datasets.push({
            label: `${dataset.label} Forecast`,
            data: dataset.data.length > 0 ? [null, ...dataset.data, null] : [],
            borderColor: dataset.color,
            backgroundColor: dataset.color,
            pointStyle: dataset.hidePoint ? 'circle' : 'rectRot',
            pointBackgroundColor: dataset.color,
            pointBorderColor: dataset.color,
            borderDash: [5, 5],
            tension: 0,
            borderWidth: 1.5,
            showLine: true,
            hidden: false,
            category: 'forecast',
            pointRadius: dataset.hidePoint ? 0 : 3,
            yAxisID: dataset.yAxisID ?? 'y',
            spanGaps: true,
            metadata: dataset.metadata,
            permission,
          })
        }
      })

      return { datasets, imagesInfo }
    }

    const { datasets: forecastDataSet, imagesInfo } = generateForecastDataSet(forecastDatasets)
    setDatasets(forecastDataSet)

    loadImages(imagesInfo).then((result) => {
      hoverDotImagesRef.current = result
    })
  }, [forecastDatasets])

  useEffect(() => {
    if (!selectedContent) {
      handleRefresh()
    }
  }, [selectedContent, handleRefresh])

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
            <MIButton
              startIcon={<RefreshIcon />}
              onClick={() => handleRefresh(true)}
              contentType={'icon'}
              type={'outlined'}
              toolTipProps={{
                placement: 'top',
                slotProps: {
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -10],
                        },
                      },
                    ],
                  },
                },
              }}
              toolTip={<Typography variant="subtext2">초기화</Typography>}
            />
            <MIButton
              startIcon={<ChartNotificationIcon />}
              onClick={() => setIsOpenSetting(true)}
              contentType={'icon'}
              type={'outlined'}
              toolTipProps={{
                placement: 'top',
                slotProps: {
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -10],
                        },
                      },
                    ],
                  },
                },
              }}
              toolTip={<Typography variant="subtext2">알람 설정</Typography>}
            />
            <MIButton
              startIcon={<ChartDownloadIcon />}
              onClick={handleDownload}
              contentType={'icon'}
              type={'outlined'}
              toolTipProps={{
                placement: 'top',
                slotProps: {
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -10],
                        },
                      },
                    ],
                  },
                },
              }}
              toolTip={<Typography variant="subtext2">다운로드</Typography>}
            />
          </Box>
        </Box>
      )}

      {!isMIAgent && !hideLegend && (
        <MIForecastLegend datasets={datasets} onToggleDataset={handleToggleDataset} selectedContent={selectedContent} />
      )}
      <Box px="18px" height={height} sx={{ position: 'relative' }}>
        <Chart
          ref={chartRef}
          type={'line'}
          data={{
            datasets,
            labels: months.length > 0 ? [null, ...months, null] : [],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            events: ['mouseup', 'mousedown', 'mousemove', 'mouseout'],
            layout: {
              padding: {
                top: 12,
                left: 5,
              },
            },
            elements: {
              line: {
                spanGaps: true,
              },
              point: {
                hoverRadius: 0,
                hitRadius: 0,
                radius: 0,
              },
            },
            scales: {
              x: {
                grid: {
                  display: true,
                  color: theme.palette.gray[50],
                  drawTicks: true,
                  drawOnChartArea: true,
                  lineWidth: 1,
                  tickLength: 0,
                  tickColor: theme.palette.gray[30],
                },
                border: {
                  display: true,
                  dash: [2, 2],
                  width: 1.5,
                  color: '#8B8B8B',
                },
                ticks: {
                  font: {
                    family: 'Pretendard',
                    size: 14,
                    weight: 400,
                  },
                  color: theme.palette.gray[60],
                  padding: 8,
                  callback: (_value: string | number, index: number, ticks: unknown[]) => {
                    if (index === 0 || index === ticks.length - 1) return ''

                    const originalIndex = index - 1
                    const monthValue = months[originalIndex]

                    if (!monthValue) return ''
                    return dayjs(monthValue, 'YYYY-MM').format('YY-MM')
                  },
                },
              },
              y: {
                ...generateYAxis({
                  isMain: true,
                  position: 'left',
                  unit: '',
                  borderColor: '#DEE2E6',
                }),
                grid: {
                  display: true,
                  color: theme.palette.gray[50],
                  drawTicks: true,
                  drawOnChartArea: true,
                  lineWidth: 1,
                  tickLength: 0,
                  tickColor: theme.palette.gray[30],
                },
                border: {
                  display: true,
                  dash: [2, 2],
                  width: 1.5,
                  color: '#8B8B8B',
                },
                ticks: {
                  font: {
                    family: 'Pretendard',
                    size: 14,
                    weight: 400,
                  },
                  color: theme.palette.gray[60],
                  padding: 8,
                  maxTicksLimit: 10,
                },
                /* eslint-disable @typescript-eslint/no-explicit-any */
                afterTickToLabelConversion(axis: any) {
                  if (axis.ticks.length > 0) {
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
                showVerticalLine, // 수직선 보일지 여부
                enable: !inactive, // 기능 활성화 여부
                verticalLinedIndex: 11, // 수직선 그릴 위치
                maxIndex: 11, // 수직선 끝 위치
                onPointerMove: externalTooltipHandler, // 마우스 이동 시 호출
                onViewForecastPoint: viewForecastPointHandler, // 포인트 클릭 시 호출
                hoverImages: hoverDotImagesRef.current, // 마우스 오버 시 마커 이미지
                showForecastTrend, // 예측 라인 표시 여부
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
          }}
          plugins={[verticalLineAndHighlightPlugin, gridAndAxesPlugin]}
        />
        <MIForecastChartTooltip {...tooltip} />
      </Box>
      {isMIAgent && <MIForecastLegend showActual={false} datasets={datasets} onToggleDataset={handleToggleDataset} />}
      <SettingModalComponent open={isOpenSetting} onClose={() => setIsOpenSetting(false)} goodsDataSourceNoList={goodsDataSourceNoList} />
    </Box>
  )
}

const HynixForecastChart = ({ selectedContent, onSelectedContent, data }: HynixForecastChartProps) => {
  const [forecastDatasets, setForecastDatasets] = useState<ForecastDataset[]>([
    {
      data: [],
      label: '',
      color: '',
      hidePoint: true,
      type: 'actualData',
      permission: true,
    },
  ])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [topLabel, setTopLabel] = useState<string>('')

  // 색상 배열을 메모이제이션
  const colorMap = useMemo(() => ['#40597A', '#26757B', '#EFA460', '#94826B', '#EFD485'], [])

  // 날짜 포맷팅 함수를 useCallback으로 메모이제이션
  const formatDate = useCallback((date: string) => {
    const dateObj = new Date(date.replace(' ', 'T'))

    const day = dateObj.getDate()
    const month = dateObj.toLocaleString('en-US', { month: 'long' })
    const year = dateObj.getFullYear()

    return `${month} ${day}, ${year}`
  }, [])

  // data prop이 변경될 때만 실행되도록 수정
  useEffect(() => {
    if (!data) return

    const label = data.charts.map((chart) => chart.chartLineDescription)
    const datasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'FUTURE') {
          const values = (chart.actualChartLines.rawData ?? []).map((item) => item.value)
          return {
            data: values,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'future',
            metadata: {
              goodsDataSourceNo: chart.actualChartLines.goodsDataSourceNo,
            },
            permission: chart.actualChartLines.isPermitted,
          }
        }
        return null
      })
      .filter(Boolean)

    const forecastDatasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'ACTUAL') {
          const value = (chart.forecastChartLines.rawData ?? []).map((item) => item.value)
          return {
            data: value,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'forecast',
            borderDash: [5, 5],
            metadata: {
              goodsDataSourceNo: chart.forecastChartLines.goodsDataSourceNo,
            },
            permission: chart.forecastChartLines.isPermitted,
          }
        }
        return null
      })
      .filter(Boolean)

    const actualDatasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'ACTUAL') {
          const value = (chart.actualChartLines.rawData ?? []).map((item) => item.value)
          return {
            data: value,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'actualData',
            metadata: {
              goodsDataSourceNo: chart.actualChartLines.goodsDataSourceNo,
            },
            permission: chart.actualChartLines.isPermitted,
          }
        }
        return null
      })
      .filter(Boolean)

    setForecastDatasets([...actualDatasets, ...forecastDatasets, ...datasets] as ForecastDataset[])
    setLastUpdated(formatDate(data.dashboardMetadata.lastUpdateDt))
    setTopLabel(`${data.dashboardMetadata.currency}/${data.dashboardMetadata.currentUnitCd}`)
  }, [data, colorMap, formatDate])

  const dates = useMemo(() => {
    if (!data) return []

    for (const chart of data.charts) {
      if (chart.actualChartLines.rawData && chart.actualChartLines.rawData.length > 0) {
        return chart.actualChartLines.rawData.map((item) => item.resultDate)
      }
      if (chart.forecastChartLines.rawData && chart.forecastChartLines.rawData.length > 0) {
        return chart.forecastChartLines.rawData.map((item) => item.resultDate)
      }
    }
    return []
  }, [data])

  return (
    <ForecastChart
      selectedContent={selectedContent}
      onSelectedContent={onSelectedContent}
      forecastDatasets={forecastDatasets}
      months={dates}
      lastUpdated={lastUpdated}
      height={530}
      topLabel={`Unit: ${topLabel}`}
      goodsDataSourceNoList={data.dashboardDataSources.map(({ goodsDataSourceNo, dashboardLineName }) => ({
        goodsDataSourceNm: dashboardLineName,
        goodsDataSourceNo,
        type: 'FORECAST',
      }))}
    />
  )
}

export default HynixForecastChart
