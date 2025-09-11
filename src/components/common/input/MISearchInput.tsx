import SearchIcon from '@mui/icons-material/Search'
import { Box, MenuItem, Typography, InputAdornment, TextField } from '@mui/material'
import { disassembleToGroups } from 'es-hangul'
import { t } from 'i18next'
import { useCallback, useEffect, useMemo, useRef, useState, ChangeEvent } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIInputClearIcon from '@/components/common/input/MIInputClearIcon'
import useCheckFocus from '@/hooks/useCheckFocus'
import theme from '@/theming'

interface Props {
  storageKey: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch: (value: string) => void
  onClear: () => void
}

const MISearchInput = ({ storageKey, value, onChange, placeholder, onSearch, onClear }: Props) => {
  const [history, setHistory] = useState<string[]>(JSON.parse(localStorage.getItem(`${storageKey}-search-history`) ?? '[]'))
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { ref: containerRef, isFocus } = useCheckFocus()

  const inputBlur = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.blur()
    }, 100)
  }, [])

  const addHistory = useCallback((newValue: string) => {
    if (!newValue) return

    setHistory((prev) => {
      const uniqueHistory = Array.from(new Set([...prev, newValue]))
      return uniqueHistory.sort((a, b) => a.localeCompare(b))
    })
  }, [])

  const filteredHistories = useMemo(() => {
    const result = history.filter((item: string) =>
      disassembleToGroups(item).flat().join().startsWith(disassembleToGroups(value).flat().join()),
    ) // 초중성 분리하여 검색
    const sortedResult = [...result]
    sortedResult.sort((a: string, b: string) => a.length - b.length)
    return sortedResult.slice(0, 10)
  }, [history, value])

  const openHistoryList = useMemo(
    () => history.length > 0 && isFocused && filteredHistories.length > 0,
    [history.length, isFocused, filteredHistories],
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  const handleClear = useCallback(() => {
    onChange('')
    onClear()
  }, [onChange, onClear])

  const handleSearchClick = useCallback(() => {
    if (value.trim()) {
      addHistory(value)
      onSearch(value)
      inputBlur()
    }
  }, [value, addHistory, onSearch, inputBlur])

  const inputProps = useMemo(
    () => ({
      endAdornment: (
        <InputAdornment position="end" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '0' }}>
          {isFocus && value && <MIInputClearIcon width={20} height={20} onClick={handleClear} />}
          <SearchIcon style={{ color: theme.palette.content['iconEnabled'], cursor: 'pointer' }} onClick={handleSearchClick} />
        </InputAdornment>
      ),
    }),
    [isFocus, value, handleClear, handleSearchClick],
  )

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`${storageKey}-search-history`, JSON.stringify(history))
    }
  }, [history, storageKey])

  useEffect(() => {
    if (!storageKey) return

    const savedHistory = localStorage.getItem(`${storageKey}-search-history`)

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [storageKey])

  return (
    <Box
      position={'relative'}
      ref={containerRef}
      sx={{
        maxWidth: '100%',
        width: 458,
        svg: {
          display: 'block',
        },
      }}
    >
      <TextField
        inputRef={inputRef}
        fullWidth
        variant="outlined"
        hiddenLabel
        placeholder={placeholder ?? t('입력하세요.')}
        value={value}
        onChange={handleInputChange}
        onKeyDown={({ key, target }) => {
          if (key === 'Enter') {
            const inputValue = (target as HTMLInputElement).value
            inputBlur()

            setTimeout(() => {
              addHistory(inputValue)
              onSearch(inputValue)
            }, 100)
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        slotProps={{
          input: inputProps,
        }}
        autoComplete="off"
        sx={{
          '& .MuiInputBase-root': {
            alignItems: 'center',
            borderRadius: '4px',
            height: '46px',
            padding: '10px 12px',
            ...theme.typography.body2R14,
            '& input': {
              height: '25px',
              fontSize: '18px',
              fontWeight: 500,
              padding: '0 6px',
              width: '100%',
              borderRadius: '0',
              '&::placeholder': {
                fontWeight: 400,
                color: `${theme.palette.gray['40']} !important`,
              },
            },
            '.MuiSvgIcon-root': {
              marginRight: '4px !important',
            },
            '.MuiInputAdornment-root': {
              marginRight: 0,
              '&.MuiInputAdornment-positionEnd': {
                marginRight: 0,
              },
            },
          },
          '& .MuiInputBase-root .MuiSvgIcon-root': {
            marginRight: 2,
            color: '#868E96',
          },
          '& .MuiInputBase-root.Mui-focused': {
            '.MuiInputAdornment-root': {
              marginRight: 0,
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
          '& .MuiInputAdornment-root': {
            margin: 0,
          },
        }}
      />
      {openHistoryList && (
        <Box
          sx={{
            backgroundColor: '#fff',
            position: 'absolute',
            top: '52px',
            left: '0px',
            width: '458px',
            zIndex: 10,
            border: '1px solid #DEE2E6',
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
            padding: '8px 0',
          }}
        >
          <ScrollWrapper maxHeight={'215px'}>
            {filteredHistories.map((item: string) => (
              <MenuItem
                key={item}
                onMouseDown={(e) => {
                  e.preventDefault() // 포커스 변경 방지
                  inputBlur()
                  onChange(item)
                  onSearch(item)
                }}
                sx={{
                  padding: '8px 12px',
                  '&:hover': {
                    backgroundColor: theme.palette.gray[5],
                    fontWeight: '500 !important',
                  },
                }}
              >
                <Typography variant="body2R14">{item}</Typography>
              </MenuItem>
            ))}
          </ScrollWrapper>
        </Box>
      )}
    </Box>
  )
}

export default MISearchInput
