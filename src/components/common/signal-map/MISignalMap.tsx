import { Chart as ChartJS, ScriptableContext, Tooltip, TooltipModel, ActiveElement, Point } from 'chart.js'
import { TreemapController, TreemapElement, TreemapScriptableContext } from 'chartjs-chart-treemap'
import { useEffect, useRef } from 'react'

import customLabelPlugin from '@/lib/chart/treemap/plugins/customLabelPlugin'

ChartJS.register(TreemapController, TreemapElement)

interface Props {
  data: {
    sector: string
    change: number
  }[]
  thresholdLevels?: number
  useAnimation?: boolean
}

interface TreemapData {
  sector: string
  value: number
  change: number
  level?: number
}

interface TreemapRawData {
  _data: {
    children: TreemapData[]
  }
  x?: number
  y?: number
  w?: number
  h?: number
  level?: number
}

declare module 'chart.js' {
  interface TreemapDatasetProperties {
    borderRadius?: number
    tiling?: string
    ratio?: number
  }
  // 사용자 정의 타입 추가
  interface TooltipPositionerMap {
    myCustomPositioner: (this: TooltipModel<'treemap'>, _elements: ActiveElement[], eventPosition: Point) => Point | false
  }
}

Tooltip.positioners.myCustomPositioner = function (_elements: ActiveElement[], eventPosition: Point): Point | false {
  const { width, height, chart } = this

  const tooltipWidth = width ?? 0
  const tooltipHeight = height ?? 0

  const canvas = chart.canvas
  const canvasWidth = canvas.clientWidth
  const canvasHeight = canvas.clientHeight

  const { x: mouseX, y: mouseY } = eventPosition

  // 1. 기본 툴팁 위치: 우하단
  let targetX = mouseX + 20
  let targetY = mouseY + tooltipHeight + 20

  // 2. 오른쪽 경계 확인 및 조정
  const wouldExceedRight = targetX + tooltipWidth > canvasWidth
  if (wouldExceedRight) {
    // 오른쪽 경계를 넘으면 마우스 기준 왼쪽으로 이동
    targetX = mouseX - tooltipWidth - 4
  }

  // 3. 아래쪽 경계 확인 및 조정
  const wouldExceedBottom = targetY + tooltipHeight > canvasHeight
  if (wouldExceedBottom) {
    // 아래쪽 경계를 넘으면 마우스 기준 위쪽으로 이동
    targetY = mouseY - 8
  }

  // 4. 캔버스 경계 확인 및 최종 조정 (Clamp)
  // 좌/상/우/하 경계 확인 및 조정
  let finalX = Math.max(0, targetX)
  let finalY = Math.max(0, targetY)
  finalX = Math.min(finalX, canvasWidth + tooltipWidth)
  finalY = Math.min(finalY, canvasHeight + tooltipHeight)

  return {
    x: finalX,
    y: finalY,
  }
}

const MISignalMap = ({ data = [], thresholdLevels = 4, useAnimation = false }: Props) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const chartInstanceRef = useRef<{ destroy:() => void }>(null)

  const formatChange = (change: number | undefined) => (typeof change === 'number' ? `${change.toFixed(2)}%` : 'N/A')

  const getSectorColor = (context: ScriptableContext<'treemap'>) => {
    const raw = context.raw as TreemapRawData
    const change = raw._data?.children[0].change

    if (!ctxRef.current || change === undefined) return 'transparent'

    const x = Math.floor(raw.x ?? 0)
    const y = Math.floor(raw.y ?? 0)
    const width = Math.floor(raw.w ?? 0)
    const height = Math.floor(raw.h ?? 0)

    const gradient = ctxRef.current.createLinearGradient(x, y, x + width, y + height)

    if (change === 0) {
      gradient.addColorStop(0, '#DEDEDE')
      gradient.addColorStop(1, '#DEDEDE')
    } else if (change < 0) {
      if (change > -0.4) {
        gradient.addColorStop(0, '#C2AAAD')
        gradient.addColorStop(1, '#AD8389')
      } else if (change > -0.7) {
        gradient.addColorStop(0, '#C7515E')
        gradient.addColorStop(1, '#99323D')
      } else {
        gradient.addColorStop(0, '#B32332')
        gradient.addColorStop(1, '#77131E')
      }
    } else if (change > 0) {
      if (change < 0.4) {
        gradient.addColorStop(0, '#99B5AE')
        gradient.addColorStop(1, '#6A867F')
      } else if (change < 0.7) {
        gradient.addColorStop(0, '#3F9E80')
        gradient.addColorStop(1, '#277F64')
      } else {
        gradient.addColorStop(0, '#006F4E')
        gradient.addColorStop(1, '#09543C')
      }
    }

    return gradient
  }

  const normalizeToLevel = (change: number, levels: number, maxChangeValue: number): number => {
    // 변화율이 0인 경우 다른 항목보다 작게 표시하기 위해 0 반환 (제일 끝에 배치)
    if (change === 0) {
      return 0
    }

    // levels가 1인 경우 미계산
    if (levels === 1) {
      return 1
    }

    const relativePosition = Math.abs(change) / maxChangeValue // 절대값으로 크기 비교
    const adjustedPosition = Math.sqrt(relativePosition)
    const level = Math.ceil(adjustedPosition * levels)

    // 레벨이 0이 되지 않도록 최소 1 보장
    return Math.max(1, Math.min(level, levels))
  }

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d')
    if (!ctx) return () => {}

    ctxRef.current = ctx

    // 이전 차트 인스턴스 제거
    chartInstanceRef.current?.destroy()

    // 데이터 최대 변화율 계산 (0인 경우 제외)
    const nonZeroChanges = data.map((item: { change: number }) => Math.abs(item.change)).filter((change: number) => change > 0)
    const maxChange = Math.max(...nonZeroChanges)

    const normalizedData: TreemapData[] = data.map((item) => {
      const level = normalizeToLevel(item.change, thresholdLevels, maxChange)

      let normalizedValue = 4 + Math.pow(2, level)

      // 변화율이 0인 경우(레벨 0) 레벨 1보다 아주 미세하게 작은 값 할당
      if (level === 0) {
        normalizedValue = 4 + Math.pow(2, 1) - 0.01
      }

      return {
        ...item,
        value: normalizedValue,
        level,
      }
    })

    const chart = new ChartJS(ctx, {
      type: 'treemap',
      data: {
        datasets: [
          {
            data: normalizedData,
            key: 'value',
            groups: ['sector'],
            spacing: 0.5,
            borderWidth: 1,
            borderRadius: 3,
            borderColor: 'transparent',
            captions: {
              display: true,
              align: 'center',
              font: {
                weight: 'bold',
                size: 14,
              },
            },
            labels: {
              display: false,
              formatter: (context: TreemapScriptableContext) => {
                const { sector, change, level } = (context.raw as unknown as TreemapRawData)._data.children[0]
                return [sector, formatChange(change), level ? `Level: ${level}` : '']
              },
              color: 'white',
            },
            backgroundColor: (context: ScriptableContext<'treemap'>) => getSectorColor(context),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: useAnimation && {
          duration: 2000,
          easing: 'easeInOutQuint',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            intersect: false,
            position: 'myCustomPositioner',
            z: 100,
            backgroundColor: 'white',
            titleColor: '#333',
            titleFont: {
              size: 14,
              weight: 'normal',
            },
            bodyColor: '#333',
            bodyFont: {
              size: 24,
              weight: 'normal',
            },
            padding: 16,
            displayColors: false,
            borderColor: '#e0e0e0',
            borderWidth: 1,
            caretSize: 0,
            xAlign: 'left',
            yAlign: 'bottom',
            callbacks: {
              title: (context: TreemapScriptableContext[]) => {
                const { sector } = (context[0].raw as unknown as TreemapRawData)._data.children[0]
                return sector
              },
              label: (context: TreemapScriptableContext) => {
                const { change } = (context.raw as unknown as TreemapRawData)._data.children[0]
                return change.toFixed(2).replace('-', '- ')
              },
            },
            animation: {
              duration: 100,
            },
          },
          customLabelPlugin: true,
        },
      },
      plugins: [customLabelPlugin],
    })

    // 차트 인스턴스 저장
    chartInstanceRef.current = chart

    return () => {
      chart.destroy()
    }
  }, [data, thresholdLevels, useAnimation]) // 차트 다시 그리기

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <canvas ref={chartRef} />
    </div>
  )
}

export default MISignalMap
