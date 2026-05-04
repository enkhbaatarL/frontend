import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import { Box, Collapse, Stack, Tab, Tabs } from '@mui/material'
import { type ReactNode, type SyntheticEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'

const WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS = 220
const WORKBENCH_DETAIL_LAYOUT_TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const WORKBENCH_DETAIL_NAV_ROW_PX = 52
const WORKBENCH_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX = 264
const STICKY_HEIGHT_MEASURE_EPS_PX = 2

const MAIN_HEADER_TOP_COLLAPSED_PX = 70
const MAIN_HEADER_TOP_EXPANDED_PX = 106

export const WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX = {
  expanded: WORKBENCH_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX,
  collapsed: WORKBENCH_DETAIL_STICKY_HEIGHT_INITIAL_EXPANDED_PX - WORKBENCH_DETAIL_NAV_ROW_PX,
}

export const WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED = '0 8px 16px -10px rgba(0, 0, 0, 0.1)'

export interface WorkbenchDetailHeaderSection {
  id: string
  label: string
}

interface ScenarioWorkbenchDetailHeaderProps {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
  sections: WorkbenchDetailHeaderSection[]
  scrollContainerId?: string
}

const ScenarioWorkbenchDetailHeader = ({
  backLabel,
  onBack,
  titleSlot,
  rightAction,
  sections,
  scrollContainerId = 'main-scroll-wrapper',
}: ScenarioWorkbenchDetailHeaderProps) => {
  const { patchStickyHeaderOptions } = useStickyHeader()

  const [activeSection, setActiveSection] = useState(0)
  const [isMainScrolled, setIsMainScrolled] = useState(false)
  const [stickyHeightsPx, setStickyHeightsPx] = useState(() => ({ ...WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX }))

  const rootRef = useRef<HTMLDivElement | null>(null)
  const isMainScrolledRef = useRef(isMainScrolled)
  isMainScrolledRef.current = isMainScrolled
  const mainScrollCollapsedRef = useRef(false)
  const suppressScrollSpyForTabScrollRef = useRef(false)
  const programmaticScrollGenerationRef = useRef(0)
  const stickyRoIgnoreUntilRef = useRef(0)
  const prevIsMainScrolledForStickyRef = useRef<boolean | null>(null)

  const sectionsRef = useRef(sections)
  sectionsRef.current = sections

  const getSectionElements = useCallback(() => sectionsRef.current.map((s) => document.getElementById(s.id)), [])

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
    const nav = WORKBENCH_DETAIL_NAV_ROW_PX
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

      const collapsed = scrollEl.scrollTop > 0
      const containerRect = scrollEl.getBoundingClientRect()
      const stickyHeight = collapsed ? stickyHeightsPx.collapsed : stickyHeightsPx.expanded
      const headerTop = collapsed ? MAIN_HEADER_TOP_COLLAPSED_PX : MAIN_HEADER_TOP_EXPANDED_PX
      return containerRect.top + headerTop + stickyHeight
    },
    [stickyHeightsPx.collapsed, stickyHeightsPx.expanded],
  )

  const applyScrollSpyActiveSection = useCallback(() => {
    if (suppressScrollSpyForTabScrollRef.current) return
    const scrollEl = document.getElementById(scrollContainerId)
    if (!scrollEl) return

    const stickyLine = getStickySectionAlignY(scrollEl)
    const els = getSectionElements()
    const lastIdx = els.length - 1
    const lastEl = lastIdx >= 0 ? els[lastIdx] : null
    const nearDocEnd = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <= 32

    let next = 0
    els.forEach((el, i) => {
      if (!el) return
      if (el.getBoundingClientRect().top <= stickyLine + 0.75) next = i
    })
    if (lastEl && nearDocEnd && lastEl.getBoundingClientRect().top > stickyLine + 0.75) {
      next = lastIdx
    }
    setActiveSection((prev) => (prev === next ? prev : next))
  }, [getSectionElements, getStickySectionAlignY, scrollContainerId])

  const scrollSectionIntoView = useCallback(
    (index: number) => {
      const els = getSectionElements()
      const el = els[index]
      const scrollEl = document.getElementById(scrollContainerId)
      if (!el || !scrollEl) return

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
        requestAnimationFrame(() => {
          scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }))
          applyScrollSpyActiveSection()
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
          setActiveSection(index)
          requestAnimationFrame(() => applyScrollSpyActiveSection())
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
    [applyScrollSpyActiveSection, getSectionElements, getStickySectionAlignY, scrollContainerId, syncMainHeaderCollapseState],
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
    const scrollEl = document.getElementById(scrollContainerId)
    if (scrollEl) {
      scrollEl.scrollTop = 0
    }
  }, [scrollContainerId])

  useEffect(() => {
    const scrollEl = document.getElementById(scrollContainerId)
    if (!scrollEl) return undefined
    const onScroll = () => {
      const y = scrollEl.scrollTop
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
  }, [applyScrollSpyActiveSection, scrollContainerId])

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
    stickyRoIgnoreUntilRef.current = performance.now() + WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS
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
    const t = globalThis.setTimeout(syncStickyHeightsFromMeasuredEl, WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS)
    return () => globalThis.clearTimeout(t)
  }, [isMainScrolled, syncStickyHeightsFromMeasuredEl])

  useLayoutEffect(() => {
    patchStickyHeaderOptions({ stickyHeightsPx })
  }, [patchStickyHeaderOptions, stickyHeightsPx])

  return (
    <Box ref={rootRef} maxWidth="1380px" margin="auto" px="12px" width="100%" sx={{ userSelect: 'none' }}>
      <Stack bgcolor="commonColor.White">
        <Collapse
          in={!isMainScrolled}
          appear={false}
          timeout={{
            appear: WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS,
            enter: WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS,
            exit: WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS,
          }}
          easing={{ enter: WORKBENCH_DETAIL_LAYOUT_TRANSITION_EASING, exit: WORKBENCH_DETAIL_LAYOUT_TRANSITION_EASING }}
          sx={{
            transition: `height ${WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS}ms ${WORKBENCH_DETAIL_LAYOUT_TRANSITION_EASING}`,
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
            boxShadow: isMainScrolled ? WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
            transition: `box-shadow ${WORKBENCH_DETAIL_LAYOUT_TRANSITION_MS}ms ${WORKBENCH_DETAIL_LAYOUT_TRANSITION_EASING}`,
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

export default ScenarioWorkbenchDetailHeader
