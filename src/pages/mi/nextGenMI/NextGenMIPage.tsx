import { Box, Stack, Typography } from '@mui/material'
import { debounce, type DebouncedFunc } from 'lodash-es'
import { createElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED } from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMITab from '@/pages/mi/nextGenMI/components/NextGenMITab'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import { NextGenMIHeaderCollapseProvider } from '@/pages/mi/nextGenMI/NextGenMIHeaderCollapseContext'
import { getNextGenMITabIndex, resolveNextGenMITabFromPathname, NEXT_GEN_MI_TAB_INFO } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { NextGenMIStickyLayoutProvider } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'

const STICKY_TOP_WHEN_SCROLLED = -14
const SCROLL_JUMP_IGNORE_EXPAND_AT_ZERO_PX = 96
const KEEP_MAIN_EPSILON_SCROLLED = 1

const getCurrentTabIndexFromLocation = () =>
  Math.max(0, getNextGenMITabIndex(resolveNextGenMITabFromPathname(globalThis.location.pathname)))

const getFirstContentSnapScrollTop = (
  scrollEl: HTMLElement,
  contentEl: HTMLElement | null,
  stickyEl: HTMLElement | null,
): number | null => {
  if (!contentEl || !stickyEl) return null
  const containerRect = scrollEl.getBoundingClientRect()
  const contentRect = contentEl.getBoundingClientRect()
  const stickyHeight = stickyEl.getBoundingClientRect().height
  const stickyBottomWhenStuck = stickyHeight + STICKY_TOP_WHEN_SCROLLED
  return scrollEl.scrollTop + contentRect.top - containerRect.top - stickyBottomWhenStuck
}

const NextGenMIPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedTab, setSelectedTab] = useState(() => getCurrentTabIndexFromLocation())
  const [stickySlotEl, setStickySlotEl] = useState<HTMLDivElement | null>(null)
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null)
  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  const isScrolledRef = useRef(false)
  const activeTabKey = NEXT_GEN_MI_TAB_INFO[selectedTab]?.key ?? null
  const activeTabLabel = NEXT_GEN_MI_TAB_INFO[selectedTab]?.label ?? NEXT_GEN_MI_TAB_INFO[0].label
  /** 상단으로 smooth 스냅 중에는 scrollTop > 0이어도 헤더/탭을 펼친 상태로 유지 */
  const expandHeaderDuringSnapRef = useRef(false)
  const lastScrollTopRef = useRef(0)
  const prevTabRef = useRef<number | null>(null)

  const programmaticScrollActiveRef = useRef(false)
  const scrollSnapBaselineRef = useRef(0)
  const scrollDebouncedRef = useRef<DebouncedFunc<() => void> | null>(null)

  isScrolledRef.current = isScrolled

  const handleTabChange = useCallback((index: number) => {
    const target = NEXT_GEN_MI_TAB_INFO[index]
    if (!target) return

    setSelectedTab(index)

    if (globalThis.location.pathname !== target.path) {
      globalThis.history.replaceState(globalThis.history.state, '', target.path)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setSelectedTab(getCurrentTabIndexFromLocation())
    }

    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [])

  useLayoutEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return

    const switchingTabs = prevTabRef.current !== null && prevTabRef.current !== selectedTab

    scrollDebouncedRef.current?.cancel()

    if (switchingTabs) {
      expandHeaderDuringSnapRef.current = false
      programmaticScrollActiveRef.current = true

      const maxTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
      const firstContentTop = isScrolledRef.current
        ? getFirstContentSnapScrollTop(scrollEl, contentWrapperRef.current, stickyHeaderRef.current)
        : null

      // firstContentTop까지 스크롤 불가 시 0으로 강제 스냅한
      const nextTop = firstContentTop !== null && firstContentTop <= maxTop ? Math.min(Math.max(0, firstContentTop), maxTop) : 0

      scrollEl.scrollTo({ top: nextTop, behavior: 'instant' })

      const top = scrollEl.scrollTop
      lastScrollTopRef.current = top
      scrollSnapBaselineRef.current = top

      if (top <= KEEP_MAIN_EPSILON_SCROLLED) {
        setIsScrolled(false)
      } else {
        setIsScrolled(true)
      }

      programmaticScrollActiveRef.current = false
    }

    prevTabRef.current = selectedTab
  }, [selectedTab])

  const nextGenMITabs = useMemo(() => NEXT_GEN_MI_TAB_INFO.map((tab) => ({ ...tab, content: createElement(tab.content) })), [])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    scrollSnapBaselineRef.current = scrollEl.scrollTop
    lastScrollTopRef.current = scrollEl.scrollTop

    const handleScrollImmediate = () => {
      const t = scrollEl.scrollTop
      const prev = lastScrollTopRef.current

      if (programmaticScrollActiveRef.current) {
        lastScrollTopRef.current = t
        return
      }

      if (expandHeaderDuringSnapRef.current && t > prev + 2) {
        expandHeaderDuringSnapRef.current = false
      }
      lastScrollTopRef.current = t

      if (t <= KEEP_MAIN_EPSILON_SCROLLED) {
        expandHeaderDuringSnapRef.current = false
        if (isScrolledRef.current && prev > SCROLL_JUMP_IGNORE_EXPAND_AT_ZERO_PX) {
          return
        }
        setIsScrolled(false)
        return
      }

      if (!expandHeaderDuringSnapRef.current) {
        setIsScrolled(true)
      }
    }

    const handleWheelExpandHeader = (e: WheelEvent) => {
      if (e.deltaY >= 0) return
      if (scrollEl.scrollTop > KEEP_MAIN_EPSILON_SCROLLED) return
      expandHeaderDuringSnapRef.current = false
      setIsScrolled(false)
      if (scrollEl.scrollTop <= KEEP_MAIN_EPSILON_SCROLLED) {
        programmaticScrollActiveRef.current = true
        scrollEl.scrollTop = 0
        lastScrollTopRef.current = 0
        programmaticScrollActiveRef.current = false
      }
    }

    const handleScrollDebounced = debounce(() => {
      const currentScrollTop = scrollEl.scrollTop
      const baseline = scrollSnapBaselineRef.current
      const isScrollingUp = currentScrollTop < baseline
      const isScrollingDown = currentScrollTop > baseline
      const contentEl = contentWrapperRef.current
      const stickyEl = stickyHeaderRef.current

      if (contentEl && stickyEl) {
        const firstContentTop = getFirstContentSnapScrollTop(scrollEl, contentEl, stickyEl)
        if (firstContentTop !== null) {
          if (isScrollingDown && currentScrollTop < firstContentTop) {
            scrollEl.scrollTo({ top: firstContentTop, behavior: 'smooth' })
          } else if (isScrollingUp && currentScrollTop + 1 < firstContentTop && currentScrollTop > 0) {
            expandHeaderDuringSnapRef.current = true
            setIsScrolled(false)
            scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      }

      scrollSnapBaselineRef.current = scrollEl.scrollTop
    }, 150)

    scrollDebouncedRef.current = handleScrollDebounced

    const handleScroll = () => {
      handleScrollImmediate()
      handleScrollDebounced()
    }

    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    scrollEl.addEventListener('wheel', handleWheelExpandHeader, { passive: true, capture: true })
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
      scrollEl.removeEventListener('wheel', handleWheelExpandHeader, true)
      handleScrollDebounced.cancel()
      scrollDebouncedRef.current = null
    }
  }, [])

  return (
    <NextGenMIHeaderCollapseProvider value={isScrolled}>
      <NextGenMIStickyLayoutProvider slotEl={stickySlotEl} activeTabKey={activeTabKey}>
        <Stack maxWidth="1380px" margin="auto" pt="20px" position="relative" sx={{ userSelect: 'none' }}>
          <Box
            ref={stickyHeaderRef}
            position="sticky"
            top={isScrolled ? '-14px' : 0}
            left="0"
            bgcolor="commonColor.White"
            zIndex={200}
            sx={{
              boxShadow: isScrolled ? NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
              clipPath: 'inset(0 0 -20px 0)',
              transition: 'box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Typography
              variant="titleLarge"
              position="absolute"
              top="12px"
              fontSize="38px"
              sx={{
                transform: `translateY(${isScrolled ? -6 : 0}px)`,
                opacity: isScrolled ? 0 : 1,
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                transitionDelay: isScrolled ? '0s' : '0.2s',
              }}
            >
              Next-Gen MI
            </Typography>
            <Box mt="96px">
              <NextGenMITab
                tabItems={nextGenMITabs}
                tabBarOnly
                value={selectedTab}
                onChange={handleTabChange}
                endAdornment={<NextGenMIUserFeedback pageTitle={activeTabLabel} />}
              />
            </Box>
            {/* 활성 탭의 패널 타이틀·필터·테이블 헤더가 portal로 주입되는 슬롯 */}
            <Box ref={setStickySlotEl} />
          </Box>
          <Box ref={contentWrapperRef} position="relative" sx={{ userSelect: 'text' }}>
            {nextGenMITabs.map((tab, index) => {
              const isSelected = selectedTab === index
              return (
                <Box
                  key={tab.label}
                  role="tabpanel"
                  id={`next-gen-mi-tabpanel-${index}`}
                  aria-labelledby={`next-gen-mi-tab-${index}`}
                  aria-hidden={!isSelected}
                  sx={{
                    ...(isSelected && {
                      position: 'relative',
                      opacity: 1,
                      animation: 'nextGenMIFadeIn 0.15s ease-out',
                      '@keyframes nextGenMIFadeIn': {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                      },
                    }),
                    ...(!isSelected && {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: 0,
                      overflow: 'hidden',
                      visibility: 'hidden',
                      pointerEvents: 'none',
                      zIndex: -1,
                    }),
                  }}
                >
                  {tab.content}
                </Box>
              )
            })}
          </Box>
        </Stack>
      </NextGenMIStickyLayoutProvider>
    </NextGenMIHeaderCollapseProvider>
  )
}

export default NextGenMIPage
