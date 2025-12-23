import { Box, SxProps, Theme } from '@mui/material'
import { useRef, useEffect, useState, useCallback, ReactNode, CSSProperties, MouseEvent, forwardRef, useMemo } from 'react'

import { useScrollThumbRegistry } from '@/hooks/useScrollThumbRegistry'

interface ScrollWrapperProps {
  children: ReactNode
  className?: string
  id?: string
  offsetTop?: number
  offsetBottom?: number
  maxHeight?: number | string
  scrollToBottomTrigger?: number | string | boolean
  scrollToBottomOffset?: number | string | boolean
  sx?: SxProps<Theme>
  styScroll?: CSSProperties
  onScrollableChange?: (isScrollable: boolean) => void
  scrollbarGap?: number
}

const ScrollWrapper = forwardRef<HTMLDivElement, ScrollWrapperProps>(
  (
    {
      children,
      className,
      id,
      offsetTop = 0,
      offsetBottom = 0,
      maxHeight = 268,
      scrollToBottomTrigger,
      scrollToBottomOffset,
      sx,
      styScroll,
      onScrollableChange,
      scrollbarGap = 0,
    },
    ref,
  ) => {
    const scrollWrapperId = useMemo(() => id ?? `scroll-wrapper-${Math.random().toString(36).substring(2, 11)}`, [id])

    const containerRef = useRef<HTMLDivElement>(null)
    const childrenRef = useRef<HTMLDivElement>(null)

    const { thumbRef, registerThumb, unregisterThumb } = useScrollThumbRegistry()
    const [thumbHeight, setThumbHeight] = useState(0)
    const [isScrollable, setIsScrollable] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [startY, setStartY] = useState(0)
    const [startScrollTop, setStartScrollTop] = useState(0)

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

      const scrollable = scrollHeight > clientHeight

      setIsScrollable(scrollable)
      onScrollableChange?.(scrollable)

      if (!scrollable) {
        setThumbHeight(0)

        return
      }

      const availableHeight = clientHeight - offsetTop - offsetBottom
      const height = (clientHeight / scrollHeight) * availableHeight

      setThumbHeight(height)

      const thumb = thumbRef.current

      if (thumb) {
        const maxScrollTop = scrollHeight - clientHeight
        const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
        const maxThumbTop = availableHeight - height
        const thumbTop = offsetTop + scrollRatio * maxThumbTop
        thumb.style.top = `${thumbTop}px`
      }
    }, [offsetTop, offsetBottom, thumbRef, onScrollableChange])

    // Handle mouse down on the thumb
    const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
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

        // Calculate the scroll ratio based on thumb movement
        const scrollRatio = scrollHeight / clientHeight
        const newScrollTop = startScrollTop + deltaY * scrollRatio

        // Update container scroll position
        container.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight))
      },
      [isDragging, startY, startScrollTop],
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

      syncThumb()

      container.addEventListener('scroll', syncThumb)
      window.addEventListener('resize', syncThumb)

      // Observe container height changes
      const resizeObserver = new ResizeObserver(() => {
        syncThumb()
      })

      resizeObserver.observe(childrenElement)

      return () => {
        container.removeEventListener('scroll', syncThumb)
        window.removeEventListener('resize', syncThumb)
        resizeObserver.disconnect()
      }
    }, [children, syncThumb])

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
      <Box sx={{ position: 'relative', maxHeight, overflow: 'hidden', padding: `${offsetTop}px 0 ${offsetBottom}px 0`, ...sx }}>
        <Box
          id={scrollWrapperId}
          className={`disabledScroll ${className ?? ''}`}
          ref={(node: HTMLDivElement | null) => {
            containerRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          sx={{
            maxHeight,
            overflowY: 'auto',
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
              top: `${offsetTop}px`,
              right: 4,
              width: 4,
              height: `${thumbHeight}px`,
              backgroundColor: '#CED4DA',
              borderRadius: '10px',
              transition: isDragging ? 'none' : 'top 0.1s',
              cursor: 'pointer',
              userSelect: 'none',
              ...styScroll,
              // Add hover effect
              ':hover': {
                ...styScroll,
                backgroundColor: '#ADB5BD',
              },
            }}
            className="scroll-wrapper-thumb"
          ></Box>
        )}
        {/* Add track area for mouse scrolling */}
        {isScrollable && (
          <button
            type="button"
            style={{
              position: 'absolute',
              top: `${offsetTop}px`,
              right: 0,
              width: 12,
              bottom: `${offsetBottom}px`,
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
    )
  },
)

ScrollWrapper.displayName = 'ScrollWrapper'

export default ScrollWrapper
