import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIAgentButton from '@/components/common/agent/MIAgentButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFooter from '@/components/mi/MIFooter'
import MIHeaderMainLayout from '@/components/mi/MIHeaderMainLayout'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import Ticker from '@/components/mi/Ticker'
import { MENU_CONFIG } from '@/constants/menu'
import { useMarketData } from '@/contexts/MarketDataContext'
import { useResetKeyContext } from '@/contexts/ResetKeyContext'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { MarketDataProvider } from '@/providers/MarketDataProvider'
import MIProvider from '@/providers/MIProvider'
import { StickyHeaderProvider } from '@/providers/StickyHeaderProvider'
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
    urls: MENU_CONFIG.map((menu) => menu.index),
    ref: scrollRef,
  })
  const [isScrolled, setIsScrolled] = useState(currentScroll !== 0)
  const { marketDataList, marketDataIsLoading } = useMarketData()
  const { stickyHeader } = useStickyHeader()
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0)

  useEffect(() => {
    setOutletKey((prevKey) => prevKey + 1)
  }, [accessCompanyInfo])

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
    if (stickyHeader) {
      const observer = new MutationObserver(() => {
        const stickyElement = document.querySelector('[data-sticky-header]')
        if (stickyElement) {
          const height = stickyElement.getBoundingClientRect().height
          if (height > 0 && height !== stickyHeaderHeight) {
            setStickyHeaderHeight(height)
          }
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })

      return () => observer.disconnect()
    }
    return undefined
  }, [stickyHeader, stickyHeaderHeight])

  useEffect(() => {
    if (stickyHeader) {
      let resizeObserver: ResizeObserver | null = null

      const measureHeight = () => {
        const stickyElement = document.querySelector('[data-sticky-header]')
        if (stickyElement) {
          const height = stickyElement.getBoundingClientRect().height
          if (height > 0) {
            setStickyHeaderHeight(height)
          }
        }
      }

      // DOM이 완전히 렌더링될 때까지 대기
      const timeoutId = setTimeout(() => {
        measureHeight()

        const stickyElement = document.querySelector('[data-sticky-header]')
        if (stickyElement) {
          resizeObserver = new ResizeObserver(() => {
            const height = stickyElement.getBoundingClientRect().height
            if (height > 0) {
              setStickyHeaderHeight(height)
            }
          })
          resizeObserver.observe(stickyElement)
        }
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        if (resizeObserver) {
          resizeObserver.disconnect()
        }
      }
    } else {
      setStickyHeaderHeight(0)
      return undefined
    }
  }, [stickyHeader])

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const notice = await boardService.getNoticePopup(accessCompanyInfo?.customerCompanyNo)

        if (!notice?.bulletinNo) return

        setNoticeData(notice)

        // 쿠키를 확인하여 오늘 하루 보지 않기를 선택했는지 확인
        const today = new Date().toDateString()
        const cookieKey = `notice_dont_show_${notice.bulletinNo}`
        const dontShowToday = getCookie(cookieKey) === today

        if (!dontShowToday) {
          // 상세 정보도 가져오기
          const detail = await boardService.getNoticeDetail(notice.bulletinNo)
          setNoticeDetailData(detail)
          setShowNoticePopup(true)
        }
      } catch (error) {
        console.error('공지사항 팝업을 불러오는 중 오류가 발생했습니다:', error)
      }
    }

    if (location.state?.noticePopup) {
      fetchNotice().then()
    }
  }, [location.state, accessCompanyInfo?.customerCompanyNo])

  const handleDontShowToday = () => {
    if (noticeData) {
      const today = new Date().toDateString()
      // 쿠키 설정 (1일 후 만료)
      setCookie(`notice_dont_show_${noticeData.bulletinNo}`, today, 1)
    }
    setShowNoticePopup(false)
  }

  const handleClose = () => setShowNoticePopup(false)

  const showTicker = useMemo(
    () => (location.pathname === '/mi/main' || location.pathname === '/mi/dashboard') && marketDataList.length > 0,
    [location.pathname, marketDataList],
  )

  // MEMO: 상반기 개발(~ 25.06.30) 기준
  // -> 개인정보 처리방침 제외
  // -> 고객사 custom iframe page 제외
  const showMiAgent = accessCompanyInfo?.isMari && !['/mi/privacy-policy', '/mi/custom'].includes(location.pathname)

  const paddingTop = useMemo(() => {
    const defaultPadding = isScrolled ? 70 : 106
    const totalPadding = defaultPadding + stickyHeaderHeight

    return `${totalPadding}px`
  }, [isScrolled, stickyHeaderHeight])

  const mariAgentTopPosition = useMemo(() => {
    const scrolledGap = isScrolled ? -headerTopHeight : 0
    const basePosition = 117 + scrolledGap

    return basePosition + stickyHeaderHeight
  }, [isScrolled, stickyHeaderHeight])

  const backgroundStyle = useMemo(() => {
    if (location.pathname === '/mi/dashboard') {
      return 'linear-gradient(300deg, #D5D6D8 0%, #FCFCFC 30%, #E6E6E7 60%, #FAFAFA 100%)'
    }
    if (showTicker) {
      return '#F2F5F7'
    }
    return undefined
  }, [location.pathname, showTicker])

  return (
    <MIProvider>
      <ScrollWrapper
        ref={scrollRef}
        id="main-scroll-wrapper"
        styScroll={{
          zIndex: 1200,
          right: 0,
          width: '10px',
        }}
        maxHeight={'100vh'}
      >
        <div
          style={{
            background: backgroundStyle,

            display: 'flex',
            flexDirection: 'column',
            minHeight: location.pathname === '/mi/main' || location.pathname === '/mi/dashboard' ? '100vh' : preRenderMinHeight,
            minWidth: '1440px',
            boxSizing: 'border-box',
          }}
        >
          {showMiAgent && <MIAgentButton top={mariAgentTopPosition} />}
          <div className={`main-header ${isScrolled ? 'fixed-header' : ''}`}>
            <MIHeaderMainLayout onMoveTab={(callback) => saveScroll(callback)} />
            {stickyHeader && (
              <Box
                data-sticky-header
                sx={{
                  position: 'sticky',
                  top: isScrolled ? '70px' : '106px',
                  zIndex: 8,
                }}
              >
                {stickyHeader}
              </Box>
            )}
          </div>
          <Box
            sx={{
              paddingTop,
              paddingBottom: `calc(${isScrolled ? headerTopHeight : 0}px + 136px)`,
              flex: 1,
              transition: 'padding 0.15s linear',
            }}
          >
            <MISkeleton variant={'dailyChart'} loading={marketDataIsLoading}>
              {showTicker && <Ticker data={marketDataList} />}
            </MISkeleton>
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

const MILayoutWithProvider = () => {
  const { resetKey } = useResetKeyContext()
  return (
    <MarketDataProvider>
      <StickyHeaderProvider>
        <MILayout key={resetKey} />
      </StickyHeaderProvider>
    </MarketDataProvider>
  )
}

export default MILayoutWithProvider
