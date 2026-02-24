import { Chart as ChartJS, Point, FinancialDataPoint } from 'chart.js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef, RefObject } from 'react'

import { formatValue } from '@/utils/number'

type ChartPoint = Point | FinancialDataPoint

interface TooltipContent {
  label?: string
  value?: number
  color?: string
  date: string
  predictDate?: string | null
  startDate?: string
  toFixed?: number
  isForecast?: boolean
  goodsDataSourceNo?: number
}

interface ForecastCrosshairLineProps {
  chartRef: RefObject<ChartJS | null>
  onTooltipChange: (context: { tooltip: { x: number; y: number; content: Record<string, TooltipContent> } | null }) => void
  hideBottomDateLabel?: boolean // 크로스라인 하단 날짜 표시 숨김
  useXAxisLabelInTooltip?: boolean // X축 라벨(resultDates) 사용 (예: 26-1Q)
}

export interface ForecastCrosshairLineHandle {
  updateCrosshairPosition: (mouseX: number, mouseY: number, xScaleIndex: number, ignoreFixedPosition?: boolean) => void
  handleMouseOut: () => void
  getCanvasRect: () => { left: number; right: number; top: number; bottom: number } | null
  setFixedPosition: (xScaleIndex: number | null, pixelX: number, hideTooltip?: boolean) => void
}

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

const ForecastCrosshairLine = forwardRef<ForecastCrosshairLineHandle, ForecastCrosshairLineProps>(
  ({ chartRef, onTooltipChange, hideBottomDateLabel = false, useXAxisLabelInTooltip = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null)
    const [fixedPositionState, setFixedPositionState] = useState<{ xScaleIndex: number; pixelX: number } | null>(null)

    const updateValueAndDateIndicators = useCallback(
      (chart: ChartJS, xScaleIndex: number, mousePos: { x: number; y: number }, isFixedMode: boolean = false) => {
        const chartArea = chart.chartArea
        const chartAreaBottom = chartArea.bottom

        const chartWrapper = chart.canvas.parentElement
        const chartParent = chartWrapper?.parentElement
        const appendTarget = chartParent ?? chartWrapper
        let mainIndicatorContainer = appendTarget?.querySelector('#main-indicator-container') as HTMLElement

        if (!mainIndicatorContainer) {
          mainIndicatorContainer = createIndicatorContainer('main-indicator-container')
          appendTarget?.appendChild(mainIndicatorContainer)
        }

        mainIndicatorContainer.innerHTML = ''

        if (!hideBottomDateLabel) {
          const dateBox = document.createElement('div')
          dateBox.id = 'date-indicator'
          dateBox.style.position = 'absolute'
          dateBox.style.backgroundColor = 'black'
          dateBox.style.color = 'white'
          dateBox.style.padding = '2px 6px'
          dateBox.style.fontSize = '14px'
          dateBox.style.fontWeight = '300'
          dateBox.style.fontFamily = 'Pretendard'
          dateBox.style.whiteSpace = 'nowrap'
          dateBox.style.boxSizing = 'border-box'
          // timestamps는 "축 기준"을 사용해야 Index fallback이 발생하지 않는다.
          // 우선순위: plugins.gridAndAxes.timestamps -> dataset metadata.timestamps
          const pluginTimestamps =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((chart.config.options as any)?.plugins?.gridAndAxes?.timestamps as string[] | undefined) ?? []
          const firstDataset = chart.data.datasets[0]
          const metadata = (firstDataset as { metadata?: { timestamps?: string[] } })?.metadata
          const timestamps = pluginTimestamps.length > 0 ? pluginTimestamps : metadata?.timestamps || []
          const roundedIndex = Math.round(xScaleIndex)
          const timestamp = timestamps[roundedIndex]
          dateBox.textContent = timestamp ? dayjs(timestamp).format('YY/MM/DD') : `Index: ${roundedIndex}`
          mainIndicatorContainer.appendChild(dateBox)

          const dateBoxWidth = dateBox.offsetWidth
          const dateBoxHeight = dateBox.offsetHeight

          // x축 라벨 위치 계산 (마우스 X 위치를 기준으로 중앙 정렬)
          const desiredLeft = mousePos.x - dateBoxWidth / 2

          // 차트 영역 내로 제한 (좌우 경계 체크)
          const minLeft = chartArea.left
          const maxLeft = chartArea.right - dateBoxWidth

          let finalLeft: number
          if (desiredLeft < minLeft) {
            finalLeft = minLeft
          } else if (desiredLeft > maxLeft) {
            finalLeft = maxLeft
          } else {
            finalLeft = desiredLeft
          }

          dateBox.style.left = `${finalLeft}px`
          dateBox.style.top = `${chartAreaBottom - dateBoxHeight}px`
        }

        // 고정 모드가 아닐 때만 Y축 라벨 표시
        if (!isFixedMode) {
          const mainDataset = chart.data.datasets[0]
          if (mainDataset) {
            const yAxisId = (mainDataset as { yAxisID: string }).yAxisID ?? 'y'

            // 마우스 Y 위치를 차트 Y 스케일 값으로 변환
            const yScale = chart.scales[yAxisId]

            // y축 범위에 따라 소수점 자릿수 계산
            let toFixed = (mainDataset as { metadata?: { toFixed?: number } }).metadata?.toFixed ?? 2
            if (yScale) {
              const yRange = yScale.max - yScale.min
              if (yRange > 0) {
                const labelStep = yRange / 5
                const magnitude = Math.floor(Math.log10(labelStep))
                toFixed = Math.max(0, -magnitude)
              }
            }

            const mouseYValue = yScale.getValueForPixel(mousePos.y)

            if (mouseYValue !== null && mouseYValue !== undefined) {
              const valueBox = document.createElement('div')
              valueBox.style.position = 'absolute'
              valueBox.style.backgroundColor = 'black'
              valueBox.style.color = 'white'
              valueBox.style.padding = '2px 14px'
              valueBox.style.fontSize = '14px'
              valueBox.style.fontWeight = '300'
              valueBox.style.fontFamily = 'Pretendard'
              valueBox.style.whiteSpace = 'nowrap'
              valueBox.style.boxSizing = 'border-box'
              valueBox.textContent = formatValue(mouseYValue, '', 'en-US', toFixed)
              valueBox.dataset.yAxisId = yAxisId
              mainIndicatorContainer.appendChild(valueBox)

              const boxHeight = valueBox.offsetHeight ?? 20
              const boxWidth = valueBox.offsetWidth ?? 0

              // 마우스 Y 위치를 기준으로 라벨 위치 계산 (라벨 중앙이 마우스 Y 위치)
              const desiredTop = mousePos.y - boxHeight / 2

              // 차트 영역 내로 제한
              const minTop = chartArea.top
              const maxTop = chartArea.bottom - boxHeight

              const topThreshold = minTop + boxHeight * 1.5

              let finalTop: number

              if (desiredTop < minTop) {
                finalTop = minTop
              } else if (desiredTop <= topThreshold) {
                finalTop = Math.max(minTop, desiredTop)
              } else if (desiredTop > maxTop) {
                finalTop = maxTop
              } else {
                let adjustedTop = getNonOverlappingTop(mainIndicatorContainer, desiredTop, boxHeight, yAxisId)

                if (adjustedTop < minTop) {
                  adjustedTop = minTop
                } else if (adjustedTop > maxTop) {
                  adjustedTop = maxTop
                }

                finalTop = adjustedTop
              }

              valueBox.style.left = `${chartArea.left - boxWidth}px`
              valueBox.style.top = `${finalTop}px`
            }
          }
        }
      },
      [hideBottomDateLabel],
    )

    const handleMouseOut = useCallback(() => {
      // 고정 모드가 아닐 때만 크로스라인 숨김
      if (!fixedPositionState) {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        const chart = chartRef.current
        const chartParent = chart?.canvas?.parentElement?.parentElement
        const mainIndicatorContainer = (chartParent ?? chart?.canvas?.parentElement)?.querySelector('#main-indicator-container')
        if (mainIndicatorContainer) {
          mainIndicatorContainer.innerHTML = ''
        }

        // lastMousePosition을 초기화하여, 이후 updateCrosshairPosition이 재생성될 때
        // useEffect가 마지막 위치로 크로스라인을 다시 그리지 않도록 방지
        setLastMousePosition(null)
        onTooltipChange({ tooltip: null })
      }
    }, [chartRef, onTooltipChange, fixedPositionState])

    const setFixedPosition = useCallback(
      (xScaleIndex: number | null, pixelX: number, hideTooltip: boolean = true) => {
        if (xScaleIndex === null) {
          setFixedPositionState(null)
          // 고정 해제 시 크로스라인 숨김 (hideTooltip이 true일 때만 툴팁도 숨김)
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
          }
          const chart = chartRef.current
          const chartParent = chart?.canvas?.parentElement?.parentElement
          const mainIndicatorContainer = (chartParent ?? chart?.canvas?.parentElement)?.querySelector('#main-indicator-container')
          if (mainIndicatorContainer) {
            mainIndicatorContainer.innerHTML = ''
          }
          // hideTooltip이 true일 때는 완전히 숨기므로 lastMousePosition도 초기화하여 useEffect가 다시 그리지 않도록 함
          if (hideTooltip) {
            setLastMousePosition(null)
            onTooltipChange({ tooltip: null })
          }
        } else {
          setFixedPositionState({ xScaleIndex, pixelX })
        }
      },
      [onTooltipChange, chartRef],
    )

    const updateCrosshairPosition = useCallback(
      (mouseX: number, mouseY: number, xScaleIndex: number, ignoreFixedPosition: boolean = false) => {
        const chart = chartRef.current
        const canvas = canvasRef.current
        if (!chart || !canvas) return

        // ignoreFixedPosition이 true이면 fixedPosition을 무시하고 일반 모드로 동작
        const effectiveFixedPosition = ignoreFixedPosition ? null : fixedPositionState

        // timestamps는 "축 기준"을 사용해야 Index fallback이 발생하지 않는다.
        // 우선순위: plugins.gridAndAxes.timestamps -> dataset metadata.timestamps
        const pluginOptions =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (chart.config.options as any)?.plugins?.gridAndAxes ?? {}
        const pluginTimestamps = (pluginOptions.timestamps as string[] | undefined) ?? []
        const pluginResultDates = (pluginOptions.resultDates as string[] | undefined) ?? []
        const firstDataset = chart.data.datasets[0]
        const metadata = (firstDataset as { metadata?: { timestamps?: string[]; predictDates?: string[]; startDates?: string[] } })
          ?.metadata
        const timestamps = pluginTimestamps.length > 0 ? pluginTimestamps : metadata?.timestamps || []
        const predictDates = metadata?.predictDates || []
        const startDates = metadata?.startDates || []
        const roundedIndex = Math.round(xScaleIndex)
        const timestamp = timestamps[roundedIndex]
        const formattedDate =
          useXAxisLabelInTooltip && pluginResultDates[roundedIndex]
            ? pluginResultDates[roundedIndex]
            : timestamp
              ? dayjs(timestamp).format('YYYY/MM/DD')
              : `Index: ${roundedIndex}`
        const predictDate = predictDates[roundedIndex] || null

        const finalMousePosition: { x: number; y: number } = { x: mouseX, y: mouseY }

        const chartArea = chart.chartArea

        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top

        canvas.width = width
        canvas.height = height
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.top = `${top}px`
        canvas.style.left = `${left}px`

        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        if (!ctx) return

        ctx.imageSmoothingEnabled = false

        ctx.clearRect(0, 0, width, height)

        // 픽셀 정렬을 위해 좌표를 정수로 반올림하고 0.5 오프셋 추가
        const canvasX = Math.round(finalMousePosition.x - left) + 0.5
        const canvasY = Math.round(finalMousePosition.y - top) + 0.5

        ctx.save()

        // 고정 모드인 경우 X축만 검은색 실선으로 표시, Y축은 표시하지 않음
        if (effectiveFixedPosition) {
          const fixedCanvasX = Math.round(effectiveFixedPosition.pixelX - left) + 0.5
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 1
          ctx.setLineDash([]) // 실선
          ctx.beginPath()
          ctx.moveTo(fixedCanvasX, 0)
          ctx.lineTo(fixedCanvasX, height)
          ctx.stroke()
        } else {
          // 일반 모드: 점선으로 X축과 Y축 모두 표시
          ctx.strokeStyle = '#868E96'
          ctx.lineWidth = 1
          ctx.setLineDash([6, 6])
          ctx.beginPath()
          ctx.moveTo(canvasX, 0)
          ctx.lineTo(canvasX, height)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(0, canvasY)
          ctx.lineTo(width, canvasY)
          ctx.stroke()
        }

        ctx.restore()

        // 크로스라인 위치의 데이터 포인트에 점 표시
        // 고정 모드일 때도 점을 표시
        const displayXScaleIndex = effectiveFixedPosition ? effectiveFixedPosition.xScaleIndex : roundedIndex
        const displayCanvasX = effectiveFixedPosition ? Math.round(effectiveFixedPosition.pixelX - left) + 0.5 : canvasX

        ctx.save()
        ctx.imageSmoothingEnabled = false
        const pointRadius = 3
        const pointBorderWidth = 1

        // 인덱스가 높은 데이터셋이 위에 표시되도록 역순으로 순회
        for (let i = chart.data.datasets.length - 1; i >= 0; i--) {
          const dataset = chart.data.datasets[i]
          // 데이터셋이 숨겨져 있으면 건너뛰기
          const meta = chart.getDatasetMeta(i)
          if (meta.hidden) continue

          // companyNo 2015: forecast junction point는 크로스헤어 점을 그리지 않음
          const datasetMetadata = (dataset as { metadata?: { skipForTooltipIndices?: number[] } }).metadata
          const pointIndex = Math.round(displayXScaleIndex)
          if (datasetMetadata?.skipForTooltipIndices?.includes(pointIndex)) continue

          // xScaleIndex에 해당하는 데이터 포인트 찾기
          const point = dataset.data.find((p) => typeof p === 'object' && p !== null && 'x' in p && p.x === displayXScaleIndex) as
            | ChartPoint
            | undefined

          if (!point) continue

          let yValue: number | null = null
          if ('y' in point && point.y !== null && typeof point.y === 'number') {
            yValue = point.y
          } else if ('c' in point && point.c !== null && typeof point.c === 'number') {
            yValue = point.c
          }

          if (yValue === null) continue

          // yAxisID 가져오기
          const yAxisId = (dataset as { yAxisID?: string }).yAxisID ?? 'y'
          const yScale = chart.scales[yAxisId]
          if (!yScale) continue

          // y 값을 픽셀 좌표로 변환하고 픽셀 정렬
          const pointPixelY = yScale.getPixelForValue(yValue)
          // 픽셀 중앙에 정렬 (이미 canvasX도 +0.5로 정렬되어 있음)
          const pointCanvasY = Math.round(pointPixelY - top) + 0.5

          // 차트 영역 내에 있는지 확인
          if (pointCanvasY < 0 || pointCanvasY > height) continue

          // 픽셀 정렬된 좌표로 원 그리기 (canvasX와 pointCanvasY는 이미 픽셀 중앙에 정렬됨)
          // 하얀 원 그리기
          ctx.beginPath()
          ctx.arc(displayCanvasX, pointCanvasY, pointRadius, 0, Math.PI * 2)
          ctx.fillStyle = '#FFFFFF'
          ctx.fill()

          // 검은 외곽선 그리기
          ctx.beginPath()
          ctx.arc(displayCanvasX, pointCanvasY, pointRadius, 0, Math.PI * 2)
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = pointBorderWidth
          ctx.stroke()
        }

        ctx.restore()

        if (effectiveFixedPosition) {
          // 고정 모드일 때는 고정된 위치로 인디케이터 업데이트 (Y축 라벨은 표시하지 않음)
          const fixedMousePos = { x: effectiveFixedPosition.pixelX, y: finalMousePosition.y }
          updateValueAndDateIndicators(chart, effectiveFixedPosition.xScaleIndex, fixedMousePos, true)
        } else {
          // 고정 모드가 아닐 때만 인디케이터 업데이트
          updateValueAndDateIndicators(chart, xScaleIndex, finalMousePosition, false)
        }

        // 고정 모드일 때는 고정된 인덱스 사용
        const tooltipXScaleIndex = effectiveFixedPosition ? effectiveFixedPosition.xScaleIndex : xScaleIndex
        const tooltipFormattedDate = effectiveFixedPosition
          ? (() => {
            const fixedIndex = Math.round(effectiveFixedPosition.xScaleIndex)
            if (useXAxisLabelInTooltip && pluginResultDates[fixedIndex]) {
              return pluginResultDates[fixedIndex]
            }
            const fixedTimestamp = timestamps[fixedIndex]
            return fixedTimestamp ? dayjs(fixedTimestamp).format('YYYY/MM/DD') : `Index: ${fixedIndex}`
          })()
          : formattedDate
        const tooltipPredictDate = effectiveFixedPosition
          ? predictDates[Math.round(effectiveFixedPosition.xScaleIndex)] || null
          : predictDate
        const tooltipStartDate = effectiveFixedPosition
          ? startDates[Math.round(effectiveFixedPosition.xScaleIndex)] || undefined
          : startDates[roundedIndex] || undefined

        const tooltipContent: Record<string, TooltipContent> = {}

        chart.data.datasets.forEach((dataset, index) => {
          const point = dataset.data.find((p) => typeof p === 'object' && p !== null && 'x' in p && p.x === tooltipXScaleIndex) as
            | ChartPoint
            | undefined

          let value: number | undefined
          if (point) {
            if ('y' in point && point.y !== null) value = point.y
            else if ('c' in point && point.c !== null) value = point.c
          }

          const datasetMetadata = (
            dataset as {
              metadata?: {
                isDashed?: boolean
                chipColor?: string
                toFixed?: number
                goodsDataSourceNo?: number
                predictDates?: string[]
                startDates?: string[]
                skipForTooltipIndices?: number[]
              }
            }
          ).metadata
          const isForecast = datasetMetadata?.isDashed ?? false
          const chipColor = datasetMetadata?.chipColor

          // companyNo 2015: forecast junction point는 툴팁에서 null처럼 표시
          const tooltipPointIndex = Math.round(tooltipXScaleIndex)
          const shouldSkipForTooltip = datasetMetadata?.skipForTooltipIndices?.includes(tooltipPointIndex)
          const displayValue = shouldSkipForTooltip ? undefined : value

          // 해당 데이터셋의 predictDate 찾기 (isForecast인 경우에만)
          const datasetPredictDate =
            isForecast && datasetMetadata?.predictDates
              ? datasetMetadata.predictDates[tooltipXScaleIndex] || tooltipPredictDate
              : tooltipPredictDate

          const datasetStartDate = datasetMetadata?.startDates
            ? datasetMetadata.startDates[Math.round(tooltipXScaleIndex)] || tooltipStartDate
            : tooltipStartDate

          tooltipContent[index] = {
            label: dataset.label,
            color: chipColor,
            value: displayValue,
            date: tooltipFormattedDate,
            predictDate: datasetPredictDate,
            startDate: datasetStartDate,
            toFixed: datasetMetadata?.toFixed,
            isForecast,
            goodsDataSourceNo: datasetMetadata?.goodsDataSourceNo,
          }
        })

        const tooltipPosition = effectiveFixedPosition
          ? { x: effectiveFixedPosition.pixelX, y: finalMousePosition.y }
          : { x: finalMousePosition.x, y: finalMousePosition.y }

        onTooltipChange({
          tooltip: {
            x: tooltipPosition.x,
            y: tooltipPosition.y,
            content: tooltipContent,
          },
        })

        setLastMousePosition({
          x: mouseX,
          y: mouseY,
        })
      },
      [chartRef, onTooltipChange, updateValueAndDateIndicators, fixedPositionState, useXAxisLabelInTooltip],
    )

    useEffect(() => {
      if (lastMousePosition && chartRef.current) {
        const chart = chartRef.current
        const xScaleIndex = chart.scales.x.getValueForPixel(lastMousePosition.x)

        if (xScaleIndex !== undefined) {
          updateCrosshairPosition(lastMousePosition.x, lastMousePosition.y, xScaleIndex)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateCrosshairPosition])

    // 고정 위치가 변경되면 크로스라인 업데이트
    useEffect(() => {
      const chart = chartRef.current
      if (!chart) return

      if (fixedPositionState) {
        const chartArea = chart.chartArea
        const mouseY = chartArea.top + chartArea.height / 2
        updateCrosshairPosition(fixedPositionState.pixelX, mouseY, fixedPositionState.xScaleIndex)
      } else if (lastMousePosition) {
        // 고정이 풀리는 순간 캔버스가 지워지므로, 마지막 마우스 위치(lastMousePosition)가 있다면 해당 위치를 기반으로 크로스헤어와 툴팁 재생성
        const xScaleIndex = chart.scales.x.getValueForPixel(lastMousePosition.x)
        if (xScaleIndex !== undefined) {
          updateCrosshairPosition(lastMousePosition.x, lastMousePosition.y, xScaleIndex)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fixedPositionState])

    useEffect(() => {
      const chart = chartRef.current
      if (!chart) return undefined

      const canvas = canvasRef.current
      if (canvas) {
        const chartArea = chart.chartArea

        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top

        canvas.width = width
        canvas.height = height
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.top = `${top}px`
        canvas.style.left = `${left}px`
      }

      const resizeObserver = new ResizeObserver(() => {
        const currentCanvas = canvasRef.current
        if (currentCanvas) {
          const chartArea = chart.chartArea

          const top = chartArea.top
          const left = chartArea.left
          const width = chartArea.right - chartArea.left
          const height = chartArea.bottom - chartArea.top

          currentCanvas.width = width
          currentCanvas.height = height
          currentCanvas.style.width = `${width}px`
          currentCanvas.style.height = `${height}px`
          currentCanvas.style.top = `${top}px`
          currentCanvas.style.left = `${left}px`
        }
      })

      resizeObserver.observe(chart.canvas)

      return () => {
        resizeObserver.disconnect()
      }
    }, [chartRef])

    const getCanvasRect = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const width = canvas.width
      const height = canvas.height
      const left = Number.parseInt(canvas.style.left)
      const top = Number.parseInt(canvas.style.top)

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
        setFixedPosition,
      }),
      [updateCrosshairPosition, handleMouseOut, getCanvasRect, setFixedPosition],
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
  },
)

ForecastCrosshairLine.displayName = 'ForecastCrosshairLine'

export default ForecastCrosshairLine
