export const require = (v: string, message?: string | boolean) => (v.length === 0 ? message || true : undefined)
export const uppercase = (v: string, message?: string | boolean) =>
  !/^[A-Z0-9]+$/.test(v) ? message || '영문 대문자만 입력 가능합니다.' : undefined
export const uppercaseWithLength = (value: string, maxLength = 20): string | undefined => {
  if (!value) return undefined
  if (!/^[A-Z]*$/.test(value)) return '영문 대문자만 입력 가능합니다.'
  if (value.length > maxLength) return `최대 ${maxLength}글자까지 입력 가능합니다.`
  return undefined
}
