import { Box, Typography, Stack, ButtonProps, PaperProps, ListSubheader, Divider } from '@mui/material'
import { ReactNode, useMemo, useState, Fragment } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIMenu, { MenuPositionOffset } from '@/components/common/menu/MIMenu'

export interface DropdownMenuItem {
  label: ReactNode
  disabled?: boolean
  group?: string
  action?: () => void
}

export type GroupDisplayType = 'label' | 'divider' | 'none'

interface Props extends ButtonProps {
  variant?: 'text' | 'outlined' | 'contained'
  label?: ReactNode
  items: DropdownMenuItem[]
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  fadeIn?: 'left' | 'right' | 'center'
  menuPositionOffset?: MenuPositionOffset
  paperProps?: PaperProps
  groupDisplayType?: GroupDisplayType
  groupLabels?: { [groupKey: string]: ReactNode }
  disablePortal?: boolean
  closeOnScroll?: boolean
  maxHeight?: number | string
  enableHoverBackground?: boolean
  zIndex?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  buttonHoverBgColor?: string
  disableRipple?: boolean
}

const MIDropdownMenu = ({
  variant = 'text',
  label,
  items,
  placement = 'bottom-start',
  fadeIn,
  menuPositionOffset = {},
  paperProps,
  groupDisplayType = 'label',
  groupLabels = {},
  disablePortal = false,
  closeOnScroll = false,
  maxHeight = 300,
  enableHoverBackground = false,
  zIndex,
  open: controlledOpen,
  onOpenChange,
  buttonHoverBgColor,
  disableRipple,
  ...props
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return
    item.action?.()
    setOpen(false)
  }

  const groupedItems = useMemo(() => {
    if (groupDisplayType === 'none') {
      return { groups: {}, ungroupedItems: items }
    }

    const groups: { [key: string]: DropdownMenuItem[] } = {}
    const ungroupedItems: DropdownMenuItem[] = []

    for (const item of items) {
      const groupKey = item.group
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = []
        }
        groups[groupKey].push(item)
      } else {
        ungroupedItems.push(item)
      }
    }

    return { groups, ungroupedItems }
  }, [items, groupDisplayType])

  const renderMenuItems = () => {
    if (groupDisplayType === 'divider') {
      return (
        <>
          {groupedItems.ungroupedItems.map((item, index) => {
            const { disabled } = item

            return (
              <Box
                key={index}
                onClick={() => handleItemClick(item)}
                borderRadius="10px"
                sx={{
                  padding: '6px 12px',
                  cursor: disabled ? 'default' : 'pointer',
                  '&:hover': {
                    backgroundColor: disabled ? 'transparent' : 'gray.10',
                  },
                  textWrap: 'nowrap',
                }}
              >
                <Typography
                  variant="body2M14"
                  color={disabled ? 'gray.40' : 'gray.60'}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            )
          })}

          {Object.entries(groupedItems.groups).map(([groupKey, groupItems], groupIndex) => (
            <Fragment key={groupKey}>
              {groupIndex > 0 && <Divider />}

              {groupItems.map((item, index) => {
                const { disabled } = item

                return (
                  <Box
                    key={`${groupKey}-${index}`}
                    onClick={() => handleItemClick(item)}
                    borderRadius="10px"
                    sx={{
                      padding: '6px 12px',
                      cursor: disabled ? 'default' : 'pointer',
                      '&:hover': {
                        backgroundColor: disabled ? 'transparent' : 'gray.10',
                      },
                      textWrap: 'nowrap',
                    }}
                  >
                    <Typography
                      variant="body2M14"
                      color={disabled ? 'gray.40' : 'gray.60'}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                )
              })}
            </Fragment>
          ))}
        </>
      )
    }

    return (
      <>
        {groupedItems.ungroupedItems.map((item, index) => {
          const { disabled } = item

          return (
            <Box
              key={index}
              onClick={() => handleItemClick(item)}
              borderRadius="10px"
              sx={{
                padding: '6px 12px',
                cursor: disabled ? 'default' : 'pointer',
                '&:hover': {
                  backgroundColor: disabled ? 'transparent' : 'gray.10',
                },
                textWrap: 'nowrap',
              }}
            >
              <Typography
                variant="body2M14"
                color={disabled ? 'gray.40' : 'gray.60'}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          )
        })}

        {Object.entries(groupedItems.groups).map(([groupKey, groupItems]) => (
          <Box key={groupKey}>
            {groupDisplayType === 'label' && (
              <ListSubheader
                sx={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: 'gray.50',
                  fontSize: '12px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {groupLabels[groupKey] || groupKey}
              </ListSubheader>
            )}

            {groupItems.map((item, index) => {
              const { disabled } = item

              return (
                <Box
                  key={`${groupKey}-${index}`}
                  onClick={() => handleItemClick(item)}
                  borderRadius="10px"
                  sx={{
                    padding: '6px 12px',
                    cursor: disabled ? 'default' : 'pointer',
                    '&:hover': {
                      backgroundColor: disabled ? 'transparent' : 'gray.10',
                    },
                    textWrap: 'nowrap',
                  }}
                >
                  <Typography
                    variant="body2M14"
                    color={disabled ? 'gray.40' : 'gray.60'}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        ))}
      </>
    )
  }

  return (
    <MIMenu
      label={label}
      displayType="button"
      variant={variant}
      placement={placement}
      menuPositionOffset={menuPositionOffset}
      fadeIn={fadeIn}
      paperProps={paperProps}
      open={open}
      onOpenChange={setOpen}
      disablePortal={disablePortal}
      closeOnScroll={closeOnScroll}
      enableHoverBackground={enableHoverBackground}
      zIndex={zIndex}
      buttonHoverBgColor={buttonHoverBgColor}
      disableRipple={disableRipple}
      {...props}
    >
      <ScrollWrapper
        maxHeight={maxHeight}
        offsetTop={12}
        offsetBottom={12}
        scrollbarGap={6}
        sx={{
          padding: '0',
        }}
      >
        <Stack gap="8px" sx={{ padding: '12px' }}>
          {renderMenuItems()}
        </Stack>
      </ScrollWrapper>
    </MIMenu>
  )
}

export default MIDropdownMenu
