import Decimal from 'decimal.js'
import { isLosslessNumber, isSafeNumber, LosslessNumber, parse, stringify } from 'lossless-json'

// Draft API의 정밀도를 보존하고 revision·행 번호 등 안전한 숫자는 number로 유지한다.
export const parseModelInputJson = (text: string): unknown =>
  parse(text, undefined, {
    parseNumber: (value) => (isSafeNumber(value) ? Number(value) : new LosslessNumber(value)),
  })

export const stringifyModelInputJson = (value: unknown): string => {
  const text = stringify(value, undefined, undefined, [
    {
      test: (number) => isLosslessNumber(number) || (typeof number === 'number' && Number.isFinite(number)),
      stringify: (number) => new Decimal(String(number)).toFixed(),
    },
  ])
  if (text === undefined) throw new Error('입력 정보를 직렬화할 수 없습니다.')
  return text
}
