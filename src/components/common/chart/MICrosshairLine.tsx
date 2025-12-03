import { Box } from '@mui/material'
import { Chart as ChartJS, Point, FinancialDataPoint } from 'chart.js'
import { ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef, RefObject } from 'react'

import { setMousePosition } from '@/lib/chart/plugins/volumeTextPlugin'
import { getFormattedDateFromChart } from '@/lib/chart/utils/chartUtils'
import { formatValue } from '@/utils/number'

type ChartPoint = Point | FinancialDataPoint

interface TooltipContent {
  label?: ReactNode
  value?: number
  color?: string
  date: string
  hasDivider?: boolean
  toFixed?: number
}

interface MICrosshairLineProps {
  chartRef: RefObject<ChartJS | null>
  volumeChartRef?: RefObject<ChartJS | null>
  onTooltipChange: (context: { tooltip: { x: number; y: number; content: Record<string, TooltipContent> } | null }) => void
}

export interface MICrosshairLineHandle {
  updateCrosshairPosition: (mouseX: number, mouseY: number, xScaleIndex: number) => void
  handleMouseOut: () => void
  getCanvasRect: () => { left: number; right: number; top: number; bottom: number } | null
}

const LegendIcon = () => (
  <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 11.5L20 11.5" stroke="#40597A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="11" cy="11.5" r="3.25" fill="white" stroke="#40597A" strokeWidth="1.5" />
  </svg>
)

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

const MICrosshairLine = forwardRef<MICrosshairLineHandle, MICrosshairLineProps>(({ chartRef, volumeChartRef, onTooltipChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false)
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null)

  const updateValueAndDateIndicators = useCallback(
    (chart: ChartJS, xScaleIndex: number, mousePos: { x: number; y: number }) => {
      const chartArea = chart.chartArea
      const volumeChartArea = volumeChartRef?.current?.chartArea
      const chartAreaBottom = chartArea.bottom + (volumeChartArea?.bottom ?? 0) - (volumeChartArea?.top ?? 0)

      let mainIndicatorContainer = chart.canvas.parentElement?.querySelector('#main-indicator-container') as HTMLElement

      if (!mainIndicatorContainer) {
        mainIndicatorContainer = createIndicatorContainer('main-indicator-container')
        chart.canvas.parentElement?.appendChild(mainIndicatorContainer)
      }

      mainIndicatorContainer.innerHTML = ''

      const dateBox = document.createElement('div')
      dateBox.id = 'date-indicator'
      dateBox.style.position = 'absolute'
      dateBox.style.left = `${mousePos.x - 46}px`
      dateBox.style.top = `${chartAreaBottom - 26}px`
      dateBox.style.backgroundColor = '#2E3F5E'
      dateBox.style.color = 'white'
      dateBox.style.padding = '2px 8px'
      dateBox.style.borderRadius = '2px'
      dateBox.style.fontSize = '14px'
      dateBox.style.fontWeight = '500'
      dateBox.style.fontFamily = 'Pretendard'
      dateBox.style.whiteSpace = 'nowrap'
      dateBox.textContent = getFormattedDateFromChart(chart, xScaleIndex)
      mainIndicatorContainer.appendChild(dateBox)

      const mainDataset = chart.data.datasets[0]
      if (mainDataset) {
        const data = mainDataset.data[xScaleIndex] as ChartPoint | undefined
        if (data) {
          let value: number | undefined
          if ('y' in data && data.y !== null) value = data.y
          else if ('c' in data && data.c !== null) value = data.c

          if (value !== undefined) {
            const yAxisId = (mainDataset as { yAxisID: string }).yAxisID ?? 'y'
            const toFixed = (mainDataset as { metadata?: { toFixed?: number } }).metadata?.toFixed

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
            valueBox.textContent = formatValue(value, '', 'en-US', toFixed)
            valueBox.dataset.yAxisId = yAxisId
            mainIndicatorContainer.appendChild(valueBox)

            const boxHeight = valueBox.offsetHeight ?? 20
            const yPixel = chart.scales[yAxisId].getPixelForValue(value)
            const adjustedTop = getNonOverlappingTop(mainIndicatorContainer, yPixel - 10, boxHeight, yAxisId)

            if (adjustedTop >= chartArea.top && adjustedTop + boxHeight <= chartArea.bottom) {
              valueBox.style.left = `${chartArea.left - valueBox.offsetWidth - 4}px`
              valueBox.style.top = `${adjustedTop}px`
            }
          }
        }
      }
    },
    [volumeChartRef],
  )

  const handleMouseOut = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const chart = chartRef.current
    const mainIndicatorContainer = chart?.canvas?.parentElement?.querySelector('#main-indicator-container')
    if (mainIndicatorContainer) {
      mainIndicatorContainer.innerHTML = ''
    }

    setMousePosition(null)
    if (volumeChartRef?.current) {
      volumeChartRef.current.update('none')
    }

    onTooltipChange({ tooltip: null })
  }, [chartRef, onTooltipChange, volumeChartRef])

  const updateCrosshairPosition = useCallback(
    (mouseX: number, mouseY: number, xScaleIndex: number) => {
      const chart = chartRef.current
      const canvas = canvasRef.current
      if (!chart || !canvas) return

      const formattedDate = getFormattedDateFromChart(chart, xScaleIndex)

      if (formattedDate === '1970-01-01') {
        handleMouseOut()
        return
      }

      let finalMousePosition: { x: number; y: number }

      if (!isModifierKeyPressed) {
        finalMousePosition = { x: mouseX, y: mouseY }
      } else {
        const mainDataset = chart.data.datasets[0]
        if (!mainDataset) return

        const nearestPoint = mainDataset.data.find((p) => typeof p === 'object' && p !== null && 'x' in p && p.x === xScaleIndex) as
          | ChartPoint
          | undefined

        if (!nearestPoint) return

        let yValue: number | undefined
        if ('y' in nearestPoint && nearestPoint.y !== null) {
          yValue = nearestPoint.y
        } else if ('c' in nearestPoint && nearestPoint.c !== null) {
          yValue = nearestPoint.c
        }

        if (yValue === undefined) return

        const yScale = chart.scales.y
        const yPixel = yScale.getPixelForValue(yValue)

        finalMousePosition = {
          x: chart.scales.x.getPixelForValue(xScaleIndex),
          y: yPixel,
        }
      }

      const chartArea = chart.chartArea
      const volumeChartArea = volumeChartRef?.current?.chartArea

      const top = chartArea.top
      const left = chartArea.left
      const width = chartArea.right - chartArea.left
      const height = chartArea.bottom - chartArea.top + ((volumeChartArea?.bottom ?? 0) - (volumeChartArea?.top ?? 0))

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.style.top = `${top}px`
      canvas.style.left = `${left}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, width, height)

      const canvasX = finalMousePosition.x - left
      const canvasY = finalMousePosition.y - top

      ctx.save()
      ctx.strokeStyle = '#2E3F5E'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])

      ctx.beginPath()
      ctx.moveTo(canvasX, 0)
      ctx.lineTo(canvasX, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, canvasY)
      ctx.lineTo(width, canvasY)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(canvasX, canvasY, 6.2, 0, Math.PI * 2)
      ctx.fillStyle = '#2E3F5E'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(canvasX, canvasY, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#2E3F5E'
      ctx.stroke()

      ctx.setLineDash([])
      ctx.restore()

      if (volumeChartRef?.current) {
        setMousePosition(finalMousePosition.x)
        volumeChartRef.current.update('none')
      }

      updateValueAndDateIndicators(chart, xScaleIndex, finalMousePosition)

      const tooltipContent: Record<string, TooltipContent> = {}

      chart.data.datasets.forEach((dataset, index) => {
        const point = dataset.data.find((p) => typeof p === 'object' && p !== null && 'x' in p && p.x === xScaleIndex) as
          | ChartPoint
          | undefined

        let value: number | undefined
        if (point) {
          if ('y' in point && point.y !== null) value = point.y
          else if ('c' in point && point.c !== null) value = point.c
        }

        tooltipContent[index] = {
          label: (
            <Box display="flex" alignItems="center" height="20px" gap="2px">
              <LegendIcon />
              <Box mt="1px">{dataset.label}</Box>
            </Box>
          ),
          color: (dataset as { metadata?: { chipColor?: string } }).metadata?.chipColor,
          value,
          date: formattedDate,
          hasDivider: (dataset as { metadata?: { hasDivider?: boolean } }).metadata?.hasDivider,
          toFixed: (dataset as { metadata?: { toFixed?: number } }).metadata?.toFixed,
        }
      })

      onTooltipChange({
        tooltip: {
          x: finalMousePosition.x,
          y: finalMousePosition.y,
          content: tooltipContent,
        },
      })

      setLastMousePosition({
        x: mouseX,
        y: mouseY,
      })
    },
    [chartRef, volumeChartRef, isModifierKeyPressed, onTooltipChange, handleMouseOut],
  )

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.key === 'Control' || event.key === 'Meta') && !event.repeat) {
      setIsModifierKeyPressed(true)
    }
  }, [])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Control' || event.key === 'Meta') {
      setIsModifierKeyPressed(false)
    }
  }, [])

  useEffect(() => {
    if (lastMousePosition && chartRef.current) {
      const chart = chartRef.current
      const xScaleIndex = chart.scales.x.getValueForPixel(lastMousePosition.x)

      if (xScaleIndex !== undefined) {
        updateCrosshairPosition(lastMousePosition.x, lastMousePosition.y, xScaleIndex)
      }
    }
  }, [isModifierKeyPressed, updateCrosshairPosition])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return () => {}

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleMouseOut, handleKeyUp])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return () => {}

    const canvas = canvasRef.current
    if (canvas) {
      const chartArea = chart.chartArea
      const volumeChartArea = volumeChartRef?.current?.chartArea

      const top = chartArea.top
      const left = chartArea.left
      const width = chartArea.right - chartArea.left
      const height = chartArea.bottom - chartArea.top + ((volumeChartArea?.bottom ?? 0) - (volumeChartArea?.top ?? 0))

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.style.top = `${top}px`
      canvas.style.left = `${left}px`
    }

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (canvas) {
        const chartArea = chart.chartArea
        const volumeChartArea = volumeChartRef?.current?.chartArea

        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top + ((volumeChartArea?.bottom ?? 0) - (volumeChartArea?.top ?? 0))

        canvas.width = width
        canvas.height = height
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.top = `${top}px`
        canvas.style.left = `${left}px`
      }
    })

    resizeObserver.observe(chart.canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [volumeChartRef])

  const getCanvasRect = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const width = canvas.width
    const height = canvas.height
    const left = parseInt(canvas.style.left)
    const top = parseInt(canvas.style.top)

    return {
      left,
      right: left + width,
      top,
      bottom: top + height,
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      updateCrosshairPosition,
      handleMouseOut,
      getCanvasRect,
    }),
    [updateCrosshairPosition, handleMouseOut, getCanvasRect],
  )

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
})

MICrosshairLine.displayName = 'MICrosshairLine'

export default MICrosshairLine
