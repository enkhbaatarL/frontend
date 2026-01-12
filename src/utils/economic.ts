import { formatValue } from './number'

/**
 * 경제 지표 값을 포맷팅합니다.
 * @param value - 포맷팅할 값 (null일 수 있음)
 * @param unitPrefix - 단위 접두사 (예: 'K', 'M')
 * @param unit - 단위 (예: '$', '%', 'USD')
 * @returns 포맷팅된 문자열
 */
export const getFormattedValue = (value: number | null, unitPrefix: string | null, unit: string | null): string => {
  if (value === null) return '-'

  const isCurrency = ['$', '€', '¥', '£'].includes(unit ?? '')

  return `${formatValue(value, isCurrency ? (unit ?? '') : '', 'en-US', 1)}${unitPrefix ? unitPrefix : ''}${!isCurrency && unit ? `${unitPrefix ? ' ' : ''}${unit}` : ''}`
}

/**
 * 중요도 레벨에 해당하는 라벨을 반환합니다.
 * @param level - 중요도 레벨 (1: Low, 2: Medium, 3: High)
 * @returns 중요도 라벨 문자열
 */
export const getImportanceLabel = (level: number): string => {
  switch (level) {
    case 3:
      return 'High'
    case 2:
      return 'Medium'
    case 1:
      return 'Low'
    default:
      return 'Not Rated'
  }
}
