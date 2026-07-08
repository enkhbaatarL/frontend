import { Box, Stack, SxProps, TextField, TextFieldProps, Theme, Typography } from '@mui/material'
import { debounce } from 'lodash-es'
import {
  useMemo,
  useRef,
  useCallback,
  useState,
  FormEvent,
  FocusEvent,
  useEffect,
  useLayoutEffect,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  forwardRef,
  useImperativeHandle,
  type InputHTMLAttributes,
} from 'react'

import { MaskConfig, PREDEFINED_MASKS } from '@/constants/masks'
import theme from '@/theming'
import { getCurrentFontFamily } from '@/utils/font'

export type MIMaskInputVariant = 'filled' | 'outlined'

export interface MIMaskInputProps extends Omit<TextFieldProps, 'value' | 'inputProps'> {
  value?: string
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  mask?: MaskConfig
  onUpdateValue?: (value?: string) => void
  onUpdateBlurValue?: (value?: string) => void
  updateTiming?: 'onInput' | 'onBlur'
  immediateUpdateOnInput?: boolean
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  offInitialError?: boolean
  width?: string | number
  readOnly?: boolean
  resetOnInvalid?: boolean
  variant?: MIMaskInputVariant
  maxLength?: number
  embedded?: boolean // 내부 래퍼의 박스 스타일 제거
}

export interface MIMaskInputRef {
  reset: () => void
}

const PLACEHOLDER_STACK_SX = {
  pointerEvents: 'none' as const,
  zIndex: 1,
  whiteSpace: 'nowrap' as const,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis' as const,
  padding: '8px 0',
}

const HELPER_CONTAINER_SX = {
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  width: '100%' as const,
  minHeight: 17,
}

const INPUT_BASE_STYLES = {
  padding: 0,
  borderRadius: 0,
  border: 'none',
  boxSizing: 'border-box' as const,
  height: '100%' as const,
  minHeight: 'unset' as const,
  backgroundColor: 'transparent' as const,
  '& fieldset': { border: 'none' as const },
  '&:hover fieldset': { border: 'none' as const },
  '&.Mui-focused fieldset': { border: 'none' as const },
}

const INPUT_FIELD_STYLES_BASE = {
  padding: 0,
  height: '100%' as const,
  boxSizing: 'border-box' as const,
  '&::placeholder': {
    color: '#ADB5BD',
    opacity: 1,
    userSelect: 'none' as const,
  },
}

const MIMaskInput = forwardRef<MIMaskInputRef, MIMaskInputProps>(
  (
    {
      value,
      mask = PREDEFINED_MASKS.PLAIN_TEXT,
      onUpdateValue,
      onUpdateBlurValue,
      updateTiming = 'onInput',
      immediateUpdateOnInput = false,
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
      variant = 'filled',
      maxLength,
      multiline,
      embedded = false,
      inputProps: legacyInputProps,
      ...props
    },
    ref,
  ) => {
    const { slotProps: propsSlotProps, placeholder: propsPlaceholder, ...restProps } = props

    const mergedSlotProps = useMemo((): TextFieldProps['slotProps'] => {
      const slotInput = typeof propsSlotProps?.input === 'object' && propsSlotProps?.input !== null ? propsSlotProps.input : {}
      const slotHtmlInput =
        typeof propsSlotProps?.htmlInput === 'object' && propsSlotProps?.htmlInput !== null ? propsSlotProps.htmlInput : {}
      const fromLegacy = typeof legacyInputProps === 'object' && legacyInputProps !== null ? legacyInputProps : {}
      const otherSlotProps = propsSlotProps
        ? Object.fromEntries(Object.entries(propsSlotProps).filter(([key]) => key !== 'input' && key !== 'htmlInput'))
        : {}
      return {
        ...otherSlotProps,
        input: {
          ...slotInput,
          ...(maxLength === undefined ? {} : { maxLength }),
          readOnly,
        },
        htmlInput: {
          ...slotHtmlInput,
          ...fromLegacy,
          ...(maxLength === undefined ? {} : { maxLength }),
          readOnly,
        },
      } as TextFieldProps['slotProps']
    }, [propsSlotProps, legacyInputProps, maxLength, readOnly])

    const inputRef = useRef<HTMLDivElement>(null)
    const inputElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
    const cursorPositionRef = useRef<number | null>(null)
    const scrollbarTrackRef = useRef<HTMLSpanElement | null>(null)
    const scrollbarSyncFrameRef = useRef(0)

    const [innerValue, setInnerValue] = useState<string>(value ?? '')
    const [hasUserInput, setHasUserInput] = useState(false)
    const [scrollbarState, setScrollbarState] = useState({ visible: false, thumbHeight: 0, thumbTop: 0 })

    const fontFamily = useMemo(() => getCurrentFontFamily(), [])

    const onUpdateValueRef = useRef(onUpdateValue)
    useEffect(() => {
      onUpdateValueRef.current = onUpdateValue
    }, [onUpdateValue])

    const debouncedOnUpdateValue = useMemo(
      () =>
        debounce((val: string | undefined) => {
          onUpdateValueRef.current?.(val)
        }, 300),
      [],
    )

    useEffect(() => () => debouncedOnUpdateValue.cancel(), [debouncedOnUpdateValue])

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

        formattedValue = mask.format ? mask.format(newValue) : newValue

        if (maxLength !== undefined && formattedValue.length > maxLength) {
          formattedValue = formattedValue.slice(0, maxLength)
        }

        setInnerValue(formattedValue)

        if (mask.calculateCursorPosition && event) {
          cursorPositionRef.current = mask.calculateCursorPosition(formattedValue, selectionStart, inputType, inputData ?? undefined)
        }

        const isValid = mask.pattern.test(formattedValue)

        if (updateTiming === 'onInput') {
          // 타이핑 도중에는 폼이 미완성이라 isValid가 false일 수 있음
          // 이때 undefined를 반환하면 데이터가 날아가므로 타이핑된 상태유지
          if (immediateUpdateOnInput) {
            debouncedOnUpdateValue.cancel()
            onUpdateValueRef.current?.(formattedValue)
          } else {
            debouncedOnUpdateValue(formattedValue)
          }
        }

        return { formattedValue, isValid }
      },
      [mask, maxLength, updateTiming, immediateUpdateOnInput, debouncedOnUpdateValue],
    )

    useLayoutEffect(() => {
      if (cursorPositionRef.current !== null && inputElementRef.current) {
        inputElementRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current)
        cursorPositionRef.current = null
      }
    }, [innerValue])

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
        debouncedOnUpdateValue.flush()

        if (isValid) {
          onUpdateBlurValue?.(formattedValue)
          if (updateTiming === 'onBlur') {
            onUpdateValue?.(formattedValue)
          }
        } else if (resetOnInvalid) {
          // 최종적으로 유효하지 않으면 롤백
          setInnerValue(value ?? '')
          if (updateTiming === 'onBlur' || updateTiming === 'onInput') {
            onUpdateValue?.(value ?? '')
          }
        }

        // 유효하지 않아도 롤백 세팅이 false면 그대로 유지
        onUpdateBlurValue?.(formattedValue)
        if (updateTiming === 'onBlur') {
          onUpdateValue?.(formattedValue)
        }
      },
      [onBlur, handleUpdateValue, onUpdateBlurValue, debouncedOnUpdateValue, value, resetOnInvalid, updateTiming, onUpdateValue],
    )

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)
        // 부모가 Enter를 처리한 경우 blur 생략
        if (event.key === 'Enter' && !multiline && !event.defaultPrevented) {
          const target = event.target as HTMLInputElement
          setTimeout(() => target.blur(), 0)
        }
      },
      [onKeyDown, multiline],
    )

    useEffect(() => {
      setInnerValue(value ?? '')
      // 부모가 value를 변경할 때마다 대기 중인 debounce를 취소해
      // stale 콜백이 입력을 덮어쓰지 않도록 함 (예: Enter 후 필드 초기화)
      debouncedOnUpdateValue.cancel()
    }, [value, debouncedOnUpdateValue])

    useEffect(() => {
      if (value && !hasUserInput) {
        setHasUserInput(true)
      }
    }, [value, hasUserInput])

    useEffect(() => {
      if (!multiline) return undefined

      const inputElement = inputElementRef.current
      if (!inputElement || inputElement.tagName !== 'TEXTAREA') return undefined

      const syncScrollbar = () => {
        const scrollableHeight = inputElement.scrollHeight - inputElement.clientHeight
        const trackHeight = scrollbarTrackRef.current?.clientHeight ?? 0
        const visible = scrollableHeight > 1 && trackHeight > 0
        const thumbHeight = visible ? Math.max((inputElement.clientHeight / inputElement.scrollHeight) * trackHeight, 20) : 0
        const thumbTop = visible ? (inputElement.scrollTop / scrollableHeight) * Math.max(trackHeight - thumbHeight, 0) : 0

        setScrollbarState((current) =>
          current.visible === visible && current.thumbHeight === thumbHeight && current.thumbTop === thumbTop
            ? current
            : { visible, thumbHeight, thumbTop },
        )
      }

      const scheduleSync = () => {
        if (scrollbarSyncFrameRef.current) return

        scrollbarSyncFrameRef.current = globalThis.requestAnimationFrame(() => {
          scrollbarSyncFrameRef.current = 0
          syncScrollbar()
        })
      }

      syncScrollbar()
      inputElement.addEventListener('scroll', scheduleSync, { passive: true })
      const resizeObserver = new ResizeObserver(scheduleSync)
      resizeObserver.observe(inputElement)

      return () => {
        if (scrollbarSyncFrameRef.current) {
          globalThis.cancelAnimationFrame(scrollbarSyncFrameRef.current)
          scrollbarSyncFrameRef.current = 0
        }
        inputElement.removeEventListener('scroll', scheduleSync)
        resizeObserver.disconnect()
      }
    }, [innerValue, multiline])

    const handleScrollbarThumbPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
      const inputElement = inputElementRef.current
      const track = scrollbarTrackRef.current
      if (!inputElement || inputElement.tagName !== 'TEXTAREA' || !track) return

      event.preventDefault()
      event.stopPropagation()

      const startY = event.clientY
      const startScrollTop = inputElement.scrollTop
      const scrollableHeight = Math.max(0, inputElement.scrollHeight - inputElement.clientHeight)
      const maxThumbTop = Math.max(1, track.clientHeight - event.currentTarget.clientHeight)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        inputElement.scrollTop = startScrollTop + ((moveEvent.clientY - startY) / maxThumbTop) * scrollableHeight
      }

      const handlePointerUp = () => {
        globalThis.removeEventListener('pointermove', handlePointerMove)
        globalThis.removeEventListener('pointerup', handlePointerUp)
      }

      globalThis.addEventListener('pointermove', handlePointerMove)
      globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
    }, [])

    const shouldShowError = offInitialError ? hasUserInput && error : error
    const shouldShowHelperText = offInitialError ? hasUserInput && helperText : helperText
    const isMaxLengthReached = maxLength !== undefined && innerValue.length >= maxLength
    const helperTextToShow =
      shouldShowHelperText || (isMaxLengthReached ? `최대 ${maxLength.toLocaleString()}자까지 입력할 수 있습니다.` : undefined)

    const inputWrapperBoxSx = useMemo(
      () =>
        [
          {
            position: 'relative' as const,
            width: '100%' as const,
            height: multiline ? 'auto' : embedded ? '100%' : '20px',
            minHeight: multiline || !embedded ? undefined : 0,
            boxSizing: 'border-box' as const,
            display: embedded && !multiline ? ('flex' as const) : undefined,
            alignItems: embedded && !multiline ? ('center' as const) : undefined,
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>,
      [multiline, sx, embedded],
    )

    const textFieldSx = useMemo(
      () =>
        [
          {
            width: '100%' as const,
            height: '100%' as const,
            boxSizing: 'border-box' as const,
            '& .MuiInputBase-root': {
              ...INPUT_BASE_STYLES,
              ...(embedded && !multiline ? { alignItems: 'center' as const } : {}),
              '& input, & textarea': {
                ...INPUT_FIELD_STYLES_BASE,
                fontFamily,
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: embedded && !multiline ? '20px' : '1.4',
                color: '#495057',
                ...(embedded && !multiline ? { paddingTop: 0, paddingBottom: 0, height: '20px' as const } : {}),
                ...(multiline
                  ? {
                    scrollbarWidth: 'none' as const,
                    '&::-webkit-scrollbar': {
                      display: 'none' as const,
                    },
                  }
                  : {}),
              },
            },
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>,
      [fontFamily, sx, embedded, multiline],
    )

    const readOnlyTypographySx = useMemo(
      () => ({
        fontFamily,
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '1.4',
        color: theme.palette.contentText.Normal,
        padding: 0,
        ...(multiline
          ? { whiteSpace: 'pre-wrap' as const, width: '100%' }
          : {
            display: 'block' as const,
            width: '100%',
            minWidth: 0,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden' as const,
            textOverflow: 'ellipsis' as const,
          }),
      }),
      [fontFamily, multiline],
    )

    const readOnlySingleLineRowSx = useMemo(
      () =>
        multiline
          ? undefined
          : ({
            minHeight: '20px',
            minWidth: 0,
            width: '100%',
            display: 'flex' as const,
            alignItems: 'center' as const,
            boxSizing: 'border-box' as const,
            overflow: 'hidden' as const,
          } as const),
      [multiline],
    )

    const placeholderTypographySx = useMemo(
      () => ({
        fontFamily,
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '1.4',
        opacity: 0,
        whiteSpace: 'pre' as const,
      }),
      [fontFamily],
    )

    const placeholderSuffixTypographySx = useMemo(
      () => ({
        fontFamily,
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#ADB5BD',
        whiteSpace: 'pre' as const,
      }),
      [fontFamily],
    )

    const helperTextTypographySx = useMemo(
      () => ({
        fontFamily,
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: '1.4',
        color: shouldShowError || isMaxLengthReached ? '#F03E3E' : '#868E96',
      }),
      [fontFamily, shouldShowError, isMaxLengthReached],
    )

    const maxLengthTypographySx = useMemo(
      () => ({
        fontFamily,
        fontWeight: 400,
        fontSize: '12px',
        lineHeight: '1.4',
        color: isMaxLengthReached ? '#F03E3E' : '#868E96',
        marginLeft: 'auto' as const,
      }),
      [fontFamily, isMaxLengthReached],
    )

    const containerSx = useMemo(
      () =>
        [
          {
            display: 'flex' as const,
            flexDirection: 'column' as const,
            gap: '4px',
            width,
            boxSizing: 'border-box' as const,
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>,
      [width, sx],
    )

    const boxBorderSx = useMemo(
      () => ({
        border: shouldShowError ? '1px solid #F03E3E' : '1px solid #DEE2E6',
        borderRadius: '8px',
        backgroundColor: disabled ? '#F1F3F5' : '#FFFFFF',
        opacity: disabled && !readOnly ? 0.6 : 1,
      }),
      [shouldShowError, disabled, readOnly],
    )

    const outlinedContainerSx = useMemo(
      () =>
        [
          {
            display: 'flex' as const,
            flexDirection: 'column' as const,
            gap: '4px',
            width,
            boxSizing: 'border-box' as const,
            ...boxBorderSx,
            padding: '8px 12px',
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>,
      [width, boxBorderSx, sx],
    )

    const noLabelBoxSx = useMemo(
      () =>
        [
          {
            position: 'relative' as const,
            width,
            flexShrink: width === '100%' ? undefined : 0,
            height: multiline ? 'auto' : embedded ? '100%' : '36px',
            minHeight: embedded && !multiline ? 0 : undefined,
            alignSelf: embedded && !multiline ? ('stretch' as const) : undefined,
            display: embedded && !multiline ? ('flex' as const) : undefined,
            flexDirection: embedded && !multiline ? ('column' as const) : undefined,
            boxSizing: 'border-box' as const,
          },
          ...(sx ? [sx] : []),
        ] as SxProps<Theme>,
      [width, multiline, sx, embedded],
    )

    const renderLabeledFieldContent = () => {
      if (readOnly) {
        return (
          <Box sx={readOnlySingleLineRowSx}>
            <Typography sx={readOnlyTypographySx} title={multiline || !innerValue ? undefined : innerValue}>
              {innerValue}
            </Typography>
          </Box>
        )
      }
      return (
        <Box sx={{ position: 'relative', width: '100%' }}>
          <Box ref={inputRef} sx={inputWrapperBoxSx}>
            <TextField
              inputRef={inputElementRef}
              value={innerValue}
              onInput={handleInput}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              multiline={multiline}
              sx={textFieldSx}
              slotProps={mergedSlotProps}
              placeholder={propsPlaceholder}
              {...restProps}
              disabled={disabled}
            />
            {mask.placeholder && placeholderSuffix && (
              <Stack
                direction="row"
                alignItems="center"
                position="absolute"
                left={0}
                top={0}
                right={0}
                bottom={0}
                sx={PLACEHOLDER_STACK_SX}
              >
                <Typography sx={placeholderTypographySx}>{innerValue}</Typography>
                <Typography sx={placeholderSuffixTypographySx}>{placeholderSuffix}</Typography>
              </Stack>
            )}
            {multiline && (
              <Stack
                component="span"
                ref={scrollbarTrackRef}
                aria-hidden
                position="absolute"
                top="4px"
                right="-10px"
                bottom="4px"
                width="14px"
                sx={{
                  opacity: scrollbarState.visible ? 1 : 0,
                  pointerEvents: scrollbarState.visible ? 'auto' : 'none',
                  transition: 'opacity 120ms ease',
                }}
              >
                <Stack
                  component="span"
                  onPointerDown={handleScrollbarThumbPointerDown}
                  position="absolute"
                  top={`${scrollbarState.thumbTop}px`}
                  right="5px"
                  width="4px"
                  height={`${scrollbarState.thumbHeight}px`}
                  borderRadius="4px"
                  bgcolor="#CED4DA"
                  sx={{
                    cursor: 'grab',
                    '&:hover': { bgcolor: '#ADB5BD' },
                  }}
                />
              </Stack>
            )}
          </Box>
        </Box>
      )
    }

    const renderLabeledHelperRow = () => {
      if (!helperTextToShow && !(maxLength !== undefined && !readOnly)) {
        return null
      }
      return (
        <Box sx={HELPER_CONTAINER_SX}>
          {helperTextToShow && <Typography sx={helperTextTypographySx}>{helperTextToShow}</Typography>}
          {maxLength !== undefined && (
            <Typography sx={maxLengthTypographySx}>
              {innerValue.length.toLocaleString()} / {maxLength.toLocaleString()}
            </Typography>
          )}
        </Box>
      )
    }

    if (label !== undefined) {
      if (variant === 'filled') {
        return (
          <Box sx={containerSx}>
            <Stack direction="row" alignItems="center" gap="2px">
              <Typography variant="body2SB14" color="contentText.Normal">
                {label}
              </Typography>
              {required && <Box width="4px" height="4px" borderRadius="50%" bgcolor="point.red1" mb="6px" />}
            </Stack>
            <Box sx={{ ...boxBorderSx, padding: '8px 12px' }}>{renderLabeledFieldContent()}</Box>
            {renderLabeledHelperRow()}
          </Box>
        )
      }

      return (
        <Box sx={outlinedContainerSx}>
          <Stack direction="row" alignItems="center" gap="2px">
            <Typography variant="body2SB14" color="contentText.Normal">
              {label}
            </Typography>
            {required && <Box width="4px" height="4px" borderRadius="50%" bgcolor="point.red1" mb="6px" />}
          </Stack>
          {renderLabeledFieldContent()}
          {renderLabeledHelperRow()}
        </Box>
      )
    }

    return (
      <Box sx={noLabelBoxSx}>
        <Box
          sx={
            embedded
              ? {
                border: 'none',
                borderRadius: 0,
                backgroundColor: 'transparent',
                padding: multiline ? '0 12px' : '0 12px 0 12px',
                width: '100%',
                height: multiline ? 'auto' : '100%',
                minHeight: multiline ? undefined : 0,
                flex: multiline ? undefined : 1,
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                alignItems: multiline ? 'stretch' : 'center',
              }
              : {
                ...boxBorderSx,
                padding: '8px 12px',
                width: '100%',
                height: multiline ? 'auto' : '100%',
                minHeight: multiline ? undefined : '36px',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }
          }
        >
          {renderLabeledFieldContent()}
        </Box>
      </Box>
    )
  },
)

MIMaskInput.displayName = 'MIMaskInput'

export default MIMaskInput
