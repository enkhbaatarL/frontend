import { Chart as ChartJS, ScriptableContext, Tooltip, TooltipModel, ActiveElement, Point } from 'chart.js'
import { TreemapController, TreemapElement, TreemapScriptableContext } from 'chartjs-chart-treemap'
import { useEffect, useMemo, useRef } from 'react'

import customLabelPlugin from '@/lib/chart/treemap/plugins/customLabelPlugin'

ChartJS.register(TreemapController, TreemapElement)

interface Props {
  mapData: {
    categoryName?: string
    instrumentNm: string
    correlationCalculationVal: number
  }[]
  useAnimation?: boolean
}

interface TreemapData {
  category?: string
  sector: string
  _key?: string
  value: number
  change: number
}

interface TreemapRawData {
  _data: { children: TreemapData[] }
  x?: number
  y?: number
  w?: number
  h?: number
}

declare module 'chart.js' {
  interface TreemapDatasetProperties {
    borderRadius?: number
    tiling?: string
    ratio?: number
  }
  interface TooltipPositionerMap {
    myCustomPositioner: (this: TooltipModel<'treemap'>, _elements: ActiveElement[], eventPosition: Point) => Point | false
  }
}

Tooltip.positioners.myCustomPositioner = function (_elements: ActiveElement[], eventPosition: Point): Point | false {
  const { width = 0, height = 0, chart } = this
  const { clientWidth: canvasW, clientHeight: canvasH } = chart.canvas
  const { x: mouseX, y: mouseY } = eventPosition

  if (mouseX === null || mouseY === null) return false

  let tx = mouseX + 20
  let ty = mouseY + height + 20

  if (tx + width > canvasW) tx = mouseX - width - 4
  if (ty + height > canvasH) ty = mouseY - 8

  return {
    x: Math.min(Math.max(0, tx), canvasW + width),
    y: Math.min(Math.max(0, ty), canvasH + height),
  }
}

// 박스 면적 범위: 항목 수에 따라 유효 비율 자동 조정 (g=2 -> x2, g>=12 -> x12)
const MIN_VALUE = 6
const MAX_VALUE = 72

const MISignalMap = ({ mapData = [], useAnimation = false }: Props) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const chartInstanceRef = useRef<{ destroy(): void }>(null)

  const data = useMemo(
    () =>
      mapData.map((m) => ({
        category: m.categoryName,
        sector: m.instrumentNm,
        change: m.correlationCalculationVal,
      })),
    [mapData],
  )

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
      gradient.addColorStop(0, '#5D636A')
      gradient.addColorStop(1, '#5D636A')
    } else if (change < 0) {
      if (change > -0.3) {
        gradient.addColorStop(0, '#C74659')
        gradient.addColorStop(1, '#C74659')
      } else if (change > -0.7) {
        gradient.addColorStop(0, '#983846')
        gradient.addColorStop(1, '#983846')
      } else {
        gradient.addColorStop(0, '#6B2935')
        gradient.addColorStop(1, '#6B2935')
      }
    } else {
      if (change < 0.3) {
        gradient.addColorStop(0, '#459578')
        gradient.addColorStop(1, '#459578')
      } else if (change < 0.7) {
        gradient.addColorStop(0, '#397964')
        gradient.addColorStop(1, '#397964')
      } else {
        gradient.addColorStop(0, '#29584A')
        gradient.addColorStop(1, '#29584A')
      }
    }

    return gradient
  }

  useEffect(() => {
    const ctx = chartRef.current?.getContext('2d')
    if (!ctx) return () => {}

    ctxRef.current = ctx
    chartInstanceRef.current?.destroy()

    // 절댓값 toFixed(2) 기준 그룹화 -> 같은 표시값은 반드시 같은 크기
    const displayGroupMap = new Map<string, number[]>()
    data.forEach((item, idx) => {
      const absVal = Math.abs(item.change)
      if (absVal === 0) return
      const key = absVal.toFixed(2)
      if (!displayGroupMap.has(key)) displayGroupMap.set(key, [])
      displayGroupMap.get(key)!.push(idx)
    })

    const sortedGroups = Array.from(displayGroupMap.entries())
      .filter(([key]) => parseFloat(key) > 0)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))

    const g = sortedGroups.length
    const rankValueMap = new Map<number, number>()

    const baseRatio = MAX_VALUE / MIN_VALUE
    const effectiveRatio = Math.pow(baseRatio, Math.min(1, g > 1 ? Math.log(g) / Math.log(baseRatio) : 1))

    sortedGroups.forEach(([, idxList], rankIdx) => {
      const normalized = g > 1 ? rankIdx / (g - 1) : 1
      const value = MIN_VALUE * Math.pow(effectiveRatio, normalized)
      idxList.forEach((idx) => rankValueMap.set(idx, value))
    })

    const normalizedData: TreemapData[] = data.map((item, idx) => ({
      ...item,
      _key: `${item.sector}__${idx}`, // 동일 sector명 병합 방지
      value: item.change === 0 ? MIN_VALUE * 0.8 : (rankValueMap.get(idx) ?? MIN_VALUE),
    }))

    const chart = new ChartJS(ctx, {
      type: 'treemap',
      data: {
        datasets: [
          {
            data: normalizedData,
            key: 'value',
            groups: ['_key'],
            spacing: 1,
            borderWidth: 1,
            borderRadius: 4,
            borderColor: 'transparent',
            captions: {
              display: true,
              align: 'center',
              font: { weight: 'bold', size: 14 },
            },
            backgroundColor: (context: ScriptableContext<'treemap'>) => getSectorColor(context),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: useAnimation && { duration: 2000, easing: 'easeInOutQuint' },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            intersect: false,
            position: 'myCustomPositioner',
            z: 100,
            backgroundColor: 'white',
            titleColor: '#333',
            titleFont: { size: 14, weight: '600', lineHeight: 1 },
            bodyColor: '#333',
            bodyFont: { size: 14, weight: '500', lineHeight: 1 },
            footerColor: '#333',
            footerFont: { size: 24, weight: '600', lineHeight: 1.5 },
            padding: 16,
            displayColors: false,
            borderColor: '#e0e0e0',
            borderWidth: 1,
            caretSize: 0,
            xAlign: 'left',
            yAlign: 'bottom',
            callbacks: {
              title: (context: TreemapScriptableContext[]) => {
                const { category } = (context[0].raw as unknown as TreemapRawData)._data.children[0]
                return category ?? ''
              },
              label: (context: TreemapScriptableContext) => (context.raw as unknown as TreemapRawData)._data.children[0].sector,
              footer: (context: TreemapScriptableContext[]) => {
                const { change } = (context[0].raw as unknown as TreemapRawData)._data.children[0]
                return change.toFixed(2).replace('-', '- ')
              },
            },
            animation: { duration: 100 },
          },
          customLabelPlugin: true,
        },
      },
      plugins: [customLabelPlugin],
    })

    chartInstanceRef.current = chart

    return () => {
      chart.destroy()
    }
  }, [data, useAnimation])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  )
}

export default MISignalMap
