import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Paper, List, ListItem, ListItemText, ClickAwayListener, Typography } from '@mui/material'
import { useState, useEffect, useRef } from 'react'

import MIInput from '@/components/common/input/MIInput'
import { useSearchHistory } from '@/hooks/useSearchHistory'

interface MISearchInputProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearch?: (searchTerm: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onClear?: () => void
  placeholder?: string
  suggestions?: string[]
  width?: number | string
  maxWidth?: number | string
  size?: 'h26' | 'h34' | 'h36' | 'h46'
  storageKey?: string
}

const MISearchInput = ({
  value = '',
  onChange,
  onSearch,
  onKeyDown,
  onClear,
  placeholder = 'Search for Data',
  suggestions = [],
  width,
  maxWidth,
  size = 'h46',
  storageKey = 'search-history',
}: MISearchInputProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const { history, addToHistory, removeFromHistory } = useSearchHistory(storageKey)

  // 자동완성 필터링
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuggestions(history)
      return
    }

    const historyMatches = history.filter((item) => item.toLowerCase().includes(value.toLowerCase()))

    const suggestionMatches = suggestions.filter(
      (item) => item.toLowerCase().includes(value.toLowerCase()) && !history.some((h) => h.toLowerCase() === item.toLowerCase()),
    )

    setFilteredSuggestions([...historyMatches, ...suggestionMatches])
  }, [value, history, suggestions])

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleSearch = (searchTerm: string) => {
    if (searchTerm.trim()) {
      addToHistory(searchTerm)
    }
    onSearch?.(searchTerm)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(value)
    }
    onKeyDown?.(e)
  }

  const handleSuggestionClick = (suggestion: string) => {
    const syntheticEvent = {
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLInputElement>

    onChange?.(syntheticEvent)
    handleSearch(suggestion)
  }

  const handleRemoveFromHistory = (item: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromHistory(item)
  }

  const handleClickAway = () => {
    setShowDropdown(false)
  }

  const handleClear = () => {
    onClear?.()
    setShowDropdown(false)
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box ref={containerRef} sx={{ position: 'relative', width, maxWidth }}>
        <MIInput
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocusInput={handleInputFocus}
          onClear={handleClear}
          placeholder={placeholder}
          size={size}
          width={width}
          maxWidth={maxWidth}
          startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
        />

        {/* 자동완성 드롭다운 */}
        {showDropdown && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              mt: 0.5,
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid #DEE2E6',
              borderRadius: '4px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {filteredSuggestions.length > 0 ? (
              <List sx={{ py: 0 }}>
                {filteredSuggestions.map((item, index) => {
                  const isFromHistory = history.includes(item)
                  return (
                    <ListItem
                      key={`${item}-${index}`}
                      onClick={() => handleSuggestionClick(item)}
                      sx={{
                        cursor: 'pointer',
                        py: 1,
                        px: 2,
                        '&:hover': {
                          backgroundColor: '#F8F9FA',
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #F1F3F5' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {isFromHistory}
                        <ListItemText
                          primary={item}
                          sx={{
                            '& .MuiListItemText-primary': {
                              fontSize: '14px',
                              color: '#495057',
                            },
                          }}
                        />
                      </Box>
                      {isFromHistory && (
                        <ClearIcon
                          onClick={(e) => handleRemoveFromHistory(item, e)}
                          sx={{
                            fontSize: '16px',
                            color: '#CED4DA',
                            cursor: 'pointer',
                            '&:hover': {
                              color: '#868E96',
                            },
                          }}
                        />
                      )}
                    </ListItem>
                  )
                })}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {value ? '검색 결과가 없습니다.' : '검색 이력이 없습니다.'}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  )
}

export default MISearchInput
