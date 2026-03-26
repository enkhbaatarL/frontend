import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Stack, SxProps, Theme, Typography, useTheme } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import React, { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactElement, useCallback, useMemo, useState } from 'react'
import { DayPicker, UI } from 'react-day-picker'
import 'react-day-picker/style.css'

import MIButton from '@/components/common/button/MIButton'
import MIMenu, { MIMenuProps } from '@/components/common/menu/MIMenu'

export interface MIDatePickerMenuProps extends Omit<MIMenuProps, 'label' | 'onChange' | 'value'> {
  label?: string
  value?: Dayjs
  onChange: (date?: Dayjs) => void
  required?: boolean
  placeholder?: string
  width?: string | number
  height?: string | number
  hideLabel?: boolean
  rootSx?: SxProps<Theme>
}

const CustomMonths = (props: HTMLAttributes<HTMLDivElement>) => {
  const { children, ...restProps } = props
  const childrenArray = React.Children.toArray(children)

  return (
    <Stack direction="row" {...restProps} alignItems="stretch">
      {childrenArray.map((child, idx) => {
        const key = (child as ReactElement)?.key ?? `month-${idx}`
        return (
          <Box key={key} flex={1}>
            {child}
          </Box>
        )
      })}
    </Stack>
  )
}

const CreateCustomMonthButton = (type: 'next' | 'previous') => {
  const CustomMonthButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { className } = props

    return (
      <Box
        component="div"
        className={className}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <MIButton
          type="outlined"
          size="h32"
          contentType="icon"
          startIcon={type === 'next' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          disabled={props.disabled}
          onClick={props.onClick}
          borderRadius="6px"
        />
      </Box>
    )
  }
  CustomMonthButton.displayName = `CustomMonthButton-${type}`
  return CustomMonthButton
}

const createTodayIndicatorSvg = (fillColor: string) => `
  <svg width="14" height="8" viewBox="0 0 14 8" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.88079 0.293044C6.27131 -0.0974806 6.90447 -0.09748 7.295 0.293044L12.8808 5.87883C13.5108 6.5088 13.0646 7.58594 12.1737 7.58594H1.0021C0.111199 7.58594 -0.334967 6.5088 0.294998 5.87883L5.88079 0.293044Z"
      fill="${fillColor}"
    />
  </svg>
`

const MIDatePickerMenu = ({
  label = '일자',
  value,
  onChange,
  required = false,
  placeholder = '일자 선택',
  placement = 'bottom-end',
  width = '140px',
  height = '40px',
  hideLabel = false,
  rootSx,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  ...menuProps
}: MIDatePickerMenuProps) => {
  const theme = useTheme()

  const [internalOpen, setInternalOpen] = useState(false)
  const isMenuOpen = controlledOpen ?? internalOpen
  const setIsMenuOpen = useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [controlledOpen, onOpenChange],
  )

  const [internalDate, setInternalDate] = useState<Dayjs | undefined>(value)

  const today = useMemo(() => dayjs().startOf('day'), [])

  const getInitialMonth = useCallback(
    (target?: Dayjs) => {
      if (target && target.isValid()) {
        return target.startOf('month').toDate()
      }
      return today.toDate()
    },
    [today],
  )

  const [calendarMonth, setCalendarMonth] = useState<Date>(getInitialMonth(value))

  const handleDayPickerSelect = useCallback((date: Date | undefined) => {
    if (!date) {
      setInternalDate(undefined)
      return
    }

    const newDate = dayjs(date).startOf('day')
    setInternalDate(newDate)
  }, [])

  const handleCancel = useCallback(() => {
    setInternalDate(value)
    setIsMenuOpen(false)
  }, [value, setIsMenuOpen])

  const handleApply = useCallback(() => {
    onChange(internalDate)
    setIsMenuOpen(false)
  }, [internalDate, onChange, setIsMenuOpen])

  const displayText = value ? value.format('YYYY-MM-DD') : placeholder

  const getTextColor = () => {
    if (disabled) return theme.palette.content.textDisabled
    if (isMenuOpen) return theme.palette.contentText.Black
    if (value) return theme.palette.contentText.Normal
    return theme.palette.contentText.Disabled
  }

  const dateInputLabel = (
    <Typography
      noWrap
      sx={{
        fontFamily: 'Pretendard',
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '140%',
        letterSpacing: 0,
        color: getTextColor(),
      }}
    >
      {displayText}
    </Typography>
  )

  const dateInputSuffix = (
    <CalendarTodayRoundedIcon
      sx={{
        fontSize: '20px',
        color: disabled ? theme.palette.content.iconDisabled : 'contentIcon.Enabled',
      }}
    />
  )

  return (
    <Stack width={width} gap="4px" sx={rootSx}>
      {!hideLabel && (
        <Stack direction="row" alignItems="center" gap="2px">
          <Typography variant="body2SB14" color="contentText.Normal">
            {label}
          </Typography>
          {required && <Box width="4px" height="4px" borderRadius="50%" bgcolor="point.red1" mb="6px" />}
        </Stack>
      )}
      <MIMenu
        open={isMenuOpen}
        onOpenChange={(open) => {
          setIsMenuOpen(open)
          if (open) {
            setInternalDate(value?.isValid() ? value : undefined)
            setCalendarMonth(getInitialMonth(value))
          }
        }}
        onClose={() => {
          setInternalDate(value)
        }}
        variant="outlined"
        label={dateInputLabel}
        suffix={dateInputSuffix}
        placement={placement}
        enableHoverBackground={false}
        buttonHoverBgColor="common.white"
        {...menuProps}
        disabled={disabled}
        sx={{
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: disabled ? '#F1F3F5' : 'common.white',
          width: '100%',
          height,
          ...(disabled
            ? {
              opacity: 0.6,
              '&.Mui-disabled': {
                borderColor: theme.palette.contentBorder.Normal,
              },
            }
            : {}),
          ...(menuProps.sx as Record<string, unknown>),
        }}
      >
        <Stack width="332px" height="410px" padding="12px" gap="12px" boxSizing="border-box">
          <Stack
            height="100%"
            sx={{
              '& .rdp-button_next': {
                width: 'auto',
                height: 'auto !important',
              },
              '& .rdp-button_previous': {
                width: 'auto',
                height: 'auto !important',
              },
              '& .rdp-day': {
                ...theme.typography.body1M16,
                color: theme.palette.contentText.Normal,
                position: 'relative',
                '& .rdp-day_button': {
                  border: 'none',
                  backgroundColor: 'transparent',
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                },
                // 선택된 날짜에만 포커싱 스타일 적용
                '&.rdp-selected': {
                  background: '#49608A',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  width: '44px',
                  height: '44px',
                  '& .rdp-day_button': {
                    background: '#49608A',
                    color: '#FFFFFF',
                  },
                },
                // 오늘 날짜 표시기 (선택되지 않은 경우)
                '&.rdp-day_today:not(.rdp-selected)::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '8px',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  zIndex: 1,
                  backgroundImage: `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                    createTodayIndicatorSvg(theme.palette.contentText.Normal),
                  )}')`,
                },
                // 오늘 날짜 표시기 (선택된 경우)
                '&.rdp-day_today.rdp-selected::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '8px',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  zIndex: 1,
                  backgroundImage: `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(createTodayIndicatorSvg('#FFFFFF'))}')`,
                },
              },
            }}
          >
            <DayPicker
              animate
              mode="single"
              navLayout="around"
              numberOfMonths={1}
              month={calendarMonth}
              onMonthChange={(month) => {
                if (!Number.isNaN(month.getTime())) {
                  setCalendarMonth(month)
                }
              }}
              selected={internalDate?.toDate()}
              onSelect={handleDayPickerSelect}
              modifiers={{
                today: today.toDate(),
              }}
              modifiersClassNames={{
                today: 'rdp-day_today',
              }}
              components={{
                Months: CustomMonths,
                NextMonthButton: CreateCustomMonthButton('next'),
                PreviousMonthButton: CreateCustomMonthButton('previous'),
              }}
              styles={{
                [UI.Root]: {
                  fontFamily: theme.typography.fontFamily,
                } as CSSProperties,
                [UI.MonthCaption]: {
                  ...theme.typography.body1SB16,
                  color: theme.palette.contentText.Normal,
                  height: '32px',
                  marginBottom: '12px',
                },
                [UI.MonthGrid]: {
                  borderCollapse: 'separate',
                  borderSpacing: '0 4px',
                },
                [UI.Weekdays]: {
                  ...theme.typography.body1M16,
                  color: theme.palette.contentText.Subtext,
                  height: '44px',
                },
                [UI.Day]: {
                  height: '44px',
                },
              }}
            />
          </Stack>

          <Stack direction="row" justifyContent="flex-end" gap="10px">
            <MIButton type="outlined" onClick={handleCancel}>
              취소
            </MIButton>
            <MIButton type="filled" disabled={!internalDate} onClick={handleApply}>
              확인
            </MIButton>
          </Stack>
        </Stack>
      </MIMenu>
    </Stack>
  )
}

export default MIDatePickerMenu
