import { TooltipPositionerFunction } from 'chart.js'

export interface OHLCData {
  time: Date
  open: number
  high: number
  low: number
  close: number
}

export interface LineData {
  time: Date
  value: number | null
}

export type ChartType = 'candlestick' | 'line'

declare module 'chart.js' {
  interface TooltipPositionerMap {
    pointerPositioner: TooltipPositionerFunction<ChartType>
  }
}
