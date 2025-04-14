import BusinessIcon from '@mui/icons-material/Business'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import { Box, CSSObject, IconButton, styled, Theme, Card, Typography, Chip, Stack } from '@mui/material'
import Divider from '@mui/material/Divider'
import MuiDrawer from '@mui/material/Drawer'
import Menu from '@mui/material/Menu'
import { useState, MouseEvent } from 'react'

import AdminMenu from '@/components/admin/AdminMenu'
import DividerScroll from '@/components/common/display/DividerScroll'
import AdminPanelSettings from '@/components/common/icons/AdminPanelSettings'
import KeyboardDoubleArrowLeftIcon from '@/components/common/icons/KeyboardDoubleArrowLeftIcon'
import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import { DRAWER_WIDTH } from '@/constants/admin'

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH.OPEN,
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH.CLOSED,
  backgroundColor: theme.palette.primary.main,
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

const DrawerHeader = () => (
  <Box display="flex" alignItems="baseline" gap={1}>
    <Typography component="span" className="ml-4" variant="body1" lineHeight={1.5} letterSpacing="-0.5px" color="common.white">
      MI Platform
    </Typography>
    <Typography component="span" variant="body6" letterSpacing="-0.5px" color="coolGray.30">
      Admin
    </Typography>
  </Box>
)

const DrawerProfile = (props: { open: boolean }) => {
  const { open } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  return (
    <Box display="flex" position="relative" alignItems="center">
      {open && (
        <Box flex={1}>
          <Typography variant="body2" color="common.white">
            홍길동
          </Typography>
          <Typography variant="body6" fontWeight={500} color="coolGray.30">
            Market Intelligence팀
          </Typography>
        </Box>
      )}

      <IconButton onClick={(event) => handleClick(event as unknown as MouseEvent<HTMLElement>)} sx={{ p: '6px' }}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        className="profileMenu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Card sx={{ boxShadow: 'none' }} className="profileCard">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box>
              <Typography color="gray.90" variant="body1B16">
                홍길동
              </Typography>
              <Chip className="chipRole" label="Admin" color="primary" size="small" />
            </Box>
          </Stack>
          <Stack spacing={1.2} gap={1.2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon fontSize="small" sx={{ color: 'gray.50', fontSize: 14 }} />
              <Typography paddingLeft={2} color="gray.70" variant="body3">
                gildong.hong@sk.com
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <BusinessIcon fontSize="small" sx={{ color: 'gray.50', fontSize: 14 }} />
              <Typography paddingLeft={2} color="gray.70" variant="body3">
                SK C&C
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <WorkIcon fontSize="small" sx={{ color: 'gray.50', fontSize: 14 }} />
              <Typography paddingLeft={2} color="gray.70" variant="body3">
                Market Intelligence팀
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Menu>
    </Box>
  )
}

const AdminDrawer = () => {
  const [open, setOpen] = useState(true)

  const toggleDrawer = () => {
    setOpen((prev) => !prev)
  }

  return (
    <Drawer variant="permanent" open={open}>
      <Box display="flex" alignItems="center" justifyContent="space-between" px={open ? '12px' : '10px'} py={4}>
        {open && (
          <Box p={1} width={20} height={20} display="flex" alignItems="center" flex={1}>
            <AdminPanelSettings />
            <DrawerHeader />
          </Box>
        )}

        <IconButton onClick={toggleDrawer} disableRipple sx={{ p: '6px' }}>
          <KeyboardDoubleArrowLeftIcon style={{ transform: open ? 'none' : 'rotate(180deg)' }} />
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'coolGray.50', height: '1px' }} />
      <DividerScroll className="py-8" topBorder={false} bottomBorder={false}>
        <AdminMenu drawerOpen={open} />
      </DividerScroll>
      <Box p={3}>
        <Divider sx={{ backgroundColor: 'coolGray.50', height: '1px', mb: 5 }} />
        <DrawerProfile open={open} />
      </Box>
    </Drawer>
  )
}

export default AdminDrawer
