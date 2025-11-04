import { Box, Menu, MenuItem, MenuProps, SxProps, Typography } from '@mui/material'
import { JSX, PropsWithChildren, useEffect, useState } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
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
  const [isScrollable, setIsScrollable] = useState(false)

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
          anchorOrigin={menuProps?.anchorOrigin ?? { vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={menuProps?.transformOrigin ?? { vertical: 'top', horizontal: 'left' }}
          disablePortal={disablePortal}
          slotProps={{
            paper: {
              sx: {
                overflow: 'hidden',
                maxHeight: '300px',
              },
            },
            list: {
              sx: {
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
                maxHeight: '300px',
              },
            },
          }}
          sx={{
            ...(disablePortal && {
              position: 'absolute',
              top: '100%',
              left: menuProps?.anchorOrigin?.horizontal === 'right' ? 'auto' : 0,
              right: menuProps?.anchorOrigin?.horizontal === 'right' ? 0 : 'auto',
              zIndex: 1200,
              '& .MuiPaper-root': {
                borderRadius: '4px',
                minWidth: minWidthMenu,
                boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
                position: 'unset',
                maxWidth: '100%',
                transform: 'none',
              },
            }),
            ...sx,
          }}
          {...(menuProps && { ...menuProps, anchorOrigin: undefined, transformOrigin: undefined })}
        >
          <ScrollWrapper
            maxHeight={300}
            onScrollableChange={setIsScrollable}
            sx={{
              padding: '4px 0',
              height: '100%',
              '& .disabledScroll': {
                paddingRight: isScrollable ? '12px !important' : '0 !important',
              },
            }}
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
          </ScrollWrapper>
        </Menu>
      )}
    </Box>
  )
}

export default MIMenuSelector
