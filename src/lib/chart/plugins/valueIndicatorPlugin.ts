import { Chart, ChartType, InteractionItem, Plugin, Point } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'

import { formatValue } from '@/utils/number'

const createIndicatorContainer = (id: string) => {
  const container = document.createElement('div')
  container.id = id
  Object.assign(container.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '100',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  })
  return container
}

const getNonOverlappingTop = (container: HTMLElement, desiredTop: number, height: number, yAxisId: string): number => {
  const padding = 2
  let newTop = desiredTop

  const existingRects = Array.from(container.children)
    .filter((child) => (child as HTMLElement).dataset.yAxisId === yAxisId)
    .map((child) => ({
      top: (child as HTMLElement).offsetTop,
      bottom: (child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight,
    }))

  while (existingRects.some((r) => newTop < r.bottom && newTop + height > r.top)) {
    newTop += height + padding
  }

  return newTop
}

interface ValueIndicatorPlugin extends Plugin {
  id: string
  mousePosition: { x: number; y: number } | null
  focusedPoints: Array<{
    label?: string
    backgroundColor?: string
    x: number
    y: number | null
    yAxisID: string
    interactionPoint: InteractionItem
  }>
  afterDraw(chart: Chart<ChartType>, args: Record<string, never>, options: unknown): void
}

const valueIndicatorPlugin: ValueIndicatorPlugin = {
  id: 'valueIndicatorPlugin',
  mousePosition: null,
  focusedPoints: [],

  afterInit(chart, _arg) {
    // 구조가 변경될 때마다 차트가 다시 그려지므로 html 요소를 제거하고 새로 생성
    chart.canvas.parentElement?.querySelector('#main-indicator-container')?.remove()
    chart.canvas.parentElement?.querySelector('#comparison-indicator-container')?.remove()

    chart.canvas.parentElement?.appendChild(createIndicatorContainer('main-indicator-container'))
    chart.canvas.parentElement?.appendChild(createIndicatorContainer('comparison-indicator-container'))

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        if (!chart.canvas?.parentElement) return

        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        this.mousePosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }

        const xScale = chart.scales.x
        const xScaleIndex = xScale.getValueForPixel(this.mousePosition.x)

        if (xScaleIndex === undefined) return

        this.focusedPoints = chart.data.datasets
          .map((dataset, datasetIndex) => {
            const data = dataset.data[xScaleIndex]

            if (!data) return null

            return {
              label: dataset.label,
              backgroundColor: dataset.borderColor as string,
              x: (data as Point).x,
              y: (data as FinancialDataPoint).c || (data as Point).y,
              yAxisID: (dataset as { yAxisID: string }).yAxisID,
              interactionPoint: {
                datasetIndex,
                index: xScaleIndex,
                element: chart.getDatasetMeta(datasetIndex).data[xScaleIndex],
              },
            }
          })
          .filter((point): point is NonNullable<typeof point> => point !== null)
      } catch (err) {
        console.error(err)
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        if (!chart.canvas?.parentElement) return
        this.mousePosition = null
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })
  },

  afterDraw(chart) {
    const comparisonIndicatorContainer = chart.canvas.parentElement?.querySelector('#comparison-indicator-container')

    if (!comparisonIndicatorContainer) return
    comparisonIndicatorContainer.innerHTML = ''

    const chartArea = chart.chartArea

    // 오른쪽 라벨: 항상 표시
    chart.data.datasets.forEach((dataset) => {
      const yAxisId = (dataset as { yAxisID: string }).yAxisID ?? 'y'
      if (yAxisId === 'y') return

      const borderColor = dataset.borderColor as string

      if (borderColor === 'transparent') return

      const data = dataset.data as (FinancialDataPoint | Point)[]
      if (!data || data.length === 0) return

      const lastPoint = data[data.length - 1]
      const value = (lastPoint as Point).y
      if (!value) return

      const scale = chart.scales[yAxisId]
      const yPixel = scale.getPixelForValue(value)

      const labelBox = document.createElement('div')
      labelBox.style.position = 'absolute'
      labelBox.style.backgroundColor = borderColor
      labelBox.style.color = 'white'
      labelBox.style.padding = '2px 8px'
      labelBox.style.borderRadius = '2px'
      labelBox.style.fontSize = '14px'
      labelBox.style.fontWeight = '500'
      labelBox.style.fontFamily = 'Pretendard'
      labelBox.style.whiteSpace = 'nowrap'
      labelBox.textContent = formatValue(value)
      labelBox.dataset.yAxisId = yAxisId
      comparisonIndicatorContainer?.appendChild(labelBox)

      const boxHeight = labelBox.offsetHeight ?? 20
      const adjustedTop = getNonOverlappingTop(comparisonIndicatorContainer as HTMLElement, yPixel - 10, boxHeight, yAxisId)

      // y축 범위를 벗어나는 경우 최상단 또는 최하단에 고정
      let finalTop = adjustedTop
      if (adjustedTop < chartArea.top) {
        finalTop = chartArea.top
      } else if (adjustedTop + boxHeight > chartArea.bottom) {
        finalTop = chartArea.bottom - boxHeight
      }

      labelBox.style.left = `${scale.left + 3}px`
      labelBox.style.top = `${finalTop}px`
    })
  },
}

export default valueIndicatorPlugin
