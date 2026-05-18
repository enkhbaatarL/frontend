import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Divider, Grid2 as Grid, Popper, Paper, ClickAwayListener, Stack, MenuProps } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

import style from './MIHeaderMainLayout.module.scss'

import logoImg from '@/assets/logo.svg'
import MIMenuSelector from '@/components/common/input/MIMenuSelector'
import MIHeaderNotice from '@/components/mi/MIHeaderNotice'
import MIHeaderProfile from '@/components/mi/MIHeaderProfile'
import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import useEnvironment from '@/hooks/useEnvironment.ts'
import { buildMiGnbFromCompanyMenus, type MiGnbTopMenu } from '@/lib/miGnbMenuNav'
import { FUNDAMENTAL_MODEL_BASE_PATH } from '@/pages/mi/fundamentalModel/fundamentalModelRoutes'
import { UserRole } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import { languageList } from '@/utils/font'

const boards = [
  { label: 'Notice', url: '/mi/notices' },
  { label: 'Help Center', url: '/mi/help-center' },
]

interface MIHeaderMainLayoutProps {
  onMoveTab?: (callback: () => void) => void
}

const MIHeaderMainLayout = ({ onMoveTab }: MIHeaderMainLayoutProps) => {
  const { isProd } = useEnvironment()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, accessCompanyInfo, loadAccessCompanyInfo, clearAuth } = useAuthStore()
  const { i18n, t } = useTranslation()

  const [isOpenCompany, setIsOpenCompany] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<{ label: string; value: string }>({ label: '한국어', value: 'ko' })
  const [isOpenLanguageSelect, setIsOpenLanguageSelect] = useState(false)

  const selectedCompany = useMemo(() => {
    const label = accessCompanyInfo?.customerCompanyNm ?? user?.companyNm ?? ''
    const value = accessCompanyInfo?.customerCompanyNo ?? user?.companyNo ?? 0
    const customerCompanyMipUrl = accessCompanyInfo?.customerCompanyMipUrl ?? user?.companyMipUrl ?? ''
    if (!label) return null
    return { label, value, customerCompanyMipUrl }
  }, [accessCompanyInfo, user])

  useEffect(() => {
    const currentLang = i18n.language ?? 'ko'
    const currentLanguageOption = languageList.find((option) => option.value === currentLang) ?? languageList[0]
    setSelectedLanguage(currentLanguageOption)
  }, [i18n.language])

  const { companyList, miHome } = useCompanyCondition()

  const gnbMenus = useMemo(
    () =>
      buildMiGnbFromCompanyMenus(accessCompanyInfo?.menus, {
        defaultLandingCd: accessCompanyInfo?.defaultLandingCd,
      }),
    [accessCompanyInfo?.menus, accessCompanyInfo?.defaultLandingCd],
  )

  const resolvedHomePath = miHome()

  const hasDropdownItems = useCallback((menu: MiGnbTopMenu) => menu.rows.some((r) => r.kind === 'item'), [])

  const isLoading = user?.userRoleCd === UserRole.USER && !accessCompanyInfo

  useEffect(() => {
    if (user?.userRoleCd === UserRole.USER && !accessCompanyInfo && user?.companyNo && user?.companyNm) {
      loadAccessCompanyInfo(user.companyNo)
    }
  }, [user, accessCompanyInfo, loadAccessCompanyInfo])

  const [openKey, setOpenKey] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  const isPathActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname],
  )

  /** Fundamental Model GNB 진입 시 항상 미선택 base URL로 이동 */
  const runNavigate = (path: string) => {
    const isFundamentalModelEntry = path === FUNDAMENTAL_MODEL_BASE_PATH
    const doNavigate = () => navigate(path, isFundamentalModelEntry ? { replace: true } : undefined)

    if (onMoveTab) {
      onMoveTab(doNavigate)
    } else {
      doNavigate()
    }
  }

  const handleTopClick = (menu: MiGnbTopMenu) => {
    runNavigate(menu.defaultPath)
  }

  const handleTopKeyDown = (e: KeyboardEvent, menuKey: string, currentTarget: HTMLElement) => {
    if (e.key === 'ArrowDown') {
      setOpenKey(menuKey)
      setAnchorEl(currentTarget)
    }
    if (e.key === 'Escape') {
      setOpenKey(null)
    }
  }

  const onTopMouseEnter = (menuKey: string) => {
    clearHoverTimer()
    hoverTimer.current = setTimeout(() => {
      setOpenKey(menuKey)
    }, 1)
  }

  const onTopMouseLeave = () => {
    clearHoverTimer()
    hoverTimer.current = setTimeout(() => setOpenKey(null), 1)
  }

  const handleClickAway = () => setOpenKey(null)

  const isTopActive = (menu: MiGnbTopMenu) =>
    isPathActive(menu.defaultPath) || menu.rows.some((r) => r.kind === 'item' && isPathActive(r.to))

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
            {companyList.length === 0 && (
              <Typography ml={1} variant="body3SB12" color="gray.70">
                {selectedCompany?.label}
              </Typography>
            )}
            {companyList.length > 0 && selectedCompany && (
              <MIMenuSelector
                sx={{ marginTop: '8px' }}
                minWidthMenu="160px"
                value={selectedCompany}
                options={companyList}
                onOpen={setIsOpenCompany}
                onChange={({ value, label }) => {
                  const newCompany = {
                    value: value as number,
                    label,
                    customerCompanyMipUrl: companyList.find((c) => c.value === value)?.customerCompanyMipUrl ?? '',
                  }

                  navigate('/mi', { state: { targetCompanyNo: newCompany.value } })
                }}
                disablePortal
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  <Typography ml={1} variant="body3SB12" color="gray.70">
                    {selectedCompany?.label}
                  </Typography>
                  <Box
                    width={'24px'}
                    height={'24px'}
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    borderRadius={'4px'}
                    sx={{
                      '& svg': { transform: isOpenCompany ? 'rotate(180deg)' : 'rotate(0deg)' },
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ color: '#495057' }} fontSize="small" />
                  </Box>
                </Stack>
              </MIMenuSelector>
            )}
          </Box>
          <Grid container gap={1} alignItems="center">
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
            {user?.userRoleCd === UserRole.ADMIN && (
              <>
                <Divider orientation="vertical" variant="middle" component="div" color="gray.70" sx={{ width: '1px', height: 16 }} />
                <MIMenuSelector
                  sx={{ marginTop: '6px' }}
                  minWidthMenu="120px"
                  value={selectedLanguage}
                  options={languageList}
                  onOpen={setIsOpenLanguageSelect}
                  onChange={({ value, label }) => {
                    setSelectedLanguage({ value: value as string, label })
                    i18n.changeLanguage(value as string)
                  }}
                  disablePortal
                  menuProps={
                    {
                      anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
                      transformOrigin: { vertical: 'top', horizontal: 'right' },
                    } as MenuProps
                  }
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    <Typography
                      variant="subtext"
                      color="gray.70"
                      width="38px"
                      height="18px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {selectedLanguage?.label}
                    </Typography>
                    <Box
                      width={'20px'}
                      height={'20px'}
                      display={'flex'}
                      alignItems={'center'}
                      justifyContent={'center'}
                      borderRadius={'4px'}
                      sx={{
                        '& svg': { transform: isOpenLanguageSelect ? 'rotate(180deg)' : 'rotate(0deg)' },
                      }}
                    >
                      <KeyboardArrowDownIcon sx={{ color: '#495057' }} fontSize="small" />
                    </Box>
                  </Stack>
                </MIMenuSelector>
              </>
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
                  runNavigate(resolvedHomePath ?? '/mi')
                } else {
                  navigate('/')
                }
              }}
            >
              <img src={logoImg} alt="AI Market Insights" draggable={false} />
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              {!isLoading &&
                gnbMenus.map((menu) => {
                  const menuKey = menu.key
                  const isOpen = openKey === menuKey
                  const isActiveTop = isTopActive(menu)
                  const showPopper = hasDropdownItems(menu)

                  return (
                    <Box
                      key={menuKey}
                      onMouseEnter={() => showPopper && onTopMouseEnter(menuKey)}
                      onMouseLeave={showPopper ? onTopMouseLeave : undefined}
                    >
                      <Button
                        ref={(el) => {
                          topBtnRefs.current[menuKey] = el
                        }}
                        disableRipple
                        onClick={(e) => {
                          e.preventDefault()
                          handleTopClick(menu)
                        }}
                        onKeyDown={(e) => showPopper && handleTopKeyDown(e, menuKey, e.currentTarget as HTMLElement)}
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
                          sx={{
                            textAlign: 'center',
                            color: isActiveTop ? 'mari.Primary' : 'contentText.normal',
                            fontWeight: isActiveTop ? 600 : 'normal',
                          }}
                        >
                          {menu.topLabel}
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

                      {showPopper && (
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
                                {menu.rows.map((row, idx) => {
                                  if (row.kind === 'section') {
                                    const prevKinds = menu.rows.slice(0, idx).map((r) => r.kind)
                                    const isFirstSection = !prevKinds.includes('item')
                                    return (
                                      <Box
                                        key={`section-${menuKey}-${idx}`}
                                        sx={{
                                          px: 2,
                                          pt: isFirstSection ? 1 : 3,
                                          pb: 1,
                                          color: 'gray.60',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        {row.title}
                                      </Box>
                                    )
                                  }

                                  const IconComponent = row.IconComponent
                                  const active = isPathActive(row.to)
                                  const hasDesc = Boolean(row.desc)
                                  const linkMinHeight = hasDesc ? 58 : 38

                                  return (
                                    <Box key={`${row.to}-${idx}`}>
                                      <Link
                                        href=""
                                        onClick={(e) => {
                                          e.preventDefault()
                                          setOpenKey(null)
                                          runNavigate(row.to)
                                        }}
                                        underline="none"
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: 1.25,
                                          minHeight: `${linkMinHeight}px`,
                                          transition: 'background-color .15s',
                                          color: active ? 'mari.Primary' : '#495057',
                                          cursor: 'pointer',
                                          backgroundColor: active ? '#ffffff' : 'transparent',
                                          '&:hover': {
                                            backgroundColor: '#e8e9eb',
                                          },
                                        }}
                                      >
                                        <Box
                                          sx={{ mt: '8px', ml: IconComponent ? '6px' : '2px' }}
                                          color={active ? 'mari.Primary' : 'gray.80'}
                                        >
                                          {IconComponent ? <IconComponent /> : <Box />}
                                        </Box>

                                        <Box paddingY={'8px'}>
                                          <Typography
                                            variant="body1SB16"
                                            color={active ? 'mari.Primary' : 'gray.80'}
                                            sx={{ display: 'flex', alignItems: 'center' }}
                                          >
                                            {row.label}
                                          </Typography>
                                          {row.desc && (
                                            <Typography variant="body2M14" color="gray.60" sx={{ mt: 0.25, display: 'block' }}>
                                              {t(row.desc)}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Link>
                                    </Box>
                                  )
                                })}
                              </Box>
                            </Paper>
                          </ClickAwayListener>
                        </Popper>
                      )}
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
