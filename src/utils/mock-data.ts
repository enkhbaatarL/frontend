import { OHLCData } from '@/components/common/chart/type'

export const getRandomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export const getMockTableData = (schema: Record<string, string[] | number[] | boolean[]>, numberOfRecord: number) => {
  const keys = Object.keys(schema)

  return Array(numberOfRecord)
    .fill(null)
    .map((_, idx) => {
      const mockData: Record<string, unknown> = {}

      keys.forEach((key) => {
        mockData.id = idx
        mockData[key] = getRandomItem<unknown>(schema[key])
      })

      return mockData
    })
}

export const getMockOHLCData = (count: number, interval: 'day' | 'month' | 'year' = 'day'): OHLCData[] => {
  const data: OHLCData[] = []
  let basePrice = 100
  const now = new Date()

  // Create more realistic market patterns
  let trendPhase = 0 // 0: consolidation, 1: uptrend, 2: correction, 3: ranging
  let trendStrength = 1
  let trendDuration = 0

  // Adjust max duration based on time interval
  const durationMultiplier = interval === 'day' ? 1 : interval === 'month' ? 0.3 : 0.1
  let maxTrendDuration = Math.floor(Math.random() * 15 * durationMultiplier) + Math.ceil(10 * durationMultiplier)

  // Adjust volatility based on time interval
  const volatilityMultiplier = interval === 'day' ? 1 : interval === 'month' ? 2.5 : 4

  for (let i = 0; i < count; i++) {
    const date = new Date(now)

    // Set date based on interval
    switch (interval) {
      case 'day':
        date.setDate(now.getDate() - (count - i))
        break
      case 'month':
        date.setMonth(now.getMonth() - (count - i))
        date.setDate(1) // First day of month
        break
      case 'year':
        date.setFullYear(now.getFullYear() - (count - i))
        date.setMonth(0) // January
        date.setDate(1) // First day of year
        break
    }

    // Manage trend phases
    trendDuration++
    if (trendDuration >= maxTrendDuration) {
      // Switch trend phase
      trendPhase = (trendPhase + 1) % 4
      trendDuration = 0
      maxTrendDuration = Math.floor(Math.random() * 15 * durationMultiplier) + Math.ceil(5 * durationMultiplier)

      // Reset or adjust trend strength
      trendStrength = Math.random() * 0.8 + 0.6
    }

    // Generate price movement based on trend phase
    let volatility = 1.5 * volatilityMultiplier
    let bias = 0

    switch (trendPhase) {
      case 0: // Consolidation
        volatility = 1 * volatilityMultiplier
        // bias = 0
        break
      case 1: // Uptrend
        volatility = 2 * volatilityMultiplier
        bias = 0.8 * trendStrength
        break
      case 2: // Correction
        volatility = 2.5 * volatilityMultiplier
        bias = -1.2 * trendStrength
        break
      case 3: // Ranging
        volatility = 1.8 * volatilityMultiplier
        bias = Math.sin(i * 0.2) * 0.5 // Oscillating bias
        break
    }

    // Add occasional volatility spikes - more likely in longer timeframes
    const spikeChance = interval === 'day' ? 0.08 : interval === 'month' ? 0.15 : 0.25

    if (Math.random() < spikeChance) {
      volatility *= 1.8
    }

    // Calculate price change with bias
    const change = (Math.random() * 2 - 1) * volatility + bias

    const open = basePrice
    const close = basePrice + change
    const high = Math.max(open, close) + Math.random() * volatility
    const low = Math.min(open, close) - Math.random() * volatility

    data.push({
      time: date,
      open,
      high,
      low,
      close,
    })

    // Set the next period's base price
    basePrice = close

    // Add occasional pullbacks within trends
    if (trendPhase === 1 && Math.random() < 0.2) {
      basePrice -= Math.random() * volatility * 0.8
    } else if (trendPhase === 2 && Math.random() < 0.2) {
      basePrice += Math.random() * volatility * 0.5
    }
  }

  return data
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param data Array of price values
 * @param period Period for the moving average
 * @returns Array of SMA values
 */
export const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0

    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    sma.push(sum / period)
  }

  return sma
}

/**
 * Calculate Bollinger Bands
 * @param data Array of price values
 * @param period Period for the moving average
 * @param multiplier Standard deviation multiplier (typically 2)
 * @returns Object containing upper and lower bands
 */
export const calculateBollingerBands = (
  data: number[],
  period: number,
  multiplier: number,
): {
  upper: number[]
  lower: number[]
} => {
  const sma = calculateSMA(data, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = period - 1; i < data.length; i++) {
    // Calculate standard deviation
    let sumSquaredDiff = 0

    for (let j = 0; j < period; j++) {
      const diff = data[i - j] - sma[i - (period - 1)]

      sumSquaredDiff += diff * diff
    }
    const stdDev = Math.sqrt(sumSquaredDiff / period)

    // Calculate upper and lower bands
    upper.push(sma[i - (period - 1)] + multiplier * stdDev)
    lower.push(sma[i - (period - 1)] - multiplier * stdDev)
  }

  return { upper, lower }
}

export const genMockDataForLineChart = (numberRecords: number) =>
  Array(numberRecords)
    .fill(null)
    .map(() => Math.floor(Math.random() * 30) + 20)

// Generate timestamps for the first day of each month in the last 12 months
export const generateMonthlyTimestamps = (months: number = 12) => {
  const timestamps = []
  const currentDate = new Date()

  // Start from 12 months ago
  currentDate.setMonth(currentDate.getMonth() - (months - 1))

  // Set to first day of month
  currentDate.setDate(1)
  currentDate.setHours(0, 0, 0, 0)

  // Generate timestamps for 12 months
  for (let i = 0; i < months; i++) {
    timestamps.push(currentDate.getTime())

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return timestamps
}
