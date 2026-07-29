import { getRandomNumber } from '@/utils/random'

/**
 * 지정된 길이의 랜덤 문자열을 생성합니다.
 * @param length 생성할 문자열의 길이
 * @returns 랜덤 문자열
 */
export const getRandomString = (length: number) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz        '
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(getRandomNumber() * characters.length))
  }
  return result
}
