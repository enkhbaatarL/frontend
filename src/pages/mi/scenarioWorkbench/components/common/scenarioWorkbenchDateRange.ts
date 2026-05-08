import dayjs, { Dayjs } from 'dayjs'

import type { DatePresetOption } from '@/components/common/menu/MIDateRangePickerMenu'

import { ListPeriod } from '@/service/mi/scenarioWorkbench/common'

/** '전체' 프리셋 시작일 (API period ALL 매칭) */
export const WORKBENCH_ALL_RANGE_START = dayjs('2000-01-01').startOf('day')

/** 시나리오 워크벤치 목록 API용 기간·시작·종료일 */
export interface WorkbenchDateApiParams {
  period: ListPeriod
  startDate?: string
  endDate?: string
}

/** 적용된 날짜 범위를 목록 조회 API 파라미터로 변환 */
export const mapWorkbenchDateRangeToApiParams = (start: Dayjs, end: Dayjs): WorkbenchDateApiParams => {
  const startD = start.startOf('day')
  const endD = end.endOf('day')
  const todayStart = dayjs().startOf('day')
  const endIsToday = endD.isSame(todayStart, 'day')

  if (startD.isSame(WORKBENCH_ALL_RANGE_START, 'day') && endIsToday) {
    return { period: ListPeriod.ALL }
  }

  if (endIsToday) {
    if (startD.isSame(todayStart.subtract(7, 'day'), 'day')) return { period: ListPeriod.RECENT_7_DAYS }
    if (startD.isSame(todayStart.subtract(1, 'month'), 'day')) return { period: ListPeriod.ONE_MONTH }
    if (startD.isSame(todayStart.subtract(3, 'month'), 'day')) return { period: ListPeriod.THREE_MONTHS }
    if (startD.isSame(todayStart.subtract(6, 'month'), 'day')) return { period: ListPeriod.SIX_MONTHS }
    if (startD.isSame(todayStart.subtract(1, 'year'), 'day')) return { period: ListPeriod.TWELVE_MONTHS }
  }

  return {
    period: ListPeriod.CUSTOM,
    startDate: startD.format('YYYY-MM-DD'),
    endDate: endD.format('YYYY-MM-DD'),
  }
}

/** 시나리오 워크벤치 날짜 프리셋 */
export const buildWorkbenchDatePresets = (today: Dayjs = dayjs()): DatePresetOption[] => {
  const t = today.startOf('day')
  return [
    { label: '최근 7일', value: { startDate: t.subtract(7, 'day'), endDate: t } },
    { label: '1개월', value: { startDate: t.subtract(1, 'month'), endDate: t } },
    { label: '3개월', value: { startDate: t.subtract(3, 'month'), endDate: t } },
    { label: '6개월', value: { startDate: t.subtract(6, 'month'), endDate: t } },
    { label: '1년', value: { startDate: t.subtract(1, 'year'), endDate: t } },
    { label: '전체', value: { startDate: WORKBENCH_ALL_RANGE_START, endDate: t } },
  ]
}
