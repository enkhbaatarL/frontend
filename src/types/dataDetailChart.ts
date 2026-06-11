export enum ChartType {
  LINE = 'LINE',
  CANDLE = 'CANDLE',
}

export enum MinInterval {
  DAILY = 'D',
  WEEKLY = 'W',
  MONTHLY = 'M',
  YEARLY = 'Y',
}

export enum ChartInterval {
  DAY = '1D',
  WEEK = '1W',
  TWO_WEEKS = '2W',
  MONTH = '1M',
  THREE_MONTHS = '3M',
  SIX_MONTHS = '6M',
  YEAR = '1Y',
}

export enum ChartRange {
  WEEK = '1W',
  MONTH = '1M',
  THREE_MONTHS = '3M',
  SIX_MONTHS = '6M',
  YEAR = '1Y',
  TWO_YEARS = '2Y',
  CUSTOM = 'CUSTOM',
}

export interface ChartMetadata {
  currency: string
  currentUnitCd: string
  currentInterval: ChartInterval
  currentRange: ChartRange
  currentRangeBetween: string[]
  initialChartType: ChartType
  changeableUnitCd: string[]
  latestDate: string
  isYAxisSeparated: boolean
}

export interface ChartSeries {
  seriesId: string
  label: string
  renderAs: 'MAIN' | 'COMPARISON'
  values: (number | null)[]
  isVisible: boolean
}

export interface ChartData {
  goodsNo?: number
  goodsDataNo?: number
  goodsDataName: string
  goodsDataSourceNo: number
  goodsDataSourceName: string
  unitCd: string
  chartType: ChartType
  timestamps: string[]
  series: ChartSeries[]
}

export interface Indicator {
  indicatorType: string
  timestamps: string[]
  series: ChartSeries[]
}

export interface DataDetailChart {
  metadata: ChartMetadata
  mainChart: ChartData
  indicators: Indicator[]
  comparisonCharts: ChartData[]
}

export interface ScenarioPriceSeries {
  indexName: string
  values: number[]
  scenarioId?: number
}

export interface ScenarioPriceForecast {
  currency: string
  unit: string
  dates: string[]
  series: ScenarioPriceSeries[]
}
