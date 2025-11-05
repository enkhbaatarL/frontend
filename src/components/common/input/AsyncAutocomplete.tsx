import {
  Autocomplete,
  AutocompleteCloseReason,
  AutocompleteHighlightChangeReason,
  AutocompleteProps,
  Box,
  Stack,
  TextField,
  TextFieldProps,
  Typography,
} from '@mui/material'
import { throttle } from 'lodash-es'
import { useMemo, useRef, useState, KeyboardEvent, useEffect } from 'react'

import theme from '@/theming'

export interface Props extends Omit<AutocompleteProps<string, false, false, boolean>, 'options' | 'renderInput'> {
  asyncFunction?: (keyword: string) => Promise<string[]>
  textFieldProps?: TextFieldProps
}

const AsyncAutocomplete = ({ asyncFunction, textFieldProps, ...props }: Props) => {
  const inputRef = useRef<HTMLDivElement>(null)
  const inputElementRef = useRef<HTMLInputElement | null>(null)
  const cacheRef = useRef<Map<string, string[]>>(new Map())

  const [isFocused, setIsFocused] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [highlightedOption, setHighlightedOption] = useState<string | null>(null)

  const isOpenOptions = useMemo(
    () => isFocused && (props.value ?? '').trim().length > 0 && options.length > 0,
    [isFocused, props.value, options],
  )

  const throttledSearch = useMemo(() => {
    if (!asyncFunction) return null

    return throttle((keyword: string) => {
      const cached = cacheRef.current.get(keyword)

      if (cached !== undefined) {
        setOptions(cached)
        return
      }

      asyncFunction(keyword).then((response) => {
        const result = response ?? []
        cacheRef.current.set(keyword, result) // 캐싱
        setOptions(result)
      })
    }, 500)
  }, [asyncFunction])

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

  const handleKeyDown = (e: KeyboardEvent) => {
    // Tab 키로 미리보기 옵션 자동완성
    if (e.key === 'Tab') {
      e.preventDefault()
      if (previewOption && !e.shiftKey) {
        props.onInputChange?.(e, previewOption, 'input')
      }
      return
    }

    if (e.key === 'Enter') {
      inputElementRef.current?.blur()
    }
  }

  const handleHighlightChange = (
    event: React.SyntheticEvent<Element>,
    option: string | null,
    reason: AutocompleteHighlightChangeReason,
  ) => {
    props.onHighlightChange?.(event, option, reason)
    if (reason === 'keyboard' || reason === 'mouse') {
      setHighlightedOption(option)
    }
  }

  const handleClose = (event: React.SyntheticEvent<Element>, reason: AutocompleteCloseReason) => {
    props.onClose?.(event, reason)
    setHighlightedOption(null)
    if (reason === 'selectOption' || reason === 'toggleInput') {
      setTimeout(() => {
        inputElementRef.current?.blur()
      }, 0)
    }
  }

  useEffect(() => {
    if (!throttledSearch || !props.value?.trim()) {
      setOptions([])
      return
    }

    throttledSearch(props.value)
  }, [throttledSearch, props.value])

  useEffect(() => () => throttledSearch?.cancel(), [throttledSearch])

  return (
    <Autocomplete
      open={isOpenOptions}
      freeSolo={props.freeSolo ?? true}
      options={options}
      onClose={handleClose}
      onHighlightChange={handleHighlightChange}
      renderInput={(params) => (
        <Box ref={inputRef} sx={{ position: 'relative', width: '100%' }}>
          <TextField
            inputRef={inputElementRef}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            sx={{
              '& .MuiInputBase-root': {
                padding: '5px 12px',
                borderRadius: '10px',
                transition: 'border-color 0.2s ease-in-out',
                '& input': {
                  padding: '8px 0',
                },
              },
            }}
            {...params}
            {...textFieldProps}
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
              padding="5px 18px"
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
        ...props.slotProps,
        popper: {
          modifiers: [{ name: 'offset', options: { offset: [0, 6] } }],
          ...(typeof props.slotProps?.popper === 'object' && props.slotProps.popper !== null ? props.slotProps.popper : undefined),
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
            ...(typeof props.slotProps?.listbox === 'object' && props.slotProps.listbox !== null && 'sx' in props.slotProps.listbox
              ? props.slotProps.listbox.sx
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
            ...(typeof props.slotProps?.paper === 'object' && props.slotProps.paper !== null && 'sx' in props.slotProps.paper
              ? props.slotProps.paper.sx
              : undefined),
          },
        },
      }}
      {...props}
    />
  )
}

export default AsyncAutocomplete
