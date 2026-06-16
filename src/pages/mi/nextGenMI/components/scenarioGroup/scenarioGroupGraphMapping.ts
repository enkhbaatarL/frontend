import dayjs from 'dayjs'

import type { IScenarioGroupGraphRes } from '@/service/mi/nextGenMI/scenarioGroup'
import type { ChartData } from '@/types/dataDetailChart'

import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import { ChartType } from '@/types/dataDetailChart'

/** ScenarioSummaryChartGraph가 받는 chart 항목(점선 플래그 포함) */
export type ScenarioGroupGraphChart = ChartData & {
  resultDates: string[]
  startDates: string[]
  visibilityKey: string
  isDashed?: boolean
}

/** Base/Scenarios 범례 렌더 메타 (값 가공 아님, 표시용 식별자만) */
export interface ScenarioGroupGraphLegendItem {
  visibilityKey: string
  name: string
  color: string
  isDashed: boolean
  /** 수급모델 실행 전 가격 배열 null → 회색 비활성, 클릭 불가 */
  executed: boolean
}

export interface ScenarioGroupGraphRender {
  charts: ScenarioGroupGraphChart[]
  chartColorMap: Map<string, string>
  /** executed=false 강제 off 항목만 담는다. 사용자 토글과 합성해 사용 */
  forcedHiddenKeys: string[]
  baseLegend: ScenarioGroupGraphLegendItem[]
  scenarioLegend: ScenarioGroupGraphLegendItem[]
}

const SCENARIO_CHART_COLORS = ['#185FA5', '#0F8A72', '#E09A3A', '#C4407A', '#A32D2D', '#2B8EA6', '#7B52B8', '#B8960C', '#3D7D3F', '#6B6A65']

/** Base 시리즈 무채색 점선 팔레트(순서 기준): 첫 시리즈(CME 등) 짙은 회색, 둘째(MI Base) 옅은 회색 */
const BASE_SERIES_COLORS = ['#2F3742', '#7E8794']

const DISABLED_LEGEND_COLOR = '#ADB5BD'

export const scenarioGroupGraphQueryKey = (scenarioGroupId: number, indexName: string) =>
  ['nextGenMIScenarioGroupGraph', scenarioGroupId, indexName] as const

export const baseSeriesVisibilityKey = (seriesId: string): string => `base:${seriesId}`

export const scenarioSeriesVisibilityKey = (scenarioId: number): string => `scenario:${scenarioId}`

/** 일 단위 dates → chart.js 타임스탬프. 디자인 X축은 일 단위(예: 12/01~01/11) */
const buildDailyTimestamps = (dates: string[]): string[] =>
  dates.map((date, index) => {
    const parsed = dayjs(date)
    if (parsed.isValid()) return parsed.startOf('day').format('YYYY-MM-DDTHH:mm:ss')
    return dayjs('2000-01-01').add(index, 'day').format('YYYY-MM-DDTHH:mm:ss')
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

/**
 * IScenarioGroupGraphRes → ScenarioSummaryChartGraph 입력 + Base/Scenarios 범례 메타.
 * 응답 값은 그대로 전달하며 차트 렌더 구조(charts/colorMap)만 구성한다.
 */
export const buildScenarioGroupGraphRender = (data: IScenarioGroupGraphRes): ScenarioGroupGraphRender => {
  const timestamps = buildDailyTimestamps(data.dates)
  const resultDates = timestamps.map((timestamp) => dayjs(timestamp).format('YYYY'))
  const startDates = timestamps.map((timestamp) => dayjs(timestamp).format('YYYYMMDD'))

  const chartColorMap = new Map<string, string>()
  const charts: ScenarioGroupGraphChart[] = []
  const forcedHiddenKeys: string[] = []

  const baseLegend = data.baseSeries.map((series, index) => {
    const visibilityKey = baseSeriesVisibilityKey(series.seriesId)
    const color = BASE_SERIES_COLORS[index] ?? BASE_SERIES_COLORS[BASE_SERIES_COLORS.length - 1]
    chartColorMap.set(series.seriesName, color)
    charts.push(buildChart(series.seriesName, visibilityKey, series.values, data.unit, timestamps, resultDates, startDates, true))
    return { visibilityKey, name: series.seriesName, color, isDashed: true, executed: true }
  })

  const scenarioColors = buildDistinctSeriesColors(SCENARIO_CHART_COLORS, data.scenarioSeries.length)

  const scenarioLegend = data.scenarioSeries.map((series, index) => {
    const visibilityKey = scenarioSeriesVisibilityKey(series.scenarioId)
    const values = series.userAdjustedValues ?? series.baseCaseValues
    const executed = series.executed && values !== null

    if (!executed) {
      forcedHiddenKeys.push(visibilityKey)
      chartColorMap.set(series.scenarioName, DISABLED_LEGEND_COLOR)
      return { visibilityKey, name: series.scenarioName, color: DISABLED_LEGEND_COLOR, isDashed: false, executed: false }
    }

    const color = scenarioColors[index] ?? SCENARIO_CHART_COLORS[0]
    chartColorMap.set(series.scenarioName, color)
    charts.push(buildChart(series.scenarioName, visibilityKey, values ?? [], data.unit, timestamps, resultDates, startDates, false))
    return { visibilityKey, name: series.scenarioName, color, isDashed: false, executed: true }
  })

  return { charts, chartColorMap, forcedHiddenKeys, baseLegend, scenarioLegend }
}

/** Unit 라벨 (buildChartUnit 규칙) */
export const buildScenarioGroupGraphUnit = (currency: string, unit: string): string => {
  if (currency && unit) return `Unit: ${currency}/${unit}`
  if (currency) return `Unit: ${currency}`
  if (unit) return `Unit: ${unit}`
  return 'Unit: -'
}
