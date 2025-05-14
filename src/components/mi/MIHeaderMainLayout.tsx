import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider, Grid2 as Grid } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import clsx from 'clsx'
import { MouseEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import style from './MIHeaderMainLayout.module.scss'

import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import MIHeaderNotice from '@/components/mi/MIHeaderNotice'
import MIHeaderProfile from '@/components/mi/MIHeaderProfile'

const pages = [
  {
    label: 'MI Dashboard',
    url: '/mi/dashboard',
  },
  {
    label: 'Signal Map',
    url: '/mi/signal-map',
  },
  {
    label: 'Market Data',
    url: '/mi/market-data',
  },
  {
    label: 'Insights',
    url: '/mi/insights',
  },
]

const boards = [
  {
    label: 'Notice',
    url: '/mi/notices',
  },
  {
    label: 'Help Center',
    url: '/mi/help-center',
  },
]

const MIHeaderMainLayout = () => {
  const navigate = useNavigate()
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  const [selectedCompany, setSelectedCompany] = useState({
    label: 'SK Innovation',
    value: 'sk-innovation',
  })
  const [isOpenCompany, setIsOpenCompany] = useState(false)
  const companyList = [
    {
      label: 'SK 하이닉스',
      value: 'sk-hynix',
    },
    {
      label: 'SK 실트론',
      value: 'sk-siltron',
    },
    {
      label: 'SK E&S',
      value: 'sk-ens',
    },
    {
      label: 'SK 가스',
      value: 'sk-gas',
    },
    {
      label: 'SK 온',
      value: 'sk-on',
    },
    {
      label: 'SK Innovation',
      value: 'sk-innovation',
    },
    {
      label: 'SK 에너지',
      value: 'sk-energy',
    },
  ]

  return (
    <div className={clsx(style.GNBHeader)}>
      <Grid bgcolor="gray.10" className={`GNBTop ${clsx(style.headerTop)}`}>
        <Grid container maxWidth={'1380px'} margin={'auto'} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography mr={1} variant="body3SB12" color="gray.70">
              {selectedCompany.label}
            </Typography>
            <MIMenuSelector
              sx={{ marginTop: '8px' }}
              value={selectedCompany}
              options={companyList}
              onOpen={setIsOpenCompany}
              onChange={({ value, label }) => {
                setSelectedCompany({
                  value: value as string,
                  label,
                })
              }}
            >
              <Box
                width={'28px'}
                height={'28px'}
                display={'flex'}
                alignItems={'center'}
                justifyContent={'center'}
                borderRadius={'4px'}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isOpenCompany ? 'rgba(46, 63, 94, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 63, 94, 0.15)',
                  },
                  '& svg': {
                    transform: isOpenCompany ? 'rotate(180deg)' : 'rotate(0deg)',
                  },
                }}
              >
                <KeyboardArrowDownIcon sx={{ color: '#495057' }} fontSize="small" />
              </Box>
            </MIMenuSelector>
          </Box>
          <Grid container gap={1}>
            {boards.map((board) => (
              <Link
                key={board.label}
                href=""
                onClick={(e) => {
                  e.preventDefault()
                  if (location.pathname !== board.url) {
                    navigate(board.url)
                  }
                }}
                color="gray.70"
                padding="4px 12px"
                underline="hover"
                variant="subtext"
              >
                {board.label}
              </Link>
            ))}
          </Grid>
        </Grid>
      </Grid>
      <AppBar className={clsx(style.AppBar)} position="static">
        <Box maxWidth={'1380px'} width={'100%'} margin={'auto'}>
          <Toolbar disableGutters>
            <Box
              sx={{ display: { xs: 'none', md: 'flex' }, mr: 7.5, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault()
                handleCloseNavMenu()
                navigate('/')
              }}
            >
              <img src="/src/assets/logo.svg" alt="Market Intelligence" />
            </Box>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="primary"
                sx={{ padding: 0 }}
              >
                <MenuIcon />
              </IconButton>
              {Boolean(anchorElNav) && (
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{ display: { xs: 'block', md: 'none' } }}
                >
                  {pages.map((page) => (
                    <MenuItem
                      disableRipple
                      key={page.label}
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(page.url)
                      }}
                    >
                      <Typography sx={{ textAlign: 'center' }} color="gray.70" variant="body1M16">
                        {page.label}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </Box>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, mr: 7.5 }}>
              <img width="150" src="/src/assets/logo.svg" alt="Market Intelligence" />
            </Box>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  disableRipple
                  key={page.label}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(page.url)
                  }}
                  sx={{
                    px: 4,
                    py: '22px',
                    display: 'block',
                    borderBottom: '2px solid transparent',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      '.MuiTypography-root': {
                        color: '#2E3F5E',
                      },
                    },
                    ...(page.url === location.pathname
                      ? {
                        backgroundColor: 'transparent',
                        borderBottom: '2px solid #2E3F5E',
                        '.MuiTypography-root': {
                          color: '#2E3F5E',
                        },
                      }
                      : {}),
                  }}
                >
                  <Typography sx={{ textAlign: 'center' }} color="gray.70" variant="body1M16">
                    {page.label}
                  </Typography>
                </Button>
              ))}
            </Box>
            <Grid container alignItems="center" wrap="nowrap" direction="row" spacing={4} sx={{ flexGrow: 0 }}>
              <MIHeaderNotice />
              <Divider orientation="vertical" variant="middle" component="div" sx={{ width: '1px', height: 20 }} />
              <MIHeaderProfile />
            </Grid>
          </Toolbar>
        </Box>
      </AppBar>
    </div>
  )
}

export default MIHeaderMainLayout
