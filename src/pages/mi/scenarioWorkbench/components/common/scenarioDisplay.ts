import { MarketDirection, SignpostImpactLevel } from '@/service/mi/scenarioWorkbench/common'

export const marketDirectionToLabel = (d: MarketDirection): string => {
  switch (d) {
    case MarketDirection.BULLISH:
      return '상승'
    case MarketDirection.BEARISH:
      return '하락'
    case MarketDirection.NEGLIGIBLE:
      return '보합'
    default:
      return '-'
  }
}

export const signpostStrengthToLabel = (s: SignpostImpactLevel): string => {
  switch (s) {
    case SignpostImpactLevel.STRONG:
      return '강함'
    case SignpostImpactLevel.MODERATE:
      return '보통'
    case SignpostImpactLevel.WEAK:
      return '약함'
    default:
      return '-'
  }
}
