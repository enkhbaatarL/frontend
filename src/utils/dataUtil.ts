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
