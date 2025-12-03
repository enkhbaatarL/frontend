/**
 * 쿠키 설정 함수
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param expiryDays 만료일 (일 단위)
 */
export const setCookie = (name: string, value: string, expiryDays: number) => {
  const date = new Date()
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

/**
 * 쿠키 가져오기 함수
 * @param name 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export const getCookie = (name: string): string | null => {
  const cookieName = `${name}=`
  const cookies = document.cookie.split(';')

  for (const cookieStr of cookies) {
    const cookie = cookieStr.trim()
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length, cookie.length)
    }
  }
  return null
}

/**
 * 쿠키 삭제 함수
 * @param name 쿠키 이름
 */
export const removeCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}
