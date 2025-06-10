import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIAgentButton from '@/components/common/agent/MIAgentButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFooter from '@/components/mi/MIFooter'
import MIHeaderMainLayout, { Page } from '@/components/mi/MIHeaderMainLayout'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import DailyChart from '@/pages/mi/dashboard/components/DailyChart'
import { MarketDataProvider } from '@/providers/MarketDataProvider'
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
    url: 'dashboard',
  },
  {
    label: 'Signal Map',
    url: 'signal-map',
  },
  {
    label: 'Market Data',
    url: 'market-data',
  },
  {
    label: 'Insights',
    url: 'insights',
  },
]

const headerTopHeight = 36

const MILayout = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showNoticePopup, setShowNoticePopup] = useState(false)
  const [noticeData, setNoticeData] = useState<INoticePopupInfo | null>(null)
  const [noticeDetailData, setNoticeDetailData] = useState<INoticeDetailInfo | null>(null)
  const [outletKey, setOutletKey] = useState(0)
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const location = useLocation()
  const { saveScroll, currentScroll, preRenderMinHeight } = useScrollRestoration({
    urls: mainPages.map((m) => m.url),
    ref: scrollRef,
  })
  const [isScrolled, setIsScrolled] = useState(currentScroll !== 0)
  const { marketDataList, marketDataIsLoading } = useMarketData()

  const { extractPage } = useCompanyCondition()

  useEffect(() => {
    setOutletKey((prevKey) => prevKey + 1)
  }, [accessCompanyInfo])

  const fixedMainPages = useMemo(() => {
    if (extractPage === undefined) return []
    return mainPages.filter(({ url }) => !extractPage.includes(url))
  }, [extractPage])

  useEffect(() => setIsScrolled(currentScroll > 0), [currentScroll])

  useEffect(() => {
    const currentRef = scrollRef.current
    const handleScroll = () => setIsScrolled((currentRef?.scrollTop ?? 0) > 0)
    currentRef?.addEventListener('scroll', handleScroll)
    return () => currentRef?.removeEventListener('scroll', handleScroll)
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

  const showDailyChart = useMemo(
    () => location.pathname === '/mi/dashboard' && marketDataList.length > 0,
    [location.pathname, marketDataList],
  )

  // MEMO: 상반기 개발(~ 25.06.30) 기준
  // -> 개인정보 처리방침 제외
  const showMiAgent = !['/mi/privacy-policy'].includes(location.pathname)

  const paddingTop = useMemo(() => {
    const defaultPadding = isScrolled ? 70 : 106

    return `${defaultPadding + (showDailyChart || marketDataIsLoading ? 76 : 0)}px`
  }, [showDailyChart, isScrolled, marketDataIsLoading])

  const mariAgentTopPosition = useMemo(() => {
    const scrolledGap = isScrolled ? -headerTopHeight : 0
    const dailyChartGap = showDailyChart || marketDataIsLoading ? 76 : 0

    return 126 + scrolledGap + dailyChartGap
  }, [showDailyChart, isScrolled, marketDataIsLoading])

  return (
    <MIProvider>
      <ScrollWrapper
        ref={scrollRef}
        styScroll={{
          zIndex: 1200,
          right: 0,
          width: '10px',
        }}
        maxHeight={'100vh'}
      >
        <div
          style={{
            background: showDailyChart ? '#F2F5F7' : undefined,
            display: 'flex',
            flexDirection: 'column',
            minHeight: preRenderMinHeight,
            minWidth: '1440px',
            boxSizing: 'border-box',
          }}
        >
          {showMiAgent && <MIAgentButton top={mariAgentTopPosition} />}
          <div className={`main-header ${isScrolled ? 'fixed-header' : ''}`}>
            <MIHeaderMainLayout pages={fixedMainPages} onMoveTab={(callback) => saveScroll(callback)} />
            <MISkeleton variant={'dailyChart'} loading={marketDataIsLoading}>
              {showDailyChart && <DailyChart data={marketDataList} />}
            </MISkeleton>
          </div>
          <Box
            sx={{
              paddingTop,
              paddingBottom: isScrolled ? `${headerTopHeight}px` : 0,
              flex: 1,
              transition: 'padding 0.15s linear',
            }}
          >
            <Outlet key={outletKey} />
          </Box>
          <MIFooter />
        </div>
      </ScrollWrapper>

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
    </MIProvider>
  )
}

const MILayoutWithProvider = () => (
  <MarketDataProvider>
    <MILayout />
  </MarketDataProvider>
)

export default MILayoutWithProvider
