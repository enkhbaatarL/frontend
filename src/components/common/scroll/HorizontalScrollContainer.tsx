import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { Box, IconButton, Stack, type StackProps } from '@mui/material'
import { ReactNode, useRef, useState, useEffect, forwardRef, MouseEvent } from 'react'

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
    const [scrollEndFeedback, setScrollEndFeedback] = useState<ScrollEndFeedback>(null)
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastButtonStateRef = useRef({ left: false, right: false })
    const wheelDeltaRef = useRef(0)
    const wheelRafRef = useRef<number | null>(null)
    const checkScrollButtonsRef = useRef<() => void>(() => {})
    const handleScrollRef = useRef<() => void>(() => {})
    const lastMousePositionRef = useRef({ x: 0, y: 0 })
    const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isMouseInsideRef = useRef(false)

    const buttonPaddingLeft = typeof buttonPadding === 'number' ? buttonPadding : (buttonPadding?.left ?? 0)
    const buttonPaddingRight = typeof buttonPadding === 'number' ? buttonPadding : (buttonPadding?.right ?? 0)
    const scrollEdgePaddingLeft = typeof scrollEdgePadding === 'number' ? scrollEdgePadding : (scrollEdgePadding?.left ?? 32)
    const scrollEdgePaddingRight = typeof scrollEdgePadding === 'number' ? scrollEdgePadding : (scrollEdgePadding?.right ?? 32)

    const checkScrollButtons = () => {
      if (scrollRef.current) {
        const { scrollLeft: currentScrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const newShowLeft = currentScrollLeft > 1
        const newShowRight = currentScrollLeft < scrollWidth - clientWidth - 1
        const last = lastButtonStateRef.current
        if (newShowLeft !== last.left || newShowRight !== last.right) {
          lastButtonStateRef.current = { left: newShowLeft, right: newShowRight }
          setShowLeftButton(newShowLeft)
          setShowRightButton(newShowRight)
        }
      }
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
      if (scrollRef.current) {
        const scrollValue = scrollRef.current.clientWidth * scrollAmount
        scrollRef.current.scrollBy({ left: -scrollValue, behavior: 'smooth' })
        setTimeout(checkScrollButtons, 300)
      }
    }

    const scrollRight = () => {
      if (scrollRef.current) {
        const { scrollLeft: currentScrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const maxScrollLeft = scrollWidth - clientWidth

        if (currentScrollLeft >= maxScrollLeft - 10) {
          scrollRef.current.scrollTo({ left: maxScrollLeft, behavior: 'smooth' })
        } else {
          const scrollValue = scrollRef.current.clientWidth * scrollAmount
          scrollRef.current.scrollBy({ left: scrollValue, behavior: 'smooth' })
        }
        setTimeout(checkScrollButtons, 300)
      }
    }

    useEffect(() => {
      checkScrollButtons()
      const timer = setTimeout(checkScrollButtons, 100)

      const handleResize = () => {
        setTimeout(checkScrollButtons, 100)
      }

      const element = scrollRef.current
      let mutationTimeout: ReturnType<typeof setTimeout> | null = null
      const mutationObserver =
        element &&
        new MutationObserver(() => {
          if (mutationTimeout) clearTimeout(mutationTimeout)
          mutationTimeout = setTimeout(() => {
            mutationTimeout = null
            checkScrollButtons()
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

        const maxScrollLeft = element.scrollWidth - element.clientWidth
        const currentScrollLeft = element.scrollLeft

        if (delta < 0 && currentScrollLeft <= 0) {
          triggerScrollEndFeedback('left')
        } else if (delta > 0 && currentScrollLeft >= maxScrollLeft - 1) {
          triggerScrollEndFeedback('right')
        }

        element.scrollLeft = Math.min(Math.max(currentScrollLeft + delta, 0), maxScrollLeft)
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
          overflow: 'hidden',
          ...(alwaysShowScrollButtons ? { '& .scroll-button': { opacity: 1 } } : { '&:hover .scroll-button': { opacity: 1 } }),
          ...containerSx,
          ...(scrollEndFeedback && {
            '@keyframes scrollEndShake': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%': { transform: `translateX(${scrollEndFeedback === 'left' ? 4 : -4}px)` },
              '40%': { transform: `translateX(${scrollEndFeedback === 'left' ? -3 : 3}px)` },
              '60%': { transform: `translateX(${scrollEndFeedback === 'left' ? 2 : -2}px)` },
              '80%': { transform: `translateX(${scrollEndFeedback === 'left' ? -1 : 1}px)` },
            },
            '& .scroll-content': {
              animation: 'scrollEndShake 0.4s ease-out',
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
              width: 32,
              height: 32,
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
              width: 32,
              height: 32,
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
            ...(showLeftButton && { paddingLeft: `${scrollEdgePaddingLeft}px` }),
            ...(showRightButton && { paddingRight: `${scrollEdgePaddingRight}px` }),
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

        {showGradient && showLeftButton && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: gradientWidth,
              pointerEvents: 'none',
              zIndex: 2,
              background:
                'linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 12%, rgba(255, 255, 255, 0.65) 28%, rgba(255, 255, 255, 0.4) 48%, rgba(255, 255, 255, 0.2) 68%, rgba(255, 255, 255, 0.06) 88%, transparent 100%)',
            }}
          />
        )}
        {showGradient && showRightButton && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: gradientWidth,
              pointerEvents: 'none',
              zIndex: 2,
              background:
                'linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 12%, rgba(255, 255, 255, 0.65) 28%, rgba(255, 255, 255, 0.4) 48%, rgba(255, 255, 255, 0.2) 68%, rgba(255, 255, 255, 0.06) 88%, transparent 100%)',
            }}
          />
        )}
      </Box>
    )
  },
)

HorizontalScrollContainer.displayName = 'HorizontalScrollContainer'

export default HorizontalScrollContainer
