import SearchIcon from '@mui/icons-material/Search'
import { Box, MenuItem, Typography } from '@mui/material'
import { disassembleToGroups } from 'es-hangul'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIInput from '@/components/common/input/MIInput'
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

  const inputBlur = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.blur()
    }, 100)
  }, [])

  const addHistory = useCallback(
    (newValue: string) => {
      if (!newValue || history.includes(newValue)) return

      setHistory((prev) => [...prev, newValue])
    },
    [history],
  )

  const filteredHistories = useMemo(() => {
    const result = history.filter((item) => disassembleToGroups(item).flat().join().startsWith(disassembleToGroups(value).flat().join())) // 초중성 분리하여 검색
    return result.slice(0, 10)
  }, [history, value])

  const openHistoryList = useMemo(
    () => history.length > 0 && isFocused && filteredHistories.length > 0,
    [history.length, isFocused, filteredHistories],
  )

  useEffect(() => {
    if (!storageKey) return
    if (storageKey) {
      localStorage.setItem(`${storageKey}-search-history`, JSON.stringify(history))
    }
  }, [history, storageKey])

  useEffect(() => {
    const savedHistory = localStorage.getItem(`${storageKey}-search-history`)

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [storageKey])

  return (
    <Box position={'relative'}>
      <MIInput
        inputRef={inputRef}
        width={458}
        maxWidth={'100%'}
        placeholder={placeholder}
        size="h46"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onKeyDown={({ key, target }) => {
          if (key === 'Enter') {
            const value = (target as HTMLInputElement).value
            inputBlur()

            addHistory(value)
            onSearch(value)
          }
        }}
        onClear={onClear}
        startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
            {filteredHistories.map((item) => (
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
