/* eslint-disable @typescript-eslint/no-explicit-any */
import { _adapters } from 'chart.js'
import dayjs, { Dayjs, ManipulateType, OpUnitType, QUnitType } from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/ko'

dayjs.extend(isoWeek)
dayjs.extend(advancedFormat)

// Define the format types
interface TimeFormats {
  datetime: string
  millisecond: string
  second: string
  minute: string
  hour: string
  day: string
  week: string
  month: string
  quarter: string
  year: string
  [key: string]: string
}

const FORMATS: TimeFormats = {
  datetime: 'MMM D YYYY HH:mm:ss',
  millisecond: 'HH:mm:ss.SSS',
  second: 'HH:mm:ss',
  minute: 'HH:mm',
  hour: 'H',
  day: 'MMM D',
  week: 'MMM D, YYYY',
  month: 'MMM YYYY',
  quarter: '[Q]Q - YYYY',
  year: 'YYYY',
}

// Type assertion to access the override method
// This is necessary because the TypeScript definitions might not expose this method directly
;(_adapters._date as any).override({
  _id: 'dayjs', // DEBUG

  formats(): TimeFormats {
    return FORMATS
  },

  parse(value: Dayjs, format?: string): number | null {
    let date: Dayjs

    if (typeof value === 'string' && typeof format === 'string') {
      date = dayjs(value, format)
    } else if (!(value instanceof dayjs)) {
      date = dayjs(value)
    } else {
      date = value
    }

    return date.isValid() ? date.valueOf() : null
  },

  format(time: number, format: string): string {
    return dayjs(time)
      .locale(this.options?.['locale'] ?? 'en')
      .format(format)
  },

  add(time: number, amount: number, unit: QUnitType | OpUnitType | ManipulateType): number {
    return dayjs(time)
      .add(amount, unit as ManipulateType)
      .valueOf()
  },

  diff(max: number, min: number, unit: QUnitType | OpUnitType): number {
    return dayjs(max).diff(min, unit)
  },

  startOf(time: number, unit: QUnitType | OpUnitType | ManipulateType | 'isoWeek', weekday?: number): number {
    if (unit === 'isoWeek') {
      return dayjs(time)
        .isoWeekday(weekday ?? 1)
        .startOf('day')
        .valueOf()
    }

    return dayjs(time)
      .startOf(unit as OpUnitType)
      .valueOf()
  },

  endOf(time: number, unit: QUnitType | OpUnitType | ManipulateType): number {
    return dayjs(time)
      .endOf(unit as ManipulateType)
      .valueOf()
  },
})
