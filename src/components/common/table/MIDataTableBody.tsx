import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Skeleton, Stack, type SxProps, type Theme, Typography, type TypographyProps } from '@mui/material'
import { type GridColDef, type GridRowModel } from '@mui/x-data-grid'
import { isValidElement, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { dataTableColumnsToGridTemplate } from '@/components/common/table/dataTableGridColTemplate'
import MIDataTableCellText, { MI_DATA_TABLE_BODY_LINE_HEIGHT_DEFAULT } from '@/components/common/table/MIDataTableCellText'
import { type MIDataTableRowHeaderOptions, MI_DATA_TABLE_ROW_HEADER_DEFAULT_Z_INDEX } from '@/components/common/table/MIDataTableHeader'
import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'

export const MI_DATA_TABLE_BODY_TOP_PADDING_DEFAULT_PX = 4
export const MI_DATA_TABLE_BODY_DEFAULT_CELL_PX = 12

const SKELETON_ROW_MIN_HEIGHT_WHEN_ROW_HEIGHT_AUTO_PX = 48
const ROW_HOVER_BORDER_RADIUS = '10px'
const DETAIL_SHORTCUT_HOVER_MS = 220
const DETAIL_SHORTCUT_HOVER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SCROLL_EDGE_EPSILON_PX = 2

const FLOATING_SCROLLBAR_TRACK_WIDTH_PX = 6
const FLOATING_SCROLLBAR_THUMB_DEFAULT_WIDTH_PX = 6
const FLOATING_SCROLLBAR_THUMB_DEFAULT_COLOR = '#CED4DA'
const FLOATING_SCROLLBAR_THUMB_DEFAULT_HOVER_COLOR = '#ADB5BD'
export const MI_DATA_TABLE_FLOATING_THUMB_INSET_DEFAULT_PX = 6

const EDGE_SHADOW_DEFAULT_COLOR = 'rgba(0, 0, 0, 0.18)'
const EDGE_SHADOW_DEFAULT_FADE_HEIGHT_PX = 20
const EDGE_SHADOW_TRANSITION = 'opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)'

const toSxArray = (sx?: SxProps<Theme>) => (Array.isArray(sx) ? sx : sx ? [sx] : [])

export type MIDataTableBodyScrollType = 'default' | 'floating'
export type MIDataTableBodyFloatingPlacement = 'inner' | 'outer'

export interface MIDataTableBodyEdgeShadowOptions {
  color?: string
  fadeHeightPx?: number
}

export interface MIDataTableBodyThumbInset {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface MIDataTableBodyScrollOptions {
  maxHeight?: number | string
  height?: number | string
  type?: MIDataTableBodyScrollType
  floatingPlacement?: MIDataTableBodyFloatingPlacement
  showThumbOnHover?: boolean
  floatingThumbWidth?: number
  floatingThumbColor?: string
  floatingThumbHoverColor?: string
  edgeShadow?: boolean | MIDataTableBodyEdgeShadowOptions
  stickyHeader?: ReactNode
  thumbInset?: MIDataTableBodyThumbInset
  edgeShadowOffsetTop?: number
  overflowX?: 'auto' | 'hidden'
}

export interface MIDataTableBodyProps<T extends GridRowModel> {
  rowId?: keyof T
  columns: GridColDef<T>[]
  rows?: T[]
  loading?: boolean
  skeletonRowCount?: number
  showCellSkeleton?: (col: GridColDef<T>) => boolean
  noRowMessage?: string
  /** 빈 목록 커스텀 오버레이(noRowMessage 대신 사용) */
  noRowsOverlay?: ReactNode
  disableHover?: boolean
  disableHoverState?: boolean
  rowHeight?: number
  getRowKey?: (row: T, index: number) => string | number
  getRowClassName?: (params: { row: T }) => string
  onRowClick?: (params: { row: T }) => void
  onRowMouseEnter?: (params: { row: T }) => void
  onRowMouseLeave?: () => void
  sx?: SxProps<Theme>
  rowSx?: SxProps<Theme>
  rowGap?: number | string
  getCellSx?: (params: { field: string; row?: T }) => SxProps<Theme>
  hideLastRowBorder?: boolean
  hideInnerRowBorder?: boolean
  primitiveCellTypographyVariant?: TypographyProps['variant']
  primitiveCellLineHeight?: number | string
  cellPx?: number | string
  cellPy?: number | string
  shouldShowEllipsisTooltip?: (params: { col: GridColDef<T>; value: unknown }) => boolean
  detailShortcutColumnField?: string
  onDetailShortcutClick?: (params: { row: T }) => void
  topPaddingPx?: number
  scroll?: MIDataTableBodyScrollOptions
  rowHeader?: MIDataTableRowHeaderOptions
}

const renderCellContentToNode = (content: unknown): ReactNode => {
  if (content === null || content === undefined) return null
  if (isValidElement(content)) return content
  if (typeof content === 'string' || typeof content === 'number') return content
  return String(content)
}

const defaultShowCellSkeleton = <T extends GridRowModel>(col: GridColDef<T>) => String(col.headerName ?? '').trim() !== ''

const defaultShouldShowEllipsisTooltip = <T extends GridRowModel>({ col, value }: { col: GridColDef<T>; value: unknown }) =>
  !col.renderCell && typeof value === 'string' && value.length > 0

const DefaultEllipsisTooltip = ({
  value,
  children,
  textAlign,
}: {
  value: string
  children: ReactNode
  textAlign: 'left' | 'center' | 'right'
}) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)

  if (!isEllipsis) {
    return (
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign,
        }}
      >
        {children}
      </Box>
    )
  }

  return (
    <MIFollowCursorTooltip title={value}>
      <Box
        ref={ref}
        sx={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign,
        }}
      >
        {children}
      </Box>
    </MIFollowCursorTooltip>
  )
}

const cellJustifyContent = (align?: GridColDef['align']) => (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start')

const cellTextAlign = (align?: GridColDef['align']): 'left' | 'center' | 'right' =>
  align === 'right' ? 'right' : align === 'center' ? 'center' : 'left'

interface ScrollableHostProps {
  scroll: MIDataTableBodyScrollOptions
  rowHeaderColIndex?: number
  children: ReactNode
}

interface DragState {
  axis: 'y' | 'x' | null
  start: number
  startScroll: number
}

const ScrollableHost = ({ scroll, rowHeaderColIndex, children }: ScrollableHostProps) => {
  const {
    maxHeight,
    height,
    type = 'default',
    floatingPlacement = 'outer',
    showThumbOnHover = false,
    floatingThumbWidth = FLOATING_SCROLLBAR_THUMB_DEFAULT_WIDTH_PX,
    floatingThumbColor = FLOATING_SCROLLBAR_THUMB_DEFAULT_COLOR,
    floatingThumbHoverColor = FLOATING_SCROLLBAR_THUMB_DEFAULT_HOVER_COLOR,
    edgeShadow,
    stickyHeader,
    thumbInset,
    edgeShadowOffsetTop,
    overflowX = 'hidden',
  } = scroll

  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null)
  const yTrackRef = useRef<HTMLDivElement | null>(null)
  const xTrackRef = useRef<HTMLDivElement | null>(null)
  const yThumbRef = useRef<HTMLDivElement | null>(null)
  const xThumbRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const dragStateRef = useRef<DragState>({ axis: null, start: 0, startScroll: 0 })

  const [yThumbSize, setYThumbSize] = useState(0)
  const [yThumbPos, setYThumbPos] = useState(0)
  const [xThumbSize, setXThumbSize] = useState(0)
  const [xThumbPos, setXThumbPos] = useState(0)
  const [isYScrollable, setIsYScrollable] = useState(false)
  const [isXScrollable, setIsXScrollable] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [isDragging, setIsDragging] = useState<'y' | 'x' | null>(null)
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0)
  const [rowHeaderWidth, setRowHeaderWidth] = useState(0)

  const isHorizontalEnabled = overflowX === 'auto'
  const isFloating = type === 'floating'
  const isOuter = floatingPlacement === 'outer'
  const useFloatingThumb = isFloating

  const floatingThumbPad = useFloatingThumb ? MI_DATA_TABLE_FLOATING_THUMB_INSET_DEFAULT_PX : 0
  const manualInsetTop = thumbInset?.top ?? floatingThumbPad
  const manualInsetBottom = thumbInset?.bottom ?? floatingThumbPad
  const manualInsetLeft = thumbInset?.left ?? (isHorizontalEnabled ? floatingThumbPad : 0)
  const manualInsetRight = thumbInset?.right ?? (isHorizontalEnabled ? floatingThumbPad : 0)
  const effectiveInsetTop = stickyHeaderHeight + manualInsetTop
  const effectiveInsetBottom = manualInsetBottom
  const effectiveInsetLeft = rowHeaderWidth + manualInsetLeft
  const effectiveInsetRight = manualInsetRight
  const thumbTrackOffset = Math.max(0, (FLOATING_SCROLLBAR_TRACK_WIDTH_PX - floatingThumbWidth) / 2)

  const sync = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollHeight, clientHeight, scrollTop, scrollWidth, clientWidth, scrollLeft } = container
    const yScrollable = scrollHeight > clientHeight + SCROLL_EDGE_EPSILON_PX
    const xScrollable = scrollWidth > clientWidth + SCROLL_EDGE_EPSILON_PX

    setIsYScrollable(yScrollable)
    setIsXScrollable(xScrollable)
    setCanScrollUp(yScrollable && scrollTop > SCROLL_EDGE_EPSILON_PX)
    setCanScrollDown(yScrollable && scrollTop + clientHeight < scrollHeight - SCROLL_EDGE_EPSILON_PX)

    if (useFloatingThumb) {
      // outer: 그리드 트랙이 0으로 붕괴되는 경우 대비 실측 높이·너비 사용
      const yViewportHeight =
        isOuter && yTrackRef.current && yTrackRef.current.clientHeight > 0 ? yTrackRef.current.clientHeight : clientHeight
      const xViewportWidth = isOuter && xTrackRef.current && xTrackRef.current.clientWidth > 0 ? xTrackRef.current.clientWidth : clientWidth

      if (yScrollable) {
        const trackHeight = Math.max(0, yViewportHeight - effectiveInsetTop - effectiveInsetBottom)
        const rawThumbHeight = trackHeight > 0 && scrollHeight > 0 ? (clientHeight / scrollHeight) * trackHeight : 0
        const nextThumbHeight = Math.max(0, rawThumbHeight)
        const maxScrollTop = Math.max(0, scrollHeight - clientHeight)
        const maxThumbTravel = Math.max(0, trackHeight - nextThumbHeight)
        const scrollRatio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0
        setYThumbSize(nextThumbHeight)
        setYThumbPos(effectiveInsetTop + scrollRatio * maxThumbTravel)
      } else {
        setYThumbSize(0)
        setYThumbPos(0)
      }

      if (xScrollable && isHorizontalEnabled) {
        const trackWidth = Math.max(0, xViewportWidth - effectiveInsetLeft - effectiveInsetRight)
        const rawThumbWidth = trackWidth > 0 && scrollWidth > 0 ? (clientWidth / scrollWidth) * trackWidth : 0
        const nextThumbWidth = Math.max(0, rawThumbWidth)
        const maxScrollLeft = Math.max(0, scrollWidth - clientWidth)
        const maxThumbTravel = Math.max(0, trackWidth - nextThumbWidth)
        const scrollRatio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0
        setXThumbSize(nextThumbWidth)
        setXThumbPos(effectiveInsetLeft + scrollRatio * maxThumbTravel)
      } else {
        setXThumbSize(0)
        setXThumbPos(0)
      }
    }
  }, [useFloatingThumb, isOuter, isHorizontalEnabled, effectiveInsetTop, effectiveInsetBottom, effectiveInsetLeft, effectiveInsetRight])

  const scheduleSync = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        sync()
      })
    })
  }, [sync])

  useLayoutEffect(() => {
    if (!stickyHeader) {
      setStickyHeaderHeight(0)
      return undefined
    }
    const el = stickyHeaderRef.current
    if (!el) return undefined

    const measure = () => setStickyHeaderHeight(el.offsetHeight)
    measure()

    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [stickyHeader])

  useLayoutEffect(() => {
    if (rowHeaderColIndex === undefined || !isHorizontalEnabled) {
      setRowHeaderWidth(0)
      return undefined
    }
    const container = containerRef.current
    if (!container) return undefined

    const measure = () => {
      const cell = container.querySelector<HTMLElement>('[data-row-header="true"]')
      setRowHeaderWidth(cell?.offsetWidth ?? 0)
    }
    measure()

    const ro = new ResizeObserver(() => measure())
    ro.observe(container)
    return () => ro.disconnect()
  }, [rowHeaderColIndex, isHorizontalEnabled])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return undefined

    scheduleSync()

    container.addEventListener('scroll', sync)
    window.addEventListener('resize', scheduleSync)

    const resizeObserver = new ResizeObserver(() => {
      scheduleSync()
    })
    resizeObserver.observe(content)
    resizeObserver.observe(container)
    const yTrackEl = yTrackRef.current
    const xTrackEl = xTrackRef.current
    if (yTrackEl) resizeObserver.observe(yTrackEl)
    if (xTrackEl) resizeObserver.observe(xTrackEl)

    return () => {
      container.removeEventListener('scroll', sync)
      window.removeEventListener('resize', scheduleSync)
      resizeObserver.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [sync, scheduleSync, isYScrollable, isXScrollable])

  const handleYThumbMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    dragStateRef.current = { axis: 'y', start: e.clientY, startScroll: containerRef.current.scrollTop }
    setIsDragging('y')
  }, [])

  const handleXThumbMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()
    dragStateRef.current = { axis: 'x', start: e.clientX, startScroll: containerRef.current.scrollLeft }
    setIsDragging('x')
  }, [])

  useEffect(() => {
    if (!isDragging) return undefined

    const handleMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container || !dragStateRef.current.axis) return

      if (dragStateRef.current.axis === 'y') {
        const { scrollHeight, clientHeight } = container
        const maxScrollTop = scrollHeight - clientHeight
        if (maxScrollTop <= 0) return
        const yViewportHeight =
          isOuter && yTrackRef.current && yTrackRef.current.clientHeight > 0 ? yTrackRef.current.clientHeight : clientHeight
        const trackHeight = Math.max(0, yViewportHeight - effectiveInsetTop - effectiveInsetBottom)
        const currentThumbHeight = scrollHeight > 0 ? (clientHeight / scrollHeight) * trackHeight : 0
        const maxThumbTravel = Math.max(0, trackHeight - currentThumbHeight)
        if (maxThumbTravel <= 0) return
        const deltaY = e.clientY - dragStateRef.current.start
        const newScrollTop = dragStateRef.current.startScroll + deltaY * (maxScrollTop / maxThumbTravel)
        container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop))
        sync()
      } else {
        const { scrollWidth, clientWidth } = container
        const maxScrollLeft = scrollWidth - clientWidth
        if (maxScrollLeft <= 0) return
        const xViewportWidth =
          isOuter && xTrackRef.current && xTrackRef.current.clientWidth > 0 ? xTrackRef.current.clientWidth : clientWidth
        const trackWidth = Math.max(0, xViewportWidth - effectiveInsetLeft - effectiveInsetRight)
        const currentThumbWidth = scrollWidth > 0 ? (clientWidth / scrollWidth) * trackWidth : 0
        const maxThumbTravel = Math.max(0, trackWidth - currentThumbWidth)
        if (maxThumbTravel <= 0) return
        const deltaX = e.clientX - dragStateRef.current.start
        const newScrollLeft = dragStateRef.current.startScroll + deltaX * (maxScrollLeft / maxThumbTravel)
        container.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft))
        sync()
      }
    }

    const handleUp = () => {
      dragStateRef.current = { axis: null, start: 0, startScroll: 0 }
      setIsDragging(null)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    document.body.classList.add('no-select')

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.classList.remove('no-select')
    }
  }, [isDragging, isOuter, sync, effectiveInsetTop, effectiveInsetBottom, effectiveInsetLeft, effectiveInsetRight])

  const edgeShadowConfig = useMemo<MIDataTableBodyEdgeShadowOptions | null>(() => {
    if (!edgeShadow) return null
    if (typeof edgeShadow === 'object') return edgeShadow
    return {}
  }, [edgeShadow])

  const edgeShadowColor = edgeShadowConfig?.color ?? EDGE_SHADOW_DEFAULT_COLOR
  const edgeShadowFadeHeight = edgeShadowConfig?.fadeHeightPx ?? EDGE_SHADOW_DEFAULT_FADE_HEIGHT_PX
  const resolvedEdgeShadowOffsetTop = edgeShadowOffsetTop ?? stickyHeaderHeight

  const showOuterYTrack = isOuter && useFloatingThumb && isYScrollable
  const showOuterXTrack = isOuter && useFloatingThumb && isXScrollable && isHorizontalEnabled
  const outerTrackSpan = FLOATING_SCROLLBAR_TRACK_WIDTH_PX + floatingThumbPad * 2
  const outerYTrackWidth = showOuterYTrack ? outerTrackSpan : 0
  const outerXTrackHeight = showOuterXTrack ? outerTrackSpan : 0

  const hostSizeSx = height !== undefined ? { height, minHeight: 0 } : maxHeight !== undefined ? { maxHeight } : {}

  const hoverThumbSx =
    useFloatingThumb && showThumbOnHover
      ? {
        '& .mi-data-table-body-floating-thumb': {
          opacity: isDragging ? 1 : 0,
          transition: 'opacity 150ms ease',
          pointerEvents: isDragging ? 'auto' : 'none',
        },
        ...(!isDragging
          ? {
            '&:hover .mi-data-table-body-floating-thumb': {
              opacity: 1,
              pointerEvents: 'auto',
            },
          }
          : {}),
      }
      : {}

  const scrollContainerSx: SxProps<Theme> = {
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    minWidth: 0,
    overflowY: 'auto',
    overflowX: isHorizontalEnabled ? 'auto' : 'hidden',
    overscrollBehavior: 'none',
    boxSizing: 'border-box',
    ...(useFloatingThumb
      ? {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }
      : {}),
  }

  const scrollAreaContent = (
    <>
      {stickyHeader && (
        <Box
          ref={stickyHeaderRef}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 4,
            isolation: 'isolate',
            width: '100%',
            minWidth: '100%',
            flexShrink: 0,
            ...(isHorizontalEnabled ? { width: 'max-content', minWidth: '100%' } : {}),
            '& > *': {
              width: '100%',
              minWidth: '100%',
            },
          }}
        >
          {stickyHeader}
        </Box>
      )}
      <Box ref={contentRef} sx={isHorizontalEnabled ? { width: 'max-content', minWidth: '100%' } : undefined}>
        {children}
      </Box>
    </>
  )

  const yThumbSx = {
    position: 'absolute' as const,
    top: `${yThumbPos}px`,
    width: floatingThumbWidth,
    height: `${yThumbSize}px`,
    backgroundColor: floatingThumbColor,
    borderRadius: '10px',
    transition: isDragging === 'y' ? 'none' : 'top 0.1s, opacity 150ms ease',
    cursor: 'pointer',
    userSelect: 'none' as const,
    zIndex: 5,
    '&:hover': {
      backgroundColor: floatingThumbHoverColor,
    },
  }

  const xThumbSx = {
    position: 'absolute' as const,
    left: `${xThumbPos}px`,
    height: floatingThumbWidth,
    width: `${xThumbSize}px`,
    backgroundColor: floatingThumbColor,
    borderRadius: '10px',
    transition: isDragging === 'x' ? 'none' : 'left 0.1s, opacity 150ms ease',
    cursor: 'pointer',
    userSelect: 'none' as const,
    zIndex: 5,
    '&:hover': {
      backgroundColor: floatingThumbHoverColor,
    },
  }

  const edgeShadows = edgeShadowConfig ? (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: `${resolvedEdgeShadowOffsetTop}px`,
          left: 0,
          right: 0,
          height: edgeShadowFadeHeight,
          opacity: canScrollUp ? 1 : 0,
          transition: EDGE_SHADOW_TRANSITION,
          pointerEvents: 'none',
          zIndex: 3,
          background: `linear-gradient(to bottom, ${edgeShadowColor} 0%, transparent 100%)`,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: edgeShadowFadeHeight,
          opacity: canScrollDown ? 1 : 0,
          transition: EDGE_SHADOW_TRANSITION,
          pointerEvents: 'none',
          zIndex: 3,
          background: `linear-gradient(to top, ${edgeShadowColor} 0%, transparent 100%)`,
        }}
      />
    </>
  ) : null

  if (!isOuter || !useFloatingThumb) {
    return (
      <Box
        sx={{
          position: 'relative',
          ...hostSizeSx,
          boxSizing: 'border-box',
          ...hoverThumbSx,
        }}
      >
        <Box ref={containerRef} sx={scrollContainerSx}>
          {scrollAreaContent}
        </Box>

        {useFloatingThumb && isYScrollable && (
          <Box
            ref={yThumbRef}
            onMouseDown={handleYThumbMouseDown}
            className="mi-data-table-body-floating-thumb"
            sx={{
              ...yThumbSx,
              right: floatingThumbPad + thumbTrackOffset,
            }}
          />
        )}

        {useFloatingThumb && isXScrollable && isHorizontalEnabled && (
          <Box
            ref={xThumbRef}
            onMouseDown={handleXThumbMouseDown}
            className="mi-data-table-body-floating-thumb"
            sx={{
              ...xThumbSx,
              bottom: floatingThumbPad + thumbTrackOffset,
            }}
          />
        )}

        {edgeShadows}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        ...hostSizeSx,
        boxSizing: 'border-box',
        ...hoverThumbSx,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          height: '100%',
          minHeight: 0,
          gridTemplateColumns: showOuterYTrack ? `minmax(0, 1fr) ${outerYTrackWidth}px` : 'minmax(0, 1fr)',
          gridTemplateRows: showOuterXTrack ? `minmax(0, 1fr) ${outerXTrackHeight}px` : 'minmax(0, 1fr)',
        }}
      >
        <Box ref={containerRef} sx={{ ...scrollContainerSx, gridColumn: 1, gridRow: 1 }}>
          {scrollAreaContent}
        </Box>

        {showOuterYTrack && (
          <Box
            ref={yTrackRef}
            sx={{
              gridColumn: 2,
              gridRow: 1,
              position: 'relative',
              alignSelf: 'stretch',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              ref={yThumbRef}
              onMouseDown={handleYThumbMouseDown}
              className="mi-data-table-body-floating-thumb"
              sx={{
                ...yThumbSx,
                right: floatingThumbPad + thumbTrackOffset,
              }}
            />
          </Box>
        )}

        {showOuterXTrack && (
          <Box
            ref={xTrackRef}
            sx={{
              gridColumn: 1,
              gridRow: 2,
              position: 'relative',
              alignSelf: 'stretch',
              width: '100%',
              minWidth: 0,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              ref={xThumbRef}
              onMouseDown={handleXThumbMouseDown}
              className="mi-data-table-body-floating-thumb"
              sx={{
                ...xThumbSx,
                bottom: floatingThumbPad + thumbTrackOffset,
              }}
            />
          </Box>
        )}

        {showOuterYTrack && showOuterXTrack && (
          <Box
            aria-hidden
            sx={{
              gridColumn: 2,
              gridRow: 2,
              flexShrink: 0,
            }}
          />
        )}
      </Box>

      {edgeShadows}
    </Box>
  )
}

const MIDataTableBody = <T extends GridRowModel>({
  rowId,
  columns,
  rows,
  loading,
  skeletonRowCount,
  showCellSkeleton,
  noRowMessage,
  noRowsOverlay,
  disableHover,
  disableHoverState,
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  rowHeight,
  getRowKey,
  getRowClassName,
  hideLastRowBorder,
  hideInnerRowBorder,
  primitiveCellTypographyVariant,
  primitiveCellLineHeight,
  cellPx,
  cellPy,
  rowSx,
  rowGap,
  getCellSx,
  sx,
  shouldShowEllipsisTooltip,
  detailShortcutColumnField,
  onDetailShortcutClick,
  topPaddingPx,
  scroll,
  rowHeader,
}: MIDataTableBodyProps<T>) => {
  const cellPxValue =
    cellPx !== undefined ? (typeof cellPx === 'number' ? `${cellPx}px` : cellPx) : `${MI_DATA_TABLE_BODY_DEFAULT_CELL_PX}px`
  const cellPyValue = cellPy !== undefined ? (typeof cellPy === 'number' ? `${cellPy}px` : cellPy) : undefined

  const primitiveVariant: TypographyProps['variant'] = primitiveCellTypographyVariant ?? 'body1M16'
  const primitiveBodySx = primitiveCellLineHeight !== undefined ? { lineHeight: primitiveCellLineHeight } : undefined

  const cellBoxSx = {
    px: cellPxValue,
    ...(cellPyValue !== undefined ? { py: cellPyValue } : {}),
    overflow: 'hidden',
    minWidth: 0,
    boxSizing: 'border-box' as const,
  }

  const hasFixedRowHeight = typeof rowHeight === 'number'
  const skeletonRows = Math.max(1, skeletonRowCount ?? 8)
  const resolveShowCellSkeleton = showCellSkeleton ?? defaultShowCellSkeleton
  const resolveShouldShowEllipsisTooltip = shouldShowEllipsisTooltip ?? defaultShouldShowEllipsisTooltip

  const rowSxArray = toSxArray(rowSx)
  const [hoveredRowKey, setHoveredRowKey] = useState<string | number | null>(null)
  const shouldTrackHover = !disableHover && !disableHoverState
  const enableHorizontalScroll = scroll?.overflowX === 'auto'
  const gridTemplateColumns = useMemo(
    () => dataTableColumnsToGridTemplate(columns, { enableHorizontalScroll }),
    [columns, enableHorizontalScroll],
  )

  const rowKey = (row: T, index: number) => (getRowKey ? getRowKey(row, index) : rowId ? row[rowId] : index)

  const resolvedTopPadding = topPaddingPx ?? MI_DATA_TABLE_BODY_TOP_PADDING_DEFAULT_PX

  const rowHeaderZIndex = rowHeader?.zIndex ?? MI_DATA_TABLE_ROW_HEADER_DEFAULT_Z_INDEX
  const getRowHeaderCellSx = (colIndex: number): SxProps<Theme> | undefined => {
    if (!rowHeader || colIndex !== rowHeader.colIndex) return undefined
    return {
      position: 'sticky',
      left: 0,
      zIndex: rowHeaderZIndex,
      // alignItems:center 유지 + 셀만 stretch → sticky 배경이 행 높이를 채움
      alignSelf: 'stretch',
    }
  }

  const rowGridAlignItems = hasFixedRowHeight ? 'center' : 'stretch'

  let body: ReactNode
  if (loading) {
    body = (
      <Stack gap={rowGap ?? 0}>
        {Array.from({ length: skeletonRows }).map((_, idx) => (
          <Box
            key={idx}
            sx={[
              (theme) => {
                const isLastSkeletonRow = idx === skeletonRows - 1
                const showBorder = (hideInnerRowBorder ? isLastSkeletonRow : true) && (!isLastSkeletonRow || !hideLastRowBorder)
                return {
                  display: 'grid',
                  gridTemplateColumns,
                  alignItems: rowGridAlignItems,
                  ...(hasFixedRowHeight ? { height: rowHeight } : { minHeight: SKELETON_ROW_MIN_HEIGHT_WHEN_ROW_HEIGHT_AUTO_PX }),
                  borderBottom: showBorder ? `1px solid ${theme.palette.contentBorder?.Normal ?? theme.palette.gray[40]}` : 'none',
                }
              },
              ...rowSxArray,
            ]}
          >
            {columns.map((col, colIdx) => (
              <Box
                key={col.field}
                data-row-header={rowHeader && colIdx === rowHeader.colIndex ? 'true' : undefined}
                sx={[
                  {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: cellJustifyContent(col.align),
                    ...cellBoxSx,
                  },
                  ...toSxArray(getRowHeaderCellSx(colIdx)),
                  ...toSxArray(getCellSx?.({ field: col.field })),
                ]}
              >
                {resolveShowCellSkeleton(col) ? (
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={hasFixedRowHeight && rowHeight ? Math.min(28, rowHeight - 8) : 28}
                    sx={{ maxWidth: '100%' }}
                  />
                ) : null}
              </Box>
            ))}
          </Box>
        ))}
      </Stack>
    )
  } else if (!rows || rows.length === 0) {
    body = (
      <Box
        sx={{
          width: '100%',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'gray.5',
          borderRadius: '10px',
        }}
      >
        {noRowsOverlay ?? (
          <Typography variant="body6" color="gray.60">
            {noRowMessage ?? 'No results found'}
          </Typography>
        )}
      </Box>
    )
  } else {
    body = (
      <Stack
        gap={rowGap ?? 0}
        sx={
          enableHorizontalScroll
            ? { width: 'max-content', minWidth: '100%', overflowX: 'visible' }
            : { width: '100%', minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }
        }
      >
        {rows.map((row, idx) => {
          const currentKey = rowKey(row, idx)
          const nextKey = idx < rows.length - 1 ? rowKey(rows[idx + 1], idx + 1) : null
          const isRowHovered = shouldTrackHover && hoveredRowKey === currentKey
          const isBeforeHoveredRow = shouldTrackHover && nextKey !== null && hoveredRowKey === nextKey

          return (
            <Box
              key={currentKey}
              onClick={onRowClick ? () => onRowClick({ row }) : undefined}
              onMouseEnter={() => {
                if (shouldTrackHover) {
                  setHoveredRowKey(currentKey)
                }
                onRowMouseEnter?.({ row })
              }}
              onMouseLeave={() => {
                if (shouldTrackHover) {
                  setHoveredRowKey(null)
                }
                onRowMouseLeave?.()
              }}
              className={getRowClassName?.({ row })}
              sx={[
                (theme) => {
                  const showDivider = hideInnerRowBorder
                    ? idx === rows.length - 1 && !hideLastRowBorder
                    : idx < rows.length - 1 || !hideLastRowBorder
                  const dividerColor = hideInnerRowBorder
                    ? (theme.palette.contentBorder?.Normal ?? theme.palette.mari[40])
                    : (theme.palette.contentBorder?.Normal ?? theme.palette.gray[40])
                  const rowHoverBgColor = theme.palette.gray[10]
                  const hideDividerForHover = showDivider && (isRowHovered || isBeforeHoveredRow)

                  return {
                    display: 'grid',
                    gridTemplateColumns,
                    alignItems: rowGridAlignItems,
                    ...(hasFixedRowHeight ? { height: rowHeight } : {}),
                    ...(enableHorizontalScroll
                      ? { width: 'max-content', minWidth: '100%' }
                      : { width: '100%', minWidth: 0, maxWidth: '100%' }),
                    position: 'relative',
                    zIndex: isRowHovered ? 1 : 0,
                    bgcolor: 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    borderBottom: showDivider ? `1px solid ${hideDividerForHover ? 'transparent' : dividerColor}` : 'none',
                    borderRadius: isRowHovered ? ROW_HOVER_BORDER_RADIUS : 0,
                    transition: 'background-color 120ms ease, border-color 120ms ease, border-radius 120ms ease',
                    ...(disableHover
                      ? {}
                      : {
                        '&:hover': {
                          backgroundColor: rowHoverBgColor,
                          borderBottomColor: 'transparent',
                          borderRadius: ROW_HOVER_BORDER_RADIUS,
                        },
                        '&:has(+ *:hover)': {
                          borderBottomColor: 'transparent',
                        },
                      }),
                  }
                },
                ...rowSxArray,
              ]}
            >
              {columns.map((col, colIdx) => {
                const value = (row as Record<string, unknown>)[col.field]
                const isRowHeaderCell = rowHeader !== undefined && colIdx === rowHeader.colIndex
                const rowHeaderCellSx = getRowHeaderCellSx(colIdx)
                const showDetailShortcutCell =
                  detailShortcutColumnField !== undefined && onDetailShortcutClick !== undefined && col.field === detailShortcutColumnField

                if (showDetailShortcutCell) {
                  return (
                    <Box
                      key={col.field}
                      data-row-header={isRowHeaderCell ? 'true' : undefined}
                      sx={[
                        {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: cellJustifyContent(col.align),
                          ...cellBoxSx,
                        },
                        ...toSxArray(rowHeaderCellSx),
                        ...toSxArray(getCellSx?.({ field: col.field, row })),
                      ]}
                    >
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          opacity: isRowHovered ? 1 : 0,
                          transition: `opacity ${DETAIL_SHORTCUT_HOVER_MS}ms ${DETAIL_SHORTCUT_HOVER_EASE}`,
                          pointerEvents: isRowHovered ? 'auto' : 'none',
                          '@media (prefers-reduced-motion: reduce)': {
                            transition: 'none',
                          },
                        }}
                      >
                        <MIBaseButton
                          variant="outlined"
                          enableHoverBackground
                          aria-label="상세 보기"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDetailShortcutClick({ row })
                          }}
                          sx={{
                            width: '22px',
                            minWidth: '0px',
                            height: '22px',
                            padding: '3px',
                            borderRadius: '4px',
                            backgroundColor: 'commonColor.White',
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 14, color: 'contentIcon.Enabled' }} />
                        </MIBaseButton>
                      </Box>
                    </Box>
                  )
                }

                const content = col.renderCell
                  ? col.renderCell({
                    value,
                    row,
                    field: col.field,
                    id: currentKey,
                    api: undefined,
                    rowNode: undefined,
                    colDef: col,
                    cellMode: 'view',
                    hasFocus: false,
                    tabIndex: 0,
                    formattedValue: value,
                    isEditable: false,
                  } as never)
                  : value
                const node = renderCellContentToNode(content)

                const textAlign = cellTextAlign(col.align)

                const shouldWrapEllipsisTooltip = resolveShouldShowEllipsisTooltip({ col, value })

                return (
                  <Box
                    key={col.field}
                    data-row-header={isRowHeaderCell ? 'true' : undefined}
                    sx={[
                      {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: cellJustifyContent(col.align),
                        ...cellBoxSx,
                      },
                      ...toSxArray(rowHeaderCellSx),
                      ...toSxArray(getCellSx?.({ field: col.field, row })),
                    ]}
                  >
                    {typeof node === 'string' || typeof node === 'number' ? (
                      <MIDataTableCellText
                        value={String(node)}
                        variant={primitiveVariant}
                        tooltipWhenTruncated
                        sx={[
                          {
                            flex: '1 1 0',
                            minWidth: 0,
                            width: '100%',
                            textAlign,
                            lineHeight: primitiveCellLineHeight ?? MI_DATA_TABLE_BODY_LINE_HEIGHT_DEFAULT,
                          },
                          ...(primitiveBodySx ? [primitiveBodySx] : []),
                        ]}
                      />
                    ) : shouldWrapEllipsisTooltip && typeof value === 'string' ? (
                      <DefaultEllipsisTooltip value={value} textAlign={textAlign}>
                        {node}
                      </DefaultEllipsisTooltip>
                    ) : (
                      node
                    )}
                  </Box>
                )
              })}
            </Box>
          )
        })}
      </Stack>
    )
  }

  const inner = (
    <Stack
      sx={[
        enableHorizontalScroll
          ? {
            width: 'max-content',
            minWidth: '100%',
            overflowX: 'visible',
            ...(resolvedTopPadding > 0 ? { pt: `${resolvedTopPadding}px` } : {}),
          }
          : {
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'hidden',
            ...(resolvedTopPadding > 0 ? { pt: `${resolvedTopPadding}px` } : {}),
          },
        ...(!scroll ? toSxArray(sx) : []),
      ]}
    >
      {body}
    </Stack>
  )

  if (!scroll) return inner

  return (
    <Box sx={toSxArray(sx)}>
      <ScrollableHost scroll={scroll} rowHeaderColIndex={rowHeader?.colIndex}>
        {inner}
      </ScrollableHost>
    </Box>
  )
}

export default MIDataTableBody
