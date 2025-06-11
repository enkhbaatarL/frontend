import { Box, Typography } from '@mui/material'
import { Chart as ChartJS, ChartDataset } from 'chart.js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import MIButton from '@/components/common/button/MIButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import ChartNotificationIcon from '@/components/common/forecast-chart/icons/ChartNotificationIcon'
import MIForecastChartTooltip, { MIForecastChartTooltipProps } from '@/components/common/forecast-chart/MIForecastChartTooltip'
import MIForecastLegend from '@/components/common/forecast-chart/MIForecastLegend'
import gridAndAxesPlugin from '@/components/common/forecast-chart/plugins/gridAndAxesPlugin'
import verticalLineAndHighlightPlugin, {
  PointerMoveEventContext,
} from '@/components/common/forecast-chart/plugins/verticalLineAndHighlightPlugin'
import loadImages, {
  createActiveDiamonSVG,
  createHoverDiamonSVG,
  createHoverDotSVG,
  createHoverPointDiamonSVG,
  createMakerSVG,
} from '@/components/common/forecast-chart/utils/loadImage'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MISegmented from '@/components/common/segmentedbtn/MISegmented'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import { IDashboardChartData } from '@/service/mi/dashboardData'
import theme from '@/theming'
import { convertToRgbaWithOpacity } from '@/utils/color'

interface InnovationForecastChartProps {
  months: (string | null)[]
  onViewDetail: (
    content: { label?: string; value?: number; category?: string; color?: string },
    label: string,
    goodsDataSourceNo?: number,
  ) => void
  data: IDashboardChartData
  showDrillDown?: boolean
  setShowDrillDown: (showDrillDown: boolean) => void
}

export interface ForecastDataset {
  data: (number | null)[]
  forecastData?: Array<(number | null)[]>
  color: string
  label: string
  hidePoint?: boolean
  type?: string
  yAxisID?: string
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
  onViewDetail?: (
    content: { label?: string; value?: number; category?: string; color?: string },
    label: string,
    goodsDataSourceNo?: number,
  ) => void
  showDrillDown?: boolean
}

interface DrillDownInnovationForecastChartProps {
  setShowDrillDown: (showDrillDown: boolean) => void
}

const HorizontalChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 18L14 18M4 12L20 12M4 6L10 6" stroke="#343A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PopupIndicatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 28 16" fill="none">
    <path d="M14 0L27.5 16H0.5L14 0Z" fill="#E9ECEF" />
  </svg>
)

const ForecastChart = (props: ForecastChartProps) => {
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
  const chartRef = useRef<ChartJS | null>(null)

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
  const [_goodDataSourceNo, setGoodDataSourceNo] = useState<number | null>(null)

  const externalTooltipHandler = useCallback((context: PointerMoveEventContext) => {
    const { tooltip: chartTooltip, plugin, chart } = context

    if (!chartTooltip) {
      setTooltip((prev) => ({ ...prev, visible: false }))

      return
    }

    if (chartTooltip.viewDetail) {
      props.onViewDetail?.(chartTooltip.content[0], chartTooltip.label, Number(chartTooltip.content[1]))
    }

    setGoodDataSourceNo(Number(chartTooltip.content[1]))

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
  }

  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [datasets, setDatasets] = useState<Array<ChartDataset<'line'> & { category: string; yAxisID: string }>>([])

  const handleToggleDataset = (index: number) => {
    const newDatasets = [...datasets]
    const dataset = newDatasets[index]

    dataset.hidden = !dataset.hidden

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const forecast = newDatasets.filter((item: any) => item.label === `${dataset.label} Forecast`)

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
        const type = dataset.type || 'actualData'
        const yAxisID = dataset.yAxisID || 'y'

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
          spanGaps: true,
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
            data: dataset.data,
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
            yAxisID: dataset.yAxisID || 'y',
            spanGaps: true,
          })
        }
      })

      imagesInfo['marker'] = createMakerSVG('#868E96')

      return { datasets, imagesInfo }
    }
    const prepareData = async () => {
      const { datasets, imagesInfo } = generateForecastDataSet(forecastDatasets)

      setDatasets(datasets)

      const images = await loadImages(imagesInfo)

      hoverDotImagesRef.current = images
    }

    prepareData()
  }, [forecastDatasets])

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
            )}
            <MIButton
              startIcon={<ChartDownloadIcon />}
              // onClick={handleDownload}
              contentType={'icon'}
              type={isMIAgent ? 'ghost' : 'outlined'}
            />
          </Box>
        </Box>
      )}

      {!isMIAgent && !hideLegend && <MIForecastLegend datasets={datasets} onToggleDataset={handleToggleDataset} />}
      <Box px="18px" height={height} sx={{ position: 'relative' }}>
        <Chart
          ref={chartRef}
          type={'line'}
          data={{
            datasets,
            labels: months,
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
                  callback: (_value: string | number, index: number) => {
                    if (index === 0 || index === months.length - 1) return ''
                    return dayjs(months[index], 'YYYY-MM').format('YY-MM')
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
                  stepSize: 0.3,
                  padding: 8,
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
                onViewForecastPoint: viewForecastPointHanlder, // 포인트 클릭 시 호출
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
      <SettingModalComponent
        open={isOpenSetting}
        onClose={() => setIsOpenSetting(false)}
        // onRegister={() => showSnackbar('삭제되었습니다.', { variant: 'success' })}
      />
    </Box>
  )
}

const DrillDownInnovationForecastChart = ({ setShowDrillDown }: DrillDownInnovationForecastChartProps) => (
  // const { data } = useQuery({
  //   queryKey: ['dashboardFactorCategory'],
  //   queryFn: () => dashboardDataService.getDashboardFactorCategory(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0, {
  //     predictDate: monthSelect,
  //     goodsDataSourceNo: chartData?.dashboardMetadata.goodsDataSourceNo,
  //   }),
  // })

  <Box width={'1028px'} mb="24px" mt="35px" sx={{ borderRadius: '4px', backgroundColor: '#E9ECEF', position: 'relative' }}>
    <Box sx={{ position: 'absolute', top: '0px', left: '50%', transform: 'translate(-50%, -100%)', '& svg': { display: 'block' } }}>
      <PopupIndicatorIcon />
    </Box>
    <Box p={'12px'}>
      <Box px={'12px'} pt={'12px'} pb={'10px'} display={'flex'} justifyContent={'space-between'}>
        <Box>
          <Box
            mb="8px"
            sx={{
              display: 'inline-flex',
              backgroundColor: theme.palette.common.white,
              padding: '0 8px',
              borderRadius: '100px',
              alignItems: 'center',
            }}
            height={'20px'}
          >
            <Typography variant="chip2" color="#495057">
              Drill-down
            </Typography>
          </Box>
          <Box mb="8px">
            <Typography variant="body2" color="#495057">
              {/* {selectedContent?.label} / {selectedContent?.date} */}
            </Typography>
          </Box>
          <Box>
            <Typography variant="messageText1" color="#212529" sx={{ marginRight: '2px' }}>
              {/* {selectedContent?.value} */}
            </Typography>
            <Typography variant="body2SB14" color="#212529">
              USD/bb
            </Typography>
          </Box>
        </Box>
        <MIButton
          type="ghost"
          contentType="icon"
          size="h32"
          onClick={() => {
            setShowDrillDown(false)
          }}
        >
          <CloseIcon />
        </MIButton>
      </Box>

      <Box p={'6px'} mt={'10px'}>
        <Box maxWidth={'994px'} p={'24px'} sx={{ backgroundColor: theme.palette.common.white, borderRadius: '4px' }}>
          <Box display={'flex'} gap="6px" mb={'12px'}>
            <HorizontalChartIcon />
            <Typography component={'div'} variant="infoDocument" color="gray.90">
              주요 요인 분석
            </Typography>
          </Box>
          <Box
            display={'flex'}
            gap={'10px'}
            maxWidth={'946px'}
            maxHeight={'100%'}
            flexWrap={'wrap'}
            paddingTop={'10px'}
            paddingBottom={'10px'}
          >
            {[
              {
                value: 'case1',
                label: 'Category 1',
              },
              {
                value: 'case2',
                label: 'Category 2',
              },
              {
                value: 'case3',
                label: 'Category 3',
              },
              {
                value: 'case4',
                label: 'Category 4',
              },
            ].map((data, index) => (
              <MISegmented size="h30" active={true} onClick={() => {}} key={index}>
                {data.label}
              </MISegmented>
            ))}
          </Box>
          <Box padding={'18px 12px 18px 12px'}>
            <Typography variant="body2R14" color="#495057">
              선택한 요인 분류에 대한 설명이 필요한 경우 여기에 작성합니다. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque
              faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed
              diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer
              nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
            </Typography>
          </Box>

          <Box mt={'12px'}>
            {/* <MIInfluenceFactorChart
                height={150}
                decreasingFactors={[
                  {
                    label: 'Decreasing Factor 1',
                    value: 85.0,
                    color: '#A9141A',
                  },
                  {
                    label: 'D Factor 2',
                    value: 40.0,
                    color: '#5B6773',
                  },
                  {
                    label: 'D Factor 3',
                    value: 30.0,
                    color: '#7A8790',
                  },
                  {
                    label: 'D Factor 4',
                    value: 20.0,
                    color: '#8C98A0',
                  },
                  {
                    label: 'D Factor 5',
                    value: 5.0,
                    color: '#9DAFB9',
                  },
                ]}
                increasingFactors={[
                  {
                    label: 'Increasing Factor 1',
                    value: 100.0,
                    color: '#3C8A36',
                  },
                  {
                    label: 'Rig count',
                    value: 80.0,
                    color: '#5B6773',
                  },
                  {
                    label: 'I Factor 3',
                    value: 65.0,
                    color: '#7A8790',
                  },
                  {
                    label: 'I Factor 4',
                    value: 35.0,
                    color: '#8C98A0',
                  },
                  {
                    label: 'I Factor 5',
                    value: 1.0,
                    color: '#9DAFB9',
                  },
                ]}
              /> */}
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
)

const InnovationForecastChart = ({ onViewDetail, data, showDrillDown, setShowDrillDown }: InnovationForecastChartProps) => {
  const [forecastDatasets, setForecastDatasets] = useState<ForecastDataset[]>([
    {
      data: [],
      label: '',
      color: '',
      hidePoint: true,
      type: 'actualData',
    },
  ])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [topLabel, setTopLabel] = useState<string>('')
  const colorMap = ['#40597A', '#26757B', '#EFA460', '#94826B', '#EFD485']

  const formatDate = (date: string) => {
    const dateObj = new Date(date.replace(' ', 'T'))

    const day = dateObj.getDate()
    const month = dateObj.toLocaleString('en-US', { month: 'long' })
    const year = dateObj.getFullYear()

    return `${month} ${day}, ${year}`
  }

  useEffect(() => {
    if (!data) return

    const label = data.charts.map((chart) => chart.chartLineDescription)
    const datasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'FUTURE') {
          const values = chart.actualChartLines.rawData.map((item) => item.value)
          return {
            data: values,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'future',
          }
        }
        return null
      })
      .filter(Boolean)

    const forecastDatasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'ACTUAL') {
          const value = chart.forecastChartLines.rawData.map((item) => item.value)
          return {
            data: value,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'forecast',
            borderDash: [5, 5],
          }
        }
        return null
      })
      .filter(Boolean)

    const actualDatasets = data.charts
      .map((chart, index) => {
        if (chart.actualChartLines.dataType === 'ACTUAL') {
          const value = chart.actualChartLines.rawData.map((item) => item.value)
          return {
            data: value,
            label: label[index],
            color: colorMap[index],
            hidePoint: true,
            type: 'actualData',
          }
        }
        return null
      })
      .filter(Boolean)

    setForecastDatasets([...datasets, ...actualDatasets, ...forecastDatasets] as ForecastDataset[])
    setLastUpdated(formatDate(data.dashboardMetadata.lastUpdateDt))
    setTopLabel(`${data.dashboardMetadata.currency}/${data.dashboardMetadata.currentUnitCd}`)
  }, [data])

  const dates = useMemo(() => {
    const rawDates = data.charts[0].actualChartLines.rawData.map((item) => item.resultDate)
    return [null, ...rawDates, null]
  }, [data])

  return (
    <>
      <ForecastChart
        onViewDetail={onViewDetail}
        forecastDatasets={forecastDatasets}
        months={dates}
        lastUpdated={lastUpdated}
        height={530}
        topLabel={`Unit: ${topLabel}`}
      />
      {showDrillDown && <DrillDownInnovationForecastChart setShowDrillDown={setShowDrillDown} />}
    </>
  )
}

export default InnovationForecastChart
