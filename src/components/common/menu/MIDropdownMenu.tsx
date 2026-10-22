import { Box, Typography, Stack, ButtonProps, PaperProps, ListSubheader, Divider } from '@mui/material'
import { type MouseEventHandler, type PointerEventHandler, type ReactNode, Fragment, useMemo, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIMenu, { MenuPositionOffset } from '@/components/common/menu/MIMenu'

export interface DropdownMenuItem {
  label: ReactNode
  disabled?: boolean
  group?: string
  action?: () => void
  onMenuItemPointerDown?: PointerEventHandler<HTMLDivElement>
  onMenuItemPointerUp?: PointerEventHandler<HTMLDivElement>
  onMenuItemPointerLeave?: () => void
  onMenuItemPointerCancel?: () => void
  onMenuItemContextMenu?: MouseEventHandler<HTMLDivElement>
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
  /** sticky 그룹 헤더가 사라지기 전에 헤더 경계 밖에 남겨둘 마지막 항목 수 */
  groupHeaderReleaseItemCount?: number
  disablePortal?: boolean
  closeOnScroll?: boolean
  closeOnItemClick?: boolean
  maxHeight?: number | string
  enableHoverBackground?: boolean
  zIndex?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  buttonHoverBgColor?: string
  disableRipple?: boolean
  /** 내부 버튼 로딩 스피너 표시 + disabled 처리 */
  isLoading?: boolean
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
  groupHeaderReleaseItemCount = 0,
  disablePortal = false,
  closeOnScroll = false,
  closeOnItemClick = true,
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
    if (closeOnItemClick) {
      setOpen(false)
    }
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

  const renderMenuItem = (item: DropdownMenuItem, index: number, groupKey?: string) => {
    const {
      disabled,
      label,
      onMenuItemPointerDown,
      onMenuItemPointerUp,
      onMenuItemPointerLeave,
      onMenuItemPointerCancel,
      onMenuItemContextMenu,
    } = item
    const key = groupKey ? `${groupKey}-${index}` : index

    return (
      <Box
        key={key}
        onClick={() => (disabled ? null : handleItemClick(item))}
        onPointerDown={onMenuItemPointerDown}
        onPointerUp={onMenuItemPointerUp}
        onPointerLeave={onMenuItemPointerLeave}
        onPointerCancel={onMenuItemPointerCancel}
        onContextMenu={onMenuItemContextMenu}
        borderRadius="10px"
        padding="8px 12px"
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : 'gray.10',
          },
          textWrap: 'nowrap',
        }}
      >
        <Typography
          variant="body2M14"
          color={disabled ? 'gray.40' : 'contentText.Normal'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          maxWidth="100%"
        >
          {label}
        </Typography>
      </Box>
    )
  }

  const renderMenuItems = () => {
    if (groupDisplayType === 'divider') {
      return (
        <>
          {groupedItems.ungroupedItems.map((item, index) => renderMenuItem(item, index))}

          {Object.entries(groupedItems.groups).map(([groupKey, groupItems], groupIndex) => (
            <Fragment key={groupKey}>
              {groupIndex > 0 && <Divider />}
              {groupItems.map((item, index) => renderMenuItem(item, index, groupKey))}
            </Fragment>
          ))}
        </>
      )
    }

    return (
      <>
        {groupedItems.ungroupedItems.map((item, index) => renderMenuItem(item, index))}

        {Object.entries(groupedItems.groups).map(([groupKey, groupItems]) => {
          const releaseItemCount = Math.min(Math.max(0, Math.floor(groupHeaderReleaseItemCount)), groupItems.length)
          const stickyBoundaryItemCount = groupItems.length - releaseItemCount
          const groupHeader =
            groupDisplayType === 'label' ? (
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
            ) : null

          if (releaseItemCount === 0) {
            return (
              <Box key={groupKey}>
                {groupHeader}
                {groupItems.map((item, index) => renderMenuItem(item, index, groupKey))}
              </Box>
            )
          }

          return (
            <Box key={groupKey}>
              <Box>
                {groupHeader}
                {groupItems.slice(0, stickyBoundaryItemCount).map((item, index) => renderMenuItem(item, index, groupKey))}
              </Box>
              {groupItems
                .slice(stickyBoundaryItemCount)
                .map((item, index) => renderMenuItem(item, stickyBoundaryItemCount + index, groupKey))}
            </Box>
          )
        })}
      </>
    )
  }

  return (
    <MIMenu
      label={label}
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
        <Stack gap="8px" padding="12px">
          {renderMenuItems()}
        </Stack>
      </ScrollWrapper>
    </MIMenu>
  )
}

export default MIDropdownMenu
