import { Box, Grow, Popper, SxProps, Theme, useTheme } from '@mui/material'
import {
  cloneElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from 'react'

const TooltipSx: SxProps<Theme> = (theme) => ({
  bgcolor: '#202d44',
  color: theme.palette.common.white,
  px: '10px',
  py: '8px',
  borderRadius: '6px',
  maxWidth: 400,
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 400,
  letterSpacing: 0,
  whiteSpace: 'pre-line',
  fontFamily: theme.typography.fontFamily,
  boxSizing: 'border-box',
  '& .MuiTypography-root': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
  },
  '& p': {
    margin: 0,
  },
})

const chainEventHandlers =
  <E extends SyntheticEvent>(...handlers: (((e: E) => void) | undefined)[]) =>
    (e: E) =>
      handlers.forEach((h) => h?.(e))

export interface NextGenMIFollowCursorTooltipProps {
  title: ReactNode
  children: ReactElement
  enterDelay?: number
  followCursor?: boolean
  /** 툴팁으로 마우스를 옮겨 내용을 선택·복사할 수 있게 한다. */
  interactive?: boolean
  placement?: ComponentProps<typeof Popper>['placement']
  tooltipSx?: SxProps<Theme>
  slotProps?: {
    popper?: { modifiers?: NonNullable<ComponentProps<typeof Popper>['modifiers']> }
  }
}

type AnyChildProps = Record<string, unknown>

const NextGenMIFollowCursorTooltip = ({
  title,
  children,
  enterDelay = 100,
  followCursor = true,
  interactive = false,
  placement,
  tooltipSx,
  slotProps,
}: NextGenMIFollowCursorTooltipProps) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)
  const posRef = useRef({ x: 0, y: 0 })
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const popperJsRef = useRef<PopperJsInstance | null>(null)

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current !== undefined) {
      clearTimeout(enterTimerRef.current)
      enterTimerRef.current = undefined
    }
  }, [])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== undefined) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = undefined
    }
  }, [])

  useEffect(
    () => () => {
      clearEnterTimer()
      clearLeaveTimer()
    },
    [clearEnterTimer, clearLeaveTimer],
  )

  const virtualAnchor = useMemo(
    () => ({
      getBoundingClientRect: () => {
        const { x, y } = posRef.current
        return {
          width: 0,
          height: 0,
          top: y,
          left: x,
          right: x,
          bottom: y,
          x,
          y,
          toJSON: () => ({}),
        } as DOMRect
      },
    }),
    [],
  )

  const scheduleOpen = useCallback(() => {
    clearEnterTimer()
    enterTimerRef.current = setTimeout(() => setOpen(true), enterDelay)
  }, [clearEnterTimer, enterDelay])

  const updateCursorPosition = useCallback(
    (e: MouseEvent) => {
      if (!followCursor) return
      posRef.current = { x: e.clientX, y: e.clientY }
      if (open) popperJsRef.current?.update?.()
    },
    [followCursor, open],
  )

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      clearLeaveTimer()
      triggerRef.current = e.currentTarget as HTMLElement
      if (interactive) {
        // Dialog의 포커스 범위 안에 두되, paper의 overflow에는 잘리지 않게 한다.
        setPortalContainer(triggerRef.current.closest<HTMLElement>('.MuiDialog-container') ?? undefined)
      }
      if (followCursor) updateCursorPosition(e)
      else {
        setAnchorEl(e.currentTarget as HTMLElement)
      }
      scheduleOpen()
    },
    [clearLeaveTimer, followCursor, interactive, scheduleOpen, updateCursorPosition],
  )

  const handleMouseLeave = useCallback(() => {
    clearEnterTimer()
    clearLeaveTimer()
    const selection = tooltipRef.current?.ownerDocument.getSelection()
    if (
      interactive &&
      (isSelectingRef.current || (selection && !selection.isCollapsed && tooltipRef.current?.contains(selection.anchorNode)))
    )
      return
    if (interactive) {
      leaveTimerRef.current = setTimeout(() => setOpen(false), 200)
    } else {
      setOpen(false)
    }
  }, [clearEnterTimer, clearLeaveTimer, interactive])

  useEffect(() => {
    if (!interactive || !open) return undefined
    const doc = triggerRef.current?.ownerDocument
    if (!doc) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !tooltipRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const handlePointerUp = (event: PointerEvent) => {
      if (!isSelectingRef.current) return
      isSelectingRef.current = false
      if (event.target instanceof Node && !tooltipRef.current?.contains(event.target)) handleMouseLeave()
    }
    doc.addEventListener('pointerdown', handlePointerDown)
    doc.addEventListener('pointerup', handlePointerUp)
    doc.addEventListener('pointercancel', handlePointerUp)
    return () => {
      isSelectingRef.current = false
      doc.removeEventListener('pointerdown', handlePointerDown)
      doc.removeEventListener('pointerup', handlePointerUp)
      doc.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handleMouseLeave, interactive, open])

  const resolvedTooltipSx: SxProps<Theme> = [
    TooltipSx,
    ...(tooltipSx ? (Array.isArray(tooltipSx) ? tooltipSx : [tooltipSx]) : []),
    ...(interactive ? [{ userSelect: 'text', cursor: 'text' } as const] : []),
  ]

  const modifiers = useMemo(() => {
    const extra = slotProps?.popper?.modifiers ?? []
    return [{ name: 'offset', options: { offset: followCursor ? [-8, 8] : [0, 8] } }, ...extra]
  }, [followCursor, slotProps?.popper?.modifiers])

  const child = children as ReactElement<AnyChildProps>
  const childProps = child.props

  const mergedChild = cloneElement(child, {
    ...childProps,
    onMouseOver: chainEventHandlers(childProps.onMouseOver as ((e: MouseEvent) => void) | undefined, handleMouseOver),
    onMouseMove: chainEventHandlers(childProps.onMouseMove as ((e: MouseEvent) => void) | undefined, updateCursorPosition),
    onMouseDown: chainEventHandlers(childProps.onMouseDown as ((e: MouseEvent) => void) | undefined, updateCursorPosition),
    onMouseLeave: chainEventHandlers(childProps.onMouseLeave as ((e: MouseEvent) => void) | undefined, handleMouseLeave),
  })

  return (
    <>
      {mergedChild}
      <Popper
        open={open}
        container={interactive ? portalContainer : undefined}
        anchorEl={followCursor ? virtualAnchor : anchorEl}
        placement={placement ?? (followCursor ? 'top-start' : 'top')}
        transition
        modifiers={modifiers}
        popperRef={(instance) => {
          popperJsRef.current = instance
        }}
        onMouseEnter={interactive ? clearLeaveTimer : undefined}
        onMouseLeave={interactive ? handleMouseLeave : undefined}
        sx={{
          zIndex: (t) => t.zIndex.tooltip,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={theme.transitions.duration.shorter}>
            <Box
              ref={tooltipRef}
              tabIndex={interactive ? -1 : undefined}
              onPointerDown={
                interactive
                  ? (event) => {
                    if (event.button !== 0) return
                    clearLeaveTimer()
                    isSelectingRef.current = true
                  }
                  : undefined
              }
              sx={resolvedTooltipSx}
            >
              {title}
            </Box>
          </Grow>
        )}
      </Popper>
    </>
  )
}

interface PopperJsInstance {
  update?: () => void
}

export default NextGenMIFollowCursorTooltip
