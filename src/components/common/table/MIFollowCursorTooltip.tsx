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

const DefaultTooltipSx: SxProps<Theme> = (theme) => ({
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

export interface MIFollowCursorTooltipProps {
  title: ReactNode
  children: ReactElement
  enterDelay?: number
  tooltipSx?: SxProps<Theme>
  slotProps?: {
    popper?: { modifiers?: NonNullable<ComponentProps<typeof Popper>['modifiers']> }
  }
}

type AnyChildProps = Record<string, unknown>

interface PopperJsInstance {
  update?: () => void
}

const MIFollowCursorTooltip = ({ title, children, enterDelay = 100, tooltipSx, slotProps }: MIFollowCursorTooltipProps) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const posRef = useRef({ x: 0, y: 0 })
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const popperJsRef = useRef<PopperJsInstance | null>(null)

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current !== undefined) {
      clearTimeout(enterTimerRef.current)
      enterTimerRef.current = undefined
    }
  }, [])

  useEffect(
    () => () => {
      clearEnterTimer()
    },
    [clearEnterTimer],
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

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      scheduleOpen()
    },
    [scheduleOpen],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (open) {
        popperJsRef.current?.update?.()
      }
    },
    [open],
  )

  const handleMouseLeave = useCallback(() => {
    clearEnterTimer()
    setOpen(false)
  }, [clearEnterTimer])

  const resolvedTooltipSx: SxProps<Theme> = tooltipSx ?? DefaultTooltipSx

  const modifiers = useMemo(() => {
    const extra = slotProps?.popper?.modifiers ?? []
    return [{ name: 'offset', options: { offset: [-8, 8] } }, ...extra]
  }, [slotProps?.popper?.modifiers])

  const child = children as ReactElement<AnyChildProps>
  const childProps = child.props

  const mergedChild = cloneElement(child, {
    ...childProps,
    onMouseOver: chainEventHandlers(childProps.onMouseOver as ((e: MouseEvent) => void) | undefined, handleMouseOver),
    onMouseMove: chainEventHandlers(childProps.onMouseMove as ((e: MouseEvent) => void) | undefined, handleMouseMove),
    onMouseLeave: chainEventHandlers(childProps.onMouseLeave as ((e: MouseEvent) => void) | undefined, handleMouseLeave),
  })

  return (
    <>
      {mergedChild}
      <Popper
        open={open}
        anchorEl={virtualAnchor}
        placement="top-start"
        transition
        modifiers={modifiers}
        popperRef={(instance) => {
          popperJsRef.current = instance
        }}
        sx={{
          zIndex: (t) => t.zIndex.tooltip,
          pointerEvents: 'none',
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={theme.transitions.duration.shorter}>
            <Box sx={resolvedTooltipSx}>{title}</Box>
          </Grow>
        )}
      </Popper>
    </>
  )
}

export default MIFollowCursorTooltip
