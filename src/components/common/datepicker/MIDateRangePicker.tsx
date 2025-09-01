import { Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo } from 'react'

import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'

interface MIDateRangePickerProps {
  onChange?: (dates: { startDate?: Dayjs; endDate?: Dayjs }) => void
  sizeInput?: 'h34' | 'h36' | 'h26'
  disabled?: boolean
  readOnly?: boolean
  startDate?: string
  endDate?: string
}

export default function MIDateRangePicker({
  onChange,
  sizeInput = 'h34',
  disabled,
  readOnly,
  startDate,
  endDate,
}: Readonly<MIDateRangePickerProps>) {
  const dateValues = useMemo(() => ({ startDate: dayjs(startDate), endDate: dayjs(endDate) }), [startDate, endDate])

  const handleStartChange = (value: Dayjs | null) => {
    const endDateVal = value && dateValues.endDate?.isBefore(value, 'day') ? undefined : dateValues.endDate
    onChange?.({ startDate: value ?? undefined, endDate: endDateVal })
  }
  const handleEndChange = (value: Dayjs | null) => {
    onChange?.({ startDate: dateValues.startDate, endDate: value ?? undefined })
  }
  return (
    <Flex direction="row" align="center">
      <MIDatePicker readOnly={readOnly} disabled={disabled} size={sizeInput} value={dayjs(startDate)} onChange={handleStartChange} />
      <Typography sx={{ marginX: 2 }} color="gray.50" component="span">
        ~
      </Typography>
      <MIDatePicker
        readOnly={readOnly}
        disabled={disabled}
        size={sizeInput}
        value={dayjs(endDate)}
        onChange={handleEndChange}
        minDate={dayjs(startDate) || undefined}
      />
    </Flex>
  )
}
