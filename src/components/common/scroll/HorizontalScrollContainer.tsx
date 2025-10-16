import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { Box, IconButton, Stack, type StackProps } from '@mui/material'
import { ReactNode, useRef, useState, useEffect, forwardRef } from 'react'

interface HorizontalScrollContainerProps extends Omit<StackProps, 'children'> {
  children: ReactNode
  scrollAmount?: number
  showGradient?: boolean
  showScrollButtons?: boolean
  enableWheelScroll?: boolean
}

const HorizontalScrollContainer = forwardRef<HTMLDivElement, HorizontalScrollContainerProps>(
  ({ children, scrollAmount = 0.6, showGradient = true, showScrollButtons = true, enableWheelScroll = true, ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftButton, setShowLeftButton] = useState(false)
    const [showRightButton, setShowRightButton] = useState(false)

    const checkScrollButtons = () => {
      if (scrollRef.current) {
        const { scrollLeft: currentScrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeftButton(currentScrollLeft > 1)
        setShowRightButton(currentScrollLeft < scrollWidth - clientWidth - 1)
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

      window.addEventListener('resize', handleResize)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleResize)
      }
    }, [])

    // 마우스 휠 -> 가로 스크롤 전환
    useEffect(() => {
      if (!enableWheelScroll) return () => {}

      const element = scrollRef.current
      if (!element) {
        return () => {}
      }

      const handleWheel = (e: WheelEvent) => {
        if (element.scrollWidth > element.clientWidth) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault()
            const newScrollLeft = element.scrollLeft + e.deltaY
            const maxScrollLeft = element.scrollWidth - element.clientWidth

            element.scrollLeft = Math.min(Math.max(newScrollLeft, 0), maxScrollLeft)
            setTimeout(checkScrollButtons, 50)
          } else if (Math.abs(e.deltaX) > 0) {
            e.preventDefault()
            const newScrollLeft = element.scrollLeft + e.deltaX
            const maxScrollLeft = element.scrollWidth - element.clientWidth

            element.scrollLeft = Math.min(Math.max(newScrollLeft, 0), maxScrollLeft)
            setTimeout(checkScrollButtons, 50)
          }
        }
      }

      element.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        element.removeEventListener('wheel', handleWheel)
      }
    }, [enableWheelScroll])

    return (
      <Box
        ref={ref}
        position="relative"
        sx={{
          '&:hover .scroll-button': {
            opacity: 1,
          },
          ...(showGradient &&
            showLeftButton && {
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '50px',
              background:
                  'linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
            },
          }),
          ...(showGradient &&
            showRightButton && {
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '50px',
              background:
                  'linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0) 100%)',
              zIndex: 1,
              pointerEvents: 'none',
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
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              border: '1px solid #DEE2E6',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              width: 32,
              height: 32,
              opacity: 0,
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
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              border: '1px solid #DEE2E6',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              width: 32,
              height: 32,
              opacity: 0,
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
          direction="row"
          overflow="hidden"
          onScroll={checkScrollButtons}
          onLoad={checkScrollButtons}
          sx={{
            overflowX: 'auto',
            flex: 1,
            minWidth: 0,
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
