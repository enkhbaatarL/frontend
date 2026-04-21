import { Box, Stack, Typography } from '@mui/material'
import { debounce } from 'lodash-es'
import { useState, useEffect, useMemo, useRef } from 'react'

import ScenarioWorkbenchTab from './components/ScenarioWorkbenchTab'
import DesignTabPanel from './tabs/DesignTabPanel'
import EventsTabPanel from './tabs/EventsTabPanel'
import OverviewTabPanel from './tabs/OverviewTabPanel'
import ScenariosTabPanel from './tabs/ScenariosTabPanel'

const STICKY_TOP_WHEN_SCROLLED = -14
const PAGE_TITLE = 'MI Scenario Workbench'

const ScenarioWorkbenchPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null)
  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  /** 상단으로 smooth 스냅 중에는 scrollTop > 0이어도 헤더/탭을 펼친 상태로 유지 */
  const expandHeaderDuringSnapRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [selectedTab])

  const tabItems = useMemo(
    () => [
      { label: 'Overview', content: <OverviewTabPanel /> },
      { label: 'Events', content: <EventsTabPanel /> },
      { label: 'Scenarios', content: <ScenariosTabPanel /> },
      { label: 'Design', content: <DesignTabPanel /> },
    ],
    [],
  )

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    let scrollStartTop = scrollEl.scrollTop
    lastScrollTopRef.current = scrollEl.scrollTop

    const handleScrollImmediate = () => {
      const t = scrollEl.scrollTop
      const prev = lastScrollTopRef.current
      if (expandHeaderDuringSnapRef.current && t > prev + 2) {
        expandHeaderDuringSnapRef.current = false
      }
      lastScrollTopRef.current = t

      if (t === 0) {
        expandHeaderDuringSnapRef.current = false
        setIsScrolled(false)
        return
      }
      if (!expandHeaderDuringSnapRef.current) {
        setIsScrolled(true)
      }
    }

    const handleScrollDebounced = debounce(() => {
      const currentScrollTop = scrollEl.scrollTop
      const isScrollingUp = currentScrollTop < scrollStartTop
      const isScrollingDown = currentScrollTop > scrollStartTop
      const contentEl = contentWrapperRef.current
      const stickyEl = stickyHeaderRef.current

      if (contentEl && stickyEl) {
        const containerRect = scrollEl.getBoundingClientRect()
        const contentRect = contentEl.getBoundingClientRect()
        const stickyHeight = stickyEl.getBoundingClientRect().height
        const stickyBottomWhenStuck = stickyHeight + STICKY_TOP_WHEN_SCROLLED
        const firstContentTop = scrollEl.scrollTop + contentRect.top - containerRect.top - stickyBottomWhenStuck

        if (isScrollingDown && currentScrollTop < firstContentTop) {
          scrollEl.scrollTo({ top: firstContentTop, behavior: 'smooth' })
        } else if (isScrollingUp && currentScrollTop + 1 < firstContentTop && currentScrollTop > 0) {
          expandHeaderDuringSnapRef.current = true
          setIsScrolled(false)
          scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }

      scrollStartTop = scrollEl.scrollTop
    }, 150)

    const handleScroll = () => {
      handleScrollImmediate()
      handleScrollDebounced()
    }

    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
      handleScrollDebounced.cancel()
    }
  }, [])

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" position="relative" sx={{ userSelect: 'none' }}>
      <Box ref={stickyHeaderRef} position="sticky" top={isScrolled ? '-14px' : 0} left="0" bgcolor="commonColor.White" zIndex={200}>
        <Typography
          variant="titleLarge"
          position="absolute"
          top="12px"
          left="24px"
          fontSize="38px"
          sx={{
            transform: `translateY(${isScrolled ? -6 : 0}px)`,
            opacity: isScrolled ? 0 : 1,
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
            transitionDelay: isScrolled ? '0s' : '0.2s',
          }}
        >
          {PAGE_TITLE}
        </Typography>
        <Box mt="96px">
          <ScenarioWorkbenchTab tabItems={tabItems} tabBarOnly value={selectedTab} onChange={setSelectedTab} />
        </Box>
      </Box>
      <Box ref={contentWrapperRef} position="relative">
        {tabItems.map((tab, index) => {
          const isSelected = selectedTab === index
          return (
            <Box
              key={tab.label}
              aria-hidden={!isSelected}
              sx={{
                ...(isSelected && {
                  position: 'relative',
                  opacity: 1,
                  animation: 'scenarioWorkbenchFadeIn 0.15s ease-out',
                  '@keyframes scenarioWorkbenchFadeIn': {
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
  )
}

export default ScenarioWorkbenchPage
