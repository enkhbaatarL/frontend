export const require = (v: string, message?: string | boolean) => (v.length === 0 ? message || true : undefined)
export const uppercase = (v: string, message?: string | boolean) =>
  !/^[A-Z0-9]+$/.test(v) ? message || '영문 대문자만 입력 가능합니다.' : undefined
