import React, { useRef, useEffect, useState, useCallback } from 'react'

const ScrollWrapper = ({
  children,
  className,
  offsetTop = 0,
  maxHeight = 268,
}: {
  children: React.ReactNode
  className?: string
  offsetTop?: number
  maxHeight?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
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

    if (!container) return () => {}

    syncThumb()
    container.addEventListener('scroll', syncThumb)
    window.addEventListener('resize', syncThumb)

    return () => {
      container.removeEventListener('scroll', syncThumb)
      window.removeEventListener('resize', syncThumb)
    }
  }, [children, syncThumb])

  return (
    <div style={{ position: 'relative', maxHeight, overflow: 'hidden', padding: `${offsetTop}px 0` }}>
      <div
        className={`disabledScroll ${className ?? ''}`}
        ref={containerRef}
        style={{
          maxHeight,
          overflowY: 'auto',
          paddingRight: '0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div>{children}</div>
      </div>
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
          }}
        />
      )}
    </div>
  )
}

export default ScrollWrapper
