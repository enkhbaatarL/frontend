const unit = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * 용량 단위 변환
 * @param bytes 바이트
 * @param options 옵션 - fixedUnit: 고정 단위, fixedDecimal: 소수점 자리수
 * @returns 변환된 숫자와 단위
 */
export const formatFileSize = (bytes: number, options: { fixedUnit?: (typeof unit)[number]; fixedDecimal?: number } = {}) => {
  const { fixedUnit, fixedDecimal = 2 } = options

  if (bytes === 0) return `0 ${fixedUnit ?? 'B'}`

  if (fixedUnit) {
    const i = unit.indexOf(fixedUnit)
    if (i > -1) {
      return `${(bytes / Math.pow(1024, i)).toFixed(fixedDecimal)} ${fixedUnit}`
    }
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const unitIndex = Math.max(0, Math.min(i, unit.length - 1))

  return `${(bytes / Math.pow(1024, unitIndex)).toFixed(fixedDecimal)} ${unit[unitIndex]}`
}

export const removeObjectEmptyValues = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === '' || value === null || value === undefined) return false
      return !(Array.isArray(value) && value.length === 0)
    }),
  ) as Partial<T>

/**
 * 차트 데이터에서 유효한 숫자 값들만 필터링
 * @param values 숫자 배열 (null, undefined, NaN 포함 가능)
 * @returns 유효한 숫자 값들만 포함된 배열
 */
export const filterValidChartValues = (values: (number | null | undefined)[]): number[] =>
  values.filter((value) => value !== null && value !== undefined && !Number.isNaN(value)) as number[]

export type ChartYAxisRange = { min: number; max: number; step: number }

/**
 * y축 min/max 범위 계산 — 적절한 단위(step)를 자동으로 계산하고 퍼센트 패딩 적용
 */
export const calculateYAxisRange = (
  values: (number | null | undefined)[],
  paddingTop: number = 0,
  paddingBottom: number = 0,
  showNearAxis: boolean = false,
): ChartYAxisRange => {
  if (!values.length) return { min: 0, max: 0, step: 1 }

  const validValues = filterValidChartValues(values)
  if (!validValues.length) return { min: 0, max: 0, step: 1 }

  const minValue = Math.min(...validValues)
  const maxValue = Math.max(...validValues)
  const range = maxValue - minValue

  if (range === 0) {
    const center = minValue
    const padding = Math.max(1, Math.abs(center) * 0.1) || 1
    return {
      min: center - padding,
      max: center + padding,
      step: 1,
    }
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(range)))
  const normalizedRange = range / magnitude

  let step: number
  if (normalizedRange <= 1) {
    step = 0.1 * magnitude
  } else if (normalizedRange <= 2) {
    step = 0.2 * magnitude
  } else if (normalizedRange <= 5) {
    step = 0.5 * magnitude
  } else {
    step = magnitude
  }

  let min = Math.floor(minValue / step) * step
  let max = Math.ceil(maxValue / step) * step

  const adjustedRange = max - min
  const topPadding = (adjustedRange * paddingTop) / 100
  const bottomPadding = (adjustedRange * paddingBottom) / 100

  min = min - bottomPadding
  max = max + topPadding

  if (showNearAxis) {
    min = Math.floor(min - step)
    max = Math.ceil(max + step)
  }

  return { min, max, step }
}
