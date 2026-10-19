/** 곱셈·나눗셈의 부동소수점 오차 없이 비율과 백분율의 소수점 위치를 옮긴다. */
const shiftDecimalPoint = (value: string, places: number) => {
  const text = value.trim()
  if (text === '' || !Number.isFinite(Number(text))) return value

  const [coefficient, exponent = '0'] = text.toLowerCase().split('e')
  const fraction = coefficient.split('.')[1] ?? ''
  const integer = BigInt(coefficient.replace('.', ''))
  const scale = fraction.length - Number(exponent) - places
  if (scale <= 0) return String(integer * 10n ** BigInt(-scale))

  const digits = String(integer < 0n ? -integer : integer).padStart(scale + 1, '0')
  const decimal = digits.slice(-scale).replace(/0+$/, '')
  return `${integer < 0n ? '-' : ''}${digits.slice(0, -scale)}${decimal ? `.${decimal}` : ''}`
}

export const getPowerMixPercentValue = (value: string) => shiftDecimalPoint(value, 2)

export const getPowerMixRatioValue = (value: string) => shiftDecimalPoint(value, -2)

export const formatPowerMixPercent = (value: string) =>
  value.trim() !== '' && Number.isFinite(Number(value)) ? `${getPowerMixPercentValue(value)}%` : value
