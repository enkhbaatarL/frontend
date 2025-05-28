import theme from '@/theming'

type Size = 'h26' | 'h34' | 'h36'

const getTextFieldSize = (size?: 'h26' | 'h34' | 'h36') => {
  switch (size) {
    case 'h26':
      return {
        boxSizing: 'border-box',
        height: '24px',
        padding: '5px 12px !important',
        ...theme.typography.body3R12,
      }
    case 'h34':
      return {
        boxSizing: 'border-box',
        height: '32px',
        padding: '6px 12px !important',
      }
    case 'h36':
      return {
        boxSizing: 'border-box',
        height: '34px',
        padding: '8px 12px !important',
      }
    default:
      return {
        boxSizing: 'border-box',
        height: '34px',
        padding: '8px 12px !important',
      }
  }
}

const getSvgStyle = (size?: 'h26' | 'h34' | 'h36') => {
  switch (size) {
    case 'h26':
      return {
        width: '14px',
        height: '14px',
      }

    default:
      return {
        width: '20px',
        height: '20px',
      }
  }
}
export const datePickerLayoutStyleSx = {
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
    '&:nth-of-type(1)': {
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
    color: theme.palette.gray[90],
  },
  '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton ': {
    ...theme.typography.body2M14,
    color: theme.palette.gray[70],
    margin: 0,
    padding: '6px 18px',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: `${theme.palette.gray[5]} !important`,
    },
  },
  color: '#1565c0',
  borderRadius: '4px',
  borderColor: '#2196f3',
  padding: '20px 12px 12px 12px',
  boxSizing: 'border-box',
  width: '252px',
  height: '279px',
}

export const datePickerTextStyleSx = (size?: Size) => ({
  minWidth: '0 !important',
  '& fieldset': { display: 'none' },
  '& .MuiInputBase-root .MuiInputAdornment-root': {
    marginLeft: '4px',
    marginRight: 0,
    caretColor: 'transparent',
  },
  '& .MuiInputBase-root': {
    borderRadius: '4px',
    paddingRight: 3,
    caretColor: 'transparent',
    '& svg': {
      display: 'block',
      ...getSvgStyle(size),
    },
    '& .clearButton': { cursor: 'pointer' },
    '& .mi-calendar__calendar-button': {
      transition: '0.3s',
    },
    '.mi-calendar__calendar-icon path': {
      transition: '0.3s',
    },
    '&.Mui-focused .mi-calendar__calendar-button': {
      backgroundColor: theme.palette.content.backgroundHover,
    },
    '&.Mui-focused .mi-calendar__calendar-icon path': {
      fill: theme.palette.primary.main,
    },
    '&:hover .mi-calendar__calendar-button': {
      backgroundColor: theme.palette.content.backgroundHover,
    },
    '&:hover .mi-calendar__calendar-icon path': {
      fill: theme.palette.gray[80],
    },
    '&.Mui-readOnly': {
      borderColor: theme.palette.content.borderDisabled,
      backgroundColor: theme.palette.content.backgroundDisabled,
      '& .MuiInputBase-input': {
        color: theme.palette.gray[70],
      },
      '.MuiInputAdornment-root': {
        pointerEvents: 'none',
        '.mi-calendar__calendar-button': {
          backgroundColor: theme.palette.content.backgroundHover,
          svg: {
            color: theme.palette.content.iconDisabled,
            path: {
              fill: theme.palette.content.iconDisabled,
            },
          },
        },
      },
    },
  },
  '& .MuiInputBase-input': {
    ...getTextFieldSize(size),
    paddingRight: '0 !important',
  },
})
