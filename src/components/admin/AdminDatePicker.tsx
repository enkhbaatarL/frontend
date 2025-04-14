import { Box, IconButton, IconButtonProps, InputAdornment, InputAdornmentProps } from '@mui/material'
import { PickersCalendarHeader, PickersCalendarHeaderProps, PickersDay, PickersDayProps } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo } from 'react'

import ArrowDown from '@/components/common/icons/ArrowDown'
import ArrowLeft from '@/components/common/icons/ArrowLeft'
import ArrowRight from '@/components/common/icons/ArrowRight'
import CalendarTodayIcon from '@/components/common/icons/CalendarTodayIcon'
import theme from '@/theming'

import 'dayjs/locale/ko'

// Function to check if date is Sunday (0 is Sunday in dayjs)
const isSunday = (date: Dayjs): boolean => date.day() === 0

const AdminDatePickerDay = (props: PickersDayProps<Dayjs>) => {
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

const AdminCalendarHeader = (props: PickersCalendarHeaderProps<Dayjs>) => {
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

const AdminInputAdornment = (props: InputAdornmentProps) => {
  const { children, ...rest } = props
  // the type of this props is not defined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childProps = (children as any).props as IconButtonProps

  return (
    <InputAdornment {...rest}>
      <IconButton {...childProps}>
        <CalendarTodayIcon />
      </IconButton>
    </InputAdornment>
  )
}

const AdminDatePicker = (props: DatePickerProps<Dayjs> & { size?: 'h26' | 'h34' | 'h36' }) => {
  const today = dayjs()

  const textFieldSize = useMemo(() => {
    switch (props.size) {
      case 'h26':
        return {
          padding: '5px 12px !important',
          ...theme.typography.body3R12,
        }
      case 'h34':
        return {
          padding: '7px 12px !important',
        }
      default: // 'h36'
        return {
          padding: '8px 12px !important',
        }
    }
  }, [props.size])

  const inputAdornmentSize = useMemo(() => {
    if (props.size === 'h26') {
      return {
        '& .MuiIconButton-root': {
          padding: '6px',
        },
        '& svg': {
          width: '14px',
          height: '14px',
        },
      }
    }

    return {
      width: '20px',
      height: '20px',
    }
  }, [props.size])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        monthsPerRow={3}
        slots={{
          day: AdminDatePickerDay,
          calendarHeader: AdminCalendarHeader,
          inputAdornment: AdminInputAdornment,
        }}
        dayOfWeekFormatter={(date) => date.locale('ko').format('dd')}
        slotProps={{
          layout: {
            sx: {
              '& .MuiDateCalendar-root': {
                width: '228px',
                height: '247px',
              },
              '& .MuiPickersCalendarHeader-root': {
                padding: 0,
                margin: 0,
                height: 28,
                minHeight: 28,
                maxHeight: 28,
                marginBottom: '10px',
              },
              '& .MuiPickersSlideTransition-root': {
                width: '228px',
                height: '192px',
                minHeight: '192px',
                margin: '0 auto',
              },
              '& .MuiDayCalendar-monthContainer': {
                height: '192px',
                minHeight: '192px',
              },
              '& .MuiDayCalendar-weekContainer': {
                margin: 0,
              },
              '& .MuiDayCalendar-weekDayLabel': {
                '&:nth-child(1)': {
                  color: theme.palette.point.red1,
                },
                ...theme.typography.body3M12,
                color: theme.palette.gray[90],
                display: 'inline-block',
                height: '17px',
                width: '32px',
                margin: '0px',
              },
              '& .MuiPickersFadeTransitionGroup-root': {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiYearCalendar-root, & .MuiMonthCalendar-root ': {
                alignItems: 'flex-start',
                alignContent: 'flex-start',
                gap: '8px',
                alignSelf: 'stretch',
                padding: 0,
                width: '282px',
              },
              '& .MuiPickersYear-root, & .MuiPickersMonth-root': {
                height: '32px',
                width: '69px',
                minWidth: '69px',
                maxWidth: '69px',
              },
              '& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected': {
                backgroundColor: `${theme.palette.gray[5]} !important`,
                color: theme.palette.gray[70],
              },
              '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton ': {
                ...theme.typography.body2M14,
                color: theme.palette.gray[70],
                margin: 0,
                padding: '6px 18px',
                borderRadius: '6px',
                '&::hover': {
                  backgroundColor: theme.palette.gray[5],
                },
              },
              color: '#1565c0',
              borderRadius: '6px',
              borderColor: '#2196f3',
              padding: '20px 12px 12px 12px',
              boxSizing: 'border-box',
              width: '252px',
              height: '279px',
            },
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
          textField: {
            fullWidth: true,
            sx: {
              minWidth: '0 !important',
              // ...readOnlyStyle,
              '& .MuiInputBase-root': {
                borderRadius: '6px',
                //border: `1px solid ${theme.palette.gray[30]}`,
                background: props.readOnly || props.disabled ? theme.palette.gray[10] : theme.palette.common.white,
                paddingRight: 3,
              },
              '& .MuiInputBase-input': {
                //border: 'none !important',
                ...textFieldSize,
              },
            },
          },
          inputAdornment: {
            sx: {
              ...inputAdornmentSize,
            },
          },
        }}
        defaultValue={today}
        format="YYYY-MM-DD"
        views={['year', 'month', 'day']}
        {...props}
      />
    </LocalizationProvider>
  )
}

export default AdminDatePicker
