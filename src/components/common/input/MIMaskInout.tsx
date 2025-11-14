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

import { MaskConfig } from '@/constants/masks'
import theme from '@/theming'

export interface MIMaskInputProps extends Omit<TextFieldProps, 'value'> {
  value?: string
  mask: MaskConfig
  onUpdateValue?: (value?: string) => void
  onUpdateBlurValue?: (value?: string) => void
  updateTiming?: 'onInput' | 'onBlur'
}

export interface MIMaskInputRef {
  reset: () => void
}

const MIMaskInput = forwardRef<MIMaskInputRef, MIMaskInputProps>(
  (
    { value, mask, onUpdateValue, onUpdateBlurValue, updateTiming: _updateTiming = 'onInput', sx, onInput, onBlur, onKeyDown, ...props },
    ref,
  ) => {
    const { slotProps: propsSlotProps, ...restProps } = props

    const inputRef = useRef<HTMLDivElement>(null)
    const inputElementRef = useRef<HTMLInputElement | null>(null)

    const [innerValue, setInnerValue] = useState<string>(value ?? '')

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
      (newValue: string, event?: FormEvent<HTMLInputElement>): string | undefined => {
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

        setInnerValue(formattedValue)

        // 커서 위치 조정
        if (mask.calculateCursorPosition && inputElementRef.current) {
          const cursorIndex = mask.calculateCursorPosition(formattedValue, selectionStart, inputType, inputData ?? undefined)

          setTimeout(() => {
            if (inputElementRef.current) {
              inputElementRef.current.setSelectionRange(cursorIndex, cursorIndex)
            }
          }, 0)
        }

        onUpdateValue?.(mask.pattern.test(formattedValue) ? formattedValue : undefined)
        return mask.pattern.test(formattedValue) ? formattedValue : undefined
      },
      [onUpdateValue, mask],
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
        const result = handleUpdateValue((event.target as HTMLInputElement).value)
        if (result) {
          onUpdateBlurValue?.(result)
        } else {
          setInnerValue(value ?? '')
        }
      },
      [onBlur, handleUpdateValue, onUpdateBlurValue, value],
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
