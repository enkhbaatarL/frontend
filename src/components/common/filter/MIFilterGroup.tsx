import { Stack, Typography, StackProps, Box, Tooltip } from '@mui/material'
import { ReactNode, useState, useRef, useCallback, useEffect } from 'react'

import AdminCheckbox from '@/components/admin/AdminCheckbox'

interface Props extends Omit<StackProps, 'title'> {
  title?: ReactNode
  type?: 'panel' | 'menu'
  filters: { label: string; badge?: string; value: string }[]
  selectedFilters?: string[]
  onFilterChange?: (selectedFilters: string[]) => void
}

const MAX_ITEMS_PER_COLUMN = 10

const MIFilterGroup = ({ title, type = 'panel', filters, selectedFilters: externalSelectedFilters, onFilterChange, ...props }: Props) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(externalSelectedFilters ?? [])
  const [isEllipsis, setIsEllipsis] = useState<{ [key: string]: boolean }>({})

  const isMultiColumn = filters.length > MAX_ITEMS_PER_COLUMN

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

  useEffect(() => {
    if (externalSelectedFilters !== undefined) {
      setSelectedFilters(externalSelectedFilters)
    }
  }, [externalSelectedFilters])

  const { width, ...restProps } = props

  return (
    <Stack px="6px" boxSizing="border-box" gap={type === 'panel' ? '12px' : '8px'} width={width} minWidth="max-content" {...restProps}>
      <Typography
        variant={type === 'panel' ? 'sidePanelTitle' : 'body3M12'}
        color={`contentText.${type === 'panel' ? 'Normal' : 'Subtext'}`}
        px={type === 'panel' ? '4px' : '2px'}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: isMultiColumn ? `repeat(${MAX_ITEMS_PER_COLUMN}, min-content)` : 'auto',
          gridAutoFlow: isMultiColumn ? 'column' : 'row',
          gridAutoColumns: 'max-content',
          gap: '12px',
          minWidth: 'max-content',
        }}
      >
        {filters.map(({ label, badge, value }) => (
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
                height: type === 'panel' ? '34px' : '24px',
                padding: type === 'panel' ? '6px 10px' : '4px',
                borderRadius: '4px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'contentBG.Hover',
                  '& .MuiCheckbox-root.MuiButtonBase-root > span:first-of-type': {
                    backgroundColor: selectedFilters.includes(value) ? '#2E3F5E' : '#ebf1f5',
                    borderColor: '#2E3F5E',
                  },
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
              {badge && (
                <Typography
                  variant="body3M12"
                  color="contentText.Subtext"
                  padding="2px 6px"
                  borderRadius="4px"
                  bgcolor="gray.20"
                  ml="-2px"
                  mr="4px"
                >
                  {badge}
                </Typography>
              )}
              <Typography
                ref={(el) => {
                  textRefs.current[value] = el
                  if (el) {
                    requestAnimationFrame(() => checkEllipsis(value))
                  }
                }}
                variant="body2M14"
                color="contentText.Normal"
                display="block"
                width="100%"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                flex={1}
                minWidth={0}
              >
                {label}
              </Typography>
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Stack>
  )
}

export default MIFilterGroup
