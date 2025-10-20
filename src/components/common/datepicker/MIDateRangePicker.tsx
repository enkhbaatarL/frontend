import { Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState, useEffect } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MIDatePicker from '@/components/common/datepicker/MIDatePicker'
import Flex from '@/components/common/display/Flex'

interface MIDateRangePickerProps {
  onChange?: (dates: { startDate?: Dayjs; endDate?: Dayjs }) => void
  sizeInput?: 'h26' | 'h28' | 'h34' | 'h36'
  disabled?: boolean
  readOnly?: boolean
  startDate?: Dayjs | string
  endDate?: Dayjs | string
  useApplyButton?: boolean
}

export default function MIDateRangePicker({
  onChange,
  sizeInput = 'h34',
  disabled,
  readOnly,
  startDate,
  endDate,
  useApplyButton = false,
}: Readonly<MIDateRangePickerProps>) {
  const dateValues = useMemo(() => {
    const convertToDayjs = (date: Dayjs | string | undefined) => {
      if (!date) return undefined
      return typeof date === 'string' ? dayjs(date) : date
    }

    return {
      startDate: convertToDayjs(startDate),
      endDate: convertToDayjs(endDate),
    }
  }, [startDate, endDate])

  // 내부 상태 관리 (useApplyButton: true)
  const [internalStartDate, setInternalStartDate] = useState<Dayjs | undefined>(dateValues.startDate)
  const [internalEndDate, setInternalEndDate] = useState<Dayjs | undefined>(dateValues.endDate)

  useEffect(() => {
    setInternalStartDate(dateValues.startDate)
    setInternalEndDate(dateValues.endDate)
  }, [dateValues.startDate, dateValues.endDate])

  const handleStartChangeWithApply = (value: Dayjs | null) => {
    const endDateVal = value && internalEndDate?.isBefore(value, 'day') ? undefined : internalEndDate
    setInternalStartDate(value ?? undefined)
    setInternalEndDate(endDateVal)
  }

  const handleStartChangeImmediate = (value: Dayjs | null) => {
    const endDateVal = value && dateValues.endDate?.isBefore(value, 'day') ? undefined : dateValues.endDate
    onChange?.({ startDate: value ?? undefined, endDate: endDateVal })
  }

  const handleEndChangeWithApply = (value: Dayjs | null) => {
    setInternalEndDate(value ?? undefined)
  }

  const handleEndChangeImmediate = (value: Dayjs | null) => {
    onChange?.({ startDate: dateValues.startDate, endDate: value ?? undefined })
  }

  const handleStartChange = useApplyButton ? handleStartChangeWithApply : handleStartChangeImmediate
  const handleEndChange = useApplyButton ? handleEndChangeWithApply : handleEndChangeImmediate

  const handleApply = () => {
    onChange?.({ startDate: internalStartDate, endDate: internalEndDate })
  }

  const isApplyEnabled = useApplyButton && internalStartDate && internalEndDate

  return (
    <Flex direction="row" align="center" gap={8}>
      <MIDatePicker
        readOnly={readOnly}
        disabled={disabled}
        size={sizeInput}
        value={useApplyButton ? internalStartDate : dateValues.startDate}
        onChange={handleStartChange}
      />
      <Typography color="gray.50" component="span">
        ~
      </Typography>
      <MIDatePicker
        readOnly={readOnly}
        disabled={disabled}
        size={sizeInput}
        value={useApplyButton ? internalEndDate : dateValues.endDate}
        onChange={handleEndChange}
        minDate={useApplyButton ? internalStartDate : dateValues.startDate}
      />
      {useApplyButton && (
        <MIButton type="filled" size="h28" onClick={handleApply} disabled={!isApplyEnabled}>
          Apply
        </MIButton>
      )}
    </Flex>
  )
}
