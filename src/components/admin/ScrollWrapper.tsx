import { Box, SxProps, Theme } from '@mui/material'
import { useRef, useEffect, useState, useCallback, ReactNode, CSSProperties } from 'react'

const ScrollWrapper = ({
  children,
  className,
  offsetTop = 0,
  maxHeight = 268,
  sx,
  styScroll,
}: {
  children: ReactNode
  className?: string
  offsetTop?: number
  maxHeight?: number | string
  sx?: SxProps<Theme>
  styScroll?: CSSProperties
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const childrenRef = useRef<HTMLDivElement>(null)
  const [thumbHeight, setThumbHeight] = useState(0)
  const [isScrollable, setIsScrollable] = useState(false)

  const syncThumb = useCallback(() => {
    const container = containerRef.current

    if (!container) return

    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const scrollTop = container.scrollTop

    const scrollable = scrollHeight > clientHeight

    setIsScrollable(scrollable)

    if (!scrollable) {
      setThumbHeight(0)

      return
    }

    const height = (clientHeight / scrollHeight) * clientHeight

    setThumbHeight(height)

    const thumb = thumbRef.current

    if (thumb) {
      thumb.style.top = `${(scrollTop / scrollHeight) * clientHeight + offsetTop}px`
    }
  }, [offsetTop])

  useEffect(() => {
    const container = containerRef.current
    const children = childrenRef.current

    if (!container || !children) return () => {}

    syncThumb()

    container.addEventListener('scroll', syncThumb)
    window.addEventListener('resize', syncThumb)

    // Observe container height changes
    const resizeObserver = new ResizeObserver(() => {
      syncThumb()
    })

    resizeObserver.observe(children)

    return () => {
      container.removeEventListener('scroll', syncThumb)
      window.removeEventListener('resize', syncThumb)
      resizeObserver.disconnect()
    }
  }, [children, syncThumb])

  return (
    <Box sx={{ position: 'relative', maxHeight, overflow: 'hidden', padding: `${offsetTop}px 0`, ...sx }}>
      <Box
        className={`disabledScroll ${className ?? ''}`}
        ref={containerRef}
        sx={{
          maxHeight,
          overflowY: 'auto',
          paddingRight: '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div ref={childrenRef}>{children}</div>
      </Box>
      {isScrollable && (
        <div
          ref={thumbRef}
          style={{
            position: 'absolute',
            top: `${offsetTop}px`,
            right: 4,
            width: 4,
            bottom: 30,
            height: `${thumbHeight}px`,
            backgroundColor: '#CED4DA',
            borderRadius: '10px',
            transition: 'top 0.1s',
            ...styScroll,
          }}
        />
      )}
    </Box>
  )
}

export default ScrollWrapper
