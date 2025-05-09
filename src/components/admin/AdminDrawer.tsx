import { Box, CSSObject, IconButton, styled, Theme, Typography } from '@mui/material'
import Divider from '@mui/material/Divider'
import MuiDrawer from '@mui/material/Drawer'
import Menu from '@mui/material/Menu'
import { useEffect, useRef, useState, MouseEvent } from 'react'
import ReactDOM from 'react-dom'

import AdminPanelSettings from '../common/icons/AdminPanelSettings'
import KeyboardDoubleArrowLeftIcon from '../common/icons/KeyboardDoubleArrowLeftIcon'
import MoreVertIcon from '../common/icons/MoreVertIcon'

import AdminButton from '@/components/admin/AdminButton'
import AdminMenu from '@/components/admin/AdminMenu'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIProfile from '@/components/common/profile/MIProfile'
import { DRAWER_WIDTH } from '@/constants/admin'
import theme from '@/theming'

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
  '& .MuiDrawer-paper': {
    justifyContent: 'space-between',
  },
}))

const DrawerHeader = () => (
  <Box display="flex" alignItems="baseline" gap={1}>
    <Typography component="span" className="ml-8" variant="body1" lineHeight={1.5} letterSpacing="-0.5px" color="common.white">
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
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const handleClose = () => {
    setAnchorEl(null)
    setIsOpen(false)
  }
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setIsOpen(true)
    const rect = event.currentTarget.getBoundingClientRect()

    setTriggerRect(rect)
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
    <Box
      paddingY={open ? 4 : 0}
      paddingX={open ? 4 : 0}
      display="flex"
      position="relative"
      alignItems="center"
      justifyContent={open ? 'space-between' : 'center'}
    >
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

      <AdminButton
        ref={triggerRef}
        onClick={(event) => handleClick(event as unknown as MouseEvent<HTMLElement>)}
        sx={{
          padding: open ? '6px' : '10px',
          boxSizing: 'border-box',
          backgroundColor: anchorEl ? '#43526E' : 'transparent',
          color: anchorEl ? '#fff' : '#7E8BA4',
          borderRadius: '4px',
        }}
      >
        <MoreVertIcon fontSize="small" />
      </AdminButton>
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
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        className="profileMenu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
      >
        <MIProfile name="홍길동" role="Admin" email="gildong.hong@sk.com" company="SK C&C" team="Market Intelligence팀" />
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
      <Box display="flex" alignItems="center" justifyContent={open ? 'space-between' : 'center'} px={open ? '12px' : '10px'} py={4}>
        {open && (
          <Box p={1} width={20} height={20} display="flex" alignItems="center" flex={1}>
            <AdminButton
              sx={{
                p: 1,
                width: 28,
                height: 28,
                minWidth: 28,
                bgcolor: '#283959',
                borderRadius: '4px',
              }}
            >
              <AdminPanelSettings />
            </AdminButton>
            <DrawerHeader />
          </Box>
        )}
        <IconButton
          onClick={toggleDrawer}
          disableRipple
          sx={{
            p: '6px',
            '&:hover': {
              backgroundColor: '#354564',
              borderRadius: '4px',
            },
            '&:active': {
              backgroundColor: '#43526E',
              borderRadius: '4px',
            },
          }}
        >
          <KeyboardDoubleArrowLeftIcon
            style={{
              transform: open ? 'none' : 'rotate(180deg)',
            }}
          />
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'coolGray.50', height: '1px', opacity: open ? 1 : 0 }} />
      <ScrollWrapper
        styScroll={{ width: 4, backgroundColor: '#909BB0', right: 4 }}
        sx={{ padding: '12px' }}
        offsetTop={12}
        maxHeight={'100%'}
      >
        <AdminMenu drawerOpen={open} />
      </ScrollWrapper>
      <Box mt={'auto'} py={3} px={open ? 3 : 0}>
        <Divider sx={{ backgroundColor: 'coolGray.50', height: '1px', mb: 5, opacity: open ? 1 : 0 }} />
        <DrawerProfile open={open} />
      </Box>
    </Drawer>
  )
}

export default AdminDrawer
