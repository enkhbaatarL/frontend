import { ChartTypeRegistry } from 'chart.js'

declare module 'chart.js' {
  interface PluginOptionsByType<_Type extends keyof ChartTypeRegistry> {
    intersectionMarker?: {
      labels: string[]
    }
    fillBetween?: {
      labels: string[]
      fillColor?: string
    }
  }
}
