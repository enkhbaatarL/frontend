import { Box } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState, MouseEvent } from 'react'
import ReactDOM from 'react-dom'

interface UseOverlayClickProps<T extends HTMLElement = HTMLElement> {
  open: boolean
  onClose?: () => void
  setAnchorEl?: (el: T | null) => void
  zIndex?: number
  borderRadius?: number
}

const OverlayBox = ({
  rect,
  onClick,
  zIndex,
  borderRadius,
}: Readonly<{
  rect: DOMRect
  onClick: () => void
  zIndex: number
  borderRadius: number
}>) => (
  <Box
    onClick={onClick}
    sx={{
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      backgroundColor: 'transparent',
      borderRadius,
      opacity: 1,
      cursor: 'pointer',
      zIndex,
    }}
  />
)

export const useOverlayClick = <T extends HTMLElement = HTMLElement>({
  open,
  onClose,
  setAnchorEl,
  zIndex = 1000,
  borderRadius = 1,
}: UseOverlayClickProps<T>) => {
  const triggerRef = useRef<T | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const handleOpen = useCallback(
    (e: MouseEvent<T>) => {
      const target = e.currentTarget

      if (target) {
        setRect(target.getBoundingClientRect())
        setAnchorEl?.(target)
      }
    },
    [setAnchorEl],
  )

  const handleClose = useCallback(() => {
    setAnchorEl?.(null)
    document.body.style.cursor = 'pointer'
    onClose?.()
  }, [setAnchorEl, onClose])

  const overlay = useMemo(() => {
    if (!open || !rect) return null

    return ReactDOM.createPortal(
      <OverlayBox rect={rect} onClick={handleClose} zIndex={zIndex} borderRadius={borderRadius} />,
      document.body,
    )
  }, [open, rect, handleClose, zIndex, borderRadius])

  useEffect(() => {
    const handleMouseMove = () => {
      if (document.body.style.cursor === 'pointer') {
        document.body.style.cursor = ''
      }
    }

    if (!open) {
      window.addEventListener('mousemove', handleMouseMove, { once: true })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [open])

  return {
    triggerRef,
    onTriggerClick: handleOpen,
    overlay,
    handleOverlayClose: handleClose,
  }
}
