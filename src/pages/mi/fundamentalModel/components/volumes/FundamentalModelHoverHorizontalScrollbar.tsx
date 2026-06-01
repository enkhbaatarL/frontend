import { Box } from '@mui/material'
import { memo, useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type RefObject } from 'react'

interface FundamentalModelHoverHorizontalScrollbarProps {
  scrollRef: RefObject<HTMLDivElement | null>
  contentWidthKey: number | string
  hoverRootClassName: string
  onScrollLeftChange: () => void
}

const THUMB_MIN_W = 24
const THUMB_H = 4
const THUMB_BOTTOM = 4

const defaultState = {
  scrollable: false,
  thumbLeft: 0,
  thumbWidth: 0,
}

const FundamentalModelHoverHorizontalScrollbar = memo(
  ({ scrollRef, contentWidthKey, hoverRootClassName, onScrollLeftChange }: FundamentalModelHoverHorizontalScrollbarProps) => {
    const dragRef = useRef({ startX: 0, startScrollLeft: 0 })
    const [state, setState] = useState(defaultState)
    const [dragging, setDragging] = useState(false)

    const updateScrollbar = useCallback(() => {
      const scrollEl = scrollRef.current
      if (!scrollEl) return

      const { clientWidth, scrollLeft, scrollWidth } = scrollEl
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
      if (maxScrollLeft <= 1 || clientWidth <= 0 || scrollWidth <= 0) {
        setState(defaultState)
        return
      }

      const thumbWidth = Math.max(THUMB_MIN_W, (clientWidth / scrollWidth) * clientWidth)
      const maxThumbLeft = Math.max(0, clientWidth - thumbWidth)
      const thumbLeft = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0

      setState({
        scrollable: true,
        thumbLeft,
        thumbWidth,
      })
    }, [scrollRef])

    const handleThumbMouseDown = useCallback(
      (event: ReactMouseEvent<HTMLDivElement>) => {
        const scrollEl = scrollRef.current
        if (!scrollEl) return

        event.preventDefault()
        event.stopPropagation()
        dragRef.current = {
          startX: event.clientX,
          startScrollLeft: scrollEl.scrollLeft,
        }
        setDragging(true)
      },
      [scrollRef],
    )

    useEffect(() => {
      updateScrollbar()

      const scrollEl = scrollRef.current
      if (!scrollEl) return undefined

      const resizeObserver = new ResizeObserver(updateScrollbar)
      resizeObserver.observe(scrollEl)
      scrollEl.addEventListener('scroll', updateScrollbar)
      window.addEventListener('resize', updateScrollbar)

      return () => {
        resizeObserver.disconnect()
        scrollEl.removeEventListener('scroll', updateScrollbar)
        window.removeEventListener('resize', updateScrollbar)
      }
    }, [contentWidthKey, scrollRef, updateScrollbar])

    useEffect(() => {
      if (!dragging) return undefined

      const handleMouseMove = (event: globalThis.MouseEvent) => {
        const scrollEl = scrollRef.current
        if (!scrollEl) return

        const maxScrollLeft = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth)
        const maxThumbLeft = Math.max(0, scrollEl.clientWidth - state.thumbWidth)
        if (maxScrollLeft <= 0 || maxThumbLeft <= 0) return

        const deltaX = event.clientX - dragRef.current.startX
        const nextScrollLeft = dragRef.current.startScrollLeft + deltaX * (maxScrollLeft / maxThumbLeft)
        scrollEl.scrollLeft = Math.max(0, Math.min(nextScrollLeft, maxScrollLeft))
        onScrollLeftChange()
        updateScrollbar()
      }

      const handleMouseUp = () => {
        setDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.classList.add('no-select')

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.classList.remove('no-select')
      }
    }, [dragging, onScrollLeftChange, scrollRef, state.thumbWidth, updateScrollbar])

    if (!state.scrollable) return null

    return (
      <Box
        className="fm-volume-horizontal-scrollbar"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: THUMB_BOTTOM,
          height: THUMB_H,
          opacity: dragging ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 150ms ease',
          [`.${hoverRootClassName}:hover &`]: {
            opacity: 1,
          },
        }}
      >
        <Box
          onMouseDown={handleThumbMouseDown}
          sx={{
            position: 'absolute',
            left: `${state.thumbLeft}px`,
            top: 0,
            width: `${state.thumbWidth}px`,
            height: THUMB_H,
            bgcolor: 'gray.40',
            borderRadius: '4px',
            cursor: 'pointer',
            pointerEvents: 'auto',
            userSelect: 'none',
            '&:hover': {
              bgcolor: 'gray.50',
            },
          }}
        />
      </Box>
    )
  },
)

FundamentalModelHoverHorizontalScrollbar.displayName = 'FundamentalModelHoverHorizontalScrollbar'

export default FundamentalModelHoverHorizontalScrollbar
