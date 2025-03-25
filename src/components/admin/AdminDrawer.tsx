import { DoubleArrow } from '@mui/icons-material'
import { Chip, CSSObject, IconButton, styled, Theme } from '@mui/material'
import Divider from '@mui/material/Divider'
import MuiDrawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import AdminMenu from '@/components/admin/AdminMenu'
import DividerScroll from '@/components/common/display/DividerScroll'
import Flex from '@/components/common/display/Flex'
import { DRAWER_WIDTH } from '@/constants/admin'

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH.OPEN,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH.CLOSED,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  width: DRAWER_WIDTH.OPEN,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}))

interface DrawerHeaderProps {
  open: boolean
}

const DrawerHeader = ({ open }: DrawerHeaderProps) => (
  <>
    <Typography className="ml-4" variant="subtitle1" fontWeight={700}>
      {open ? 'MI Platform' : 'M'}
    </Typography>
    {open && <Chip label="Admin" size="small" variant="outlined" />}
  </>
)

const AdminDrawer = () => {
  const [open, setOpen] = useState(true)

  const toggleDrawer = () => {
    setOpen((prev) => !prev)
  }

  return (
    <Drawer variant="permanent" open={open}>
      <Flex className="px-14 py-10" gap={6}>
        <DrawerHeader open={open} />
      </Flex>
      <Divider />
      <DividerScroll className="py-8" topBorder={false}>
        <AdminMenu drawerOpen={open} />
      </DividerScroll>
      <Flex justify="flex-end">
        <IconButton onClick={toggleDrawer} disableRipple sx={{ width: 48, height: 48 }}>
          <DoubleArrow sx={{ transform: open ? 'rotate(180deg)' : 'none' }} />
        </IconButton>
      </Flex>
    </Drawer>
  )
}

export default AdminDrawer
