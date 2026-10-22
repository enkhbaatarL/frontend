import Decimal from 'decimal.js'

import getSheetCellTextAlign from '@/pages/mi/fundamentalModel/components/inputTable/getSheetCellTextAlign'

const formatFundamentalModelCellValue = (value: string | number): string => {
  const text = String(value)
  if (getSheetCellTextAlign(value) !== 'right' || !/[.eE]/.test(text)) return text

  const isPercentage = text.trim().endsWith('%')
  const numericValue = new Decimal(text.trim().replaceAll(',', '').replace(/%$/, ''))
  if (!numericValue.isFinite() || Math.abs(numericValue.e) > 1_048_576) return text
  const rounded = numericValue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const [integer, fraction] = (rounded.isZero() && numericValue.isNegative() ? '-0' : rounded.toFixed()).split('.')

  return `${text.includes(',') ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : integer}${fraction ? `.${fraction}` : ''}${isPercentage ? '%' : ''}`
}

export default formatFundamentalModelCellValue
