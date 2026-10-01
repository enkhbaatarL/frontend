import { Box, SxProps, Theme } from '@mui/material'
import { useRef, useEffect, useState, useCallback, ReactNode, CSSProperties, MouseEvent, forwardRef, useMemo } from 'react'

import { useScrollThumbRegistry } from '@/hooks/useScrollThumbRegistry'
import {
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
  NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_TOP,
  NEXT_GEN_MI_SCROLL_EDGE_FADE_BOTTOM_BG,
  NEXT_GEN_MI_SCROLL_EDGE_FADE_HEIGHT_PX,
  NEXT_GEN_MI_SCROLL_EDGE_FADE_TOP_BG,
  NEXT_GEN_MI_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import { getRandomNumber } from '@/utils/random'
import { chainBoundaryWheelScroll } from '@/utils/scrollChain'

const SCROLL_EDGE_FADE_TRANSITION = `opacity ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`

const scrollEdgeOverlaySx = {
  pointerEvents: 'none',
  zIndex: 6,
  overflow: 'visible',
  WebkitMaskImage: NEXT_GEN_MI_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
  maskImage: NEXT_GEN_MI_SCROLL_EDGE_HORIZONTAL_MASK_IMAGE,
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
  thumbMinHeight?: number
  thumbMaxHeight?: number
  overscrollBehavior?: CSSProperties['overscrollBehavior']
  overflowX?: CSSProperties['overflowX']
  showHorizontalScrollbar?: boolean
  horizontalScrollbarInset?: number
  scrollbarOutside?: boolean
  scrollbarOutsideGutter?: number
  scrollbarOutsideRightGutter?: number
  scrollbarOutsideBottomGutter?: number
  scrollbarOffsetRight?: number
  showScrollbarOnHover?: boolean
  reserveScrollbarGap?: boolean
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
      thumbMinHeight,
      thumbMaxHeight,
      overscrollBehavior = 'none',
      overflowX = 'hidden',
      showHorizontalScrollbar = false,
      horizontalScrollbarInset = 0,
      scrollbarOutside = false,
      scrollbarOutsideGutter = SCROLL_TRACK_WIDTH_PX,
      scrollbarOutsideRightGutter,
      scrollbarOutsideBottomGutter,
      scrollbarOffsetRight = 0,
      showScrollbarOnHover = false,
      reserveScrollbarGap = false,
      showScrollEdgeShadow = false,
      contentKey,
    },
    ref,
  ) => {
    const scrollWrapperId = useMemo(() => id ?? `scroll-wrapper-${getRandomNumber().toString(36).substring(2, 11)}`, [id])
    const thumbTopInset = thumbInsetTop ?? offsetTop
    const thumbBottomInset = thumbInsetBottom ?? offsetBottom
    const thumbRightPx = Math.max(0, (SCROLL_TRACK_WIDTH_PX - thumbWidth) / 2)
    const horizontalThumbHeight = styScroll?.width ?? thumbWidth
    const scrollbarOutsideRightGutterPx = scrollbarOutsideRightGutter ?? scrollbarOutsideGutter
    const scrollbarOutsideBottomGutterPx = scrollbarOutsideBottomGutter ?? scrollbarOutsideGutter
    const scrollbarOutsideRightTrackInset = (scrollbarOutsideRightGutterPx - SCROLL_TRACK_WIDTH_PX) / 2
    const scrollbarOutsideBottomTrackInset = (scrollbarOutsideBottomGutterPx - SCROLL_TRACK_WIDTH_PX) / 2
    const scrollbarOutsideRightTrackOffset = scrollbarOutsideRightGutterPx - scrollbarOutsideRightTrackInset
    const scrollbarOutsideBottomTrackOffset = scrollbarOutsideBottomGutterPx - scrollbarOutsideBottomTrackInset
    const horizontalThumbBottom =
      typeof horizontalThumbHeight === 'number'
        ? `${Math.max(0, (SCROLL_TRACK_WIDTH_PX - horizontalThumbHeight) / 2)}px`
        : `calc((${SCROLL_TRACK_WIDTH_PX}px - ${horizontalThumbHeight}) / 2)`

    const containerRef = useRef<HTMLDivElement>(null)
    const childrenRef = useRef<HTMLDivElement>(null)
    const horizontalThumbRef = useRef<HTMLDivElement>(null)

    const { thumbRef, registerThumb, unregisterThumb } = useScrollThumbRegistry()
    const [thumbHeight, setThumbHeight] = useState(0)
    const [isScrollable, setIsScrollable] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [horizontalThumbWidth, setHorizontalThumbWidth] = useState(0)
    const [isHorizontallyScrollable, setIsHorizontallyScrollable] = useState(false)
    const [isHorizontalDragging, setIsHorizontalDragging] = useState(false)
    const [canScrollUp, setCanScrollUp] = useState(false)
    const [canScrollDown, setCanScrollDown] = useState(false)
    const [startY, setStartY] = useState(0)
    const [startScrollTop, setStartScrollTop] = useState(0)
    const [startX, setStartX] = useState(0)
    const [startScrollLeft, setStartScrollLeft] = useState(0)
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
      const nextCanScrollUp = scrollable && scrollTop > SCROLL_EDGE_EPSILON_PX
      const nextCanScrollDown = scrollable && scrollTop + clientHeight < scrollHeight - SCROLL_EDGE_EPSILON_PX

      setCanScrollUp(nextCanScrollUp)
      setCanScrollDown(nextCanScrollDown)

      if (showHorizontalScrollbar) {
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        const scrollLeft = container.scrollLeft
        const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
        const horizontallyScrollable = maxScrollLeft > SCROLL_EDGE_EPSILON_PX

        setIsHorizontallyScrollable(horizontallyScrollable)

        if (!horizontallyScrollable) {
          setHorizontalThumbWidth(0)
        } else {
          const availableWidth = clientWidth - (scrollbarOutside || !scrollable ? 0 : SCROLL_TRACK_WIDTH_PX) - horizontalScrollbarInset * 2
          const nextHorizontalThumbWidth = (clientWidth / scrollWidth) * availableWidth
          setHorizontalThumbWidth(nextHorizontalThumbWidth)

          const horizontalThumb = horizontalThumbRef.current

          if (horizontalThumb) {
            const scrollRatio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0
            const maxThumbLeft = availableWidth - nextHorizontalThumbWidth
            horizontalThumb.style.left = `${horizontalScrollbarInset + scrollRatio * maxThumbLeft}px`
          }
        }
      }

      if (!scrollable) {
        setThumbHeight(0)
        setCanScrollUp(false)
        setCanScrollDown(false)

        return
      }

      const availableHeight = clientHeight - thumbTopInset - thumbBottomInset
      const rawThumbHeight = (clientHeight / scrollHeight) * availableHeight
      const nextThumbHeight = Math.min(Math.max(rawThumbHeight, thumbMinHeight ?? 0), thumbMaxHeight ?? availableHeight, availableHeight)

      setThumbHeight(nextThumbHeight)

      const thumb = thumbRef.current

      if (thumb) {
        const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
        const maxThumbTop = availableHeight - nextThumbHeight
        const thumbTop = thumbTopInset + scrollRatio * maxThumbTop
        thumb.style.top = `${thumbTop}px`
      }
    }, [
      horizontalScrollbarInset,
      scrollbarOutside,
      thumbTopInset,
      thumbBottomInset,
      thumbMinHeight,
      thumbMaxHeight,
      thumbRef,
      onScrollableChange,
      showHorizontalScrollbar,
    ])

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

    useEffect(() => {
      if (showHorizontalScrollbar) scheduleSyncThumb()
    }, [isHorizontallyScrollable, scheduleSyncThumb, showHorizontalScrollbar])

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
        const rawThumbHeight = (clientHeight / scrollHeight) * availableHeight
        const currentThumbHeight = Math.min(rawThumbHeight, thumbMaxHeight ?? rawThumbHeight, availableHeight)
        const maxScrollTop = scrollHeight - clientHeight
        const maxThumbTravel = Math.max(0, availableHeight - currentThumbHeight)

        if (maxThumbTravel <= 0) return

        const newScrollTop = startScrollTop + deltaY * (maxScrollTop / maxThumbTravel)

        container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop))
      },
      [isDragging, startY, startScrollTop, thumbTopInset, thumbBottomInset, thumbMaxHeight],
    )

    // Handle mouse up to stop dragging
    const handleMouseUp = useCallback(() => {
      setIsDragging(false)
    }, [])

    const handleHorizontalMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current

      if (!container) return

      setIsHorizontalDragging(true)
      setStartX(e.clientX)
      setStartScrollLeft(container.scrollLeft)
    }, [])

    const handleHorizontalMouseMove = useCallback(
      (e: globalThis.MouseEvent) => {
        if (!isHorizontalDragging) return

        const container = containerRef.current

        if (!container) return

        const availableWidth =
          container.clientWidth - (scrollbarOutside || !isScrollable ? 0 : SCROLL_TRACK_WIDTH_PX) - horizontalScrollbarInset * 2
        const maxScrollLeft = container.scrollWidth - container.clientWidth
        const maxThumbTravel = Math.max(0, availableWidth - horizontalThumbWidth)

        if (maxThumbTravel <= 0) return

        const nextScrollLeft = startScrollLeft + (e.clientX - startX) * (maxScrollLeft / maxThumbTravel)
        container.scrollLeft = Math.max(0, Math.min(nextScrollLeft, maxScrollLeft))
      },
      [horizontalScrollbarInset, horizontalThumbWidth, isHorizontalDragging, isScrollable, scrollbarOutside, startScrollLeft, startX],
    )

    const handleHorizontalMouseUp = useCallback(() => {
      setIsHorizontalDragging(false)
    }, [])

    const handleWheel = useCallback(
      (e: WheelEvent) => {
        if (overscrollBehavior !== 'auto') return
        if (chainBoundaryWheelScroll(e, containerRef.current)) syncThumb()
      },
      [overscrollBehavior, syncThumb],
    )

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

    useEffect(() => {
      if (!isHorizontalDragging) return () => {}

      document.addEventListener('mousemove', handleHorizontalMouseMove)
      document.addEventListener('mouseup', handleHorizontalMouseUp)
      document.body.classList.add('no-select')

      return () => {
        document.removeEventListener('mousemove', handleHorizontalMouseMove)
        document.removeEventListener('mouseup', handleHorizontalMouseUp)
        document.body.classList.remove('no-select')
      }
    }, [isHorizontalDragging, handleHorizontalMouseMove, handleHorizontalMouseUp])

    // Set up scroll event listeners
    useEffect(() => {
      const container = containerRef.current
      const childrenElement = childrenRef.current

      if (!container || !childrenElement) return () => {}

      scheduleSyncThumb()

      container.addEventListener('scroll', syncThumb)
      container.addEventListener('wheel', handleWheel, { passive: false })
      window.addEventListener('resize', scheduleSyncThumb)

      const resizeObserver = new ResizeObserver(() => {
        scheduleSyncThumb()
      })

      resizeObserver.observe(childrenElement)
      resizeObserver.observe(container)

      return () => {
        container.removeEventListener('scroll', syncThumb)
        container.removeEventListener('wheel', handleWheel)
        window.removeEventListener('resize', scheduleSyncThumb)
        resizeObserver.disconnect()
      }
    }, [children, syncThumb, scheduleSyncThumb, contentKey, handleWheel])

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
            overflow: scrollbarOutside || scrollbarOffsetRight > 0 ? 'visible' : 'hidden',
            padding: scrollbarOutside
              ? `${offsetTop}px ${scrollbarOutsideRightGutterPx}px ${offsetBottom + (showHorizontalScrollbar ? scrollbarOutsideBottomGutterPx : 0)}px 0`
              : `${offsetTop}px 0 ${offsetBottom}px 0`,
            ...(height === undefined ? {} : { height, minHeight: 0 }),
            ...(scrollbarOutside ? { boxSizing: 'border-box' } : {}),
            ...(showScrollbarOnHover && scrollbarOutside
              ? {
                '& .scroll-wrapper-thumb, & .scroll-wrapper-track, & .scroll-wrapper-horizontal-thumb, & .scroll-wrapper-horizontal-track':
                    {
                      opacity: isDragging || isHorizontalDragging ? 1 : 0,
                      transition: 'opacity 150ms ease',
                      pointerEvents: isDragging || isHorizontalDragging ? 'auto' : 'none',
                    },
                ...(isDragging || isHorizontalDragging
                  ? {}
                  : {
                    '&:hover .scroll-wrapper-thumb, &:hover .scroll-wrapper-track, &:hover .scroll-wrapper-horizontal-thumb, &:hover .scroll-wrapper-horizontal-track':
                          {
                            opacity: 1,
                            pointerEvents: 'auto',
                          },
                  }),
              }
              : {}),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            overflow: scrollbarOutside || scrollbarOffsetRight > 0 ? 'visible' : 'hidden',
            boxSizing: 'border-box',
            ...(showScrollbarOnHover
              ? {
                '& .scroll-wrapper-thumb, & .scroll-wrapper-track, & .scroll-wrapper-horizontal-thumb, & .scroll-wrapper-horizontal-track':
                    {
                      opacity: isDragging || isHorizontalDragging ? 1 : 0,
                      transition: 'opacity 150ms ease',
                      pointerEvents: isDragging || isHorizontalDragging ? 'auto' : 'none',
                    },
                ...(isDragging || isHorizontalDragging
                  ? {}
                  : {
                    '&:hover .scroll-wrapper-thumb, &:hover .scroll-wrapper-track, &:hover .scroll-wrapper-horizontal-thumb, &:hover .scroll-wrapper-horizontal-track':
                          {
                            opacity: 1,
                            pointerEvents: 'auto',
                          },
                  }),
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
              ...(height === undefined
                ? { maxHeight }
                : {
                  height: '100%',
                  maxHeight: '100%',
                  minHeight: 0,
                  boxSizing: 'border-box',
                }),
              overflowY: 'auto',
              overflowX,
              overscrollBehavior,
              position: 'relative',
              zIndex: 1,
              paddingRight: scrollbarOutside ? '0' : isScrollable || reserveScrollbarGap ? `${scrollbarGap}px` : '0',
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
                right: scrollbarOutside ? `${-(scrollbarOutsideRightTrackOffset - thumbRightPx)}px` : thumbRightPx - scrollbarOffsetRight,
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
          {showHorizontalScrollbar && isHorizontallyScrollable && (
            <Box
              ref={horizontalThumbRef}
              onMouseDown={handleHorizontalMouseDown}
              sx={{
                position: 'absolute',
                bottom: scrollbarOutside
                  ? `calc(-${scrollbarOutsideBottomGutterPx}px + ${scrollbarOutsideBottomTrackInset}px + ${horizontalThumbBottom})`
                  : horizontalThumbBottom,
                left: 0,
                width: `${horizontalThumbWidth}px`,
                height: horizontalThumbHeight,
                backgroundColor: '#CED4DA',
                borderRadius: '10px',
                transition: isHorizontalDragging ? 'none' : 'left 0.1s, opacity 150ms ease',
                cursor: 'pointer',
                userSelect: 'none',
                zIndex: 2,
                ':hover': {
                  backgroundColor: '#ADB5BD',
                },
              }}
              className="scroll-wrapper-horizontal-thumb"
            />
          )}
          {showHorizontalScrollbar && isHorizontallyScrollable && (
            <button
              type="button"
              className="scroll-wrapper-horizontal-track"
              style={{
                position: 'absolute',
                right: (scrollbarOutside || !isScrollable ? 0 : SCROLL_TRACK_WIDTH_PX) + horizontalScrollbarInset,
                bottom: scrollbarOutside ? -scrollbarOutsideBottomTrackOffset : 0,
                left: horizontalScrollbarInset,
                height: SCROLL_TRACK_WIDTH_PX,
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
                const clickRatio = (e.clientX - rect.left) / rect.width
                container.scrollLeft = (container.scrollWidth - container.clientWidth) * clickRatio
              }}
            />
          )}
          {isScrollable && (
            <button
              type="button"
              className="scroll-wrapper-track"
              style={{
                position: 'absolute',
                top: `${thumbTopInset}px`,
                right: scrollbarOutside ? -scrollbarOutsideRightTrackOffset : -scrollbarOffsetRight,
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
                height: NEXT_GEN_MI_SCROLL_EDGE_FADE_HEIGHT_PX,
                opacity: canScrollUp ? 1 : 0,
                transition: SCROLL_EDGE_FADE_TRANSITION,
                ...scrollEdgeOverlaySx,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: NEXT_GEN_MI_SCROLL_EDGE_FADE_TOP_BG,
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
                  boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
                  clipPath: NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_TOP,
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
                height: NEXT_GEN_MI_SCROLL_EDGE_FADE_HEIGHT_PX,
                opacity: canScrollDown ? 1 : 0,
                transition: SCROLL_EDGE_FADE_TRANSITION,
                ...scrollEdgeOverlaySx,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: NEXT_GEN_MI_SCROLL_EDGE_FADE_BOTTOM_BG,
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
                  boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
                  clipPath: NEXT_GEN_MI_SCROLL_EDGE_CLIP_PATH_BOTTOM,
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
