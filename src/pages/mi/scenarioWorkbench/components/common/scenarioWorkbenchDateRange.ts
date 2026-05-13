import dayjs, { Dayjs } from 'dayjs'

import type { DatePresetOption, DateRange } from '@/components/common/menu/MIDateRangePickerMenu'

/** 기본 조회 구간: 오늘 기준 1개월 */
export const defaultWorkbenchDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(1, 'month'), endDate: t }
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
  ]
}
