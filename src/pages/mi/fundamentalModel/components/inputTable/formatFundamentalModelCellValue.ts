import getSheetCellTextAlign from '@/pages/mi/fundamentalModel/components/inputTable/getSheetCellTextAlign'

const formatFundamentalModelCellValue = (value: string | number): string => {
  const text = String(value)
  if (getSheetCellTextAlign(value) !== 'right' || !/[.eE]/.test(text)) return text

  const isPercentage = text.trim().endsWith('%')
  const numericValue = Number(text.trim().replaceAll(',', '').replace(/%$/, ''))
  if (!Number.isFinite(numericValue)) return text

  return `${numericValue.toLocaleString('en-US', {
    useGrouping: text.includes(','),
    maximumFractionDigits: 2,
  })}${isPercentage ? '%' : ''}`
}

export default formatFundamentalModelCellValue
