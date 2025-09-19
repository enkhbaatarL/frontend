export const require = (v: string, message?: string | boolean) => (v.length === 0 ? message || true : undefined)

export const uppercase = (v: string, message?: string | boolean) =>
  !/^[A-Z0-9]+$/.test(v) ? message || '영문 대문자만 입력 가능합니다.' : undefined

export const uppercaseWithLength = (value: string, maxLength = 20): string | undefined => {
  if (!value) return undefined
  if (!/^[A-Z]*$/.test(value)) return '영문 대문자만 입력 가능합니다.'
  if (value.length > maxLength) return `최대 ${maxLength}글자까지 입력 가능합니다.`
  return undefined
}

// 시간 형식 유효성 검사 (HH:MM, 00:00-23:59)
export const timeFormat = (value: string, message?: string): string | undefined => {
  if (!value) return undefined

  // 숫자와 콜론만 허용
  if (!/^[\d:]+$/.test(value)) {
    return message ?? '숫자와 콜론(:)만 입력 가능합니다.'
  }

  // HH:MM 형식 검사
  const timeRegex = /^([0-1]?\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(value)) {
    return message ?? '올바른 시간 형식이 아닙니다.'
  }

  return undefined
}

// 일자 형식 유효성 검사 (YYYY-MM-DD)
export const dateFormat = (value: string, message?: string): string | undefined => {
  if (!value) return undefined

  // 숫자와 하이픈만 허용
  if (!/^[\d-]+$/.test(value)) {
    return message ?? '숫자와 하이픈(-)만 입력 가능합니다.'
  }

  // YYYY-MM-DD 형식 검사
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = dateRegex.exec(value)

  if (!match) {
    return message ?? '올바른 날짜 형식이 아닙니다.'
  }

  const [, year, month, day] = match
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)

  // 월 검사 (1-12)
  if (monthNum < 1 || monthNum > 12) {
    return message ?? '월은 01-12 사이의 값이어야 합니다.'
  }

  // 일 검사 (1-31)
  if (dayNum < 1 || dayNum > 31) {
    return message ?? '일은 01-31 사이의 값이어야 합니다.'
  }

  // 실제 날짜 유효성 검사
  const date = new Date(yearNum, monthNum - 1, dayNum)
  if (date.getFullYear() !== yearNum || date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
    return message ?? '유효하지 않은 날짜입니다.'
  }

  return undefined
}

// 제목 길이 유효성 검사
export const titleLength = (value: string, maxLength = 90, message?: string): string | undefined => {
  if (!value) return undefined
  if (value.length > maxLength) {
    return message ?? `제목은 ${maxLength}자 이하로 입력해주세요.`
  }
  return undefined
}

// 내용 길이 유효성 검사
export const contentLength = (value: string, maxLength = 3000, message?: string): string | undefined => {
  if (!value) return undefined
  if (value.length > maxLength) {
    return message ?? `내용은 ${maxLength}자 이하로 입력해주세요.`
  }
  return undefined
}
