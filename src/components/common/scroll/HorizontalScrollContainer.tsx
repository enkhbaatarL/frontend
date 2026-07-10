import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { Box, IconButton, Stack, type StackProps } from '@mui/material'
import { ReactNode, useRef, useState, useEffect, useLayoutEffect, forwardRef, MouseEvent } from 'react'

type ScrollEndFeedback = 'left' | 'right' | null

interface HorizontalScrollContainerProps extends Omit<StackProps, 'children' | 'onScrollEnd'> {
  children: ReactNode
  scrollAmount?: number
  showGradient?: boolean
  gradientWidth?: number
  showScrollButtons?: boolean
  alwaysShowScrollButtons?: boolean
  enableWheelScroll?: boolean
  buttonPadding?: number | { left?: number; right?: number }
  scrollEdgePadding?: number | { left?: number; right?: number }
  onScrollEnd?: (elementUnderCursor: Element | null) => void
  scrollEndDelay?: number
  containerSx?: StackProps['sx']
}

const HorizontalScrollContainer = forwardRef<HTMLDivElement, HorizontalScrollContainerProps>(
  (
    {
      children,
      scrollAmount = 0.6,
      showGradient = true,
      gradientWidth = 50,
      showScrollButtons = true,
      alwaysShowScrollButtons = false,
      enableWheelScroll = true,
      buttonPadding,
      scrollEdgePadding,
      onScrollEnd,
      scrollEndDelay = 400,
      containerSx,
      ...props
    },
    ref,
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftButton, setShowLeftButton] = useState(false)
    const [showRightButton, setShowRightButton] = useState(false)
    const [isScrollable, setIsScrollable] = useState(false)
    const [scrollEndFeedback, setScrollEndFeedback] = useState<ScrollEndFeedback>(null)
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastButtonStateRef = useRef({ left: false, right: false })
    const isScrollableRef = useRef(false)
    const wheelDeltaRef = useRef(0)
    const wheelRafRef = useRef<number | null>(null)
    const checkScrollButtonsRef = useRef<() => void>(() => {})
    const getScrollLimitsRef = useRef<(element: HTMLDivElement) => { minScrollLeft: number; maxScrollLeft: number }>(() => ({
      minScrollLeft: 0,
      maxScrollLeft: 0,
    }))
    const handleScrollRef = useRef<() => void>(() => {})
    const lastMousePositionRef = useRef({ x: 0, y: 0 })
    const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isMouseInsideRef = useRef(false)

    const buttonPaddingLeft = typeof buttonPadding === 'number' ? buttonPadding : (buttonPadding?.left ?? 0)
    const buttonPaddingRight = typeof buttonPadding === 'number' ? buttonPadding : (buttonPadding?.right ?? 0)
    const scrollEdgePaddingLeft = typeof scrollEdgePadding === 'number' ? scrollEdgePadding : (scrollEdgePadding?.left ?? 32)
    const scrollEdgePaddingRight = typeof scrollEdgePadding === 'number' ? scrollEdgePadding : (scrollEdgePadding?.right ?? 32)
    const hasScrollEdgePadding = showScrollButtons && isScrollable
    const scrollMaskImage =
      showGradient && showLeftButton && showRightButton
        ? `linear-gradient(to right, transparent 0, black ${gradientWidth}px, black calc(100% - ${gradientWidth}px), transparent 100%)`
        : showGradient && showLeftButton
          ? `linear-gradient(to right, transparent 0, black ${gradientWidth}px)`
          : showGradient && showRightButton
            ? `linear-gradient(to left, transparent 0, black ${gradientWidth}px)`
            : undefined

    const getActiveScrollEdgePadding = () => ({
      left: showScrollButtons && isScrollableRef.current ? scrollEdgePaddingLeft : 0,
      right: showScrollButtons && isScrollableRef.current ? scrollEdgePaddingRight : 0,
    })

    const getScrollLimits = (element: HTMLDivElement) => {
      const edgePadding = getActiveScrollEdgePadding()
      const minScrollLeft = edgePadding.left
      const maxScrollLeft = Math.max(minScrollLeft, element.scrollWidth - element.clientWidth - edgePadding.right)

      return { minScrollLeft, maxScrollLeft }
    }
    getScrollLimitsRef.current = getScrollLimits

    const syncButtonState = (left: boolean, right: boolean) => {
      const last = lastButtonStateRef.current
      if (left !== last.left || right !== last.right) {
        lastButtonStateRef.current = { left, right }
        setShowLeftButton(left)
        setShowRightButton(right)
      }
    }

    const checkScrollButtons = () => {
      const element = scrollRef.current
      if (!element) return

      const edgePadding = getActiveScrollEdgePadding()
      const nextIsScrollable = element.scrollWidth - edgePadding.left - edgePadding.right > element.clientWidth + 1
      if (nextIsScrollable !== isScrollableRef.current) {
        isScrollableRef.current = nextIsScrollable
        setIsScrollable(nextIsScrollable)
        if (!nextIsScrollable) syncButtonState(false, false)
        return
      }

      const { minScrollLeft, maxScrollLeft } = getScrollLimits(element)
      let currentScrollLeft = element.scrollLeft
      const nextScrollLeft = Math.min(Math.max(currentScrollLeft, minScrollLeft), maxScrollLeft)
      if (Math.abs(nextScrollLeft - currentScrollLeft) > 1) {
        element.scrollLeft = nextScrollLeft
        currentScrollLeft = nextScrollLeft
      }

      syncButtonState(nextIsScrollable && currentScrollLeft > minScrollLeft + 1, nextIsScrollable && currentScrollLeft < maxScrollLeft - 1)
    }
    checkScrollButtonsRef.current = checkScrollButtons

    const handleScroll = () => {
      checkScrollButtons()
      if (onScrollEnd) {
        if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current)
        scrollEndTimeoutRef.current = setTimeout(() => {
          scrollEndTimeoutRef.current = null
          if (!isMouseInsideRef.current) {
            onScrollEnd(null)
            return
          }
          const { x, y } = lastMousePositionRef.current
          const elementUnderCursor = document.elementFromPoint(x, y)
          onScrollEnd(elementUnderCursor)
        }, scrollEndDelay)
      }
    }
    handleScrollRef.current = handleScroll

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseEnter = () => {
      isMouseInsideRef.current = true
    }

    const handleMouseLeave = () => {
      isMouseInsideRef.current = false
      if (onScrollEnd) {
        if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current)
        scrollEndTimeoutRef.current = null
        onScrollEnd(null)
      }
    }

    const scrollLeft = () => {
      const element = scrollRef.current
      if (!element) return

      const { minScrollLeft } = getScrollLimits(element)
      const scrollValue = element.clientWidth * scrollAmount
      element.scrollTo({ left: Math.max(element.scrollLeft - scrollValue, minScrollLeft), behavior: 'smooth' })
      setTimeout(checkScrollButtons, 300)
    }

    const scrollRight = () => {
      const element = scrollRef.current
      if (!element) return

      const { maxScrollLeft } = getScrollLimits(element)
      const scrollValue = element.clientWidth * scrollAmount
      element.scrollTo({ left: Math.min(element.scrollLeft + scrollValue, maxScrollLeft), behavior: 'smooth' })
      setTimeout(checkScrollButtons, 300)
    }

    useLayoutEffect(() => {
      checkScrollButtons()
    })

    useEffect(() => {
      checkScrollButtonsRef.current()
      const timer = setTimeout(() => checkScrollButtonsRef.current(), 100)

      const handleResize = () => {
        setTimeout(() => checkScrollButtonsRef.current(), 100)
      }

      const element = scrollRef.current
      let mutationTimeout: ReturnType<typeof setTimeout> | null = null
      const mutationObserver =
        element &&
        new MutationObserver(() => {
          if (mutationTimeout) clearTimeout(mutationTimeout)
          mutationTimeout = setTimeout(() => {
            mutationTimeout = null
            checkScrollButtonsRef.current()
          }, 50)
        })
      if (mutationObserver && element) {
        mutationObserver.observe(element, { childList: true, subtree: true })
      }

      window.addEventListener('resize', handleResize)

      return () => {
        clearTimeout(timer)
        if (mutationTimeout) clearTimeout(mutationTimeout)
        window.removeEventListener('resize', handleResize)
        mutationObserver?.disconnect()
      }
    }, [])

    // 마우스 휠 -> 가로 스크롤 전환
    useEffect(() => {
      const element = scrollRef.current
      if (!element) {
        return () => {}
      }

      if (!enableWheelScroll) {
        const handleWheelBlock = (e: WheelEvent) => {
          if (element.scrollWidth <= element.clientWidth) return
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault()
          }
        }
        element.addEventListener('wheel', handleWheelBlock, { passive: false })
        return () => {
          element.removeEventListener('wheel', handleWheelBlock)
        }
      }

      const triggerScrollEndFeedback = (direction: 'left' | 'right') => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
        setScrollEndFeedback(direction)
        feedbackTimeoutRef.current = setTimeout(() => {
          setScrollEndFeedback(null)
          feedbackTimeoutRef.current = null
        }, 400)
      }

      const applyWheelScroll = () => {
        const delta = wheelDeltaRef.current
        wheelDeltaRef.current = 0
        wheelRafRef.current = null

        if (delta === 0) return

        const { minScrollLeft, maxScrollLeft } = getScrollLimitsRef.current(element)
        const currentScrollLeft = element.scrollLeft

        if (delta < 0 && currentScrollLeft <= minScrollLeft + 1) {
          triggerScrollEndFeedback('left')
        } else if (delta > 0 && currentScrollLeft >= maxScrollLeft - 1) {
          triggerScrollEndFeedback('right')
        }

        element.scrollLeft = Math.min(Math.max(currentScrollLeft + delta, minScrollLeft), maxScrollLeft)
        handleScrollRef.current()
      }

      const handleWheel = (e: WheelEvent) => {
        if (element.scrollWidth <= element.clientWidth) return

        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX

        if (Math.abs(delta) > 0) {
          e.preventDefault()
          wheelDeltaRef.current += delta
          wheelRafRef.current ??= requestAnimationFrame(applyWheelScroll)
        }
      }

      element.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        element.removeEventListener('wheel', handleWheel)
        if (wheelRafRef.current !== null) {
          cancelAnimationFrame(wheelRafRef.current)
          wheelRafRef.current = null
        }
      }
    }, [enableWheelScroll])

    useEffect(
      () => () => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
        if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current)
      },
      [],
    )

    return (
      <Box
        ref={ref}
        position="relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          overflow: 'visible',
          ...(alwaysShowScrollButtons ? { '& .scroll-button': { opacity: 1 } } : { '&:hover .scroll-button': { opacity: 1 } }),
          ...containerSx,
          ...(scrollEndFeedback && {
            '@keyframes scrollEndPullLeft': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%': { transform: 'translateX(4px)' },
              '40%': { transform: 'translateX(1px)' },
              '60%': { transform: 'translateX(3px)' },
              '80%': { transform: 'translateX(0)' },
            },
            '@keyframes scrollEndPullRight': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%': { transform: 'translateX(-4px)' },
              '40%': { transform: 'translateX(-1px)' },
              '60%': { transform: 'translateX(-3px)' },
              '80%': { transform: 'translateX(0)' },
            },
            '& .scroll-content': {
              animation: `${scrollEndFeedback === 'left' ? 'scrollEndPullLeft' : 'scrollEndPullRight'} 0.4s ease-out`,
            },
          }),
        }}
      >
        {showScrollButtons && showLeftButton && (
          <IconButton
            className="scroll-button"
            onClick={scrollLeft}
            disableRipple
            sx={{
              position: 'absolute',
              left: buttonPaddingLeft,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              border: '1px solid #DEE2E6',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              width: '32px',
              height: '32px',
              opacity: alwaysShowScrollButtons ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}

        {showScrollButtons && showRightButton && (
          <IconButton
            className="scroll-button"
            onClick={scrollRight}
            disableRipple
            sx={{
              position: 'absolute',
              right: buttonPaddingRight,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              border: '1px solid #DEE2E6',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              width: '32px',
              height: '32px',
              opacity: alwaysShowScrollButtons ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        )}

        <Stack
          ref={scrollRef}
          className="scroll-content"
          direction="row"
          overflow="hidden"
          onScroll={handleScroll}
          onLoad={checkScrollButtons}
          sx={{
            overflowX: 'auto',
            flex: 1,
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 0,
            WebkitMaskImage: scrollMaskImage,
            maskImage: scrollMaskImage,
            ...(hasScrollEdgePadding && { paddingLeft: `${scrollEdgePaddingLeft}px`, paddingRight: `${scrollEdgePaddingRight}px` }),
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          {...props}
        >
          {children}
        </Stack>
      </Box>
    )
  },
)

HorizontalScrollContainer.displayName = 'HorizontalScrollContainer'

export default HorizontalScrollContainer
