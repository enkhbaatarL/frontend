import { Stack } from '@mui/material'
import {
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type FormEvent as ReactFormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

const getNextGenMIPixelValue = (value?: string) => {
  const pixelValue = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(pixelValue) ? pixelValue : undefined
}

const getNextGenMISingleLineValue = (value: string) => value.replace(/[\r\n]+/g, ' ')

const useNextGenMIResizableHeight = (initialHeight: string, minResizeHeight: string, maxHeight?: string, resetKey?: number) => {
  const [height, setHeight] = useState(initialHeight)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    setHeight(initialHeight)
  }, [initialHeight, resetKey])

  const handleResizeStart = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startHeight = event.currentTarget.parentElement?.getBoundingClientRect().height ?? getNextGenMIPixelValue(height) ?? 0
    const minHeightValue = getNextGenMIPixelValue(minResizeHeight) ?? 0
    const maxHeightValue = getNextGenMIPixelValue(maxHeight)
    const previousUserSelect = document.body.style.userSelect

    setIsResizing(true)
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextHeight = startHeight + moveEvent.clientY - startY
      const clampedHeight = Math.max(minHeightValue, maxHeightValue ? Math.min(nextHeight, maxHeightValue) : nextHeight)

      setHeight(`${Math.round(clampedHeight)}px`)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = previousUserSelect
      globalThis.removeEventListener('mousemove', handleMouseMove)
      globalThis.removeEventListener('mouseup', handleMouseUp)
    }

    globalThis.addEventListener('mousemove', handleMouseMove)
    globalThis.addEventListener('mouseup', handleMouseUp)
  }

  return { height, isResizing, handleResizeStart }
}

const NextGenMIResizeHandle = ({
  disabled,
  onMouseDown,
}: {
  disabled?: boolean
  onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void
}) => (
  <Stack
    component="span"
    aria-hidden
    className="next-gen-mi-resize-handle"
    position="absolute"
    right="6px"
    bottom="4px"
    width="16px"
    height="16px"
    color={disabled ? '#CED4DA' : '#868E96'}
    onMouseDown={disabled ? undefined : onMouseDown}
    sx={{
      cursor: disabled ? 'default' : 'ns-resize',
      pointerEvents: disabled ? 'none' : 'auto',
      zIndex: 2,
    }}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 10L10 14M14 5.33333L5.33333 14"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Stack>
)

const NextGenMIResizableTextarea = ({
  value,
  maxLength,
  minHeight,
  minResizeHeight = minHeight,
  maxHeight,
  resetKey,
  disabled,
  ariaLabel,
  placeholder,
  borderColor = 'contentBorder.Normal',
  bgcolor = 'commonColor.White',
  color = 'contentText.Normal',
  fontSize = '14px',
  fontWeight = 500,
  padding = '20px',
  hoverBgcolor,
  preventLineBreak,
  onBlur,
  onChange,
  onMaxLengthExceeded,
}: {
  value: string
  maxLength: number
  minHeight: string
  minResizeHeight?: string
  maxHeight?: string
  resetKey?: number
  disabled?: boolean
  ariaLabel?: string
  placeholder?: string
  borderColor?: string
  bgcolor?: string
  color?: string
  fontSize?: string
  fontWeight?: number
  padding?: string
  hoverBgcolor?: string
  preventLineBreak?: boolean
  onBlur?: () => void
  onChange?: (value: string) => void
  onMaxLengthExceeded?: () => void
}) => {
  const { height, isResizing, handleResizeStart } = useNextGenMIResizableHeight(minHeight, minResizeHeight, maxHeight, resetKey)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollbarTrackRef = useRef<HTMLSpanElement | null>(null)
  const scrollbarSyncFrameRef = useRef(0)
  const [scrollbarState, setScrollbarState] = useState({ visible: false, thumbHeight: 0, thumbTop: 0 })
  const activeBgcolor = disabled ? bgcolor : 'gray.5'

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return undefined

    const syncScrollbar = () => {
      const scrollableHeight = textarea.scrollHeight - textarea.clientHeight
      const trackHeight = scrollbarTrackRef.current?.clientHeight ?? 0
      const visible = scrollableHeight > 1 && trackHeight > 0
      const thumbHeight = visible ? Math.max((textarea.clientHeight / textarea.scrollHeight) * trackHeight, 20) : 0
      const thumbTop = visible ? (textarea.scrollTop / scrollableHeight) * Math.max(trackHeight - thumbHeight, 0) : 0

      setScrollbarState((current) =>
        current.visible === visible && current.thumbHeight === thumbHeight && current.thumbTop === thumbTop
          ? current
          : { visible, thumbHeight, thumbTop },
      )
    }

    const scheduleSync = () => {
      if (scrollbarSyncFrameRef.current) return

      scrollbarSyncFrameRef.current = globalThis.requestAnimationFrame(() => {
        scrollbarSyncFrameRef.current = 0
        syncScrollbar()
      })
    }

    syncScrollbar()
    textarea.addEventListener('scroll', scheduleSync, { passive: true })
    const resizeObserver = new ResizeObserver(scheduleSync)
    resizeObserver.observe(textarea)

    return () => {
      if (scrollbarSyncFrameRef.current) {
        globalThis.cancelAnimationFrame(scrollbarSyncFrameRef.current)
        scrollbarSyncFrameRef.current = 0
      }
      textarea.removeEventListener('scroll', scheduleSync)
      resizeObserver.disconnect()
    }
  }, [height, value])

  const handleScrollbarThumbPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const textarea = textareaRef.current
    const track = scrollbarTrackRef.current
    if (!textarea || !track) return

    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startScrollTop = textarea.scrollTop
    const scrollableHeight = Math.max(0, textarea.scrollHeight - textarea.clientHeight)
    const maxThumbTop = Math.max(1, track.clientHeight - event.currentTarget.clientHeight)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      textarea.scrollTop = startScrollTop + ((moveEvent.clientY - startY) / maxThumbTop) * scrollableHeight
    }

    const handlePointerUp = () => {
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(preventLineBreak ? getNextGenMISingleLineValue(event.target.value) : event.target.value)
  }

  const handleBeforeInput = (event: ReactFormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = event.nativeEvent as InputEvent
    if (nativeEvent.isComposing || !nativeEvent.inputType.startsWith('insert') || !nativeEvent.data) return

    const textarea = event.currentTarget
    const insertedValue = preventLineBreak ? getNextGenMISingleLineValue(nativeEvent.data) : nativeEvent.data
    const selectionLength = textarea.selectionEnd - textarea.selectionStart

    if (value.length - selectionLength + insertedValue.length > maxLength) {
      onMaxLengthExceeded?.()
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (!preventLineBreak || event.key !== 'Enter' || event.nativeEvent.isComposing) return

    event.preventDefault()
    event.currentTarget.blur()
  }

  const handlePaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
    const pastedValue = event.clipboardData.getData('text')
    const nextPastedValue = preventLineBreak ? getNextGenMISingleLineValue(pastedValue) : pastedValue
    const textarea = event.currentTarget
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const availableLength = Math.max(maxLength - (value.length - (selectionEnd - selectionStart)), 0)

    if (nextPastedValue.length > availableLength) {
      onMaxLengthExceeded?.()
    }

    if (!preventLineBreak || !onChange) return
    if (pastedValue === nextPastedValue) return

    event.preventDefault()

    const insertedValue = nextPastedValue.slice(0, availableLength)

    onChange(`${value.slice(0, selectionStart)}${insertedValue}${value.slice(selectionEnd)}`)
  }

  return (
    <Stack
      className="next-gen-mi-resizable-textarea"
      position="relative"
      width="100%"
      height={height}
      minHeight={minResizeHeight}
      maxHeight={maxHeight}
      bgcolor={bgcolor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="10px"
      boxSizing="border-box"
      color={color}
      overflow="hidden"
      sx={{
        backgroundColor: isResizing ? activeBgcolor : undefined,
        '&:hover': {
          backgroundColor: isResizing ? activeBgcolor : disabled || !hoverBgcolor ? bgcolor : hoverBgcolor,
        },
        '&:focus-within': {
          backgroundColor: activeBgcolor,
          borderColor: disabled ? borderColor : 'contentBorder.Active',
        },
        '&:hover .next-gen-mi-resize-handle, &:focus-within .next-gen-mi-resize-handle': {
          color: disabled ? '#CED4DA' : '#343A40',
        },
      }}
    >
      <Stack
        ref={textareaRef}
        component="textarea"
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        onBlur={onBlur}
        onBeforeInput={handleBeforeInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          border: 0,
          outline: 'none',
          bgcolor: 'transparent',
          boxSizing: 'border-box',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize,
          fontWeight,
          lineHeight: 1.5,
          overflow: 'auto',
          padding,
          paddingRight: `calc(${padding} + 16px)`,
          resize: 'none',
          scrollbarWidth: 'none',
          '&::placeholder': {
            color: 'contentText.Disabled',
          },
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      />
      <Stack
        component="span"
        ref={scrollbarTrackRef}
        aria-hidden
        position="absolute"
        top="4px"
        right="2px"
        bottom="24px"
        width="14px"
        sx={{
          opacity: scrollbarState.visible ? 1 : 0,
          pointerEvents: scrollbarState.visible ? 'auto' : 'none',
          transition: 'opacity 120ms ease',
        }}
      >
        <Stack
          component="span"
          onPointerDown={handleScrollbarThumbPointerDown}
          position="absolute"
          top={`${scrollbarState.thumbTop}px`}
          right="5px"
          width="4px"
          height={`${scrollbarState.thumbHeight}px`}
          borderRadius="4px"
          bgcolor="#CED4DA"
          sx={{
            cursor: 'grab',
            '&:hover': { bgcolor: '#ADB5BD' },
          }}
        />
      </Stack>
      <NextGenMIResizeHandle disabled={disabled} onMouseDown={handleResizeStart} />
    </Stack>
  )
}

export default NextGenMIResizableTextarea
