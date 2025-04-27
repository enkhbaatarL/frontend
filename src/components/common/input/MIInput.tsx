import { Box, InputAdornment, TextField, TextFieldProps, Tooltip, Typography } from '@mui/material'
import { t } from 'i18next'
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import MIInputErrorIcon from '@/components/common/input/MIInputErrorIcon'
import useCheckFocus from '@/hooks/useCheckFocus'
import theme from '@/theming'

export interface MIInputProps extends Omit<TextFieldProps, 'size' | 'variant'> {
  size?: 'h26' | 'h34' | 'h36' | 'h46'
  readOnly?: boolean
  success?: boolean
  endIcon?: ReactNode
  startIcon?: ReactNode
  maxLength?: number
  errorMessage?: string
  variant?: 'inTable' | 'inForm'
  maxWidth?: number | string
  minWidth?: number | string
  width?: number | string
  maxHeight?: number | string
  contentWidth?: number
}

const MIInput = ({
  size,
  readOnly,
  label,
  endIcon,
  startIcon,
  success,
  contentWidth,
  maxLength,
  value,
  errorMessage,
  maxHeight,
  variant = 'inForm',
  ...props
}: MIInputProps) => {
  const [innerValue, setInnerValue] = useState<string>(String(value) || '')
  const { ref: containerRef, isFocus, registerClickOutListener } = useCheckFocus()

  useEffect(() => {
    setInnerValue(value ? value.toString() : '')
  }, [value])

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) return
      setInnerValue(e.target.value)
      props.onInput?.(e)
    },
    [maxLength, props.onInput],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) return
      setInnerValue(e.target.value)
      props.onChange?.(e)
    },
    [maxLength, props.onChange],
  )

  const styleBaseSize = useMemo(() => {
    switch (size) {
      case 'h26':
        return {
          padding: '4px 11px',
          ...theme.typography.body3R12,
          '& input': {
            height: '16px',
          },
        }
      case 'h34':
        return {
          padding: '6px 11px',
          ...theme.typography.body2R14,
          '& input': {
            height: '20px',
          },
        }
      case 'h36':
        return {
          padding: '7px 11px',
          ...theme.typography.body2R14,
          '& input': {
            height: '20px',
          },
        }
      case 'h46':
        return {
          padding: '10px 12px',
          ...theme.typography.body2R14,
          '& input': {
            height: '25px',
            fontSize: '18px',
            '&::placeholder': {
              color: `${theme.palette.gray['60']} !important`, // Only apply for input H46
            },
          },
          '.MuiSvgIcon-root': {
            marginRight: '10px !important',
          },
        }
      // Default size is h34
      default:
        return {
          padding: '6px 11px',
          ...theme.typography.body3R14,
          '& input': {
            height: '20px',
          },
        }
    }
  }, [size])

  const inputProps = useMemo(() => {
    const defaultProps: Record<string, string | ReactNode> = {
      readOnly,
    }

    defaultProps.endAdornment = (
      <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
        {!readOnly && isFocus && innerValue && !props.error && !props.multiline && (
          <MIInputClearIcon width={16} height={16} onClick={() => setInnerValue('')} />
        )}
        {props.error && variant === 'inTable' && (
          <Tooltip disableHoverListener={!errorMessage} title={errorMessage}>
            <MIInputErrorIcon width={16} height={16} />
          </Tooltip>
        )}
        {endIcon}
      </InputAdornment>
    )

    if (startIcon) {
      defaultProps.startAdornment = <InputAdornment position="start">{startIcon}</InputAdornment>
    }

    if (maxLength) {
      defaultProps.maxLength = maxLength
    }

    return defaultProps
  }, [endIcon, readOnly, startIcon, innerValue, isFocus, props.error, props.multiline, variant, errorMessage, maxLength])

  return (
    <Box ref={containerRef} maxWidth={props.maxWidth} minWidth={props.minWidth} width={props.width}>
      <TextField
        fullWidth
        variant="outlined"
        hiddenLabel
        placeholder={t('입력하세요.')}
        value={innerValue}
        onFocus={registerClickOutListener}
        minRows={4.3}
        maxRows={11.8}
        slotProps={{
          input: inputProps,
        }}
        sx={{
          '& .MuiInputBase-root': {
            alignItems: props.multiline ? 'flex-start' : 'center',
            borderRadius: '6px',
            border: `1px solid ${theme.palette.gray[30]}`,
            borderColor: success ? theme.palette.point.green1 : 'none',
            ...styleBaseSize,
            '&.MuiInputBase-multiline': {
              lineHeight: '20px',
              padding: '6px 4px 6px 11px',
            },
          },
          '& .MuiInputBase-root .MuiSvgIcon-root': {
            marginRight: 2,
            color: '#868E96',
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
            '& .MuiSvgIcon-root': {
              color: '#CED4DA',
            },
          },
          '& .MuiInputBase-root.Mui-readOnly': {
            borderColor: theme.palette.gray[20],
            backgroundColor: theme.palette.gray[10],
            color: theme.palette.gray[70],
          },
          '& .MuiInputAdornment-root': {
            margin: 0,
          },
          '& .MuiInputBase-input.MuiInputBase-inputMultiline ': {
            width: '100%',
          },
          '& .MuiInputBase-input': {
            width: contentWidth ? `${contentWidth}px` : 'auto',
            borderRadius: '0',
            padding: 0,
            '&::placeholder': {
              color: theme.palette.gray[40],
            },
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CED4DA',
              borderRadius: '10px',
            },
          },
        }}
        {...props}
        onInput={handleInput}
        onChange={handleChange}
      />
      {/* show the limitation of length input */}
      {!props.error && maxLength && (
        <Box display={'flex'} justifyContent={'flex-end'} width={'100%'} mt={1}>
          <Typography variant="subtext2" color="gray.60">{`${innerValue.length}/${maxLength}`}</Typography>
        </Box>
      )}

      {props.error && errorMessage && variant === 'inForm' && (
        <Typography component={'p'} variant="subtext2" color="point.red1" mt={1}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  )
}

export default MIInput
