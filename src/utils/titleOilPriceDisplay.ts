/** 메일 유가 행 표시·리비전 diff 문자열을 한 규칙으로 맞추기 위한 유틸 */

export const formatPriceForDisplay = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(n)

export const oilChangePresentation = (from: number, to: number): { changeText: string; isPositive: boolean } => {
  const change = to - from
  const pct = from !== 0 ? (change / from) * 100 : 0
  const changeText = `${change >= 0 ? '+' : ''}${formatPriceForDisplay(change)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`
  return { changeText, isPositive: change >= 0 }
}

/** 리비전 diff 비교용 — 화면 유가 행과 동일 규칙 */
export const titleOilPricePlainSummaryForDiff = (from?: number, to?: number): string => {
  if (from === undefined || to === undefined) return ''
  const { changeText } = oilChangePresentation(from, to)
  return `${formatPriceForDisplay(from)}→${formatPriceForDisplay(to)} ${changeText}`
}
