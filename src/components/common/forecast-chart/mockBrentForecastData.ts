import dayjs from 'dayjs'

/**
 * Options for chart month generation
 */
interface ChartMonthOptions {
  /** Output format (using dayjs format) */
  format?: string
  /** Whether to return timestamps instead of formatted strings */
  timestamps?: boolean
  /** Starting year (full 4-digit year) */
  startYear?: number
  /** Starting month for originalMonths (1-12) */
  startMonth?: number
  /** Number of months in originalMonths */
  monthCount?: number
}

/**
 * Result containing both month arrays
 */
interface ChartMonthResult {
  /** Original months (typically 12 months) */
  originalMonths: string[]
  /** Extended months (with one month before and two after) */
  months: string[]
}

/**
 * Generates month labels for Chart.js
 * @param options - Configuration options
 * @return Object containing both arrays: { originalMonths, months }
 */
export const generateChartMonths = (options: ChartMonthOptions = {}): ChartMonthResult => {
  // Default options
  const { format = 'YYYY-MM', startYear = 2024, startMonth = 6, monthCount = 12 } = options

  const originalMonths: string[] = []
  let currentYear = startYear
  let currentMonth = startMonth

  // Generate originalMonths
  for (let i = 0; i < monthCount; i++) {
    // Create date for first day of month
    const date = new Date(currentYear, currentMonth - 1, 1)

    originalMonths.push(dayjs(date).format(format))

    // Move to next month
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  // Create extended months (adds one month before and two months after)
  const prevMonth = new Date(startYear, startMonth - 2, 1)
  const nextMonth1 = new Date(currentYear, currentMonth - 1, 1)
  const nextMonth2 = new Date(currentYear, currentMonth, 1)

  let months: string[] = []

  // Add one month before
  months.push(dayjs(prevMonth).format(format))

  // Add original months
  months = [...months, ...originalMonths]

  // Add two months after
  ;[nextMonth1, nextMonth2].forEach((date) => {
    months.push(dayjs(date).format(format))
  })

  return { originalMonths, months }
}

export const actualData = [null, 87, 87, 83, 75, 78, 77, 75, 82, 78, 74, 70, 67, null, null]

// Futures data (with null padding)
export const futuresM1Data = [null, 87.5, 84, 81, 74.5, 75, 76, 75.5, 80.5, 77.5, 72, 69.5, 69, null, null]

export const futuresM2Data = [null, 86, 83, 80, 73, 75.5, 76.5, 76, 79, 75, 71, 68, 67, null, null]

/**
 * Options for generating mock futures data
 */
export interface MockFuturesOptions {
  /** Minimum variance from actual data (default: -3) */
  varianceMin?: number
  /** Maximum variance from actual data (default: 3) */
  varianceMax?: number
  /** Bias for trending direction (negative for bearish, positive for bullish, default: 0) */
  trendBias?: number
  /** Whether to maintain null values in the same positions (default: true) */
  maintainNulls?: boolean
  /** Volatility factor (0-1, default: 0.5) */
  volatility?: number
}

/**
 * Scenario configuration for generating futures data
 */
export interface FuturesScenario {
  /** Name identifier for the scenario */
  name: string
  /** Options for generating this scenario */
  options: MockFuturesOptions
}

/**
 * Generate mock futures data based on actual data with configurable parameters
 * @param baseData - The base actual data array
 * @param options - Configuration options for mock data generation
 * @returns Generated mock futures data
 */
export const generateMockFuturesData = (baseData: (number | null)[], options: MockFuturesOptions = {}): (number | null)[] => {
  const { varianceMin = -3, varianceMax = 3, trendBias = 0, maintainNulls = true, volatility = 0.5 } = options

  return baseData.map((value, index) => {
    // Maintain null values if specified
    if (value === null && maintainNulls) {
      return null
    }

    // Skip if value is null but we're not maintaining nulls
    if (value === null) {
      // eslint-disable-next-line no-param-reassign
      value = 0
    }

    // Calculate variance based on volatility
    const varianceRange = varianceMax - varianceMin
    const randomFactor = Math.random() * volatility
    const variance = varianceMin + randomFactor * varianceRange

    // Apply trend bias (increases/decreases over time)
    const trendEffect = (index / baseData.length) * trendBias

    // Calculate final mock value
    const mockValue = value + variance + trendEffect

    // Round to 0.5 increments for more realistic futures pricing
    return Math.round(mockValue * 2) / 2
  })
}

export const generateForecastDatasets = (months: string[]) => {
  // Create a forecast line for each month (including the last one)
  const forecastDatasets = []

  for (let i = 1; i < months.length - 2; i++) {
    // Set the current month's actual value
    const forecastData: Array<number | null> = Array(months.length).fill(null)

    forecastData[i] = actualData[i]

    // Set the next month's forecast value
    forecastData[i + 1] = (actualData[i] as number) * (0.95 + Math.random() * 0.1)

    forecastDatasets.push(forecastData)
  }

  return forecastDatasets
}

export const generateSingleForecastDatasets = (months: string[]) => {
  // Create a forecast line for each month (including the last one)
  const forecastData: Array<number | null> = Array(months.length)
    .fill(null)
    .map((_item, i) => {
      if (actualData[i] === null) return null

      return (actualData[i] as number) * (0.95 + Math.random() * 0.1)
    })

  forecastData.pop()
  forecastData.pop()
  forecastData.push((actualData[1] as number) * (0.95 + Math.random() * 0.1))
  forecastData.push((actualData[2] as number) * (0.95 + Math.random() * 0.1))

  return [forecastData]
}
