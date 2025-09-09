import { Box, Typography, ClickAwayListener } from '@mui/material'
import { useState, useRef, FC } from 'react'

import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import { SourceOption } from '@/service/mi/dashboard'

export interface SourceDropdownChipProps {
  sources: SourceOption[]
  onSourceSelected: (source: SourceOption) => void
  disabled?: boolean
}

const SourceDropdownChip: FC<SourceDropdownChipProps> = ({ sources, onSourceSelected, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)
  const hasMultiple = sources.length > 1

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSourceSelect = (source: SourceOption) => {
    onSourceSelected(source)
    setIsOpen(false)
  }

  const handleClickAway = () => {
    setIsOpen(false)
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box height={20} sx={{ position: 'relative' }}>
        <Box
          ref={chipRef}
          display="flex"
          alignItems="center"
          gap={hasMultiple ? 0.5 : 0}
          padding="2px 6px"
          borderRadius="100px"
          sx={{
            backgroundColor: '#F1F3F5',
            border: isOpen ? '0.5px solid #495057' : '0.5px solid transparent',
            cursor: disabled ? 'default' : 'pointer',
            ...(!disabled && {
              '&:hover': {
                border: '0.5px solid #495057',
              },
            }),
            transition: 'all 0.2s ease',
          }}
          onClick={hasMultiple ? handleToggle : () => onSourceSelected(sources[0])}
        >
          <Typography
            variant="body2"
            color="gray.90"
            sx={{
              fontSize: 10,
            }}
          >
            {sources[0]?.name || ''}
          </Typography>
          {hasMultiple && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <KeyboardArrowUpIcon
                width={12}
                height={12}
                style={{
                  transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              />
            </Box>
          )}
        </Box>

        {isOpen && hasMultiple && (
          <Box
            position="absolute"
            top="28px"
            left={0}
            zIndex={1000}
            bgcolor="#FFFFFF"
            border="0.5px solid #DEE2E6"
            borderRadius="4px"
            minWidth="120px"
            boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
            py="8px"
            display="flex"
            flexDirection="column"
            gap="4px"
          >
            {sources.map((source) => (
              <Box
                key={source.link}
                display="flex"
                alignItems="center"
                px="10px"
                height={23}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#F8F9FA',
                  },
                }}
                onClick={() => handleSourceSelect(source)}
              >
                <Typography
                  variant="body3"
                  color="gray.90"
                  sx={{
                    fontSize: 10,
                  }}
                >
                  {source.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  )
}

export default SourceDropdownChip
