import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Divider, FormControlLabel, Stack, Switch, Typography, useTheme } from '@mui/material'
import dayjs, { Dayjs, ManipulateType } from 'dayjs'
import {
  ButtonHTMLAttributes,
  Children,
  useMemo,
  useState,
  ReactElement,
  Fragment,
  HTMLAttributes,
  CSSProperties,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { DayPicker, UI } from 'react-day-picker'
import 'react-day-picker/style.css'

import MIButton from '@/components/common/button/MIButton'
import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import MIMaskInput, { MIMaskInputRef } from '@/components/common/input/MIMaskInout'
import MIMenu, { MIMenuProps } from '@/components/common/menu/MIMenu'
import { PREDEFINED_MASKS } from '@/constants/masks'
import useSnackbar from '@/hooks/useSnackbar'
export interface DateRange {
  startDate?: Dayjs
  endDate?: Dayjs
}

const getUnitLabel = (unit: ManipulateType): string => {
  switch (unit) {
    case 'millisecond':
    case 'milliseconds':
    case 'ms':
      return '밀리초'
    case 'second':
    case 'seconds':
    case 's':
      return '초'
    case 'minute':
    case 'minutes':
    case 'm':
      return '분'
    case 'hour':
    case 'hours':
    case 'h':
      return '시간'
    case 'day':
    case 'days':
    case 'd':
    case 'D':
      return '일'
    case 'week':
    case 'weeks':
    case 'w':
      return '주'
    case 'month':
    case 'months':
    case 'M':
      return '개월'
    case 'year':
    case 'years':
    case 'y':
      return '년'
    default:
      return unit
  }
}

interface MIDateRangePickerMenuProps extends MIMenuProps {
  dateRange?: DateRange
  onSave?: (dates?: DateRange) => void
  onApply: (dates: DateRange) => void
  showPreset?: boolean
  initialSaveOn?: boolean
  enableHoverBackground?: boolean
  limitDateRange?: [number, ManipulateType]
  datePresets?: DatePresetOption[]
}

export interface DatePresetOption {
  label: string
  value: DateRange
}

const CustomMonths = (props: HTMLAttributes<HTMLDivElement>) => {
  const { children, ...restProps } = props
  const childrenArray = Children.toArray(children)

  return (
    <Stack direction="row" {...restProps} alignItems="stretch">
      {childrenArray.map((child, idx) => {
        const key = (child as ReactElement)?.key ?? `month-${idx}`
        return (
          <Fragment key={key}>
            {child}
            {idx < childrenArray.length - 1 && (
              <Stack height="400px" alignItems="center" justifyContent="center">
                <Divider
                  orientation="vertical"
                  sx={{
                    height: '324px',
                    borderColor: 'contentBorder.Normal',
                  }}
                />
              </Stack>
            )}
          </Fragment>
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

const MIDateRangePickerMenu = ({
  label,
  dateRange = { startDate: undefined, endDate: undefined },
  onSave,
  onApply,
  initialSaveOn = false,
  enableHoverBackground = false,
  showPreset = true,
  limitDateRange,
  datePresets,
  ...props
}: MIDateRangePickerMenuProps) => {
  const theme = useTheme()
  const { showSnackbar } = useSnackbar()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [save, setSave] = useState(initialSaveOn)

  const showSaveOption = useMemo(() => onSave !== undefined, [onSave])

  const [internalStartDate, setInternalStartDate] = useState<Dayjs | undefined>(dateRange.startDate)
  const [internalEndDate, setInternalEndDate] = useState<Dayjs | undefined>(dateRange.endDate)

  const startDateInputRef = useRef<MIMaskInputRef>(null)
  const endDateInputRef = useRef<MIMaskInputRef>(null)

  const today = useMemo(() => dayjs().startOf('day'), [])

  const [calendarMonth, setCalendarMonth] = useState<Date>(
    dateRange.endDate?.subtract(1, 'month').toDate() ?? today.subtract(1, 'month').toDate(),
  )

  const yesterday = useMemo(() => today.subtract(1, 'day'), [today])
  const last7days = useMemo(() => today.subtract(7, 'day'), [today])
  const last30days = useMemo(() => today.subtract(30, 'day'), [today])
  const last3months = useMemo(() => today.subtract(3, 'month'), [today])

  const DATE_PRESETS: DatePresetOption[] = useMemo(
    () => [
      { label: 'Today', value: { startDate: today, endDate: today } },
      { label: 'Yesterday', value: { startDate: yesterday, endDate: yesterday } },
      { label: 'Last 7 days', value: { startDate: last7days, endDate: today } },
      { label: 'Last 30 days', value: { startDate: last30days, endDate: today } },
      { label: 'Last 3 months', value: { startDate: last3months, endDate: today } },
    ],
    [today, yesterday, last7days, last30days, last3months],
  )

  const presets = useMemo(
    () => [...(datePresets ?? DATE_PRESETS), { label: 'Custom', value: { startDate: undefined, endDate: undefined } }],
    [datePresets, DATE_PRESETS],
  )

  const validateMaxDateRange = useCallback(
    (startDate: Dayjs | undefined, endDate: Dayjs | undefined): boolean => {
      if (!startDate || !endDate || limitDateRange === undefined) {
        return true
      }

      const [maxValue, maxUnit] = limitDateRange
      const maxEndDate = startDate.add(maxValue, maxUnit)
      if (endDate.isAfter(maxEndDate)) {
        const unitLabel = getUnitLabel(maxUnit)
        showSnackbar(`최대 ${maxValue}${unitLabel}까지 설정할 수 있습니다.`, {
          variant: 'error',
        })
        return false
      }

      return true
    },
    [limitDateRange, showSnackbar],
  )

  const handlePresetClick = (value: DateRange) => {
    if (!validateMaxDateRange(value.startDate, value.endDate)) {
      return
    }

    setInternalStartDate(value.startDate)
    setInternalEndDate(value.endDate)

    // 왼쪽에서 리스트 선택 시 오른쪽 달력에 endDate가 보이도록 달력 위치 조정
    if (value.endDate) {
      setCalendarMonth(value.endDate.subtract(1, 'month').toDate())
    }
  }

  const handleApply = () => {
    const dates = {
      startDate: internalStartDate,
      endDate: internalEndDate,
    }

    onApply(dates)

    if (onSave) {
      if (save) {
        onSave(dates)
      } else {
        onSave(undefined)
      }
    }

    setIsMenuOpen(false)
  }

  const handleClear = () => {
    setInternalStartDate(undefined)
    setInternalEndDate(undefined)
  }

  const handleDayPickerSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setInternalStartDate(undefined)
      setInternalEndDate(undefined)
      return
    }

    const newStartDate = range.from ? dayjs(range.from).startOf('day') : undefined
    const newEndDate = range.to ? dayjs(range.to).startOf('day') : undefined

    if (!validateMaxDateRange(newStartDate, newEndDate)) {
      return
    }

    setInternalStartDate(newStartDate)
    setInternalEndDate(newEndDate)
  }

  const validateDateRange = useCallback(
    (value: DateRange) => {
      if (value.startDate && value.endDate) {
        if (value.startDate.isAfter(value.endDate)) {
          showSnackbar('시작일이 종료일보다 이전이어야 합니다.', {
            variant: 'error',
          })
          return false
        }

        if (!validateMaxDateRange(value.startDate, value.endDate)) {
          return false
        }
      }
      return true
    },
    [showSnackbar, validateMaxDateRange],
  )

  const handleDateInputChange = useCallback(
    (value: string | undefined, type: 'start' | 'end') => {
      if (!value) {
        showSnackbar('올바르지 않은 날짜입니다.', {
          variant: 'error',
        })
        return
      }

      const parsedDate = dayjs(value, 'YYYY-MM-DD')
      const newDateRange: DateRange = {
        startDate: type === 'start' ? parsedDate : internalStartDate,
        endDate: type === 'end' ? parsedDate : internalEndDate,
      }

      const validated = validateDateRange(newDateRange)
      if (validated) {
        if (type === 'start') {
          setInternalStartDate(parsedDate)
        } else {
          setInternalEndDate(parsedDate)
        }
      } else {
        startDateInputRef.current?.reset?.()
        endDateInputRef.current?.reset?.()
      }
    },
    [internalStartDate, internalEndDate, validateDateRange, showSnackbar],
  )

  const getPresetLabel = useCallback(
    (startDate?: Dayjs, endDate?: Dayjs) =>
      presets.find(
        ({ value }) =>
          value.startDate?.format('YYYY-MM-DD') === startDate?.format('YYYY-MM-DD') &&
          value.endDate?.format('YYYY-MM-DD') === endDate?.format('YYYY-MM-DD'),
      )?.label ?? 'Custom',
    [presets],
  )

  const dateLabel = useMemo(
    () => (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="8px">
        {showPreset && (
          <>
            <Typography variant="body2SB14" color="contentText.Normal" ml="4px">
              {getPresetLabel(dateRange.startDate, dateRange.endDate)}
            </Typography>
            <Divider orientation="vertical" sx={{ height: '16px', backgroundColor: 'contentBorder.Normal' }} />
          </>
        )}
        <Typography
          variant="body2SB14"
          color={dateRange.startDate ? 'contentText.Normal' : 'contentText.Disabled'}
          ml={showPreset ? '0' : '4px'}
        >
          {dateRange.startDate?.format('YYYY-MM-DD') ?? 'YYYY-MM-DD'}
        </Typography>
        <Divider orientation="horizontal" sx={{ width: '10px', backgroundColor: 'contentBorder.Active' }} />
        <Typography variant="body2SB14" color={dateRange.endDate ? 'contentText.Normal' : 'contentText.Disabled'}>
          {dateRange.endDate?.format('YYYY-MM-DD') ?? 'YYYY-MM-DD'}
        </Typography>
        <CalendarTodayRoundedIcon sx={{ fontSize: '20px', color: 'content.iconEnabled' }} />
      </Stack>
    ),
    [dateRange, getPresetLabel, showPreset],
  )

  useEffect(() => {
    if (save) {
      onSave?.({ startDate: internalStartDate, endDate: internalEndDate })
    } else {
      onSave?.(undefined)
    }
  }, [save, internalStartDate, internalEndDate, onSave])

  return (
    <MIMenu
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      onClose={() => {
        setInternalStartDate(dateRange.startDate)
        setInternalEndDate(dateRange.endDate)
      }}
      variant="outlined"
      label={dateLabel}
      enableHoverBackground={enableHoverBackground}
      placement="bottom-end"
      sx={{ padding: '8px' }}
      {...props}
    >
      <Stack>
        <Stack direction="row" padding="12px" gap="12px" boxSizing="border-box">
          {showPreset && (
            <>
              <Stack gap="8px" minWidth="160px">
                {presets.map((preset) => {
                  const { label: presetLabel, value } = preset
                  const isSelected = getPresetLabel(internalStartDate, internalEndDate) === presetLabel

                  return (
                    <Box
                      key={presetLabel}
                      onClick={() => {
                        if (isSelected) {
                          return
                        }

                        handlePresetClick(value)
                      }}
                      borderRadius="10px"
                      sx={{
                        padding: '6px 12px',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'gray.10',
                        },
                        textWrap: 'nowrap',
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
                        <Typography
                          variant="body2M14"
                          color={isSelected ? 'gray.70' : 'gray.60'}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {presetLabel}
                        </Typography>
                        <Box width="20px" height="20px">
                          {isSelected && <CheckIcon fill="gray.70" />}
                        </Box>
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'contentBorder.Normal' }} />
            </>
          )}
          <Stack
            height="400px"
            padding="12px"
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
                '&.rdp-range_middle': {
                  backgroundColor: theme.palette.contentIcon.ActiveSecondary,
                  color: theme.palette.contentText.White,
                },
                '&.rdp-range_start': {
                  borderTopLeftRadius: '6px',
                  borderBottomLeftRadius: '6px',
                  background: theme.palette.contentIcon.ActivePrimary,
                },
                '&.rdp-range_end': {
                  borderTopRightRadius: '6px',
                  borderBottomRightRadius: '6px',
                  background: theme.palette.contentIcon.ActivePrimary,
                },
                '& .rdp-day_button': {
                  border: 'none',
                  backgroundColor: 'transparent',
                },
                '&.rdp-day_today::after': {
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
                },
                // 오늘 날짜 표시기 - 선택된 경우 흰색
                '&.rdp-day_today.rdp-selected::after': {
                  backgroundImage: `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(createTodayIndicatorSvg(theme.palette.contentText.White))}')`,
                },
                // 오늘 날짜 표시기 - 선택되지 않은 경우 검은색
                '&.rdp-day_today:not(.rdp-selected)::after': {
                  backgroundImage: `url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(createTodayIndicatorSvg(theme.palette.contentText.Normal))}')`,
                },
              },
            }}
          >
            <DayPicker
              animate
              mode="range"
              navLayout="around"
              numberOfMonths={2}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={{ from: internalStartDate?.toDate(), to: internalEndDate?.toDate() }}
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
        </Stack>
        <Stack
          direction="row"
          padding="10px 12px"
          justifyContent="space-between"
          alignItems="center"
          borderTop="1px solid"
          borderColor="contentBorder.Normal"
          gap="16px"
        >
          <Stack direction="row" alignItems="center" gap="24px">
            {showSaveOption && (
              <FormControlLabel
                label="Save"
                control={
                  <Switch
                    size="small"
                    checked={save}
                    onChange={() => {
                      setSave(!save)
                    }}
                    sx={{
                      mt: '1px',
                    }}
                  />
                }
                sx={{ marginRight: 0 }}
              />
            )}
            <Stack direction="row" alignItems="center" justifyContent="center" gap="4px" ml={showSaveOption ? '0' : '4px'}>
              <MIMaskInput
                ref={startDateInputRef}
                value={internalStartDate?.format('YYYY-MM-DD') ?? ''}
                mask={PREDEFINED_MASKS.DATE}
                onUpdateBlurValue={(value) => handleDateInputChange(value, 'start')}
                sx={{ width: '110px' }}
              />
              <Divider orientation="horizontal" sx={{ width: '10px', backgroundColor: 'contentBorder.Active' }} />
              <MIMaskInput
                ref={endDateInputRef}
                value={internalEndDate?.format('YYYY-MM-DD') ?? ''}
                mask={PREDEFINED_MASKS.DATE}
                onUpdateBlurValue={(value) => handleDateInputChange(value, 'end')}
                sx={{ width: '110px' }}
              />
            </Stack>
          </Stack>
          <Stack direction="row" gap="10px" ml={showSaveOption ? 0 : 'auto'}>
            <MIButton type="outlined" disabled={!internalStartDate && !internalEndDate} onClick={handleClear}>
              Clear
            </MIButton>
            <MIButton type="filled" disabled={!internalStartDate || !internalEndDate} onClick={handleApply}>
              Apply
            </MIButton>
          </Stack>
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default MIDateRangePickerMenu
