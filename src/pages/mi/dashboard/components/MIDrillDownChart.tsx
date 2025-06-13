import { Box } from '@mui/material'
import { Chart as ChartJS, ChartDataset } from 'chart.js'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import MIForecastChartTooltip, { MIForecastChartTooltipProps } from '@/components/common/forecast-chart/MIForecastChartTooltip'
import gridAndAxesPlugin from '@/components/common/forecast-chart/plugins/gridAndAxesPlugin'
import loadImages, { createHoverPointDiamonSVG } from '@/components/common/forecast-chart/utils/loadImage'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import SettingModalComponent from '@/pages/mi/dataDetail/components/SettingModalComponent'
import theme from '@/theming'

export interface DrillDownDataset {
  data: (number | null)[]
  color: string
  label: string
  hidePoint?: boolean
  type?: string
  yAxisID?: string
  metadata?: Record<string, unknown>
}

export interface MIDrillDownChartProps {
  height: number | string
  months: (string | null)[]
  datasets: Array<DrillDownDataset>
  topLabel?: string
  bottomLabel?: string
  isPermitted?: boolean
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

const MIDrillDownChart = (props: MIDrillDownChartProps) => {
  const { height, months, datasets, topLabel, bottomLabel } = props
  const chartRef = useRef<ChartJS | null>(null)

  const [tooltip, setTooltip] = useState<MIForecastChartTooltipProps>(initialTooltip)
  const [isOpenSetting, setIsOpenSetting] = useState(false)

  const hoverDotImagesRef = useRef<{ [key: string]: HTMLImageElement | null }>({})
  const [chartDatasets, setChartDatasets] = useState<Array<ChartDataset<'line'> & { category: string; yAxisID: string }>>([])
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null)

  const simpleHoverLinePlugin = {
    id: 'simpleHoverLine',
    afterInit(chart: ChartJS) {
      const canvas = chart.canvas

      canvas.addEventListener('mousemove', (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        mousePositionRef.current = { x, y }

        chart.update('none')

        const activeElements = chart.tooltip?.getActiveElements()

        if (activeElements && activeElements.length > 0) {
          const element = activeElements[0]
          const datasetIndex = element.datasetIndex
          const index = element.index
          const dataset = chart.data.datasets[datasetIndex]
          const chartValue = dataset.data[index] as number
          const chartLabel = chart.data.labels?.[index] as string

          if (chartValue === null || chartLabel === null || chartLabel === undefined) {
            setTooltip((prev) => ({ ...prev, visible: false }))
            return
          }

          const originalIndex = index - 1
          const originalValue = datasets[datasetIndex]?.data[originalIndex]
          const originalLabel = months[originalIndex]

          setTooltip({
            minWidth: 293,
            visible: true,
            viewDetail: false,
            isSimple: true,
            top: y,
            left: x + 20 + 20,
            label: originalLabel ?? chartLabel,
            content: [
              {
                label: dataset?.label ?? '',
                value: originalValue ?? chartValue,
                color: (dataset?.borderColor as string) || '#000000',
              },
            ],
          })
        } else {
          setTooltip((prev) => ({ ...prev, visible: false }))
        }
      })

      canvas.addEventListener('mouseout', () => {
        mousePositionRef.current = null
        setTooltip((prev) => ({ ...prev, visible: false }))
      })
    },
    afterDraw(chart: ChartJS) {
      const tooltip = chart.tooltip
      if (tooltip && tooltip.getActiveElements().length > 0) {
        const ctx = chart.ctx
        const activeElements = tooltip.getActiveElements()
        const activePoint = activeElements[0]
        const datasetIndex = activePoint.datasetIndex
        const index = activePoint.index
        const dataset = chart.data.datasets[datasetIndex]
        const chartValue = dataset.data[index]
        const chartLabel = chart.data.labels?.[index] as string

        if (chartValue === null || chartLabel === null || chartLabel === undefined) {
          return
        }

        const { x } = activePoint.element
        const topY = chart.scales.y.top
        const bottomY = chart.scales.y.bottom

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x, topY)
        ctx.lineTo(x, bottomY)
        ctx.lineWidth = 2
        ctx.strokeStyle = '#333E4B'
        ctx.stroke()
        ctx.restore()

        if (hoverDotImagesRef.current) {
          const point = chart.getDatasetMeta(datasetIndex).data[index]

          if (point && dataset?.label) {
            const img = hoverDotImagesRef.current[dataset.label]
            if (img) {
              const size = 21
              const xPos = point.x - size / 2
              const yPos = point.y - size / 2
              ctx.drawImage(img, xPos, yPos, size, size)
            }
          }
        }
      }
    },
  }

  useEffect(() => {
    if (datasets.length === 0) return
    const generateChartDataSet = (rawDatasets: Array<DrillDownDataset>) => {
      const datasets: Array<ChartDataset<'line'> & { category: string; yAxisID: string }> = []
      const imagesInfo: Record<string, string> = {}

      rawDatasets.forEach((dataset) => {
        const data = dataset.data
        const label = dataset.label
        const color = dataset.color
        const type = dataset.type ?? 'actualData'
        const yAxisID = dataset.yAxisID ?? 'y'

        datasets.push({
          label,
          data: data.length > 0 ? [null, ...data, null] : [],
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointBorderColor: color,
          tension: 0,
          category: type,
          pointRadius: 0,
          pointHoverRadius: 0,
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          yAxisID,
          spanGaps: true,
          metadata: dataset.metadata,
        })

        if (color) {
          imagesInfo[label] = createHoverPointDiamonSVG(color)
        }
      })

      return { datasets, imagesInfo }
    }

    const { datasets: chartDataSet, imagesInfo } = generateChartDataSet(datasets)
    setChartDatasets(chartDataSet)

    loadImages(imagesInfo).then((result) => {
      hoverDotImagesRef.current = result
    })
  }, [datasets])

  return (
    <Box width={'100%'} maxWidth={'100%'} sx={{ boxSizing: 'border-box' }}>
      <Box px="18px" height={height} sx={{ position: 'relative' }}>
        <Chart
          ref={chartRef}
          type={'line'}
          data={{
            datasets: chartDatasets,
            labels: months.length > 0 ? [null, ...months, null] : [],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            events: ['mouseup', 'mousedown', 'mousemove', 'mouseout'],
            interaction: {
              mode: 'index',
              intersect: false,
            },
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
                radius: 0,
                hoverRadius: 0,
                hitRadius: 15,
                borderWidth: 0,
                hoverBorderWidth: 0,
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
                beginAtZero: !props.isPermitted,
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
                topLabel,
                bottomLabel,
              },
              legend: {
                display: false,
              },
              tooltip: {
                enabled: true,
                position: 'nearest',
                mode: 'index',
                intersect: false,
                displayColors: false,
                backgroundColor: 'transparent',
                titleColor: 'transparent',
                bodyColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
              },
              title: {
                display: false,
              },
            },
          }}
          plugins={[simpleHoverLinePlugin, gridAndAxesPlugin]}
        />
        <MIForecastChartTooltip {...tooltip} />
      </Box>
      <SettingModalComponent
        open={isOpenSetting}
        onClose={() => setIsOpenSetting(false)}
        goodsDataSourceNoList={[{ goodsDataSourceNm: '', goodsDataSourceNo: 1, type: 'ACTUAL' }]}
      />
    </Box>
  )
}

export default MIDrillDownChart
