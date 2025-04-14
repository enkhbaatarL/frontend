import { InputAdornment, TextField, TextFieldProps } from '@mui/material'
import { t } from 'i18next'
import { ReactNode, useMemo } from 'react'

import theme from '@/theming'

export interface MIInputProps extends Omit<TextFieldProps, 'size'> {
  size?: 'h26' | 'h34' | 'h36'
  readOnly?: boolean
  success?: boolean
  endIcon?: ReactNode
  contentWidth?: number
}

const MIInput = ({ size, readOnly, label, endIcon, success, contentWidth, ...props }: MIInputProps) => {
  const styleBaseSize = useMemo(() => {
    switch (size) {
      case 'h26':
        return {
          padding: '4px 11px',
          ...theme.typography.body3R12,
          height: '16px',
        }
      case 'h34':
        return {
          padding: '6px 11px',
          ...theme.typography.body2R14,
          height: '20px',
        }
      case 'h36':
        return {
          padding: '7px 11px',
          ...theme.typography.body2R14,
          height: '20px',
        }
      // Default size is h34
      default:
        return {
          padding: '6px 11px',
          ...theme.typography.body3R14,
          height: '20px',
        }
    }
  }, [size])

  const inputProps = useMemo(() => {
    const defaultProps: Record<string, string | ReactNode> = {
      readOnly,
    }

    if (endIcon) {
      defaultProps.endAdornment = <InputAdornment position="end">{endIcon}</InputAdornment>
    }

    return defaultProps
  }, [endIcon, readOnly])

  return (
    <TextField
      variant="outlined"
      hiddenLabel
      placeholder={t('입력하세요.')}
      slotProps={{
        input: inputProps,
      }}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: '6px',
          border: `1px solid ${theme.palette.gray[30]}`,
          borderColor: success ? theme.palette.point.green1 : 'none',
          boxSizing: 'content-box',
          ...styleBaseSize,
        },
        '& .MuiInputBase-root.Mui-focused': {
          borderColor: theme.palette.primary.main,
        },
        '& .MuiInputBase-root.Mui-error': {
          borderColor: `${theme.palette.point.red1}`,
        },
        '& .MuiInputBase-root.Mui-disabled': {
          borderColor: theme.palette.gray[20],
          backgroundColor: theme.palette.gray[10],
          color: theme.palette.gray[50],
        },
        '& .MuiInputBase-root.Mui-readOnly': {
          borderColor: theme.palette.gray[20],
          backgroundColor: theme.palette.gray[10],
          color: theme.palette.gray[70],
        },
        '& .MuiInputAdornment-root': {
          margin: 0,
        },
        '& .MuiInputBase-input': {
          width: contentWidth ? `${contentWidth}px` : 'auto',
          padding: 0,
          '&::placeholder': {
            color: theme.palette.gray[40],
          },
        },
      }}
      {...props}
    />
  )
}

export default MIInput
