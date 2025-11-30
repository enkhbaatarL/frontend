import { Box } from '@mui/material'
import {
  useRef,
  useState,
  useEffect,
  isValidElement,
  cloneElement,
  ForwardRefExoticComponent,
  ReactElement,
  RefObject,
  ReactNode,
} from 'react'

export interface GradientSideOption {
  display?: boolean
  height?: number
  color?: string
  offset?: number
}

interface GradientOverlayScrollProps {
  children: ReactNode
  top?: GradientSideOption
  bottom?: GradientSideOption
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

const hexToRgbObj = (hex: string) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  return { r, g, b }
}

const GradientOverlayScroll = ({
  children,
  top = { display: false },
  bottom = { display: false },
  inputRef,
}: GradientOverlayScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef || internalTextareaRef
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(false)

  const topBgColor = hexToRgbObj(top.color ?? '#fff')
  const bottomBgColor = hexToRgbObj(bottom.color ?? '#fff')

  useEffect(() => {
    const container = textareaRef.current || containerRef.current
    if (!container) return () => {}

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container as HTMLElement
      const offset = 4
      setShowTop(!!top.display && scrollTop > offset)
      setShowBottom(!!bottom.display && scrollTop + clientHeight + offset < scrollHeight)
    }

    updateScrollState()
    container.addEventListener('scroll', updateScrollState)
    const resizeObserver = new globalThis.ResizeObserver(updateScrollState)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [top.display, bottom.display, textareaRef])

  let content: ReactNode
  if (
    isValidElement(children) &&
    typeof children.type !== 'string' &&
    (children.type as ForwardRefExoticComponent<{ ref?: RefObject<HTMLTextAreaElement | null> }>).$$typeof?.toString() ===
      'Symbol(react.forward_ref)'
  ) {
    content = cloneElement(children as ReactElement<{ ref?: RefObject<HTMLTextAreaElement | null> }>, { ref: textareaRef })
  } else {
    content = (
      <div ref={containerRef} style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <Box position="relative" width="100%" height="100%">
      {showTop && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${top.offset ?? 0}px`,
            height: `${top.height ?? 16}px`,
            pointerEvents: 'none',
            background: `linear-gradient(
              to top,
              rgba(${topBgColor.r}, ${topBgColor.g}, ${topBgColor.b}, 0) 0%,
              rgba(${topBgColor.r}, ${topBgColor.g}, ${topBgColor.b}, 0.7) 40%,
              rgba(${topBgColor.r}, ${topBgColor.g}, ${topBgColor.b}, 1) 100%
            )`,
            zIndex: 1,
          }}
        />
      )}
      {content}
      {showBottom && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${bottom.offset ?? 0}px`,
            height: `${bottom.height ?? 16}px`,
            pointerEvents: 'none',
            background: `linear-gradient(
              to bottom,
              rgba(${bottomBgColor.r}, ${bottomBgColor.g}, ${bottomBgColor.b}, 0) 0%,
              rgba(${bottomBgColor.r}, ${bottomBgColor.g}, ${bottomBgColor.b}, 0.7) 40%,
              rgba(${bottomBgColor.r}, ${bottomBgColor.g}, ${bottomBgColor.b}, 1) 100%
            )`,
            zIndex: 1,
          }}
        />
      )}
    </Box>
  )
}

export default GradientOverlayScroll
