import { Box, Menu, MenuItem, MenuProps, SxProps, Typography } from '@mui/material'
import { JSX, PropsWithChildren, useEffect, useState } from 'react'

import { useOverlayClick } from '@/hooks/useOverlayClick'
import theme from '@/theming'

export interface MIMenuSelectorProps {
  options?: Array<{ icon?: JSX.Element; value: unknown; label: string }>
  value?: { value: unknown; label: string }
  onChange?: (item: { value: unknown; label: string }) => void
  onOpen?: (value: boolean) => void
  menuProps?: MenuProps
  size?: number | string
  minWidthMenu?: number | string
  disablePortal?: boolean
  sx?: SxProps
}

const MIMenuSelector = (props: PropsWithChildren<MIMenuSelectorProps>) => {
  const { children, value, options = [], menuProps, size, minWidthMenu = 71, sx, disablePortal } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuBottom, setMenuBottom] = useState<number | null>(null)

  const open = Boolean(anchorEl)

  const { triggerRef, onTriggerClick, overlay, handleOverlayClose } = useOverlayClick({
    open,
    setAnchorEl,
    onClose: () => {
      props.onOpen?.(false)
    },
    zIndex: theme.zIndex.modal + 1,
  })

  useEffect(() => {
    props.onOpen?.(open)
  }, [open])

  useEffect(() => {
    const calculateDistance = () => {
      if (open && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const menuEl = document.querySelector('.MuiMenu-paper') as HTMLElement
        const distanceToBottom = window.innerHeight - triggerRect.bottom

        if (menuEl) {
          setMenuBottom(distanceToBottom)
        }
      } else {
        setMenuBottom(null)
      }
    }

    calculateDistance()
    window.addEventListener('resize', calculateDistance)

    return () => {
      window.removeEventListener('resize', calculateDistance)
    }
  }, [open, triggerRef])

  return (
    <Box position={'relative'} display={'flex'} alignItems={'center'}>
      <Box style={{ cursor: 'pointer !important' }} ref={triggerRef} display={'inline-block'} onClick={onTriggerClick}>
        {children}
      </Box>
      {menuBottom !== null && menuBottom >= 100 && overlay}
      {open && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleOverlayClose}
          keepMounted
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          disablePortal={disablePortal}
          sx={{
            ...(disablePortal && {
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 'auto',
              zIndex: 1200,
              '& .MuiPaper-root': {
                borderRadius: '4px',
                minWidth: minWidthMenu,
                boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
                position: 'unset',
                maxWidth: '100%',
                maxHeight: 'unset',
                transform: 'none',
                '.MuiList-root': {
                  width: '100% !important',
                  paddingRight: '0 !important',
                },
              },
            }),
            ...sx,
          }}
          {...menuProps}
        >
          {options.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                props.onChange?.(item)
                handleOverlayClose()
              }}
              sx={{
                padding: '8px 12px',
                backgroundColor: value?.value === item.value ? `${theme.palette.gray[5]} !important` : 'inherit',
                '&:hover': {
                  backgroundColor: theme.palette.gray[5],
                },
              }}
            >
              <Typography
                variant={value?.value === item.value ? 'body2M14' : 'body2R14'}
                color={value?.value === item.value ? 'gray.90' : 'gray.70'}
                sx={{ fontSize: size === 'h28' ? '12px' : '14px' }}
              >
                {item?.icon && <span style={{ verticalAlign: 'sub', marginRight: '8px' }}>{item?.icon}</span>}
                {item.label}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  )
}

export default MIMenuSelector
