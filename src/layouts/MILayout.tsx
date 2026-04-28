import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIAgentButton from '@/components/common/agent/MIAgentButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFooter from '@/components/mi/MIFooter'
import MIHeaderMainLayout from '@/components/mi/MIHeaderMainLayout'
import MiMenuRegistryAccessGuard from '@/components/mi/MiMenuRegistryAccessGuard'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import Ticker from '@/components/mi/Ticker'
import { useMarketData } from '@/contexts/MarketDataContext'
import { useResetKeyContext } from '@/contexts/ResetKeyContext'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { collectMiScrollSegmentsFromMenus } from '@/lib/miGnbMenuNav'
import { MarketDataProvider } from '@/providers/MarketDataProvider'
import MIProvider from '@/providers/MIProvider'
import { StickyHeaderProvider } from '@/providers/StickyHeaderProvider'
import boardService, { INoticeDetailInfo, INoticePopupInfo } from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore'
import { getCookie, setCookie } from '@/utils/cookie'

const headerTopHeight = 36

const MILayout = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showNoticePopup, setShowNoticePopup] = useState(false)
  const [noticeData, setNoticeData] = useState<INoticePopupInfo | null>(null)
  const [noticeDetailData, setNoticeDetailData] = useState<INoticeDetailInfo | null>(null)
  const [outletKey, setOutletKey] = useState(0)
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const user = useAuthStore((state) => state.user)
  const currentCompanyNo = accessCompanyInfo?.customerCompanyNo ?? user?.companyNo
  const location = useLocation()
  const scrollUrlSegments = useMemo(() => collectMiScrollSegmentsFromMenus(accessCompanyInfo?.menus), [accessCompanyInfo?.menus])
  const { saveScroll, currentScroll, preRenderMinHeight } = useScrollRestoration({
    urls: scrollUrlSegments.length > 0 ? scrollUrlSegments : ['forecast'],
    ref: scrollRef,
  })
  const [isScrolled, setIsScrolled] = useState(() => currentScroll > 0)
  const { marketDataList, marketDataIsLoading } = useMarketData()
  const { stickyHeader, stickyHeaderOptions } = useStickyHeader()
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0)
  const stickyHeightsPx = stickyHeaderOptions.stickyHeightsPx

  /** stickyHeightsPx 가 있으면 목표 높이가 정해져 있으므로 DOM 측정 없이 isScrolled 와 동일 프레임에서 패딩 전환 → Collapse·GNB 와 동시에 시작 */
  const stickyHeaderHeightResolved = useMemo(() => {
    if (stickyHeightsPx) return isScrolled ? stickyHeightsPx.collapsed : stickyHeightsPx.expanded
    return stickyHeaderHeight
  }, [isScrolled, stickyHeaderHeight, stickyHeightsPx])

  useEffect(() => {
    setOutletKey((prevKey) => prevKey + 1)
  }, [accessCompanyInfo])

  useEffect(() => {
    setIsScrolled(currentScroll > 0)
  }, [currentScroll])

  useEffect(() => {
    const currentRef = scrollRef.current
    const handleScroll = () => {
      const y = currentRef?.scrollTop ?? 0
      setIsScrolled(y > 0)
    }
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
    if (!stickyHeader) {
      setStickyHeaderHeight(0)
      return undefined
    }
    if (stickyHeaderOptions.stickyHeightsPx) {
      setStickyHeaderHeight(0)
      return undefined
    }

    let resizeObserver: ResizeObserver | null = null
    let rafId: number | null = null

    const measureHeight = () => {
      const stickyElement = document.querySelector('[data-sticky-header]')
      if (!stickyElement) return
      const height = stickyElement.getBoundingClientRect().height
      if (height > 0) {
        setStickyHeaderHeight((prev) => (height === prev ? prev : height))
      }
    }

    const scheduleMeasure = () => {
      rafId ??= requestAnimationFrame(() => {
        rafId = null
        measureHeight()
      })
    }

    const mutationObserver = new MutationObserver(() => scheduleMeasure())

    const timeoutId = setTimeout(() => {
      measureHeight()
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
      const stickyElement = document.querySelector('[data-sticky-header]')
      if (stickyElement) {
        resizeObserver = new ResizeObserver(() => scheduleMeasure())
        resizeObserver.observe(stickyElement)
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      mutationObserver.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
    }
  }, [stickyHeader, stickyHeaderOptions.stickyHeightsPx])

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
  const showMiAgent =
    !!accessCompanyInfo?.floating?.some((f) => f.screenElementCd === 'MARI') &&
    !['/mi/privacy-policy', '/mi/custom'].includes(location.pathname)

  const paddingTop = useMemo(() => {
    const defaultPadding = isScrolled ? 70 : 106
    const totalPadding = defaultPadding + stickyHeaderHeightResolved

    return `${totalPadding}px`
  }, [isScrolled, stickyHeaderHeightResolved])

  /**
   * 스티키 등록·실측으로 `stickyHeaderHeightResolved`만 바뀔 때도 `padding-top`이 220ms 보간되면
   * 진입 직후 본문이 아래로 내려오는 것처럼 보임 — GNB 접힘(`isScrolled`) 전환 때만 전환 애니메이션.
   */
  const prevIsScrolledForMainPaddingRef = useRef(isScrolled)
  const shouldTransitionMainPadding = prevIsScrolledForMainPaddingRef.current !== isScrolled
  useLayoutEffect(() => {
    prevIsScrolledForMainPaddingRef.current = isScrolled
  }, [isScrolled])

  const mainContentPaddingTransition = shouldTransitionMainPadding
    ? 'padding-top 220ms cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 220ms cubic-bezier(0.4, 0, 0.2, 1)'
    : 'none'

  const mariAgentTopPosition = useMemo(() => {
    const scrolledGap = isScrolled ? -headerTopHeight : 0
    const basePosition = 117 + scrolledGap
    const stickyOffset = stickyHeaderOptions.pinMariPosition ? 0 : stickyHeaderHeightResolved

    return basePosition + stickyOffset
  }, [isScrolled, stickyHeaderHeightResolved, stickyHeaderOptions.pinMariPosition])

  const backgroundStyle = useMemo(() => {
    if (location.pathname === '/mi/dashboard') {
      return 'linear-gradient(300deg, #D5D6D8 0%, #FCFCFC 30%, #E6E6E7 60%, #FAFAFA 100%)'
    }
    if (showTicker) {
      return '#F2F5F7'
    }
    // ForecastPage (companyNo 2013)일 때만 배경색 적용, NewForecastPage는 해당 안 됨
    if (location.pathname === '/mi/forecast' && currentCompanyNo === 2013) {
      return '#F2F5F7'
    }
    return undefined
  }, [location.pathname, showTicker, currentCompanyNo])

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
                  /** `.main-header` transform 0.22s와 동일 계열 — 패딩만 즉시 바뀌면 본문이 헤더보다 먼저 움직여 보임 */
                  transition: 'top 220ms cubic-bezier(0.4, 0, 0.2, 1)',
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
              overflowAnchor: 'none',
              transition: mainContentPaddingTransition,
            }}
          >
            <MISkeleton variant={'dailyChart'} loading={marketDataIsLoading}>
              {showTicker && <Ticker data={marketDataList} />}
            </MISkeleton>
            <MiMenuRegistryAccessGuard>
              <Outlet key={outletKey} />
            </MiMenuRegistryAccessGuard>
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
