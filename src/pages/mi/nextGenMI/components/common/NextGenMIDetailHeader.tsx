import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import { Box, Collapse, Stack, Tab, Tabs } from '@mui/material'
import { type ReactNode, type SyntheticEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'

const NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS = 220
const NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const NEXT_GEN_MI_DETAIL_NAV_ROW_PX = 52
const NEXT_GEN_MI_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX = 264
const STICKY_HEIGHT_MEASURE_EPS_PX = 2

const MAIN_HEADER_TOP_COLLAPSED_PX = 70
const MAIN_HEADER_TOP_EXPANDED_PX = 106

export const NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX = {
  expanded: NEXT_GEN_MI_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX,
  collapsed: NEXT_GEN_MI_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX - NEXT_GEN_MI_DETAIL_NAV_ROW_PX,
}

export const NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED = '0 8px 16px -10px rgba(0, 0, 0, 0.1)'

export const NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS = NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS
export const NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING = NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_EASING
export const NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP = NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED
export const NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM = '0 -8px 16px -10px rgba(0, 0, 0, 0.1)'
export const NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_TOP = 'inset(0 0 -20px 0)'
export const NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_BOTTOM = 'inset(-20px 0 0 0)'

export const NEXT_GEN_MI_SCROLL_EDGE_FADE_HEIGHT_PX = 20

const NEXT_GEN_MI_SCROLL_EDGE_FADE_RGB = '233, 236, 239'
export const NEXT_GEN_MI_SCROLL_EDGE_FADE_TOP_BG = `linear-gradient(to bottom, rgba(${NEXT_GEN_MI_SCROLL_EDGE_FADE_RGB}, 0.78) 0%, rgba(${NEXT_GEN_MI_SCROLL_EDGE_FADE_RGB}, 0) 80%)`
export const NEXT_GEN_MI_SCROLL_EDGE_FADE_BOTTOM_BG = `linear-gradient(to top, rgba(${NEXT_GEN_MI_SCROLL_EDGE_FADE_RGB}, 0.78) 0%, rgba(${NEXT_GEN_MI_SCROLL_EDGE_FADE_RGB}, 0) 80%)`

export const NEXT_GEN_MI_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE =
  'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%)'

export interface NextGenMIDetailHeaderSection {
  id: string
  label: string
}

interface NextGenMIDetailHeaderProps {
  backLabel: string
  onBack?: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
  sections: NextGenMIDetailHeaderSection[]
  scrollContainerId?: string
  /** 임베디드(모핑 팝업) 모드: 페이지 전역 스크롤 컨테이너 대신 이 엘리먼트를 사용 */
  scrollContainer?: HTMLElement | null
  embeddedStickyTop?: number | string
  hideBackButton?: boolean
}

const NextGenMIDetailHeader = ({
  backLabel,
  onBack,
  titleSlot,
  rightAction,
  sections,
  scrollContainerId = 'main-scroll-wrapper',
  scrollContainer,
  embeddedStickyTop = '68px',
  hideBackButton = false,
}: NextGenMIDetailHeaderProps) => {
  const { patchStickyHeaderOptions } = useStickyHeader()
  const isEmbedded = scrollContainer !== undefined

  const getScrollEl = useCallback(() => {
    if (isEmbedded) return scrollContainer ?? null
    return document.getElementById(scrollContainerId)
  }, [isEmbedded, scrollContainer, scrollContainerId])

  const [activeSection, setActiveSection] = useState(0)
  const [isMainScrolled, setIsMainScrolled] = useState(false)
  const [stickyHeightsPx, setStickyHeightsPx] = useState(() => ({ ...NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX }))

  const rootRef = useRef<HTMLDivElement | null>(null)
  const isMainScrolledRef = useRef(isMainScrolled)
  isMainScrolledRef.current = isMainScrolled
  const mainScrollCollapsedRef = useRef(false)
  const suppressScrollSpyForTabScrollRef = useRef(false)
  const programmaticScrollGenerationRef = useRef(0)
  const tabScrollPinnedSectionRef = useRef<{ scrollTop: number | null } | null>(null)
  const stickyRoIgnoreUntilRef = useRef(0)
  const prevIsMainScrolledForStickyRef = useRef<boolean | null>(null)

  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const getSectionElements = useCallback(() => {
    const scrollEl = getScrollEl()
    // 임베디드 모드인데 컨테이너가 아직 준비되지 않았으면 빈 결과를 반환 (페이지 전역 DOM으로 폴백 금지)
    if (isEmbedded && !scrollEl) return sectionsRef.current.map(() => null)
    const root: ParentNode = scrollEl ?? document
    return sectionsRef.current.map((s) => {
      // ID에는 CSS 선택자 특수문자가 포함될 수 있어 안전한 속성 선택자로 조회
      const escaped = (s.id ?? '').replaceAll('"', '\\"')
      return root.querySelector(`[id="${escaped}"]`) as HTMLElement | null
    })
  }, [getScrollEl, isEmbedded])

  const syncMainHeaderCollapseState = useCallback((scrollEl: HTMLElement) => {
    const next = scrollEl.scrollTop > 0
    if (next !== mainScrollCollapsedRef.current) {
      mainScrollCollapsedRef.current = next
      setIsMainScrolled(next)
    }
  }, [])

  const syncStickyHeightsFromMeasuredEl = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    if (h < 1) return
    const nav = NEXT_GEN_MI_DETAIL_NAV_ROW_PX
    const next = isMainScrolledRef.current
      ? { expanded: Math.round(h + nav), collapsed: Math.round(h) }
      : { expanded: Math.round(h), collapsed: Math.round(h - nav) }
    setStickyHeightsPx((prev) => {
      if (
        Math.abs(prev.expanded - next.expanded) < STICKY_HEIGHT_MEASURE_EPS_PX &&
        Math.abs(prev.collapsed - next.collapsed) < STICKY_HEIGHT_MEASURE_EPS_PX
      ) {
        return prev
      }
      return next
    })
  }, [])

  const getStickySectionAlignY = useCallback(
    (scrollEl: HTMLElement) => {
      const sticky = scrollEl.querySelector('[data-sticky-header]')
      if (sticky) return sticky.getBoundingClientRect().bottom

      const containerRect = scrollEl.getBoundingClientRect()
      // 임베디드(팝업): 페이지 전역 헤더가 없으므로 컨테이너 상단을 정렬 기준으로 사용
      if (isEmbedded) return containerRect.top

      const collapsed = scrollEl.scrollTop > 0
      const stickyHeight = collapsed ? stickyHeightsPx.collapsed : stickyHeightsPx.expanded
      const headerTop = collapsed ? MAIN_HEADER_TOP_COLLAPSED_PX : MAIN_HEADER_TOP_EXPANDED_PX
      return containerRect.top + headerTop + stickyHeight
    },
    [isEmbedded, stickyHeightsPx.collapsed, stickyHeightsPx.expanded],
  )

  const applyScrollSpyActiveSection = useCallback(() => {
    if (suppressScrollSpyForTabScrollRef.current) return
    if (tabScrollPinnedSectionRef.current) return
    const scrollEl = getScrollEl()
    if (!scrollEl) return

    const stickyLine = getStickySectionAlignY(scrollEl)
    const scrollRect = scrollEl.getBoundingClientRect()
    const visibleBottom = scrollRect.bottom
    const els = getSectionElements()

    let next = activeSection
    let bestVisibleTop = Number.POSITIVE_INFINITY
    let closestUpcomingTop = Number.POSITIVE_INFINITY

    els.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const visibleTop = Math.max(rect.top, stickyLine)
      const visibleHeight = Math.min(rect.bottom, visibleBottom) - visibleTop

      if (visibleHeight > 0) {
        if (visibleTop < bestVisibleTop) {
          bestVisibleTop = visibleTop
          next = i
        }
        return
      }

      const distanceFromStickyLine = rect.top - stickyLine
      if (bestVisibleTop === Number.POSITIVE_INFINITY && distanceFromStickyLine >= 0 && distanceFromStickyLine < closestUpcomingTop) {
        closestUpcomingTop = distanceFromStickyLine
        next = i
      }
    })
    setActiveSection((prev) => (prev === next ? prev : next))
  }, [activeSection, getScrollEl, getSectionElements, getStickySectionAlignY])

  const scrollSectionIntoView = useCallback(
    (index: number) => {
      const els = getSectionElements()
      const el = els[index]
      const scrollEl = getScrollEl()
      if (!el || !scrollEl) return

      tabScrollPinnedSectionRef.current = { scrollTop: null }

      const computeScrollTopToAlignSection = () => {
        if (index === 0) {
          return 0
        }
        const stickyBottom = getStickySectionAlignY(scrollEl)
        const elRect = el.getBoundingClientRect()
        return Math.max(0, scrollEl.scrollTop + elRect.top - stickyBottom)
      }

      const scrollTarget = computeScrollTopToAlignSection()
      const beforeTop = scrollEl.scrollTop

      if (Math.abs(scrollTarget - beforeTop) < 8) {
        syncMainHeaderCollapseState(scrollEl)
        tabScrollPinnedSectionRef.current = { scrollTop: scrollEl.scrollTop }
        setActiveSection(index)
        requestAnimationFrame(() => {
          scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }))
        })
        return
      }

      programmaticScrollGenerationRef.current += 1
      const generation = programmaticScrollGenerationRef.current
      suppressScrollSpyForTabScrollRef.current = true

      const finishProgrammaticScroll = () => {
        if (generation === programmaticScrollGenerationRef.current) {
          scrollEl.scrollTop = computeScrollTopToAlignSection()
          syncMainHeaderCollapseState(scrollEl)
          suppressScrollSpyForTabScrollRef.current = false
          tabScrollPinnedSectionRef.current = { scrollTop: scrollEl.scrollTop }
          setActiveSection(index)
        }
      }

      let finished = false
      const fallbackTimer = {
        id: undefined as ReturnType<typeof globalThis.setTimeout> | undefined,
      }
      const settleOnce = () => {
        if (finished) return
        finished = true
        scrollEl.removeEventListener('scrollend', settleOnce)
        if (fallbackTimer.id !== undefined) globalThis.clearTimeout(fallbackTimer.id)
        finishProgrammaticScroll()
      }

      scrollEl.addEventListener('scrollend', settleOnce, { passive: true })
      fallbackTimer.id = globalThis.setTimeout(settleOnce, 4000)
      scrollEl.scrollTo({ top: scrollTarget, behavior: 'smooth' })
    },
    [getScrollEl, getSectionElements, getStickySectionAlignY, syncMainHeaderCollapseState],
  )

  const handleTabChange = useCallback(
    (_: SyntheticEvent, index: number) => {
      setActiveSection(index)
      scrollSectionIntoView(index)
    },
    [scrollSectionIntoView],
  )

  const handleTabClick = useCallback(
    (index: number) => {
      if (activeSection === index) {
        scrollSectionIntoView(index)
      }
    },
    [activeSection, scrollSectionIntoView],
  )

  useEffect(() => {
    const scrollEl = getScrollEl()
    if (scrollEl) {
      scrollEl.scrollTop = 0
    }
  }, [getScrollEl])

  useEffect(() => {
    const scrollEl = getScrollEl()
    if (!scrollEl) return undefined
    const onScroll = () => {
      const y = scrollEl.scrollTop
      const pinnedSection = tabScrollPinnedSectionRef.current
      if (pinnedSection && pinnedSection.scrollTop !== null && Math.abs(y - pinnedSection.scrollTop) > 2) {
        tabScrollPinnedSectionRef.current = null
      }
      const next = y > 0
      if (next !== mainScrollCollapsedRef.current) {
        mainScrollCollapsedRef.current = next
        setIsMainScrolled(next)
      }
      applyScrollSpyActiveSection()
    }
    onScroll()
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [applyScrollSpyActiveSection, getScrollEl])

  useEffect(() => {
    applyScrollSpyActiveSection()
  }, [applyScrollSpyActiveSection, isMainScrolled])

  useLayoutEffect(() => {
    if (prevIsMainScrolledForStickyRef.current === null) {
      prevIsMainScrolledForStickyRef.current = isMainScrolled
      return
    }
    if (prevIsMainScrolledForStickyRef.current === isMainScrolled) return
    prevIsMainScrolledForStickyRef.current = isMainScrolled
    stickyRoIgnoreUntilRef.current = performance.now() + NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS
  }, [isMainScrolled])

  useLayoutEffect(() => {
    syncStickyHeightsFromMeasuredEl()

    let ro: ResizeObserver | null = null
    let cancelled = false
    let raf = 0

    const startObserver = () => {
      if (cancelled) return
      const el = rootRef.current
      if (!el) return
      syncStickyHeightsFromMeasuredEl()
      ro = new ResizeObserver(() => {
        if (performance.now() < stickyRoIgnoreUntilRef.current) return
        syncStickyHeightsFromMeasuredEl()
      })
      ro.observe(el)
    }

    raf = requestAnimationFrame(startObserver)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [syncStickyHeightsFromMeasuredEl, titleSlot])

  useLayoutEffect(() => {
    const t = globalThis.setTimeout(syncStickyHeightsFromMeasuredEl, NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS)
    return () => globalThis.clearTimeout(t)
  }, [isMainScrolled, syncStickyHeightsFromMeasuredEl])

  useLayoutEffect(() => {
    if (isEmbedded) return
    patchStickyHeaderOptions({ stickyHeightsPx })
  }, [isEmbedded, patchStickyHeaderOptions, stickyHeightsPx])

  return (
    <Box
      ref={rootRef}
      {...(isEmbedded && { 'data-sticky-header': true })}
      maxWidth="1380px"
      margin="auto"
      px="12px"
      width="100%"
      sx={{
        ...(isEmbedded && {
          position: 'sticky',
          top: embeddedStickyTop,
          zIndex: 2,
          bgcolor: 'commonColor.White',
        }),
      }}
    >
      <Stack bgcolor="commonColor.White">
        {!hideBackButton && (
          <Collapse
            in={!isMainScrolled}
            appear={false}
            timeout={{
              appear: NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS,
              enter: NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS,
              exit: NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS,
            }}
            easing={{ enter: NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_EASING, exit: NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_EASING }}
            sx={{
              transition: `height ${NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_MS}ms ${NEXT_GEN_MI_DETAIL_LAYOUT_TRANSITION_EASING}`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" py="8px">
              <Box flex={1} minWidth={0} display="flex" alignItems="flex-end" minHeight="36px">
                <MIBaseButton
                  variant="outlined"
                  prefix={<KeyboardBackspaceIcon sx={{ fontSize: 20 }} />}
                  onClick={onBack}
                  enableHoverBackground
                  sx={{
                    height: '36px',
                  }}
                >
                  {backLabel}
                </MIBaseButton>
              </Box>
            </Stack>
          </Collapse>
        )}

        {titleSlot}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          sx={{
            position: 'relative',
            mt: '4px',
            bgcolor: 'commonColor.White',
            overflow: 'visible',
            boxShadow: isMainScrolled ? NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
            clipPath: NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_TOP,
            transition: `box-shadow ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '1px',
              bgcolor: '#DEE2E6',
              pointerEvents: 'none',
              zIndex: 1,
            },
          }}
        >
          <Tabs
            value={activeSection}
            onChange={handleTabChange}
            slotProps={{
              scroller: {
                style: { overflow: 'visible' },
              },
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              borderBottom: 'none',
              position: 'relative',
              zIndex: 3,
              overflow: 'visible',
              '& .MuiTabs-flexContainer': { alignItems: 'flex-end' },
              '.MuiTabs-indicator': {
                backgroundColor: 'commonColor.Black',
                height: '2px',
                minHeight: '2px',
                bottom: 0,
                zIndex: 2,
              },
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: 1.4,
                color: 'contentText.Black',
                minHeight: 62,
                padding: '20px',
                textTransform: 'none',
                '&.Mui-selected': { color: 'commonColor.Black', fontWeight: 600 },
              },
            }}
          >
            {sections.map((section, index) => (
              <Tab key={section.id} label={section.label} disableRipple onClick={() => handleTabClick(index)} />
            ))}
          </Tabs>

          {rightAction}
        </Stack>
      </Stack>
    </Box>
  )
}

export default NextGenMIDetailHeader
