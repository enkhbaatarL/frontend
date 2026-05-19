import { Box, SxProps, Theme } from '@mui/material'
import { useRef, useEffect, useState, useCallback, ReactNode, CSSProperties, MouseEvent, forwardRef, useMemo } from 'react'

import { useScrollThumbRegistry } from '@/hooks/useScrollThumbRegistry'
import {
  WORKBENCH_EDGE_SHADOW_TRANSITION_EASING,
  WORKBENCH_EDGE_SHADOW_TRANSITION_MS,
  WORKBENCH_SCROLL_EDGE_CLIP_PATH_BOTTOM,
  WORKBENCH_SCROLL_EDGE_CLIP_PATH_TOP,
  WORKBENCH_SCROLL_EDGE_FADE_BOTTOM_BG,
  WORKBENCH_SCROLL_EDGE_FADE_HEIGHT_PX,
  WORKBENCH_SCROLL_EDGE_FADE_TOP_BG,
  WORKBENCH_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
  WORKBENCH_SCROLL_EDGE_SHADOW_BOTTOM,
  WORKBENCH_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'

const SCROLL_EDGE_FADE_TRANSITION = `opacity ${WORKBENCH_EDGE_SHADOW_TRANSITION_MS}ms ${WORKBENCH_EDGE_SHADOW_TRANSITION_EASING}`

const scrollEdgeOverlaySx = {
  pointerEvents: 'none',
  zIndex: 6,
  overflow: 'visible',
  WebkitMaskImage: WORKBENCH_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
  maskImage: WORKBENCH_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
} as const

const SCROLL_EDGE_EPSILON_PX = 2

interface ScrollWrapperProps {
  children: ReactNode
  className?: string
  id?: string
  offsetTop?: number
  offsetBottom?: number
  maxHeight?: number | string
  height?: number | string
  scrollToBottomTrigger?: number | string | boolean
  scrollToBottomOffset?: number | string | boolean
  sx?: SxProps<Theme>
  styScroll?: CSSProperties
  onScrollableChange?: (isScrollable: boolean) => void
  scrollbarGap?: number
  thumbInsetTop?: number
  thumbInsetBottom?: number
  thumbWidth?: number
  showScrollbarOnHover?: boolean
  showScrollEdgeShadow?: boolean
  contentKey?: number | string
}

const SCROLL_TRACK_WIDTH_PX = 12
const DEFAULT_THUMB_WIDTH_PX = 4

const ScrollWrapper = forwardRef<HTMLDivElement, ScrollWrapperProps>(
  (
    {
      children,
      className,
      id,
      offsetTop = 0,
      offsetBottom = 0,
      maxHeight = 268,
      height,
      scrollToBottomTrigger,
      scrollToBottomOffset,
      sx,
      styScroll,
      onScrollableChange,
      scrollbarGap = 0,
      thumbInsetTop,
      thumbInsetBottom,
      thumbWidth = DEFAULT_THUMB_WIDTH_PX,
      showScrollbarOnHover = false,
      showScrollEdgeShadow = false,
      contentKey,
    },
    ref,
  ) => {
    const scrollWrapperId = useMemo(() => id ?? `scroll-wrapper-${Math.random().toString(36).substring(2, 11)}`, [id])
    const thumbTopInset = thumbInsetTop ?? offsetTop
    const thumbBottomInset = thumbInsetBottom ?? offsetBottom
    const thumbRightPx = Math.max(0, (SCROLL_TRACK_WIDTH_PX - thumbWidth) / 2)

    const containerRef = useRef<HTMLDivElement>(null)
    const childrenRef = useRef<HTMLDivElement>(null)

    const { thumbRef, registerThumb, unregisterThumb } = useScrollThumbRegistry()
    const [thumbHeight, setThumbHeight] = useState(0)
    const [isScrollable, setIsScrollable] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [canScrollUp, setCanScrollUp] = useState(false)
    const [canScrollDown, setCanScrollDown] = useState(false)
    const [startY, setStartY] = useState(0)
    const [startScrollTop, setStartScrollTop] = useState(0)
    const syncThumbRafRef = useRef<number | undefined>(undefined)
    const prevContentKeyRef = useRef<number | string | undefined>(undefined)

    useEffect(() => {
      registerThumb(scrollWrapperId)

      return () => {
        unregisterThumb(scrollWrapperId)
      }
    }, [scrollWrapperId, registerThumb, unregisterThumb])

    const syncThumb = useCallback(() => {
      const container = containerRef.current

      if (!container) return

      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const scrollTop = container.scrollTop

      const scrollable = scrollHeight > clientHeight + SCROLL_EDGE_EPSILON_PX

      setIsScrollable(scrollable)
      onScrollableChange?.(scrollable)

      const maxScrollTop = Math.max(0, scrollHeight - clientHeight)
      setCanScrollUp(scrollable && scrollTop > SCROLL_EDGE_EPSILON_PX)
      setCanScrollDown(scrollable && scrollTop + clientHeight < scrollHeight - SCROLL_EDGE_EPSILON_PX)

      if (!scrollable) {
        setThumbHeight(0)
        setCanScrollUp(false)
        setCanScrollDown(false)

        return
      }

      const availableHeight = clientHeight - thumbTopInset - thumbBottomInset
      const nextThumbHeight = (clientHeight / scrollHeight) * availableHeight

      setThumbHeight(nextThumbHeight)

      const thumb = thumbRef.current

      if (thumb) {
        const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
        const maxThumbTop = availableHeight - nextThumbHeight
        const thumbTop = thumbTopInset + scrollRatio * maxThumbTop
        thumb.style.top = `${thumbTop}px`
      }
    }, [thumbTopInset, thumbBottomInset, thumbRef, onScrollableChange])

    const scheduleSyncThumb = useCallback(() => {
      if (syncThumbRafRef.current) cancelAnimationFrame(syncThumbRafRef.current)
      syncThumbRafRef.current = requestAnimationFrame(() => {
        syncThumbRafRef.current = requestAnimationFrame(() => {
          syncThumb()
        })
      })
    }, [syncThumb])

    useEffect(
      () => () => {
        if (syncThumbRafRef.current) cancelAnimationFrame(syncThumbRafRef.current)
      },
      [],
    )

    // Handle mouse down on the thumb
    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current

      if (!container) return

      setIsDragging(true)
      setStartY(e.clientY)
      setStartScrollTop(container.scrollTop)
    }, [])

    // Handle mouse move while dragging
    const handleMouseMove = useCallback(
      (e: globalThis.MouseEvent) => {
        if (!isDragging) return

        const container = containerRef.current

        if (!container) return

        const deltaY = e.clientY - startY
        const scrollHeight = container.scrollHeight
        const clientHeight = container.clientHeight
        const availableHeight = clientHeight - thumbTopInset - thumbBottomInset
        const currentThumbHeight = (clientHeight / scrollHeight) * availableHeight
        const maxScrollTop = scrollHeight - clientHeight
        const maxThumbTravel = Math.max(0, availableHeight - currentThumbHeight)

        if (maxThumbTravel <= 0) return

        const newScrollTop = startScrollTop + deltaY * (maxScrollTop / maxThumbTravel)

        container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop))
      },
      [isDragging, startY, startScrollTop, thumbTopInset, thumbBottomInset],
    )

    // Handle mouse up to stop dragging
    const handleMouseUp = useCallback(() => {
      setIsDragging(false)
    }, [])

    // Add event listeners for dragging
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        // Add a class to prevent text selection while dragging
        document.body.classList.add('no-select')
      } else {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.classList.remove('no-select')
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.classList.remove('no-select')
      }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // Set up scroll event listeners
    useEffect(() => {
      const container = containerRef.current
      const childrenElement = childrenRef.current

      if (!container || !childrenElement) return () => {}

      scheduleSyncThumb()

      container.addEventListener('scroll', syncThumb)
      window.addEventListener('resize', scheduleSyncThumb)

      const resizeObserver = new ResizeObserver(() => {
        scheduleSyncThumb()
      })

      resizeObserver.observe(childrenElement)
      resizeObserver.observe(container)

      return () => {
        container.removeEventListener('scroll', syncThumb)
        window.removeEventListener('resize', scheduleSyncThumb)
        resizeObserver.disconnect()
      }
    }, [children, syncThumb, scheduleSyncThumb, contentKey])

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const prevKey = prevContentKeyRef.current
      prevContentKeyRef.current = contentKey

      if (prevKey === 'loading' || prevKey === undefined) {
        container.scrollTop = 0
      }

      scheduleSyncThumb()
    }, [contentKey, scheduleSyncThumb])

    // Handle scrollToBottomTrigger
    useEffect(() => {
      const container = containerRef.current

      if (!container) return

      if (scrollToBottomTrigger) container.scrollTop = container.scrollHeight
    }, [scrollToBottomTrigger])

    // Handle scrollToBottomOffset
    useEffect(() => {
      const container = containerRef.current

      if (!container) return

      const newScrollTop = container.scrollTop + 80

      if (scrollToBottomOffset) container.scrollTop = Math.min(newScrollTop, container.scrollHeight - container.clientHeight)
    }, [scrollToBottomOffset])

    return (
      <Box
        sx={[
          {
            position: 'relative',
            maxHeight: height ?? maxHeight,
            ...(height !== undefined ? { height, minHeight: 0 } : {}),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
            padding: `${offsetTop}px 0 ${offsetBottom}px 0`,
            ...(showScrollbarOnHover
              ? {
                '& .scroll-wrapper-thumb, & .scroll-wrapper-track': {
                  opacity: isDragging ? 1 : 0,
                  transition: 'opacity 150ms ease',
                  pointerEvents: isDragging ? 'auto' : 'none',
                },
                ...(!isDragging
                  ? {
                    '&:hover .scroll-wrapper-thumb, &:hover .scroll-wrapper-track': {
                      opacity: 1,
                      pointerEvents: 'auto',
                    },
                  }
                  : {}),
              }
              : {}),
          }}
        >
          <Box
            id={scrollWrapperId}
            className={`disabledScroll ${className ?? ''}`}
            ref={(node: HTMLDivElement | null) => {
              containerRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            sx={{
              ...(height !== undefined ? { height: '100%', maxHeight: '100%', minHeight: 0, boxSizing: 'border-box' } : { maxHeight }),
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'none',
              position: 'relative',
              zIndex: 1,
              paddingRight: isScrollable ? `${scrollbarGap}px` : '0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div ref={childrenRef}>{children}</div>
          </Box>
          {isScrollable && (
            <Box
              ref={thumbRef}
              onMouseDown={handleMouseDown}
              data-scroll-id={scrollWrapperId}
              sx={{
                position: 'absolute',
                top: `${thumbTopInset}px`,
                right: thumbRightPx,
                width: thumbWidth,
                height: `${thumbHeight}px`,
                backgroundColor: '#CED4DA',
                borderRadius: '10px',
                transition: isDragging ? 'none' : 'top 0.1s, opacity 150ms ease',
                cursor: 'pointer',
                userSelect: 'none',
                zIndex: 2,
                ...styScroll,
                ':hover': {
                  ...styScroll,
                  backgroundColor: '#ADB5BD',
                },
              }}
              className="scroll-wrapper-thumb"
            />
          )}
          {isScrollable && (
            <button
              type="button"
              className="scroll-wrapper-track"
              style={{
                position: 'absolute',
                top: `${thumbTopInset}px`,
                right: 0,
                width: SCROLL_TRACK_WIDTH_PX,
                bottom: `${thumbBottomInset}px`,
                cursor: 'pointer',
                zIndex: 1,
                border: 'none',
                background: 'transparent',
                padding: 0,
              }}
              onClick={(e) => {
                const container = containerRef.current

                if (!container) return

                const rect = e.currentTarget.getBoundingClientRect()
                const clickRatio = (e.clientY - rect.top) / rect.height
                const scrollHeight = container.scrollHeight
                const clientHeight = container.clientHeight

                container.scrollTop = (scrollHeight - clientHeight) * clickRatio
              }}
            />
          )}
        </Box>
        {showScrollEdgeShadow && (
          <>
            <Box
              className="scroll-wrapper-edge-shadow scroll-wrapper-edge-shadow-top"
              aria-hidden
              sx={{
                position: 'absolute',
                top: `${offsetTop}px`,
                left: 0,
                right: 0,
                height: WORKBENCH_SCROLL_EDGE_FADE_HEIGHT_PX,
                opacity: canScrollUp ? 1 : 0,
                transition: SCROLL_EDGE_FADE_TRANSITION,
                ...scrollEdgeOverlaySx,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: WORKBENCH_SCROLL_EDGE_FADE_TOP_BG,
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  boxShadow: WORKBENCH_SCROLL_EDGE_SHADOW_TOP,
                  clipPath: WORKBENCH_SCROLL_EDGE_CLIP_PATH_TOP,
                }}
              />
            </Box>
            <Box
              className="scroll-wrapper-edge-shadow scroll-wrapper-edge-shadow-bottom"
              aria-hidden
              sx={{
                position: 'absolute',
                bottom: `${offsetBottom}px`,
                left: 0,
                right: 0,
                height: WORKBENCH_SCROLL_EDGE_FADE_HEIGHT_PX,
                opacity: canScrollDown ? 1 : 0,
                transition: SCROLL_EDGE_FADE_TRANSITION,
                ...scrollEdgeOverlaySx,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: WORKBENCH_SCROLL_EDGE_FADE_BOTTOM_BG,
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  boxShadow: WORKBENCH_SCROLL_EDGE_SHADOW_BOTTOM,
                  clipPath: WORKBENCH_SCROLL_EDGE_CLIP_PATH_BOTTOM,
                }}
              />
            </Box>
          </>
        )}
      </Box>
    )
  },
)

ScrollWrapper.displayName = 'ScrollWrapper'

export default ScrollWrapper
