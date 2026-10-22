export const getNextFundamentalModelColumn = ({
  field,
  monthly,
  year,
  month,
  period,
  lastLabel,
  addedCount,
}: {
  field: string
  monthly: boolean
  year?: string
  month?: string
  period?: string
  lastLabel: string
  addedCount: number
}) => {
  if (monthly) {
    const currentYear = Number(year)
    const currentMonth = Number(month)
    const currentPeriod = Number(period)
    if (!Number.isInteger(currentYear) || currentYear <= 0 || !Number.isInteger(currentMonth) || currentMonth < 1 || currentMonth > 12)
      return undefined
    return {
      field,
      label: '',
      year: String(currentMonth === 12 ? currentYear + 1 : currentYear),
      month: String(currentMonth === 12 ? 1 : currentMonth + 1),
      period: Number.isInteger(currentPeriod) ? String(currentPeriod + 1) : '',
    }
  }
  const lastYear = Number(lastLabel.match(/\d{4}/)?.[0])
  return {
    field,
    label: Number.isInteger(lastYear) && lastYear > 0 ? String(lastYear + 1) : `추가 열 ${addedCount + 1}`,
  }
}
