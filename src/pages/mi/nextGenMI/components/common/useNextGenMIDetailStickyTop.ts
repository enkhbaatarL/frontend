import { useLayoutEffect, useRef, useState } from 'react'

import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import { NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX } from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import { NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID } from '@/pages/mi/nextGenMI/nextGenMIScroll'

interface UseNextGenMIDetailStickyTopOptions {
  gapPx?: number
  fallbackTopPx?: number
  scrollContainer?: HTMLElement | null
}

const DEFAULT_STICKY_GAP_PX = 20
const DEFAULT_STICKY_TOP_FALLBACK_PX = NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX.collapsed + 80
const MAIN_HEADER_STICKY_TOP_EXPANDED_PX = 106
const MAIN_HEADER_STICKY_TOP_COLLAPSED_PX = 70

const getDetailStickyHeader = (scrollContainer?: HTMLElement | null) => {
  if (scrollContainer !== undefined) {
    return scrollContainer?.querySelector<HTMLElement>('[data-sticky-header]') ?? null
  }

  return document.querySelector<HTMLElement>('.main-header [data-sticky-header]')
}

const useNextGenMIDetailStickyTop = ({
  gapPx = DEFAULT_STICKY_GAP_PX,
  fallbackTopPx = DEFAULT_STICKY_TOP_FALLBACK_PX,
  scrollContainer,
}: UseNextGenMIDetailStickyTopOptions = {}) => {
  const { stickyHeaderOptions } = useStickyHeader()
  const [stickyTopPx, setStickyTopPx] = useState(fallbackTopPx)
  const observedHeaderRef = useRef<HTMLElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const stickyHeightsPx = stickyHeaderOptions.stickyHeightsPx

  useLayoutEffect(() => {
    let rafId = 0

    let measure = () => {
      rafId = 0
    }

    const scheduleMeasure = () => {
      if (rafId !== 0) return
      rafId = globalThis.requestAnimationFrame(measure)
    }

    const syncObservedHeader = (nextHeader: HTMLElement | null) => {
      if (observedHeaderRef.current === nextHeader) return

      observedHeaderRef.current?.removeEventListener('transitionend', scheduleMeasure)
      resizeObserverRef.current?.disconnect()
      observedHeaderRef.current = nextHeader

      if (!nextHeader) return

      resizeObserverRef.current = new ResizeObserver(scheduleMeasure)
      resizeObserverRef.current.observe(nextHeader)
      nextHeader.addEventListener('transitionend', scheduleMeasure)
    }

    measure = () => {
      rafId = 0

      const scrollEl = scrollContainer ?? document.getElementById(NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID)
      const stickyHeader = getDetailStickyHeader(scrollContainer)
      syncObservedHeader(stickyHeader)

      if (!scrollEl && !stickyHeader) {
        setStickyTopPx((current) => (current === fallbackTopPx ? current : fallbackTopPx))
        return
      }

      const scrollContainerTop = scrollEl?.getBoundingClientRect().top ?? 0
      const stickyBottom =
        scrollContainer === undefined && scrollEl && stickyHeightsPx
          ? scrollEl.scrollTop > 0
            ? MAIN_HEADER_STICKY_TOP_COLLAPSED_PX + stickyHeightsPx.collapsed
            : MAIN_HEADER_STICKY_TOP_EXPANDED_PX + stickyHeightsPx.expanded
          : (stickyHeader?.getBoundingClientRect().bottom ?? scrollContainerTop)
      const nextTop = Math.max(0, Math.round(Math.max(scrollContainerTop, stickyBottom) - scrollContainerTop + gapPx))

      setStickyTopPx((current) => (Math.abs(current - nextTop) < 1 ? current : nextTop))
    }

    const scrollEl = scrollContainer ?? document.getElementById(NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID)

    measure()
    rafId = globalThis.requestAnimationFrame(measure)
    scrollEl?.addEventListener('scroll', scheduleMeasure, { passive: true })
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      scrollEl?.removeEventListener('scroll', scheduleMeasure)
      globalThis.removeEventListener('resize', scheduleMeasure)
      observedHeaderRef.current?.removeEventListener('transitionend', scheduleMeasure)
      resizeObserverRef.current?.disconnect()
    }
  }, [fallbackTopPx, gapPx, scrollContainer, stickyHeightsPx])

  return stickyTopPx
}

export default useNextGenMIDetailStickyTop
