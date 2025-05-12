import { Box, MenuItem, Typography } from '@mui/material'
import { KeyboardEventHandler, useEffect, useRef, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper.tsx'
import SearchIcon from '@/components/common/icons/SearchIcon'
import MIInput from '@/components/common/input/MIInput'
import theme from '@/theming'

export default function InsightHistorySearch(props: { onChange?: (text: string) => void; placeholder?: string; nameSearch?: string }) {
  const { onChange } = props
  const [histories, setHistories] = useState<string[]>([])
  const [filteredHistories, setFilteredHistories] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const anchorEl = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClose = () => {
    setOpen(false)
  }

  const showHistory = () => {
    const listHistories = localStorage.getItem(`SaveHistory${props.nameSearch}`)

    if (listHistories) {
      try {
        const parsedHistories = JSON.parse(listHistories)

        if (Array.isArray(parsedHistories)) {
          setOpen(true)
          setHistories(parsedHistories)
          setFilteredHistories(parsedHistories)
        }
      } catch (e) {
        console.error('Failed to parse history from localStorage:', e)
      }
    }
  }
  const search = (text: string) => {
    setSearchText(() => text)

    const filtered = histories.filter((item) => item.toLowerCase().includes(text.toLowerCase()))

    setFilteredHistories(filtered)
    //saveHistory(text)
    //setOpen(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const existing = localStorage.getItem(`SaveHistory${props.nameSearch}`)
      const parsed = existing ? JSON.parse(existing) : []

      if (!text.trim()) return

      const filtered = parsed.filter((item: string) => item !== text)
      const newHistories = [text, ...filtered]

      localStorage.setItem(`SaveHistory${props.nameSearch}`, JSON.stringify(newHistories))
    }, 2000)
  }

  useEffect(() => {
    onChange?.(searchText)
  }, [searchText, onChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (anchorEl.current && !anchorEl.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()

      const inputValue = (event.target as HTMLInputElement).value

      if (!inputValue) return

      const existing = localStorage.getItem(`SaveHistory${props.nameSearch}`)
      const parsed = existing ? JSON.parse(existing) : []

      const filtered = parsed.filter((item: string) => item !== inputValue)
      const newHistories = [inputValue, ...filtered]

      localStorage.setItem(`SaveHistory${props.nameSearch}`, JSON.stringify(newHistories))
      setOpen(false)
    }
  }

  return (
    <>
      <Box sx={{ position: 'relative' }} width={'458px'} ref={anchorEl}>
        <MIInput
          autoComplete="off"
          onFocusInput={showHistory}
          onKeyDown={handleKeyDown}
          value={searchText}
          onChange={(e) => {
            search(e.target.value)
          }}
          placeholder={props.placeholder}
          size="h46"
          startIcon={
            <Box p="9px" sx={{ '& svg': { display: 'block' } }}>
              <SearchIcon width={24} height={24} style={{ color: '#CED4DA' }} />
            </Box>
          }
        />
        {open && filteredHistories.length > 0 && (
          <Box
            sx={{
              backgroundColor: '#fff',
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              zIndex: 10,
              border: '1px solid #DEE2E6',
              boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              overflow: 'hidden',
              padding: '8px 0',
            }}
          >
            <ScrollWrapper maxHeight={'215px'}>
              {filteredHistories.map((item) => (
                <MenuItem
                  key={item}
                  onClick={() => {
                    setSearchText(() => item)
                    handleClose()
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
    </>
  )
}
