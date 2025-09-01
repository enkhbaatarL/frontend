import dayjs from 'dayjs'

export const generateMonthDataAsStrings = (startDate: string, count = 7) => {
  const months = []
  const start = dayjs(startDate)

  for (let i = 0; i < count; i++) {
    months.push(start.add(i, 'month').format('YYYY-MM'))
  }

  return months
}
