import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Divider, Grid2 as Grid } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import style from './MIHeaderMainLayout.module.scss'

import logoImg from '@/assets/logo.svg'
import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import MIHeaderNotice from '@/components/mi/MIHeaderNotice'
import MIHeaderProfile from '@/components/mi/MIHeaderProfile'
import { UserRole } from '@/service/admin/members'
import companiesService from '@/service/mi/companies'
import useAuthStore from '@/store/useAuthStore'

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
  const { user, setAccessCompanyInfo } = useAuthStore()

  const [selectedCompany, setSelectedCompany] = useState({
    label: user?.companyNm ?? '',
    value: user?.companyNo ?? 0,
  })
  const [isOpenCompany, setIsOpenCompany] = useState(false)

  const { data: allCompanies } = useQuery({
    queryKey: ['getAllCompanies'],
    queryFn: async () => await companiesService.getAllCompanies(),
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    gcTime: 0,
    staleTime: 0,
    enabled: user?.userRoleCd === UserRole.ADMIN && user?.isOtherServiceAccessPossible,
  })

  const companyList = useMemo(
    () =>
      allCompanies?.map(({ customerCompanyNo, customerCompanyNm }) => ({
        label: customerCompanyNm,
        value: customerCompanyNo,
      })) ?? [],
    [allCompanies],
  )

  useEffect(() => {
    if (selectedCompany) {
      setAccessCompanyInfo({
        customerCompanyNo: selectedCompany.value,
        customerCompanyNm: selectedCompany.label,
      })
    }
  }, [selectedCompany, setAccessCompanyInfo])

  return (
    <div className={clsx(style.GNBHeader)}>
      <Grid bgcolor="gray.10" className={`GNBTop ${clsx(style.headerTop)}`}>
        <Grid
          boxSizing={'border-box'}
          px={7.5}
          container
          width={'1440px'}
          margin={'auto'}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography mr={1} variant="body3SB12" color="gray.70">
              {selectedCompany.label}
            </Typography>
            {companyList.length > 0 && (
              <MIMenuSelector
                sx={{ marginTop: '8px' }}
                minWidthMenu="160px"
                value={selectedCompany}
                options={companyList}
                onOpen={setIsOpenCompany}
                onChange={({ value, label }) => {
                  setSelectedCompany({
                    value: value as number,
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
            )}
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
        <Box boxSizing={'border-box'} px={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Toolbar disableGutters>
            <Box
              sx={{ display: 'flex', mr: 7.5, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
            >
              <img width="150" src={logoImg} alt="Market Intelligence" />
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
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
