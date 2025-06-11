import dayjs from 'dayjs'

/**
 * 다양한 형식의 날짜 문자열을 파싱하여 표준 형식으로 변환합니다.
 * @param dateStr - 파싱할 날짜 문자열
 * @returns 파싱된 날짜 문자열 (YYYY-MM-DD 형식)
 */
export const parseDate = (dateStr: unknown): string => {
  if (!dateStr) return ''

  const str = typeof dateStr === 'string' ? dateStr : ''
  // 날짜 문자열에서 숫자만 추출
  const numbers = str.replace(/\D/g, '')

  try {
    // YYYYMMDD 형식 (8자리)
    if (numbers.length === 8) {
      const year = numbers.substring(0, 4)
      const month = numbers.substring(4, 6)
      const day = numbers.substring(6, 8)
      return `${year}-${month}-${day}`
    }

    // YYYYMM 형식 (6자리)
    if (numbers.length === 6) {
      const year = numbers.substring(0, 4)
      const month = numbers.substring(4, 6)
      return `${year}-${month}`
    }

    // YYMMDD 형식 (6자리)
    if (numbers.length === 6 && parseInt(numbers.substring(0, 2)) < 50) {
      const year = `20${numbers.substring(0, 2)}`
      const month = numbers.substring(2, 4)
      const day = numbers.substring(4, 6)
      return `${year}-${month}-${day}`
    }

    // YYMM 형식 (4자리)
    if (numbers.length === 4 && parseInt(numbers.substring(0, 2)) < 50) {
      const year = `20${numbers.substring(0, 2)}`
      const month = numbers.substring(2, 4)
      return `${year}-${month}`
    }

    // 기본 파싱 시도 (YYYY-MM-DD, YYYY/MM/DD, YYYY-MM, YYYY/MM 등)
    const parsed = dayjs(str)
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD')
    }
  } catch (error) {
    console.error('날짜 파싱 실패:', error)
  }

  return ''
}

/**
 * 날짜 문자열을 특정 형식으로 포맷팅합니다.
 * @param dateStr - 포맷팅할 날짜 문자열
 * @param format - 원하는 출력 형식 (예: 'YYYY-MM-DD', 'MMMM YYYY')
 * @returns 포맷팅된 날짜 문자열
 */
export const formatDate = (dateStr: unknown, format: string = 'YYYY-MM-DD'): string => {
  if (!dateStr) return ''

  const parsedDate = parseDate(dateStr)
  if (!parsedDate) return ''

  return dayjs(parsedDate).format(format)
}

/**
 * 날짜 문자열이 유효한지 검사합니다.
 * @param dateStr - 검사할 날짜 문자열
 * @returns 유효한 날짜인지 여부
 */
export const isValidDate = (dateStr: unknown): boolean => {
  if (!dateStr) return false
  const parsedDate = parseDate(dateStr)
  return dayjs(parsedDate).isValid()
}

/**
 * 날짜 문자열을 ISO 형식으로 변환합니다.
 * @param dateStr - 변환할 날짜 문자열
 * @returns ISO 형식의 날짜 문자열
 */
export const toISODate = (dateStr: unknown): string => {
  if (!dateStr) return ''
  const parsedDate = parseDate(dateStr)
  return dayjs(parsedDate).toISOString()
}
