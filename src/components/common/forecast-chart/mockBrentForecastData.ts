import dayjs from 'dayjs'

import { getRandomNumber } from '@/utils/random'

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

/**
 * Options for generating mock actual data
 */
export interface MockActualDataOptions {
  /** Base price to start from (default: 80) */
  basePrice?: number
  /** Minimum monthly change (default: -5) */
  minChange?: number
  /** Maximum monthly change (default: 5) */
  maxChange?: number
  /** Volatility factor (0-1, default: 0.6) */
  volatility?: number
  /** Number of null values at the beginning (default: 1) */
  leadingNulls?: number
  /** Number of null values at the end (default: 2) */
  trailingNulls?: number
  /** Seasonal factor - adds a slight seasonal pattern (0-1, default: 0.3) */
  seasonality?: number
  /** Trend direction (-1 to 1, negative for downtrend, positive for uptrend, default: 0) */
  trend?: number
}

/**
 * Generates mock actual data based on months
 * @param months - Array of month strings
 * @param options - Configuration options for mock data generation
 * @returns Generated mock actual data array
 */
export const generateMockActualData = (months: string[], options: MockActualDataOptions = {}): (number | null)[] => {
  const {
    basePrice = 80,
    minChange = -5,
    maxChange = 5,
    volatility = 0.6,
    leadingNulls = 1,
    trailingNulls = 2,
    seasonality = 0.3,
    trend = 0,
  } = options

  const result: (number | null)[] = []
  let currentPrice = basePrice

  // Calculate how many actual data points we need
  const dataPointCount = months.length
  const actualDataPointCount = dataPointCount - leadingNulls - trailingNulls

  // Add leading nulls
  for (let i = 0; i < leadingNulls; i++) {
    result.push(null)
  }

  // Generate actual data points
  for (let i = 0; i < actualDataPointCount; i++) {
    // Calculate month index (0-11) for seasonality
    const monthStr = months[i + leadingNulls]
    const monthIndex = parseInt(monthStr.split('-')[1]) - 1 // Extract month from YYYY-MM format

    // Seasonal factor: higher in winter months (Dec-Feb), lower in summer (Jun-Aug)
    // Northern hemisphere seasons
    const winterPeak = monthIndex <= 1 || monthIndex === 11 ? 1 : 0 // Dec, Jan, Feb
    const summerDip = monthIndex >= 5 && monthIndex <= 7 ? -1 : 0 // Jun, Jul, Aug
    const seasonalFactor = (winterPeak + summerDip) * seasonality

    // Random change with volatility
    const changeRange = maxChange - minChange
    const randomChange = minChange + getRandomNumber() * changeRange * volatility

    // Apply trend (increases effect over time)
    const trendEffect = (i / actualDataPointCount) * trend * 2

    // Calculate new price with all factors
    currentPrice += randomChange + seasonalFactor + trendEffect

    // Ensure price doesn't go below a reasonable floor (e.g., 30)
    currentPrice = Math.max(30, currentPrice)

    // Round to whole numbers for actual data
    result.push(Math.round(currentPrice))
  }

  // Add trailing nulls
  for (let i = 0; i < trailingNulls; i++) {
    result.push(null)
  }

  return result
}

const generateForecastByMonth = (actualData: (number | null)[], months: string[]) => {
  // Create a forecast line for each month (including the last one)
  const forecastDatasets = []

  for (let i = 1; i < months.length - 2; i++) {
    // Set the current month's actual value
    const forecastData: Array<number | null> = Array(months.length).fill(null)

    forecastData[i] = actualData[i]

    // Set the next month's forecast value
    forecastData[i + 1] = (actualData[i] as number) * (0.95 + getRandomNumber() * 0.1)

    forecastDatasets.push(forecastData)
  }

  return forecastDatasets
}

const generateForecastByYear = (actualData: (number | null)[], months: string[]) => {
  // Create a forecast line for each month (including the last one)
  const forecastData: Array<number | null> = Array(months.length)
    .fill(null)
    .map((_item, i) => {
      if (actualData[i] === null) return null

      return (actualData[i] as number) * (0.95 + getRandomNumber() * 0.1)
    })

  forecastData.pop()
  forecastData.pop()
  forecastData.push((actualData[1] as number) * (0.95 + getRandomNumber() * 0.1))
  forecastData.push((actualData[2] as number) * (0.95 + getRandomNumber() * 0.1))

  return [forecastData]
}

export const generateForecastDataset = (
  months: string[],
  options?: {
    forecastByMonth?: boolean
    hasForecast?: boolean
    actualDataIsEmpty?: boolean
  },
) => {
  const { forecastByMonth = true, actualDataIsEmpty = false } = options ?? {}

  const actualData = generateMockActualData(months)
  const forecastData = forecastByMonth ? generateForecastByMonth(actualData, months) : generateForecastByYear(actualData, months)

  return {
    data: actualDataIsEmpty ? [] : actualData,
    forecastData,
  }
}
