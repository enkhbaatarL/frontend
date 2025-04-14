import { Box, Menu, MenuItem, Typography } from '@mui/material'
import { PropsWithChildren, useEffect, useState } from 'react'

import theme from '@/theming'

export interface MIMenuSelectorProps {
  options?: Array<{ value: unknown; label: string }>
  value?: { value: unknown; label: string }
  onChange?: (item: { value: unknown; label: string }) => void
  onOpen?: (value: boolean) => void
}

const MIMenuSelector = (props: PropsWithChildren<MIMenuSelectorProps>) => {
  const { children, value, options = [] } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    props.onOpen?.(open)
  }, [open])

  return (
    <>
      <Box display={'inline-block'} onClick={handleClick}>
        {children}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '6px',
            boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
          },
        }}
      >
        {options.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              props.onChange?.(item)
              handleClose()
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
            >
              {item.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default MIMenuSelector
