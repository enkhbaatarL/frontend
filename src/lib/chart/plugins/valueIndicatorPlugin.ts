import { Chart, ChartType, InteractionItem, Plugin, Point } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'

import { getFormattedDateFromChart } from '@/lib/chart/utils/chartUtils'
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

const getNonOverlappingTop = (container: HTMLElement, desiredTop: number, height: number): number => {
  const padding = 2
  let newTop = desiredTop

  const existingRects = Array.from(container.children).map((child) => ({
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

const priceIndicatorPlugin: ValueIndicatorPlugin = {
  id: 'priceIndicatorPlugin',
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

        const nearestPoints = chart.getElementsAtEventForMode(event, 'nearest', { axis: 'x', intersect: false }, false)

        if (nearestPoints.length) {
          const focusedPoints = nearestPoints.map((p) => {
            const data = chart.data.datasets[p.datasetIndex].data[p.index]

            return {
              label: chart.data.datasets[p.datasetIndex].label,
              backgroundColor: chart.data.datasets[p.datasetIndex].borderColor as string,
              x: (data as Point).x,
              y: (data as FinancialDataPoint).c || (data as Point).y,
              yAxisID: (chart.data.datasets[p.datasetIndex] as { yAxisID: string }).yAxisID,
              interactionPoint: p,
            }
          })

          this.focusedPoints = focusedPoints.filter((item) => !['MA5', 'MA20', 'MA60', 'MA120'].includes(item.label ?? ''))
        }
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        if (!chart.canvas?.parentElement) return

        this.mousePosition = null
        const mainIndicatorContainer = chart.canvas.parentElement?.querySelector('#main-indicator-container')
        if (mainIndicatorContainer) {
          mainIndicatorContainer.innerHTML = ''
        }
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })
  },

  afterDraw(chart) {
    const mainIndicatorContainer = chart.canvas.parentElement?.querySelector('#main-indicator-container')
    const comparisonIndicatorContainer = chart.canvas.parentElement?.querySelector('#comparison-indicator-container')

    if (!mainIndicatorContainer || !comparisonIndicatorContainer) return

    const chartArea = chart.chartArea

    mainIndicatorContainer.innerHTML = ''
    comparisonIndicatorContainer.innerHTML = ''

    // 메인 값,날짜 표시: crosshair가 있는 경우
    if (
      this.mousePosition &&
      this.mousePosition.x >= chartArea.left &&
      this.mousePosition.x <= chartArea.right &&
      this.mousePosition.y >= chartArea.top &&
      this.mousePosition.y <= chartArea.bottom &&
      this.focusedPoints.length > 0
    ) {
      // 날짜 표시
      const dateBox = document.createElement('div')
      dateBox.id = 'date-indicator'
      dateBox.style.position = 'absolute'
      dateBox.style.left = `${this.focusedPoints[0].interactionPoint.element.x - 46}px`
      dateBox.style.top = `${chartArea.bottom - 26}px`
      dateBox.style.backgroundColor = '#2E3F5E'
      dateBox.style.color = 'white'
      dateBox.style.padding = '2px 8px'
      dateBox.style.borderRadius = '2px'
      dateBox.style.fontSize = '14px'
      dateBox.style.fontWeight = '500'
      dateBox.style.fontFamily = 'Pretendard'
      dateBox.style.whiteSpace = 'nowrap'
      dateBox.textContent = getFormattedDateFromChart(chart, this.focusedPoints[0].interactionPoint.index)
      mainIndicatorContainer.appendChild(dateBox)

      // 값 표시
      let displayedFirstYValue = false
      this.focusedPoints.forEach((p) => {
        if (['Upper BB', 'Middle BB', 'Lower BB'].includes(p.label ?? '')) return

        const yAxisId = p.yAxisID ?? 'y'
        const value = p.y
        if (!value) return

        if (yAxisId === 'y') {
          if (displayedFirstYValue) return

          const valueBox = document.createElement('div')
          valueBox.style.position = 'absolute'
          valueBox.style.backgroundColor = '#2E3F5E'
          valueBox.style.color = 'white'
          valueBox.style.padding = '2px 8px'
          valueBox.style.borderRadius = '2px'
          valueBox.style.fontSize = '14px'
          valueBox.style.fontWeight = '500'
          valueBox.style.fontFamily = 'Pretendard'
          valueBox.style.whiteSpace = 'nowrap'
          valueBox.textContent = formatValue(value)
          mainIndicatorContainer?.appendChild(valueBox)

          const boxHeight = valueBox.offsetHeight ?? 20
          const yPixel = chart.scales[yAxisId].getPixelForValue(value)
          const adjustedTop = getNonOverlappingTop(mainIndicatorContainer as HTMLElement, yPixel - 10, boxHeight)

          valueBox.style.left = `${chartArea.left - valueBox.offsetWidth - 4}px`
          valueBox.style.top = `${adjustedTop}px`

          displayedFirstYValue = true
        }
      })
    }

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

      comparisonIndicatorContainer?.appendChild(labelBox)

      const boxHeight = labelBox.offsetHeight ?? 20
      const adjustedTop = getNonOverlappingTop(comparisonIndicatorContainer as HTMLElement, yPixel - 10, boxHeight)

      labelBox.style.left = `${scale.left + 3}px`
      labelBox.style.top = `${adjustedTop}px`
    })
  },
}

export default priceIndicatorPlugin
