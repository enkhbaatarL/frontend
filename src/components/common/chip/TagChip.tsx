import { Box, Typography, ClickAwayListener, Stack, StackProps } from '@mui/material'
import { useState, useRef, FC } from 'react'

import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'

export interface ITagChipItem {
  name: string
  value?: string
}

export interface TagChipProps extends StackProps {
  items: ITagChipItem[]
  onItemSelected?: (item: ITagChipItem) => void
  disabled?: boolean
  ellipsisRange?: number
}

const TagChip: FC<TagChipProps> = ({ items, onItemSelected, ellipsisRange, disabled = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  const chipRef = useRef<HTMLDivElement>(null)

  const visibleItems = ellipsisRange ? items.slice(0, ellipsisRange) : items
  const collapsedItems = ellipsisRange ? items.slice(ellipsisRange) : []
  const isItemClickable = !!onItemSelected && !disabled

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleItemSelect = (item: ITagChipItem) => {
    if (isItemClickable) {
      onItemSelected?.(item)
    }
    setIsOpen(false)
  }

  const handleClickAway = () => {
    setIsOpen(false)
  }

  return (
    <Stack direction="row" gap="8px" {...props}>
      {visibleItems.map((item, index) => (
        <Box
          key={`${item.name}-${index}`}
          ref={chipRef}
          display="flex"
          alignItems="center"
          padding="2px 6px"
          borderRadius="100px"
          sx={{
            backgroundColor: '#E9ECEF',
            border: '0.5px solid transparent',
            cursor: isItemClickable ? 'pointer' : 'default',
            ...(isItemClickable && {
              '&:hover': {
                border: '0.5px solid #495057',
              },
            }),
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
          onClick={isItemClickable ? () => handleItemSelect(item) : undefined}
        >
          <Typography
            variant="body2"
            color="gray.90"
            sx={{
              fontSize: 10,
            }}
          >
            {item.name}
          </Typography>
        </Box>
      ))}
      {collapsedItems.length > 0 && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box height={20} sx={{ position: 'relative', userSelect: 'none' }}>
            <Box
              ref={chipRef}
              display="flex"
              alignItems="center"
              gap={0.5}
              padding="2px 6px"
              borderRadius="100px"
              sx={{
                backgroundColor: '#E9ECEF',
                border: isOpen ? '0.5px solid #495057' : '0.5px solid transparent',
                cursor: 'pointer',
                '&:hover': {
                  border: '0.5px solid #495057',
                },
                transition: 'all 0.2s ease',
              }}
              onClick={handleToggle}
            >
              <Typography
                variant="body2"
                color="gray.90"
                sx={{
                  fontSize: 10,
                }}
              >
                More
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyboardArrowUpIcon
                  width={12}
                  height={12}
                  style={{
                    transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                />
              </Box>
            </Box>

            {isOpen && (
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
                {collapsedItems.map((collapsedItem, index) => (
                  <Box
                    key={`${collapsedItem.name}-${index}`}
                    display="flex"
                    alignItems="center"
                    px="10px"
                    height={23}
                    sx={{
                      cursor: isItemClickable ? 'pointer' : 'default',
                      ...(isItemClickable && {
                        '&:hover': {
                          backgroundColor: '#F8F9FA',
                        },
                      }),
                    }}
                    onClick={isItemClickable ? () => handleItemSelect(collapsedItem) : undefined}
                  >
                    <Typography
                      variant="body3"
                      color="gray.90"
                      sx={{
                        fontSize: 10,
                      }}
                    >
                      {collapsedItem.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </ClickAwayListener>
      )}
    </Stack>
  )
}

export default TagChip
