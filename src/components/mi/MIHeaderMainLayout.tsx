import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Divider, Grid2 as Grid, Popper, Paper, ClickAwayListener } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import style from './MIHeaderMainLayout.module.scss'

import logoImg from '@/assets/logo.svg'
import DashboardIcon from '@/components/common/icons/gnb/DashboardIcon'
import ForecastIcon from '@/components/common/icons/gnb/ForecastIcon'
import MetricsIcon from '@/components/common/icons/gnb/MetricsIcon'
import NewsIcon from '@/components/common/icons/gnb/NewsIcon'
import ParallelIcon from '@/components/common/icons/gnb/ParallelIcon'
import ReportIcon from '@/components/common/icons/gnb/ReportIcon'
import SignalIcon from '@/components/common/icons/gnb/SignalIcon'
import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import MIHeaderNotice from '@/components/mi/MIHeaderNotice'
import MIHeaderProfile from '@/components/mi/MIHeaderProfile'
import useEnvironment from '@/hooks/useEnvironment.ts'
import { UserRole } from '@/service/admin/members'
import companiesService from '@/service/mi/companies'
import useAuthStore from '@/store/useAuthStore'
import { MiPagesType } from '@/types/common'

export interface Page {
  label: string
  url: MiPagesType
  show?: boolean
}

type SubItem = {
  label: string
  to: string
  desc?: string
  disable?: boolean
  show?: boolean
  iconSlot?: React.ReactNode
  children?: SubItem[]
  section?: 'SERVICES' | 'DEFAULT'
}
const SUBMENUS: Record<string, SubItem[]> = {
  dashboard: [
    {
      label: 'Dashboard',
      to: '/mi/dashboard',
      desc: 'AI 시장 인사이트 브리핑',
      disable: false,
      show: false,
      iconSlot: <DashboardIcon />,
    },
    {
      label: 'Newsletters',
      to: '/mi/newsletters',
      disable: false,
      show: false,
      section: 'SERVICES',
    },
    {
      label: 'Economic Event Calendar',
      to: '/mi/economic-event',
      disable: false,
      show: false,
    },
  ],
  forecast: [
    {
      label: 'AI Forecast Model',
      to: '/mi/forecast',
      desc: 'AI 예측 시뮬레이션',
      iconSlot: <ForecastIcon />,
      show: false,
    },
    {
      label: 'Signal Map',
      to: '/mi/signal-map',
      desc: '주요 요인 상관관계 분석',
      iconSlot: <SignalIcon />,
      show: false,
    },
  ],
  market: [
    {
      label: 'Market Metrics',
      to: '/mi/market-data',
      desc: '시장 수치 지표 및 가격 데이터',
      iconSlot: <MetricsIcon />,
      show: false,
    },
    {
      label: 'Market Reports',
      to: '/mi/insights',
      desc: '분석 리포트 및 인사이트',
      iconSlot: <ReportIcon />,
      show: false,
    },
    {
      label: 'Market News',
      to: '/mi/news-list',
      desc: '시장 동향 및 주요 이슈',
      disable: false,
      show: false,
      iconSlot: <NewsIcon />,
    },
    {
      label: 'Parallel Coordinates',
      to: '/mi/parallel-coordinates',
      desc: '주요 요인 인과관계 분석',
      disable: false,
      show: false,
      iconSlot: <ParallelIcon />,
    },
    {
      label: 'Qualitative Analysis',
      to: '/mi/custom',
      section: 'SERVICES',
      show: false,
    },
  ],
}

const boards = [
  { label: 'Notice', url: '/mi/notices' },
  { label: 'Help Center', url: '/mi/help-center' },
]

interface MIHeaderMainLayoutProps {
  pages: Page[]
  activeMenu: MiPagesType[]
  onMoveTab: (callback: () => void) => void
}

const MIHeaderMainLayout = ({ pages, activeMenu, onMoveTab }: MIHeaderMainLayoutProps) => {
  const { isProd } = useEnvironment()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, accessCompanyInfo, setAccessCompanyInfo, clearAuth } = useAuthStore()

  const [selectedCompany, setSelectedCompany] = useState<{ label: string; value: number; customerCompanyMipUrl: string } | null>(null)
  const [isOpenCompany, setIsOpenCompany] = useState(false)

  const { data: allCompanies } = useQuery({
    queryKey: ['getAllCompanies'],
    queryFn: async () => await companiesService.getAllCompanies(),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: user?.userRoleCd === UserRole.ADMIN && user?.isOtherServiceAccessPossible,
  })

  const companyList = useMemo(
    () =>
      allCompanies?.map(({ customerCompanyNo, customerCompanyNm, customerCompanyMipUrl }) => ({
        label: customerCompanyNm,
        value: customerCompanyNo,
        customerCompanyMipUrl,
      })) ?? [],
    [allCompanies],
  )
  const updatedMainmenus = useMemo(() => {
    const activeSet = new Set(activeMenu.map((m) => String(m)))
    return pages.map((item) => {
      const url = String(item.url)
      const show = activeSet.has(url)
      return { ...item, show }
    })
  }, [pages, activeMenu])

  const updatedSubmenus = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SUBMENUS).map(([main, items]) => [
          main,
          items.map((item) => {
            const url = item.to.split('/mi/').pop() || ''
            return { ...item, show: activeMenu.includes(url as MiPagesType) }
          }),
        ]),
      ),
    [activeMenu],
  )

  useEffect(() => {
    if (!selectedCompany) {
      if (user?.userRoleCd === UserRole.USER) {
        setSelectedCompany({
          label: accessCompanyInfo?.customerCompanyNm ?? user?.companyNm ?? '',
          value: accessCompanyInfo?.customerCompanyNo ?? user?.companyNo ?? 0,
          customerCompanyMipUrl: accessCompanyInfo?.customerCompanyMipUrl ?? '',
        })
      } else if (companyList.length > 0) {
        const def = companyList.find((c) => c.value === (accessCompanyInfo?.customerCompanyNo ?? user?.companyNo))
        setSelectedCompany(def ?? companyList[0])
      }
    }
  }, [companyList, selectedCompany, accessCompanyInfo, user])

  useEffect(() => {
    if (selectedCompany) {
      setAccessCompanyInfo({
        customerCompanyNo: selectedCompany.value,
        customerCompanyNm: selectedCompany.label,
        customerCompanyMipUrl: selectedCompany.customerCompanyMipUrl,
      })
    }
  }, [selectedCompany, setAccessCompanyInfo])

  const [openKey, setOpenKey] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const hoverTimer = useRef<number | null>(null)
  const topBtnRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (openKey) {
      setAnchorEl(topBtnRefs.current[openKey] ?? null)
    } else {
      setAnchorEl(null)
    }
  }, [openKey])

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  const isPathActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname],
  )

  const handleTopClick = (pageUrlKey: string) => {
    const items = updatedSubmenus[pageUrlKey]
    if (items && items.length > 0) {
      navigate(items[0].to)
    } else {
      navigate(`/mi/${pageUrlKey}`)
    }
  }

  const handleTopKeyDown = (e: React.KeyboardEvent, pageUrlKey: string, currentTarget: HTMLElement) => {
    if (e.key === 'ArrowDown') {
      setOpenKey(pageUrlKey)
      setAnchorEl(currentTarget)
    }
    if (e.key === 'Escape') {
      setOpenKey(null)
    }
  }

  const onTopMouseEnter = (pageUrlKey: string, _currentTarget: HTMLElement) => {
    clearHoverTimer()
    hoverTimer.current = window.setTimeout(() => {
      setOpenKey(pageUrlKey)
    }, 1)
  }
  const onTopMouseLeave = () => {
    clearHoverTimer()
    hoverTimer.current = window.setTimeout(() => setOpenKey(null), 1)
  }

  const handleClickAway = () => setOpenKey(null)

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
              {selectedCompany?.label}
            </Typography>
            {companyList.length > 0 && selectedCompany && (
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
                    customerCompanyMipUrl: companyList.find((c) => c.value === value)?.customerCompanyMipUrl ?? '',
                  })
                  navigate('/mi')
                }}
                disablePortal
              >
                <Box
                  width={'24px'}
                  height={'24px'}
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  borderRadius={'4px'}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isOpenCompany ? 'rgba(46, 63, 94, 0.15)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(34, 103, 230, 0.15)' },
                    '& svg': { transform: isOpenCompany ? 'rotate(180deg)' : 'rotate(0deg)' },
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
                  navigate(board.url)
                }}
                color="gray.70"
                padding="4px 12px"
                underline="hover"
                variant="subtext"
              >
                {board.label}
              </Link>
            ))}
            {user?.isExternalLogin && (
              <Link
                href=""
                onClick={(e) => {
                  e.preventDefault()
                  clearAuth()
                }}
                color="gray.70"
                padding="4px 12px"
                underline="hover"
                variant="subtext"
              >
                Sign Out
              </Link>
            )}
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
                if (isProd) {
                  navigate('/mi')
                } else {
                  navigate('/')
                }
              }}
            >
              <img src={logoImg} alt="AI Market Insights" />
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              {updatedMainmenus
                .filter((page) => page.show)
                .map((page) => {
                  const pageKey = String(page.url)
                  const isOpen = openKey === pageKey
                  const isActiveTop = isPathActive(`/mi/${pageKey}`) || (updatedSubmenus[pageKey]?.some((s) => isPathActive(s.to)) ?? false)

                  return (
                    <Box
                      key={page.label}
                      onMouseEnter={(e) => onTopMouseEnter(pageKey, e.currentTarget as HTMLElement)}
                      onMouseLeave={onTopMouseLeave}
                    >
                      <Button
                        ref={(el) => {
                          topBtnRefs.current[pageKey] = el
                        }}
                        disableRipple
                        onClick={(e) => {
                          e.preventDefault()
                          onMoveTab(() => handleTopClick(pageKey))
                        }}
                        onKeyDown={(e) => handleTopKeyDown(e, pageKey, e.currentTarget as HTMLElement)}
                        sx={{
                          position: 'relative',
                          px: 4,
                          py: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          borderRadius: 0,
                          backgroundColor: isOpen ? '#e8e9eb' : 'transparent',
                          '&:hover': { backgroundColor: '#e8e9eb' },
                          '.gnb-label': {
                            color: isOpen || isActiveTop ? '#ff1122' : undefined,
                            transition: 'color .15s ease',
                          },
                        }}
                      >
                        <Typography
                          variant="body1M16"
                          sx={{ textAlign: 'center', color: isActiveTop ? 'mari.Primary' : 'contentText.normal' }}
                        >
                          {page.label}
                        </Typography>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2.5,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'mari.Primary',
                            opacity: isActiveTop ? 1 : 0,
                            transition: 'opacity 0.35s ease',
                          }}
                        />
                      </Button>

                      <Popper open={isOpen} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
                        <ClickAwayListener onClickAway={handleClickAway}>
                          <Paper
                            onMouseEnter={clearHoverTimer}
                            onMouseLeave={onTopMouseLeave}
                            sx={{
                              marginTop: '5px',
                              minWidth: 258,
                              boxShadow: '0px 0px 10px rgba(0,0,0,0.05)',
                              borderRadius: '0px',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                margin: '8px 0 8px 0',
                              }}
                            >
                              {(updatedSubmenus[pageKey] ?? []).map((item, idx) => {
                                const active = isPathActive(item.to)
                                const isServices = item.section === 'SERVICES'
                                return (
                                  item.show && (
                                    <Box key={`${item.label}-${idx}`}>
                                      {isServices && (
                                        <Box
                                          sx={{
                                            px: 2,
                                            pt: 3,
                                            pb: 1,
                                            color: 'gray.60',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            lineHeight: 1.6,
                                          }}
                                        >
                                          SERVICES
                                        </Box>
                                      )}

                                      <Link
                                        href=""
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setOpenKey(null)
                                          navigate(item.to)
                                        }}
                                        underline="none"
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: 1.25,
                                          height: item.desc ? '58px' : '38px',
                                          transition: 'background-color .15s',
                                          color: item.disable ? 'gray.60' : active ? 'mari.Primary' : '#495057',
                                          cursor: item.disable ? 'default' : 'pointer',
                                          backgroundColor: active ? '#ffffff' : 'transparent',
                                          '&:hover': {
                                            backgroundColor: '#e8e9eb',
                                          },
                                        }}
                                      >
                                        <Box
                                          sx={{ mt: '8px', ml: item.iconSlot ? '6px' : '2px' }}
                                          // color={active ? 'mari.Primary' : item.disable ? 'contentText.Disabled' : 'gray.80'}
                                          color={active ? 'mari.Primary' : 'gray.80'}
                                        >
                                          {item.iconSlot ?? <Box />}
                                        </Box>

                                        <Box paddingY={'8px'}>
                                          <Typography
                                            variant="body1SB16"
                                            // color={active ? 'mari.Primary' : item.disable ? 'contentText.Disabled' : 'gray.80'}
                                            color={active ? 'mari.Primary' : 'gray.80'}
                                          >
                                            {item.label}
                                          </Typography>
                                          {item.desc && (
                                            <Typography
                                              variant="body2M14"
                                              // color={item.disable ? 'contentText.Disabled' : 'gray.60'}
                                              color={'gray.60'}
                                              sx={{ mt: 0.25, display: 'block' }}
                                            >
                                              {item.desc}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Link>
                                    </Box>
                                  )
                                )
                              })}
                            </Box>
                          </Paper>
                        </ClickAwayListener>
                      </Popper>
                    </Box>
                  )
                })}
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
