import { Typography } from '@mui/material'
import { Dayjs } from 'dayjs'
import { useState } from 'react'

import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'

interface MIDateRangePickerProps {
  onChange?: (dates: { startDate: Dayjs | null; endDate: Dayjs | null }) => void
  sizeInput?: 'h34' | 'h36' | 'h26'
  disabled?: boolean
  readOnly?: boolean
}

export default function MIDateRangePicker({ onChange, sizeInput = 'h34', disabled, readOnly }: Readonly<MIDateRangePickerProps>) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)

  const handleStartChange = (value: Dayjs | null) => {
    if (value && endDate?.isBefore(value, 'day')) {
      setEndDate(null)
    }
    setStartDate(value)
    onChange?.({ startDate: value, endDate: endDate && !endDate.isBefore(value) ? endDate : null })
  }

  const handleEndChange = (value: Dayjs | null) => {
    if (value && startDate && value.isBefore(startDate, 'day')) {
      setStartDate(null)
    }
    setEndDate(value)
    onChange?.({ startDate: startDate && !value?.isBefore(startDate) ? startDate : null, endDate: value })
  }

  return (
    <Flex direction="row" align="center">
      <MIDatePicker readOnly={readOnly} disabled={disabled} size={sizeInput} value={startDate} onChange={handleStartChange} />
      <Typography sx={{ marginX: 2 }} color="gray.50" component="span">
        ~
      </Typography>
      <MIDatePicker
        readOnly={readOnly}
        disabled={disabled}
        size={sizeInput}
        value={endDate}
        onChange={handleEndChange}
        minDate={startDate || undefined}
      />
    </Flex>
  )
}
