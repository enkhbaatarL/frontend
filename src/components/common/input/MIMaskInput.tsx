import { Box, Stack, SxProps, TextField, TextFieldProps, Theme, Typography } from '@mui/material'
import {
  useMemo,
  useRef,
  useCallback,
  useState,
  FormEvent,
  FocusEvent,
  useEffect,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { flushSync } from 'react-dom'

import { MaskConfig } from '@/constants/masks'
import theme from '@/theming'
import { getCurrentFontFamily } from '@/utils/font'

export interface MIMaskInputProps extends Omit<TextFieldProps, 'value'> {
  value?: string
  mask: MaskConfig
  onUpdateValue?: (value?: string) => void
  onUpdateBlurValue?: (value?: string) => void
  updateTiming?: 'onInput' | 'onBlur'
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  offInitialError?: boolean
  width?: string | number
  readOnly?: boolean
  resetOnInvalid?: boolean // 유효하지 않은 값일 때 원래 값으로 되돌릴지 여부 (기본값: true)
}

export interface MIMaskInputRef {
  reset: () => void
}

const MIMaskInput = forwardRef<MIMaskInputRef, MIMaskInputProps>(
  (
    {
      value,
      mask,
      onUpdateValue,
      onUpdateBlurValue,
      updateTiming: _updateTiming = 'onInput',
      sx,
      onInput,
      onBlur,
      onKeyDown,
      label,
      required = false,
      error = false,
      helperText,
      offInitialError = false,
      width = '100%',
      readOnly = false,
      disabled,
      resetOnInvalid = true,
      ...props
    },
    ref,
  ) => {
    const { slotProps: propsSlotProps, ...restProps } = props

    const inputRef = useRef<HTMLDivElement>(null)
    const inputElementRef = useRef<HTMLInputElement | null>(null)

    const [innerValue, setInnerValue] = useState<string>(value ?? '')
    const [hasUserInput, setHasUserInput] = useState(false)

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          setInnerValue(value ?? '')
        },
      }),
      [value],
    )

    const placeholderSuffix = useMemo(() => mask.placeholder?.substring(innerValue.length) ?? '', [mask.placeholder, innerValue])

    const handleUpdateValue = useCallback(
      (newValue: string, event?: FormEvent<HTMLInputElement>): { formattedValue: string; isValid: boolean } => {
        const target = event?.target as HTMLInputElement | undefined
        const selectionStart = target?.selectionStart ?? 0
        const inputType = (event?.nativeEvent as InputEvent)?.inputType ?? ''
        const inputData = (event?.nativeEvent as InputEvent)?.data ?? undefined

        let formattedValue: string

        if (mask.format) {
          formattedValue = mask.format(newValue)
        } else {
          formattedValue = newValue
        }

        flushSync(() => {
          setInnerValue(formattedValue)
        })

        // 커서 위치 조정
        if (mask.calculateCursorPosition && inputElementRef.current) {
          const cursorIndex = mask.calculateCursorPosition(formattedValue, selectionStart, inputType, inputData ?? undefined)
          inputElementRef.current.setSelectionRange(cursorIndex, cursorIndex)
        }

        const isValid = mask.pattern.test(formattedValue)
        // resetOnInvalid가 false일 때는 유효하지 않은 값이어도 formattedValue를 반환
        const valueToCallback = isValid || !resetOnInvalid ? formattedValue : undefined

        onUpdateValue?.(valueToCallback)
        return { formattedValue, isValid }
      },
      [onUpdateValue, mask, resetOnInvalid],
    )

    const handleInput = useCallback(
      (event: FormEvent<HTMLInputElement>) => {
        onInput?.(event)
        handleUpdateValue((event.target as HTMLInputElement).value, event)
      },
      [onInput, handleUpdateValue],
    )

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        onBlur?.(event)
        const { formattedValue, isValid } = handleUpdateValue((event.target as HTMLInputElement).value)
        if (isValid) {
          onUpdateBlurValue?.(formattedValue)
        } else if (resetOnInvalid) {
          // resetOnInvalid가 true일 때만 원래 값으로 되돌림
          setInnerValue(value ?? '')
        } else {
          // resetOnInvalid가 false일 때는 유효하지 않은 값이어도 그대로 전달
          onUpdateBlurValue?.(formattedValue)
        }
      },
      [onBlur, handleUpdateValue, onUpdateBlurValue, value, resetOnInvalid],
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)
        if (event.key === 'Enter') {
          ;(event.target as HTMLInputElement).blur()
        }
      },
      [onKeyDown],
    )

    useEffect(() => {
      setInnerValue(value ?? '')
    }, [value])

    useEffect(() => {
      if (value && !hasUserInput) {
        setHasUserInput(true)
      }
    }, [value, hasUserInput])

    const shouldShowError = offInitialError ? hasUserInput && error : error
    const shouldShowHelperText = offInitialError ? hasUserInput && helperText : helperText

    // label이 있는 경우 Box 스타일로 렌더링
    if (label !== undefined) {
      return (
        <Stack
          width={width}
          padding={readOnly ? '4px' : '12px'}
          border={shouldShowError ? '1px solid #F03E3E' : '1px solid #DEE2E6'}
          borderRadius="8px"
          boxSizing="border-box"
          gap="4px"
          sx={{
            backgroundColor: disabled ? '#F1F3F5' : '#FFFFFF',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {!readOnly && (
            <Stack direction="row" alignItems="center" gap="4px">
              <Typography
                sx={{
                  fontFamily: getCurrentFontFamily(),
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: '#868E96',
                }}
              >
                {label}
              </Typography>
              {required && (
                <Typography
                  sx={{
                    fontFamily: getCurrentFontFamily(),
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '1.4',
                    color: '#F03E3E',
                  }}
                >
                  *
                </Typography>
              )}
            </Stack>
          )}

          {readOnly ? (
            <Typography
              sx={{
                fontFamily: 'Pretendard',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '1.4',
                color: '#495057',
                padding: '8px 0',
              }}
            >
              {innerValue}
            </Typography>
          ) : (
            <Box sx={{ position: 'relative', width: '100%' }}>
              <Box
                ref={inputRef}
                sx={
                  [
                    {
                      position: 'relative',
                      width: '100%',
                      height: '20px',
                      boxSizing: 'border-box',
                    },
                    ...(sx ? [sx] : []),
                  ] as SxProps<Theme>
                }
              >
                <TextField
                  inputRef={inputElementRef}
                  value={innerValue}
                  onInput={handleInput}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  sx={
                    [
                      {
                        width: '100%',
                        height: '100%',
                        boxSizing: 'border-box',
                        '& .MuiInputBase-root': {
                          padding: 0,
                          borderRadius: 0,
                          border: 'none',
                          boxSizing: 'border-box',
                          height: '100%',
                          minHeight: 'unset',
                          backgroundColor: 'transparent',
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover fieldset': {
                            border: 'none',
                          },
                          '&.Mui-focused fieldset': {
                            border: 'none',
                          },
                          '& input': {
                            padding: 0,
                            height: '100%',
                            boxSizing: 'border-box',
                            fontFamily: getCurrentFontFamily(),
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '1.4',
                            color: '#495057',
                            '&::placeholder': {
                              color: '#ADB5BD',
                              opacity: 1,
                              userSelect: 'none',
                            },
                          },
                        },
                      },
                      ...(sx ? [sx] : []),
                    ] as SxProps<Theme>
                  }
                  slotProps={{
                    input: {
                      ...(() => {
                        if (typeof propsSlotProps?.input === 'object' && propsSlotProps?.input !== null) {
                          return propsSlotProps.input
                        }
                        return {}
                      })(),
                    },
                    ...(propsSlotProps ? Object.fromEntries(Object.entries(propsSlotProps).filter(([key]) => key !== 'input')) : {}),
                  }}
                  {...restProps}
                />
                {/* 플레이스홀더 미리보기 */}
                {mask.placeholder && placeholderSuffix && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    position="absolute"
                    left={0}
                    top={0}
                    right={0}
                    bottom={0}
                    sx={{
                      pointerEvents: 'none',
                      zIndex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '8px 0',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: getCurrentFontFamily(),
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '1.4',
                        opacity: 0,
                        whiteSpace: 'pre',
                      }}
                    >
                      {innerValue}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: getCurrentFontFamily(),
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '1.4',
                        color: '#ADB5BD',
                        whiteSpace: 'pre',
                      }}
                    >
                      {placeholderSuffix}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          )}

          {shouldShowHelperText && (
            <Typography
              sx={{
                fontFamily: 'Pretendard',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '1.4',
                color: shouldShowError ? '#F03E3E' : '#868E96',
                marginTop: '4px',
              }}
            >
              {shouldShowHelperText}
            </Typography>
          )}
        </Stack>
      )
    }

    return (
      <Box
        ref={inputRef}
        sx={
          [
            {
              position: 'relative',
              width: '100%',
              height: '36px',
              boxSizing: 'border-box',
            },
            ...(sx ? [sx] : []),
          ] as SxProps<Theme>
        }
      >
        <TextField
          inputRef={inputElementRef}
          value={innerValue}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          sx={
            [
              {
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                '& .MuiInputBase-root': {
                  padding: '6px 12px',
                  borderRadius: '10px',
                  transition: 'border-color 0.2s ease-in-out',
                  boxSizing: 'border-box',
                  height: '100%',
                  minHeight: 'unset',
                  backgroundColor: theme.palette.commonColor.White,
                  border: `1px solid ${theme.palette.content.borderEnabled}`,
                  ...theme.typography.body2M14,
                  color: theme.palette.contentText.Normal,
                  '&.MuiInputBase-adornedEnd': {
                    paddingRight: '12px !important',
                  },
                  '& fieldset': {
                    border: `1px solid ${theme.palette.content.borderEnabled}`,
                  },
                  '&:hover fieldset': {
                    border: `1px solid ${theme.palette.content.borderEnabled}`,
                  },
                  '&.Mui-focused fieldset': {
                    border: `1px solid ${theme.palette.content.borderEnabled}`,
                  },
                  '& input': {
                    padding: '8px 0',
                    height: '100%',
                    boxSizing: 'border-box',
                    '&::placeholder': {
                      userSelect: 'none',
                    },
                  },
                  '& .MuiInputAdornment-root': {
                    marginRight: 0,
                    '&.MuiInputAdornment-positionEnd': {
                      marginRight: 0,
                    },
                  },
                },
              },
              ...(sx ? [sx] : []),
            ] as SxProps<Theme>
          }
          slotProps={{
            input: {
              ...(() => {
                if (typeof propsSlotProps?.input === 'object' && propsSlotProps?.input !== null) {
                  return propsSlotProps.input
                }
                return {}
              })(),
            },
            ...(propsSlotProps ? Object.fromEntries(Object.entries(propsSlotProps).filter(([key]) => key !== 'input')) : {}),
          }}
          {...restProps}
        />
        {/* 플레이스홀더 미리보기 */}
        {mask.placeholder && placeholderSuffix && (
          <Stack
            direction="row"
            alignItems="center"
            position="absolute"
            left={0}
            top={0}
            right={0}
            bottom={0}
            padding="6px 12px"
            sx={{
              pointerEvents: 'none',
              zIndex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Typography
              variant="body2M14"
              sx={{
                opacity: 0,
                whiteSpace: 'pre',
              }}
            >
              {innerValue}
            </Typography>
            <Typography
              variant="body2M14"
              color="gray.40"
              sx={{
                whiteSpace: 'pre',
              }}
            >
              {placeholderSuffix}
            </Typography>
          </Stack>
        )}
      </Box>
    )
  },
)

MIMaskInput.displayName = 'MIMaskInput'

export default MIMaskInput
