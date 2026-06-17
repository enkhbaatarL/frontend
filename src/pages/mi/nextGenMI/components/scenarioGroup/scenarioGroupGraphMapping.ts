import dayjs from 'dayjs'

import type { IScenarioGroupGraphRes, ScenarioGroupGraphPeriodUnit } from '@/service/mi/nextGenMI/scenarioGroup'
import type { ChartData } from '@/types/dataDetailChart'

import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import { ChartType } from '@/types/dataDetailChart'

export type ScenarioGroupGraphChart = ChartData & {
  resultDates: string[]
  startDates: string[]
  visibilityKey: string
  isDashed?: boolean
  badge?: 'BC' | 'UA'
}

export type ScenarioGroupGraphLegendVariant = 'line' | 'nonExecuted' | 'discarded'

export interface ScenarioGroupGraphLegendItem {
  visibilityKey: string
  name: string
  color: string
  hasUA: boolean
  variant: ScenarioGroupGraphLegendVariant
  statusLabel?: string
  realized?: boolean
  scenarioId?: number
  toggleKeys: string[]
}

export interface ScenarioGroupGraphRender {
  charts: ScenarioGroupGraphChart[]
  chartColorMap: Map<string, string>
  periodUnit: ScenarioGroupGraphPeriodUnit
  baseLegend: ScenarioGroupGraphLegendItem[]
  scenarioLegend: ScenarioGroupGraphLegendItem[]
}

export interface ScenarioGroupGraphFilter {
  showNonExecuted: boolean
  showDiscarded: boolean
}

const SCENARIO_CHART_COLORS = ['#185FA5', '#0F8A72', '#E09A3A', '#C4407A', '#A32D2D', '#2B8EA6', '#7B52B8', '#B8960C', '#3D7D3F', '#6B6A65']

const BASE_SERIES_COLORS = ['#2F3742', '#7E8794']

const DISABLED_LEGEND_COLOR = '#ADB5BD'

export const scenarioGroupGraphQueryKey = (scenarioGroupId: number, indexName: string, periodUnit: ScenarioGroupGraphPeriodUnit) =>
  ['nextGenMIScenarioGroupGraph', scenarioGroupId, indexName, periodUnit] as const

export const baseSeriesVisibilityKey = (seriesId: string): string => `base:${seriesId}`

export const scenarioBcVisibilityKey = (scenarioId: number): string => `scenario:${scenarioId}:BC`

export const scenarioUaVisibilityKey = (scenarioId: number): string => `scenario:${scenarioId}:UA`

const buildPeriodTimestamps = (dates: string[], periodUnit: ScenarioGroupGraphPeriodUnit): string[] =>
  dates.map((date, index) => {
    const parsed = dayjs(date)
    if (parsed.isValid()) {
      return periodUnit === 'yearly' ? parsed.startOf('year').format('YYYY-MM-DD') : parsed.startOf('month').format('YYYY-MM-DD')
    }
    return dayjs('2000-01-01')
      .add(index, periodUnit === 'yearly' ? 'year' : 'month')
      .format('YYYY-MM-DD')
  })

const buildChart = (
  name: string,
  visibilityKey: string,
  values: (number | null)[],
  unit: string,
  timestamps: string[],
  resultDates: string[],
  startDates: string[],
  isDashed: boolean,
  badge?: 'BC' | 'UA',
): ScenarioGroupGraphChart => ({
  goodsDataSourceName: name,
  goodsDataSourceNo: 0,
  goodsDataName: name,
  unitCd: unit,
  chartType: ChartType.LINE,
  timestamps,
  resultDates,
  startDates,
  visibilityKey,
  isDashed,
  badge,
  series: [
    {
      seriesId: 'main',
      label: name,
      renderAs: 'MAIN',
      values,
      isVisible: true,
    },
  ],
})

export const buildScenarioGroupGraphRender = (data: IScenarioGroupGraphRes, filter: ScenarioGroupGraphFilter): ScenarioGroupGraphRender => {
  const dateFormat = data.periodUnit === 'yearly' ? 'YYYY' : 'YYYY-MM'
  const timestamps = buildPeriodTimestamps(data.dates, data.periodUnit)
  const resultDates = timestamps.map((timestamp) => dayjs(timestamp).format(dateFormat))
  const startDates = timestamps.map((timestamp) => dayjs(timestamp).format('YYYYMMDD'))

  const chartColorMap = new Map<string, string>()
  const charts: ScenarioGroupGraphChart[] = []

  const baseLegend = data.baseSeries.map((series, index): ScenarioGroupGraphLegendItem => {
    const visibilityKey = baseSeriesVisibilityKey(series.seriesId)
    const color = BASE_SERIES_COLORS[index] ?? BASE_SERIES_COLORS[BASE_SERIES_COLORS.length - 1]
    chartColorMap.set(series.seriesName, color)
    charts.push(buildChart(series.seriesName, visibilityKey, series.values, data.unit, timestamps, resultDates, startDates, false))
    return { visibilityKey, name: series.seriesName, color, hasUA: false, variant: 'line', toggleKeys: [visibilityKey] }
  })

  const filteredScenarioSeries = data.scenarioSeries
    .filter((series) => {
      if (!filter.showDiscarded && series.status === 'discarded') return false
      if (!filter.showNonExecuted && !series.executed) return false
      return true
    })
    .sort((a, b) => Number(b.status === 'realized') - Number(a.status === 'realized'))

  const scenarioColors = buildDistinctSeriesColors(SCENARIO_CHART_COLORS, filteredScenarioSeries.length)

  const scenarioLegend = filteredScenarioSeries.map((series, index): ScenarioGroupGraphLegendItem => {
    const bcKey = scenarioBcVisibilityKey(series.scenarioId)
    const uaKey = scenarioUaVisibilityKey(series.scenarioId)
    const hasBC = series.baseCaseValues !== null
    const hasUA = series.userAdjustedValues !== null
    const isDiscarded = series.status === 'discarded'
    const isActive = !isDiscarded && series.executed && (hasBC || hasUA)

    if (!isActive) {
      return {
        visibilityKey: bcKey,
        name: series.scenarioName,
        color: DISABLED_LEGEND_COLOR,
        hasUA: false,
        variant: isDiscarded ? 'discarded' : 'nonExecuted',
        statusLabel: isDiscarded ? '폐기' : '미실행',
        scenarioId: series.scenarioId,
        toggleKeys: [],
      }
    }

    const color = scenarioColors[index] ?? SCENARIO_CHART_COLORS[0]
    chartColorMap.set(series.scenarioName, color)

    const toggleKeys: string[] = []
    if (hasBC) {
      charts.push(
        buildChart(series.scenarioName, bcKey, series.baseCaseValues ?? [], data.unit, timestamps, resultDates, startDates, false, 'BC'),
      )
      toggleKeys.push(bcKey)
    }
    if (hasUA) {
      charts.push(
        buildChart(series.scenarioName, uaKey, series.userAdjustedValues ?? [], data.unit, timestamps, resultDates, startDates, true, 'UA'),
      )
      toggleKeys.push(uaKey)
    }

    const isRealized = series.status === 'realized'

    return {
      visibilityKey: hasBC ? bcKey : uaKey,
      name: series.scenarioName,
      color,
      hasUA,
      variant: 'line',
      statusLabel: isRealized ? '실현' : undefined,
      realized: isRealized,
      scenarioId: series.scenarioId,
      toggleKeys,
    }
  })

  return { charts, chartColorMap, periodUnit: data.periodUnit, baseLegend, scenarioLegend }
}

export const buildScenarioGroupGraphUnit = (currency: string, unit: string): string => {
  if (currency && unit) return `Unit: ${currency}/${unit}`
  if (currency) return `Unit: ${currency}`
  if (unit) return `Unit: ${unit}`
  return 'Unit: -'
}
