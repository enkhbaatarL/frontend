import { Box, Menu, MenuItem, Typography } from '@mui/material'
import { ReactElement, useRef, useState, useEffect, MouseEvent } from 'react'
import ReactDOM from 'react-dom'

import KeyboardArrowUpIcon from '../icons/KeyboardArrowUpIcon'

import theme from '@/theming'

export default function MIButtonSelect(
  props: Readonly<{
    value?: { label: string | ReactElement; value: unknown; icon?: ReactElement; activeIcon?: ReactElement }
    options?: Array<{ label: string | ReactElement; value: unknown; icon?: ReactElement; activeIcon?: ReactElement }>
    onChange?: (item: { label: string | ReactElement; value: unknown; icon?: ReactElement; activeIcon?: ReactElement }) => void
    minWidthMenu?: number | string
  }>,
) {
  const [selectedItem, setSelectedItem] = useState(props.value || props.options?.[0])
  const [isOpen, setIsOpen] = useState(false)
  const [hoverItem, setHoverItem] = useState<{
    label: string | ReactElement
    value: unknown
    icon?: ReactElement
    activeIcon?: ReactElement
  } | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setIsOpen(true)
    const rect = event.currentTarget.getBoundingClientRect()

    setTriggerRect(rect)
  }
  const handleClose = () => {
    setAnchorEl(null)
    setIsOpen(false)
    document.body.style.cursor = 'pointer'
  }

  useEffect(() => {
    const handleMouseMove = () => {
      if (document.body.style.cursor === 'pointer') {
        document.body.style.cursor = ''
      }
    }

    if (!isOpen) {
      window.addEventListener('mousemove', handleMouseMove, { once: true })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isOpen])

  return (
    <>
      <Box
        ref={triggerRef}
        display={'flex'}
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{
          cursor: 'pointer',
          '& svg': { display: 'block' },
          padding: '7px 8px',
          borderRadius: '4px',
          backgroundColor: isOpen ? theme.palette.content.backgroundHover : 'transparent',
          minWidth: props.minWidthMenu,
          boxSizing: 'border-box',
        }}
        onClick={handleClick}
      >
        <Box display={'flex'} alignItems={'center'}>
          {(selectedItem?.activeIcon || selectedItem?.icon) && (
            <Typography color={isOpen ? 'gray.80' : 'gray.60'} mr="8px">
              {isOpen ? selectedItem?.activeIcon : selectedItem?.icon}
            </Typography>
          )}
          <Typography variant={'body2SB14'} color={isOpen ? 'gray.90' : 'gray.70'}>
            {selectedItem?.label}
          </Typography>
        </Box>

        <Typography color={isOpen ? 'gray.80' : 'gray.60'} ml="12px">
          <KeyboardArrowUpIcon style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }} />
        </Typography>
      </Box>
      {isOpen &&
        triggerRect &&
        ReactDOM.createPortal(
          <Box
            onClick={handleClose}
            sx={{
              position: 'fixed',
              top: triggerRect.top,
              left: triggerRect.left,
              width: triggerRect.width,
              height: triggerRect.height,
              backgroundColor: 'transparent',
              zIndex: theme.zIndex.modal + 1,
              borderRadius: '4px',
              opacity: 1,
              cursor: 'pointer',
            }}
          />,
          document.body,
        )}
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '6px',
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
          },
        }}
        slotProps={{
          list: {
            sx: {
              minWidth: props.minWidthMenu,
            },
          },
        }}
      >
        {props.options?.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              props.onChange?.(item)
              setSelectedItem(item)
              handleClose()
            }}
            sx={{
              padding: '8px 12px',
              backgroundColor: props.value?.value === item.value ? `${theme.palette.gray[5]} !important` : 'inherit',
              '&:hover': {
                backgroundColor: theme.palette.gray[5],
              },
            }}
            onMouseOver={() => setHoverItem(item)}
            onMouseOut={() => setHoverItem(null)}
          >
            <Box display={'flex'} alignItems={'center'}>
              {(item.activeIcon || item.icon) && (
                <Typography color={hoverItem?.value === item.value || selectedItem?.value === item.value ? 'gray.80' : 'gray.60'} mr="8px">
                  {hoverItem?.value === item.value || selectedItem?.value === item.value ? item.activeIcon : item.icon}
                </Typography>
              )}

              <Typography
                variant={hoverItem?.value === item.value || selectedItem?.value === item.value ? 'body2M14' : 'body2R14'}
                color={hoverItem?.value === item.value || selectedItem?.value === item.value ? 'gray.90' : 'gray.70'}
              >
                {item.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
