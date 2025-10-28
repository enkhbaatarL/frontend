import { Box, BoxProps, InputAdornment, InputAdornmentProps } from '@mui/material'
import { PickersCalendarHeader, PickersCalendarHeaderProps, PickersDay, PickersDayProps } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs, { Dayjs } from 'dayjs'
import { ReactElement } from 'react'

import { datePickerLayoutStyleSx, datePickerTextStyleSx } from './MIDatePickerStyleSx'
import MIInputClearIcon from '../input/MIInputClearIcon'

import ArrowDown from '@/components/common/icons/ArrowDown'
import ArrowLeft from '@/components/common/icons/ArrowLeft'
import ArrowRight from '@/components/common/icons/ArrowRight'
import CalendarTodayIcon from '@/components/common/icons/CalendarTodayIcon'
import theme from '@/theming'

import 'dayjs/locale/ko'

const isSunday = (date: Dayjs): boolean => date.day() === 0

const MIDatePickerDay = (props: PickersDayProps<Dayjs>) => {
  const { day, outsideCurrentMonth, ...other } = props

  const isWeekend = isSunday(day)

  return (
    <Box p={1} width={32} height={32} boxSizing={'border-box'} display={'flex'} alignItems={'center'} justifyContent={'center'}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          width: '100%',
          height: '100%',
          margin: 0,
          color: isWeekend ? theme.palette.point.red1 : theme.palette.gray[70],
          ...theme.typography.body3M12,
          '&.Mui-selected': {
            color: theme.palette.common.white,
          },
        }}
      />
    </Box>
  )
}

const MICalendarHeader = (props: PickersCalendarHeaderProps<Dayjs>) => {
  const { slots, ...rest } = props

  return (
    <PickersCalendarHeader
      format="YYYY . MM"
      slots={{
        switchViewIcon: ArrowDown,
        previousIconButton: ArrowLeft,
        nextIconButton: ArrowRight,
      }}
      {...rest}
      sx={{
        '& .MuiPickersCalendarHeader-label': {
          ...theme.typography.body2SB14,
          color: theme.palette.gray[90],
        },
      }}
    />
  )
}

const MIInputAdornment = (props: InputAdornmentProps) => {
  const { children, ...rest } = props
  const childProps = (children as ReactElement).props as BoxProps

  return (
    <InputAdornment {...rest}>
      <Box className="mi-calendar__calendar-button" onClick={childProps.onClick} p="4px" sx={{ cursor: 'pointer', borderRadius: '4px' }}>
        <CalendarTodayIcon className="mi-calendar__calendar-icon" />
      </Box>
    </InputAdornment>
  )
}

export default function MIDatePicker(props: DatePickerProps<Dayjs> & { size?: 'h26' | 'h28' | 'h34' | 'h36' | 'h40' }) {
  const today = dayjs()
  const { value, ...restProps } = props

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        monthsPerRow={3}
        slots={{
          day: MIDatePickerDay,
          calendarHeader: MICalendarHeader,
          inputAdornment: MIInputAdornment,
          clearButton: MIInputClearIcon,
        }}
        dayOfWeekFormatter={(date) => date.locale('ko').format('dd')}
        slotProps={{
          layout: {
            sx: datePickerLayoutStyleSx,
          },
          calendarHeader: {
            sx: {
              padding: 0,
              margin: 0,
            },
          },
          desktopPaper: {
            sx: {
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
            },
          },
          field: {
            clearable: true,
          },
          textField: {
            fullWidth: true,
            sx: { ...datePickerTextStyleSx(props.size) },
          },
        }}
        value={value}
        defaultValue={value === undefined ? today : undefined}
        format="YYYY-MM-DD"
        views={['year', 'month', 'day']}
        {...restProps}
      />
    </LocalizationProvider>
  )
}
