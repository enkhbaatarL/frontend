import dayjs from 'dayjs'

import { ListSort, MarketDirection, NextGenMIStatus, SignpostImpactLevel } from '@/service/mi/nextGenMI/common'

export const NEXT_GEN_MI_STATUS_FILTER_OPTIONS = [
  { value: NextGenMIStatus.ALL, label: '전체' },
  { value: NextGenMIStatus.NEW, label: '신규' },
  { value: NextGenMIStatus.UPDATED, label: '갱신' },
] as const

export const NEXT_GEN_MI_LIST_SORT_OPTIONS = [
  { value: ListSort.LATEST, label: '최신순' },
  { value: ListSort.OLDEST, label: '오래된순' },
] as const

export const formatNextGenMIDateTime = (value?: string | null, template = 'MM-DD HH:mm'): string => {
  const date = value ? dayjs(value) : null
  return date?.isValid() ? date.format(template) : '-'
}

/** Design 탭 생성중 툴팁: YYYY-MM-DD HH:mm */
export const formatNextGenMIDateTimeYmdHm = (value?: string | null): string => {
  const date = value ? dayjs(value) : null
  return date?.isValid() ? date.format('YYYY-MM-DD HH:mm') : '-'
}

export const findIndexImpact = <T extends { indexName: string }>(impacts: readonly T[] | undefined, indexName: string): T | undefined =>
  impacts?.find((impact) => (impact.indexName ?? '').toUpperCase() === indexName)

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
