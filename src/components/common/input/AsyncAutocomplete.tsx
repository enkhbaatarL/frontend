import SearchIcon from '@mui/icons-material/Search'
import {
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteCloseReason,
  AutocompleteHighlightChangeReason,
  AutocompleteProps,
  Box,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material'
import { throttle } from 'lodash-es'
import { useMemo, useRef, useState, useEffect, useCallback, ReactNode, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react'

import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import theme from '@/theming'

export interface Props extends Omit<AutocompleteProps<string, false, false, boolean>, 'options' | 'renderInput'> {
  width?: string | number
  height?: string | number
  asyncFunction?: (keyword: string) => Promise<string[]>
  textFieldProps?: TextFieldProps
  showSearchIcon?: boolean
  onSearch?: (value: string) => void
  onClear?: () => void
  showOptionsOnFocus?: boolean
  disableCache?: boolean
}

const AsyncAutocomplete = ({
  width,
  height,
  asyncFunction,
  textFieldProps,
  showSearchIcon = false,
  onSearch,
  onClear,
  showOptionsOnFocus = false,
  disableCache = false,
  ...props
}: Props) => {
  const inputRef = useRef<HTMLDivElement>(null)
  const inputElementRef = useRef<HTMLInputElement | null>(null)
  const cacheRef = useRef<Map<string, string[]>>(new Map())

  const [isFocused, setIsFocused] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [highlightedOption, setHighlightedOption] = useState<string | null>(null)
  const [isComposing, setIsComposing] = useState(false)

  const isOpenOptions = useMemo(() => {
    if (!isFocused || options.length === 0) return false
    if (showOptionsOnFocus) return true
    return (props.value ?? '').trim().length > 0
  }, [isFocused, props.value, options, showOptionsOnFocus])

  const throttledSearch = useMemo(() => {
    if (!asyncFunction) return null

    return throttle((keyword: string) => {
      if (!disableCache) {
        const cached = cacheRef.current.get(keyword)

        if (cached !== undefined) {
          setOptions(cached)
          return
        }
      }

      asyncFunction(keyword).then((response) => {
        const result = response ?? []
        if (!disableCache) {
          cacheRef.current.set(keyword, result)
        }
        setOptions(result)
      })
    }, 500)
  }, [asyncFunction, disableCache])

  // 현재 입력값과 매칭되는 첫 번째 옵션
  const firstSuggestion = useMemo(() => {
    if (!props.value?.trim() || options?.length === 0) return null

    const lowerValue = props.value.toLowerCase()
    const matched = options?.find((option) => option.toLowerCase().startsWith(lowerValue))

    if (matched && matched.toLowerCase() !== lowerValue) {
      return matched
    }
    return null
  }, [props.value, options])

  const previewOption = useMemo(() => highlightedOption ?? firstSuggestion, [highlightedOption, firstSuggestion])

  // 입력된 부분을 제외한 나머지 제안 문자
  const suggestionSuffix = useMemo(() => {
    if (!previewOption || !props.value) return ''
    return previewOption.substring(props.value.length)
  }, [previewOption, props.value])

  const handleSearch = useCallback(
    (e?: MouseEvent<HTMLDivElement>) => {
      e?.preventDefault()
      e?.stopPropagation()

      const value = props.value ?? ''
      if (value.trim() && onSearch) {
        onSearch(value.trim())
      }

      inputElementRef.current?.blur()
    },
    [props.value, onSearch],
  )

  const handleClear = useCallback(
    (e?: MouseEvent<HTMLDivElement>) => {
      e?.preventDefault()
      e?.stopPropagation()

      if (props.onChange) {
        props.onChange(e as SyntheticEvent<Element>, null, 'clear')
      }
      if (props.onInputChange) {
        props.onInputChange(e as SyntheticEvent<Element>, '', 'clear')
      }
      if (onClear) {
        onClear()
      }

      inputElementRef.current?.blur()
    },
    [props, onClear],
  )

  const handleKeyDown = (e: KeyboardEvent) => {
    // IME 조합 중인지 확인 (한글, 일본어 등 조합형 문자 입력 중)
    const nativeIsComposing = (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing ?? false
    const composing = isComposing || nativeIsComposing

    if (composing) {
      return // IME 조합 -> SKIP
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (previewOption && !e.shiftKey) {
        props.onInputChange?.(e, previewOption, 'input')
      }
    } else if (e.key === 'Enter' && !highlightedOption) {
      handleSearch()
    }
  }

  const handleHighlightChange = (event: SyntheticEvent<Element>, option: string | null, reason: AutocompleteHighlightChangeReason) => {
    props.onHighlightChange?.(event, option, reason)
    if (reason === 'keyboard' || reason === 'mouse') {
      setHighlightedOption(option)
    }
  }

  const { sx: propsSx, onChange: propsOnChange, ...restProps } = props

  const handleChange = (event: SyntheticEvent<Element>, value: string | null, reason: AutocompleteChangeReason) => {
    if (propsOnChange) {
      propsOnChange(event, value, reason)
    }

    // 마우스로 옵션 선택 시 onSearch 호출
    if (reason === 'selectOption' && value && onSearch) {
      onSearch(value.trim())
      inputElementRef.current?.blur()
    }
  }

  const handleClose = (event: SyntheticEvent<Element>, reason: AutocompleteCloseReason) => {
    props.onClose?.(event, reason)
    setHighlightedOption(null)
    if (reason === 'selectOption' || reason === 'toggleInput') {
      setTimeout(() => {
        inputElementRef.current?.blur()
      }, 0)
    }
  }

  useEffect(() => {
    if (!throttledSearch) {
      setOptions([])
      return
    }

    const inputValue = props.value ?? ''
    const trimmedValue = inputValue.trim()

    if ((showOptionsOnFocus && isFocused) || trimmedValue.length > 0) {
      // 포커스 상태이고 showOptionsOnFocus가 true일 때는 빈 문자열로도 검색
      throttledSearch(trimmedValue)
    } else {
      setOptions([])
    }
  }, [throttledSearch, props.value, showOptionsOnFocus, isFocused])

  useEffect(() => () => throttledSearch?.cancel(), [throttledSearch])

  const heightValue = useMemo(() => {
    if (!height) return null
    if (typeof height === 'number') return height
    const regex = /^(\d+(?:\.\d+)?)/
    const match = regex.exec(String(height))
    return match ? Number.parseFloat(match[1]) : null
  }, [height])

  const horizontalPadding = useMemo(() => {
    if (!heightValue) return 12
    return heightValue >= 40 ? 12 : 6
  }, [heightValue])

  return (
    <Autocomplete
      open={isOpenOptions}
      freeSolo={restProps.freeSolo ?? true}
      options={options}
      onChange={handleChange}
      onClose={handleClose}
      onHighlightChange={handleHighlightChange}
      sx={{
        ...(width && { width }),
        ...(height && { height }),
        boxSizing: 'border-box',
        ...propsSx,
      }}
      renderInput={(params) => (
        <Box ref={inputRef} sx={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box' }}>
          <TextField
            {...params}
            inputRef={inputElementRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            sx={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              '& .MuiInputBase-root': {
                padding: `5px ${horizontalPadding}px`,
                borderRadius: '10px',
                transition: 'border-color 0.2s ease-in-out',
                boxSizing: 'border-box',
                height: '100%',
                minHeight: 'unset',
                '&.MuiInputBase-adornedEnd': {
                  paddingRight: `${horizontalPadding}px !important`,
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
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                ...(typeof textFieldProps?.slotProps?.input === 'object' && textFieldProps?.slotProps?.input !== null
                  ? textFieldProps.slotProps.input
                  : {}),
                endAdornment: (
                  <Stack direction="row" alignItems="center" gap="8px">
                    {params.InputProps?.endAdornment}
                    {typeof textFieldProps?.slotProps?.input === 'object' &&
                    textFieldProps?.slotProps?.input !== null &&
                    'endAdornment' in textFieldProps.slotProps.input
                      ? (textFieldProps.slotProps.input as { endAdornment?: ReactNode }).endAdornment
                      : null}
                    {onClear && isFocused && props.value && (
                      <InputAdornment
                        position="end"
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: showSearchIcon ? '8px' : 0,
                          minWidth: 'auto',
                          padding: 0,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={handleClear}
                      >
                        <MIInputClearIcon width={20} height={20} style={{ cursor: 'pointer' }} />
                      </InputAdornment>
                    )}
                    {showSearchIcon && (
                      <InputAdornment
                        position="end"
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 0,
                          minWidth: 'auto',
                          padding: 0,
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={handleSearch}
                      >
                        <SearchIcon sx={{ fontSize: 20 }} style={{ color: theme.palette.content['iconEnabled'], cursor: 'pointer' }} />
                      </InputAdornment>
                    )}
                  </Stack>
                ),
              },
              ...(textFieldProps?.slotProps
                ? Object.fromEntries(Object.entries(textFieldProps.slotProps).filter(([key]) => key !== 'input'))
                : {}),
            }}
            {...(() => {
              if (!textFieldProps) return {}
              const { slotProps, ...rest } = textFieldProps as Omit<typeof textFieldProps, 'InputProps'>
              return rest
            })()}
          />
          {/* 제안 문자 표시 */}
          {isFocused && suggestionSuffix && inputElementRef.current && (
            <Stack
              direction="row"
              alignItems="center"
              position="absolute"
              left={0}
              top={0}
              right={0}
              bottom={0}
              padding={`5px ${horizontalPadding + 6}px`}
              sx={{
                pointerEvents: 'none',
                zIndex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography
                variant="body3R14"
                sx={{
                  opacity: 0,
                  whiteSpace: 'pre',
                }}
              >
                {props.value ?? ''}
              </Typography>
              <Typography
                variant="body3R14"
                color="gray.40"
                sx={{
                  whiteSpace: 'pre',
                }}
              >
                {suggestionSuffix}
              </Typography>
            </Stack>
          )}
        </Box>
      )}
      slotProps={{
        ...restProps.slotProps,
        popper: {
          modifiers: [{ name: 'offset', options: { offset: [0, 6] } }],
          ...(typeof restProps.slotProps?.popper === 'object' && restProps.slotProps.popper !== null
            ? restProps.slotProps.popper
            : undefined),
        },
        listbox: {
          className: 'async-autocomplete-listbox',
          onMouseLeave: () => {
            setHighlightedOption(null)
          },
          sx: {
            padding: '12px 10px',
            margin: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CED4DA transparent',
            '& li': {
              minHeight: '40px !important',
              margin: 0,
              padding: 0,
            },
            ...(typeof restProps.slotProps?.listbox === 'object' &&
            restProps.slotProps.listbox !== null &&
            'sx' in restProps.slotProps.listbox
              ? restProps.slotProps.listbox.sx
              : undefined),
          },
        },
        paper: {
          sx: {
            padding: '0',
            boxShadow: '0px 0px 4px 0px rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'gray.20',
            userSelect: 'none',
            '& .MuiAutocomplete-option': {
              padding: '8px 16px !important',
              borderRadius: '10px',
              margin: 0,
              ...theme.typography.body2M14,
              color: theme.palette.gray[90],
              '&:hover': {
                backgroundColor: theme.palette.gray[10],
              },
            },
            ...(typeof restProps.slotProps?.paper === 'object' && restProps.slotProps.paper !== null && 'sx' in restProps.slotProps.paper
              ? restProps.slotProps.paper.sx
              : undefined),
          },
        },
      }}
      {...restProps}
    />
  )
}

export default AsyncAutocomplete
