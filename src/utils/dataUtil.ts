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
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }),
  ) as Partial<T>

/**
 * 차트 데이터에서 유효한 숫자 값들만 필터링
 * @param values 숫자 배열 (null, undefined, NaN 포함 가능)
 * @returns 유효한 숫자 값들만 포함된 배열
 */
export const filterValidChartValues = (values: (number | null | undefined)[]): number[] =>
  values.filter((value) => value !== null && value !== undefined && !isNaN(value)) as number[]
