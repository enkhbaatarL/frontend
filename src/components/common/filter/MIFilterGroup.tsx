import { Stack, Typography, StackProps, FormGroup, Box, Tooltip } from '@mui/material'
import { ReactNode, useState, useRef, useCallback, useEffect } from 'react'

import AdminCheckbox from '@/components/admin/AdminCheckbox'

interface Props extends Omit<StackProps, 'title'> {
  title?: ReactNode
  filters: { label: string; value: string }[]
  onFilterChange?: (selectedFilters: string[]) => void
}

const MIFilterGroup = ({ title, filters, onFilterChange, ...props }: Props) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isEllipsis, setIsEllipsis] = useState<{ [key: string]: boolean }>({})

  const textRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({})

  const handleFilterChange = (value: string, checked: boolean) => {
    let newSelectedFilters: string[]

    if (checked) {
      newSelectedFilters = [...selectedFilters, value]
    } else {
      newSelectedFilters = selectedFilters.filter((f) => f !== value)
    }

    setSelectedFilters(newSelectedFilters)
    onFilterChange?.(newSelectedFilters)
  }

  const checkEllipsis = useCallback((value: string) => {
    const element = textRefs.current[value]
    if (element) {
      const isTextOverflowing = element.scrollWidth > element.clientWidth
      setIsEllipsis((prev) => {
        if (prev[value] !== isTextOverflowing) {
          return {
            ...prev,
            [value]: isTextOverflowing,
          }
        }
        return prev
      })
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      for (const { value } of filters) {
        checkEllipsis(value)
      }
    }

    const timer = setTimeout(() => {
      for (const { value } of filters) {
        checkEllipsis(value)
      }
    }, 100)

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [filters, checkEllipsis])

  return (
    <Stack px="6px" boxSizing="border-box" gap="12px" {...props}>
      <Typography variant="sidePanelTitle" color="contentText.Normal" px="6px">
        {title}
      </Typography>
      <FormGroup sx={{ gap: '2px' }}>
        {filters.map(({ label, value }) => (
          <Tooltip
            key={value}
            title={isEllipsis[value] ? label : ''}
            placement="top-start"
            followCursor
            disableHoverListener={!isEllipsis[value]}
          >
            <Box
              sx={{
                boxSizing: 'border-box',
                userSelect: 'none',
                width: '100%',
                height: '34px',
                padding: '6px 10px',
                borderRadius: '10px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
              onClick={() => handleFilterChange(value, !selectedFilters.includes(value))}
            >
              <Box display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <AdminCheckbox
                  checked={selectedFilters.includes(value)}
                  value={value}
                  onChange={(e) => handleFilterChange(value, e.target.checked)}
                />
              </Box>
              <span
                ref={(el) => {
                  textRefs.current[value] = el
                  if (el) {
                    requestAnimationFrame(() => checkEllipsis(value))
                  }
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginLeft: '4px',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {label}
              </span>
            </Box>
          </Tooltip>
        ))}
      </FormGroup>
    </Stack>
  )
}

export default MIFilterGroup
