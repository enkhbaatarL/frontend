import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import React, { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactElement, useCallback, useMemo, useState } from 'react'
import { DayPicker, UI } from 'react-day-picker'
import 'react-day-picker/style.css'

import MIButton from '@/components/common/button/MIButton'
import MIMenu, { MIMenuProps } from '@/components/common/menu/MIMenu'

export interface MIDatePickerMenuProps
  extends Omit<MIMenuProps, 'label' | 'onChange' | 'value'> {
  /**
   * 상단 라벨 텍스트 (기본값: "일자")
   */
  label?: string
  /**
   * 선택된 날짜
   */
  value?: Dayjs
  /**
   * 확인 버튼 클릭 시 호출되는 콜백
   */
  onChange: (date?: Dayjs) => void
  /**
   * 라벨 우측에 필수(*) 표시 여부
   */
  required?: boolean
  /**
   * 인풋 placeholder (기본값: "일자 선택")
   */
  placeholder?: string
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
  ...menuProps
}: MIDatePickerMenuProps) => {
  const theme = useTheme()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
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

  const handleClear = useCallback(() => {
    setInternalDate(undefined)
  }, [])

  const handleApply = useCallback(() => {
    onChange(internalDate)
    setIsMenuOpen(false)
  }, [internalDate, onChange])

  const displayText = internalDate ? internalDate.format('YYYY-MM-DD') : placeholder

  const dateInputLabel = (
    <Box
      sx={{
        width: '120px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '6px',
        padding: '8px 12px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        backgroundColor: 'transparent',
      }}
    >
      <Typography
        noWrap
        sx={{
          fontFamily: 'Pretendard',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '14px',
          lineHeight: '140%',
          letterSpacing: 0,
          verticalAlign: 'middle',
          color: internalDate ? theme.palette.contentText.Normal : theme.palette.contentText.Disabled,
        }}
      >
        {displayText}
      </Typography>
    </Box>
  )

  return (
    <Stack width="120px" height="60px" gap="4px">
      <Stack direction="row" alignItems="center" gap="4px" height="20px">
        <Typography
          variant="body2SB14"
          sx={{
            fontSize: '14px',
            lineHeight: '140%',
            letterSpacing: 0,
          }}
          color="contentText.Normal"
        >
          {label}
        </Typography>
        {required && (
          <Typography sx={{ verticalAlign: 4, fontSize: 12, fontWeight: 900 }} component="span" color="error">
          *
        </Typography>
        )}
      </Stack>
      <MIMenu
        open={isMenuOpen}
        onOpenChange={(open) => {
          setIsMenuOpen(open)
          if (open) {
            // 열릴 때 기존 value와 동기화
            setInternalDate(value && value.isValid() ? value : undefined)
            setCalendarMonth(getInitialMonth(value))
          }
        }}
        onClose={() => {
          // 닫힐 때 외부 value로 롤백
          setInternalDate(value)
        }}
        variant="outlined"
        label={dateInputLabel}
        placement={placement}
        sx={{ padding: '8px' }}
        enableHoverBackground={false}
        {...menuProps}
      >
        <Stack
          width="332px"
          height="410px"
          padding="12px"
          gap="12px"
          sx={{
            borderRadius: '10px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'contentBorder.Normal',
            boxSizing: 'border-box',
          }}
        >
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
                  backgroundImage: `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                    createTodayIndicatorSvg('#FFFFFF'),
                  )}')`,
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
                if (month instanceof Date && !Number.isNaN(month.getTime())) {
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
            <MIButton type="outlined" disabled={!internalDate} onClick={handleClear}>
              초기화
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

