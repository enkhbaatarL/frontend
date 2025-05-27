import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import MIAgentButton from '@/components/common/agent/MIAgentButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFooter from '@/components/mi/MIFooter'
import MIHeaderMainLayout, { Page } from '@/components/mi/MIHeaderMainLayout'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import DailyChart from '@/pages/mi/dashboard/components/DailyChart'
import { dashboardMapper } from '@/pages/mi/dashboard/lib/dashboardMapper'
import MIProvider from '@/providers/MIProvider'
import boardService, { INoticeDetailInfo, INoticePopupInfo } from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore'

// 쿠키 설정 함수
const setCookie = (name: string, value: string, expiryDays: number) => {
  const date = new Date()
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

// 쿠키 가져오기 함수
const getCookie = (name: string): string | null => {
  const cookieName = `${name}=`
  const cookies = document.cookie.split(';')

  for (const cookieStr of cookies) {
    const cookie = cookieStr.trim()
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length, cookie.length)
    }
  }
  return null
}

const mainPages: Page[] = [
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

const MILayout = () => {
  const [showNoticePopup, setShowNoticePopup] = useState(false)
  const [noticeData, setNoticeData] = useState<INoticePopupInfo | null>(null)
  const [noticeDetailData, setNoticeDetailData] = useState<INoticeDetailInfo | null>(null)
  const [outletKey, setOutletKey] = useState(0)
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const location = useLocation()
  const { saveScroll, currentScroll, preRenderMinHeight } = useScrollRestoration({ urls: mainPages.map((m) => m.url) })
  const [isScrolled, setIsScrolled] = useState(currentScroll !== 0)
  useEffect(() => {
    setOutletKey((prevKey) => prevKey + 1)
  }, [accessCompanyInfo])

  const shouldHideDashboard = useMemo(
    () => dashboardMapper[accessCompanyInfo?.customerCompanyNo ?? -1]?.hide,
    [accessCompanyInfo?.customerCompanyNo],
  )

  const fixedMainPages = useMemo(
    () => (!shouldHideDashboard ? mainPages : mainPages.filter((page) => page.url !== '/mi/dashboard')),
    [shouldHideDashboard],
  )

  useEffect(() => setIsScrolled(currentScroll > 0), [currentScroll])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const portalOpen = document.querySelector('[role="menu"], [role="listbox"]')

      document.body.classList.toggle('mui-list-open', !!portalOpen)
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        // 로컬스토리지에서 오늘 이미 조회했는지 확인
        const today = new Date().toDateString()
        const lastFetchDate = localStorage.getItem('notice_last_fetch_date')

        if (lastFetchDate === today) {
          return
        }

        const latestNotice = await boardService.getNoticePopup()

        if (!latestNotice) {
          localStorage.setItem('notice_last_fetch_date', today)
          return
        }

        setNoticeData(latestNotice)

        // 쿠키를 확인하여 오늘 하루 보지 않기를 선택했는지 확인
        const todayDontShow = getCookie(`notice_dont_show_${latestNotice.bulletinNo}`)

        if (!todayDontShow || todayDontShow !== today) {
          // 상세 정보도 가져오기
          const detailResponse = await boardService.getNoticeDetail(latestNotice.bulletinNo)
          setNoticeDetailData(detailResponse)
          setShowNoticePopup(true)
        }

        localStorage.setItem('notice_last_fetch_date', today)
      } catch (error) {
        console.error('Failed to fetch notice:', error)
      }
    }

    fetchNotice()
  }, [])

  const handleDontShowToday = () => {
    if (noticeData) {
      const today = new Date().toDateString()

      // 쿠키 설정 (1일 후 만료)
      setCookie(`notice_dont_show_${noticeData.bulletinNo}`, today, 1)
    }
    setShowNoticePopup(false)
  }

  const handleClose = () => {
    setShowNoticePopup(false)
  }

  const dailyChartData = [
    { product: 'Wheat Flour', country: 'Ukraine', name: 'Wheat Flour in Ukraine', change: 0.0035 },
    { product: 'Rice', country: 'China', name: 'Rice in China', change: -0.237 },
  ]

  const showDailyChart = useMemo(() => location.pathname === '/mi/dashboard', [location.pathname])
  const showMiAgent = true ///

  const paddingTop = useMemo(() => {
    const defaultPadding = isScrolled ? 70 : 106

    return `${defaultPadding + (showDailyChart ? 50 : 0)}px`
  }, [showDailyChart, isScrolled])

  return (
    <MIProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: preRenderMinHeight,
          minWidth: '1440px',
          boxSizing: 'border-box',
        }}
      >
        <div className={`main-header ${isScrolled ? 'fixed-header' : ''}`}>
          <MIHeaderMainLayout pages={fixedMainPages} onMoveTab={(callback) => saveScroll(callback)} />
          {showDailyChart && <DailyChart data={dailyChartData} />}
        </div>
        <Box
          sx={{
            paddingTop,
            flex: 1,
            transition: 'padding-top 0.15s linear',
          }}
        >
          {showMiAgent && <MIAgentButton />}
          <Outlet key={outletKey} />
        </Box>

        <MIFooter />

        {/* 공지사항 팝업 */}
        {noticeData && noticeDetailData && (
          <MIConfirm
            open={showNoticePopup}
            title={noticeDetailData.bulletinTitleNm}
            width={800}
            handleClose={handleClose}
            actions={[
              {
                label: '오늘 하루 보지 않기',
                variant: 'outlined',
                color: 'gray',
                onClick: handleDontShowToday,
              },
              {
                label: '닫기',
                variant: 'filled',
                color: 'primary',
                onClick: handleClose,
              },
            ]}
          >
            {noticeDetailData.fileUrl && <img style={{ display: 'block' }} width="100%" src={noticeDetailData.fileUrl} alt="" />}
            <Grid direction="column" paddingY={5} gap={4} container>
              <Typography variant="body3R14" component="div" color="gray.90">
                {noticeDetailData.bulletinCntt}
              </Typography>
            </Grid>
          </MIConfirm>
        )}
      </div>
    </MIProvider>
  )
}

export default MILayout
