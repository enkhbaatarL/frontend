import { Box, InputAdornment, TextField, TextFieldProps, Tooltip, Typography } from '@mui/material'
import { t } from 'i18next'
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  onClear?: () => void
  appendContent?: string
  onFocusInput?: () => void
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
  appendContent,
  variant = 'inForm',
  maxWidth,
  minWidth,
  width,
  onClear,
  onFocusInput,
  ...props
}: MIInputProps) => {
  const [innerValue, setInnerValue] = useState<string>(String(value) || '')
  const { ref: containerRef, isFocus, registerClickOutListener } = useCheckFocus()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (maxLength && typeof value === 'string' && value.length >= maxLength) return
    setInnerValue(value ? String(value) : '')
  }, [maxLength, value])

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) return
      setInnerValue(e.target.value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        props.onChange?.(e)
      }, 300)
    },
    [maxLength, props],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (maxLength && e.target.value.length > maxLength) return
      setInnerValue(e.target.value)
      props.onChange?.(e)
    },
    [maxLength, props],
  )

  const handleFocus = useCallback(() => {
    if (onFocusInput) {
      onFocusInput()
    }
    registerClickOutListener()
  }, [onFocusInput, registerClickOutListener])

  const styleBaseSize = useMemo(() => {
    switch (size) {
      case 'h26':
        return {
          height: props.multiline ? 'auto' : '26px',
          padding: '4px 11px',
          ...theme.typography.body3R12,
          '& input': {
            height: '16px',
          },
        }
      case 'h34':
        return {
          height: props.multiline ? 'auto' : '34px',
          padding: '6px 11px',
          ...theme.typography.body2R14,
          '& input': {
            height: '20px',
          },
        }
      case 'h36':
        return {
          height: props.multiline ? 'auto' : '36px',
          padding: '7px 11px',
          ...theme.typography.body2R14,
          '& input': {
            height: '20px',
          },
        }
      case 'h46':
        return {
          height: props.multiline ? 'auto' : '46px',
          padding: '10px 12px',
          ...theme.typography.body2R14,
          '& input': {
            height: '25px',
            fontSize: '18px',
            fontWeight: 500,
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
          height: props.multiline ? 'auto' : '34px',
          padding: '6px 11px',
          ...theme.typography.body3R14,
          '& input': {
            height: '20px',
          },
        }
    }
  }, [props.multiline, size])

  const inputProps = useMemo(() => {
    const defaultProps: Record<string, string | ReactNode> = {
      readOnly,
    }

    defaultProps.endAdornment = (
      <InputAdornment position="end" sx={{ cursor: 'pointer' }}>
        {isFocus && !readOnly && innerValue && !props.error && !props.multiline && (
          <MIInputClearIcon
            width={size === 'h46' ? 20 : 16}
            height={size === 'h46' ? 20 : 16}
            onClick={() => {
              setInnerValue('')
              if (onClear) {
                onClear()
              } else {
                props.onChange?.({
                  target: {
                    value: '',
                  },
                } as ChangeEvent<HTMLInputElement>)
              }
            }}
          />
        )}
        {props.error && variant === 'inTable' && (
          <Tooltip disableHoverListener={!errorMessage} title={errorMessage}>
            <MIInputErrorIcon width={16} height={16} />
          </Tooltip>
        )}
        {endIcon && (
          <Box className="end-icon-wrapper" p={'4px'}>
            {endIcon}
          </Box>
        )}
      </InputAdornment>
    )

    if (startIcon) {
      defaultProps.startAdornment = <InputAdornment position="start">{startIcon}</InputAdornment>
    }

    if (maxLength) {
      defaultProps.maxLength = maxLength
    }

    return defaultProps
  }, [readOnly, isFocus, innerValue, props, size, variant, errorMessage, endIcon, startIcon, maxLength, onClear])

  return (
    <Box
      className={'BoxInput'}
      ref={containerRef}
      sx={{
        maxWidth,
        minWidth,
        width,
        svg: {
          display: 'block',
        },
      }}
    >
      <Box display={'flex'} alignItems={'center'}>
        <TextField
          fullWidth
          variant="outlined"
          hiddenLabel
          placeholder={t('입력하세요.')}
          value={innerValue}
          onFocus={handleFocus}
          minRows={4.3}
          maxRows={11.8}
          slotProps={{
            input: inputProps,
          }}
          sx={{
            '& .MuiInputBase-root': {
              alignItems: props.multiline ? 'flex-start' : 'center',
              borderRadius: '4px',
              //border: `1px solid ${theme.palette.content['borderEnabled']}`,
              borderColor: success ? theme.palette.point.green1 : 'none',
              ...styleBaseSize,
              '&.MuiInputBase-multiline': {
                lineHeight: '20px',
                padding: '6px 4px 6px 11px',
              },
              '.MuiInputAdornment-root': {
                marginRight: 0,
              },
              '& .end-icon-wrapper': {
                borderRadius: '4px',
                marginLeft: '8px',
              },
              '& .end-icon-wrapper svg path': {
                fill: '#868E96',
              },
              '&:hover .end-icon-wrapper': {
                backgroundColor: theme.palette.content.backgroundHover,
              },
              '&:hover .end-icon-wrapper svg path': {
                fill: theme.palette.gray[80],
              },
            },
            '& .MuiInputBase-root .MuiSvgIcon-root': {
              marginRight: 2,
              color: '#868E96',
            },

            '& .MuiInputBase-root.Mui-focused': {
              //borderColor: theme.palette.content['borderActivePrimary'],
              '.MuiInputAdornment-root': {
                marginRight: 0,
                '.end-icon-wrapper': {
                  backgroundColor: theme.palette.content.backgroundHover,
                },
                'svg:last-child': {
                  color: theme.palette.content['iconActive'],
                  path: {
                    fill: theme.palette.content['iconActive'],
                  },
                },
                'svg.iconClear': {
                  color: theme.palette.content['iconEnabled'],
                  path: {
                    fill: theme.palette.content['iconEnabled'],
                  },
                },
              },
            },
            '& .MuiInputBase-root.Mui-error': {
              borderColor: `${theme.palette.point.red1}`,
            },
            // '& .MuiInputBase-root.Mui-disabled': {
            //   borderColor: theme.palette.gray[20],
            //   backgroundColor: theme.palette.gray[10],
            //   color: theme.palette.gray[50],
            //   '& .MuiSvgIcon-root': {
            //     color: '#CED4DA',
            //   },
            // },
            // '& .MuiInputBase-root.Mui-readOnly': {
            //   borderColor: theme.palette.gray[20],
            //   backgroundColor: theme.palette.gray[10],
            //   color: theme.palette.gray[70],
            // },
            '& .MuiInputAdornment-root': {
              margin: 0,
            },
            '& .MuiInputBase-input.MuiInputBase-inputMultiline ': {
              width: '100%',
            },
            '& .MuiInputBase-input': {
              width: contentWidth ? `${contentWidth}px` : '100%',
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
        {appendContent && (
          <Typography whiteSpace={'nowrap'} ml={1} component={'div'} variant="body2R14" color="gray.70">
            {appendContent}
          </Typography>
        )}
      </Box>
      {/* show the limitation of length input */}
      {!props.error && maxLength && !props.disabled && (
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
