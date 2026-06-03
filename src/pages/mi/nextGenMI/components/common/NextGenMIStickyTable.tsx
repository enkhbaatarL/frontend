import { Box, Skeleton, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

import {
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'

type NextGenMIStickyTableAlign = 'left' | 'center' | 'right'
type ScrollAxis = 'horizontal' | 'vertical' | null

export interface NextGenMIStickyTableColumn<T> {
  field: string
  headerName: ReactNode
  width: string
  minWidth?: string
  maxWidth?: string
  align?: NextGenMIStickyTableAlign
  headerAlign?: NextGenMIStickyTableAlign
  renderCell: (params: { row: T; rowIndex: number; column: NextGenMIStickyTableColumn<T> }) => ReactNode
  shouldRenderCell?: (params: { row: T; rowIndex: number; column: NextGenMIStickyTableColumn<T> }) => boolean
  getRowSpan?: (params: { row: T; rowIndex: number; column: NextGenMIStickyTableColumn<T> }) => number
  cellSx?: SxProps<Theme>
  headerCellSx?: SxProps<Theme>
}

interface NextGenMIStickyTableProps<T> {
  columns: NextGenMIStickyTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  fixedColumnIndexes?: number[]
  leftAlignedHeaderSticky?: boolean
  loading?: boolean
  noRowMessage?: string
  maxHeight?: string
  rowHeight?: string
  headerHeight?: string
  cellPadding?: string
  headerFontSize?: string
  bodyFontSize?: string
  bodyLineHeight?: number | string
  skeletonRowCount?: number
}

const STICKY_COLUMN_EDGE_SHADOW_SX = {
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: '-16px',
    bottom: 0,
    width: '16px',
    pointerEvents: 'none',
    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  },
} as const

const toSxArray = (sx?: SxProps<Theme>) => {
  if (Array.isArray(sx)) return sx
  if (sx) return [sx]
  return []
}

const resolveActiveScrollAxis = (updateAxis: boolean, deltaLeft: number, deltaTop: number): ScrollAxis => {
  if (!updateAxis) return null
  if (deltaLeft === 0 && deltaTop === 0) return null
  if (deltaLeft >= deltaTop) return 'horizontal'
  return 'vertical'
}

const normalizeFixedColumnIndexes = (indexes: number[] | undefined, columnCount: number) =>
  Array.from(new Set(indexes ?? []))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < columnCount)
    .sort((a, b) => a - b)

const toCssCalc = (parts: string[]) => (parts.length > 0 ? `calc(${parts.join(' + ')})` : '0px')

const getColumnAlign = <T,>(column: NextGenMIStickyTableColumn<T>) => column.align ?? 'left'

const getColumnStickyWidth = <T,>(column: NextGenMIStickyTableColumn<T>) => column.minWidth ?? column.width

const NextGenMIStickyTable = <T,>({
  columns,
  rows,
  getRowKey,
  fixedColumnIndexes,
  leftAlignedHeaderSticky = false,
  loading = false,
  noRowMessage = '표시할 데이터가 없습니다.',
  maxHeight,
  rowHeight = '48px',
  headerHeight = '36px',
  cellPadding = '12px',
  headerFontSize = '14px',
  bodyFontSize = '16px',
  bodyLineHeight = 1.4,
  skeletonRowCount = 8,
}: NextGenMIStickyTableProps<T>) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastScrollPositionRef = useRef({ left: 0, top: 0 })
  const fixedColumnIndexList = useMemo(
    () => normalizeFixedColumnIndexes(fixedColumnIndexes, columns.length),
    [columns.length, fixedColumnIndexes],
  )
  const fixedColumnIndexSet = useMemo(() => new Set(fixedColumnIndexList), [fixedColumnIndexList])
  const fixedColumnLeftMap = useMemo(() => {
    const next = new Map<number, string | number>()
    const widthParts: string[] = []

    fixedColumnIndexList.forEach((columnIndex) => {
      const column = columns.at(columnIndex)
      if (!column) return
      next.set(columnIndex, widthParts.length > 0 ? toCssCalc(widthParts) : 0)
      widthParts.push(getColumnStickyWidth(column))
    })

    return next
  }, [columns, fixedColumnIndexList])
  const fixedColumnsWidthParts = useMemo(
    () =>
      fixedColumnIndexList.flatMap((columnIndex) => {
        const column = columns.at(columnIndex)
        return column ? [getColumnStickyWidth(column)] : []
      }),
    [columns, fixedColumnIndexList],
  )
  const leftAlignedHeaderStickyLeft =
    fixedColumnsWidthParts.length > 0 ? `calc(${fixedColumnsWidthParts.join(' + ')} + ${cellPadding})` : cellPadding

  const [scrollState, setScrollState] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
    horizontal: false,
    vertical: false,
    activeAxis: null as ScrollAxis,
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
  })
  const [isScrollAreaHovered, setIsScrollAreaHovered] = useState(false)
  const [dragAxis, setDragAxis] = useState<ScrollAxis>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined

    const sync = (updateAxis = false) => {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = el
      const maxLeft = Math.max(0, scrollWidth - clientWidth)
      const maxTop = Math.max(0, scrollHeight - clientHeight)
      const deltaLeft = Math.abs(scrollLeft - lastScrollPositionRef.current.left)
      const deltaTop = Math.abs(scrollTop - lastScrollPositionRef.current.top)
      const activeAxis = resolveActiveScrollAxis(updateAxis, deltaLeft, deltaTop)
      const next = {
        left: scrollLeft > 1,
        right: scrollLeft < maxLeft - 1,
        up: scrollTop > 1,
        down: scrollTop < maxTop - 1,
        horizontal: maxLeft > 1,
        vertical: maxTop > 1,
        scrollLeft,
        scrollTop,
        scrollWidth,
        scrollHeight,
        clientWidth,
        clientHeight,
      }

      lastScrollPositionRef.current = { left: scrollLeft, top: scrollTop }

      setScrollState((prev) => {
        const nextActiveAxis = next.horizontal || next.vertical ? (activeAxis ?? prev.activeAxis) : null

        return prev.left === next.left &&
          prev.right === next.right &&
          prev.up === next.up &&
          prev.down === next.down &&
          prev.horizontal === next.horizontal &&
          prev.vertical === next.vertical &&
          prev.activeAxis === nextActiveAxis &&
          prev.scrollLeft === next.scrollLeft &&
          prev.scrollTop === next.scrollTop &&
          prev.scrollWidth === next.scrollWidth &&
          prev.scrollHeight === next.scrollHeight &&
          prev.clientWidth === next.clientWidth &&
          prev.clientHeight === next.clientHeight
          ? prev
          : { ...next, activeAxis: nextActiveAxis }
      })
    }

    sync()
    const handleScroll = () => sync(true)
    el.addEventListener('scroll', handleScroll, { passive: true })
    const ro = new ResizeObserver(() => sync())
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [columns.length, loading, rows.length])

  const handleScrollbarPointerDown = (axis: Exclude<ScrollAxis, null>) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    const track = event.currentTarget.parentElement
    if (!el || !track) return

    event.preventDefault()
    event.stopPropagation()
    setDragAxis(axis)

    const startPosition = axis === 'horizontal' ? event.clientX : event.clientY
    const startScroll = axis === 'horizontal' ? el.scrollLeft : el.scrollTop
    const maxScroll = axis === 'horizontal' ? Math.max(0, el.scrollWidth - el.clientWidth) : Math.max(0, el.scrollHeight - el.clientHeight)
    const trackSize = axis === 'horizontal' ? track.clientWidth : track.clientHeight
    const thumbSize = axis === 'horizontal' ? event.currentTarget.clientWidth : event.currentTarget.clientHeight
    const maxThumbTravel = Math.max(1, trackSize - thumbSize)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentPosition = axis === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
      const nextScroll = startScroll + ((currentPosition - startPosition) / maxThumbTravel) * maxScroll

      if (axis === 'horizontal') {
        el.scrollLeft = nextScroll
        return
      }
      el.scrollTop = nextScroll
    }

    const handlePointerUp = () => {
      setDragAxis(null)
      globalThis.removeEventListener('pointermove', handlePointerMove)
      globalThis.removeEventListener('pointerup', handlePointerUp)
    }

    globalThis.addEventListener('pointermove', handlePointerMove)
    globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  const showScrollbars = isScrollAreaHovered || dragAxis !== null
  const horizontalThumbWidth =
    scrollState.horizontal && scrollState.scrollWidth > 0 ? Math.max((scrollState.clientWidth / scrollState.scrollWidth) * 100, 8) : 0
  const horizontalThumbLeft =
    scrollState.horizontal && scrollState.scrollWidth > scrollState.clientWidth
      ? (scrollState.scrollLeft / (scrollState.scrollWidth - scrollState.clientWidth)) * (100 - horizontalThumbWidth)
      : 0
  const verticalThumbHeight =
    scrollState.vertical && scrollState.scrollHeight > 0 ? Math.max((scrollState.clientHeight / scrollState.scrollHeight) * 100, 8) : 0
  const verticalThumbTop =
    scrollState.vertical && scrollState.scrollHeight > scrollState.clientHeight
      ? (scrollState.scrollTop / (scrollState.scrollHeight - scrollState.clientHeight)) * (100 - verticalThumbHeight)
      : 0

  const renderHeaderCell = (column: NextGenMIStickyTableColumn<T>, columnIndex: number) => {
    const align = column.headerAlign ?? getColumnAlign(column)
    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
    const isLastFixedColumn = fixedColumnIndexList.at(-1) === columnIndex

    return (
      <Box
        key={column.field}
        component="th"
        data-fixed-column={isFixedColumn ? 'true' : undefined}
        sx={[
          {
            height: headerHeight,
            padding: `0 ${cellPadding}`,
            textAlign: align,
            fontSize: headerFontSize,
            fontWeight: 600,
            color: 'contentText.Black',
            borderBottom: '1px solid',
            borderColor: 'contentBorder.Normal',
            whiteSpace: 'nowrap',
            width: column.width,
            minWidth: column.minWidth ?? column.width,
            maxWidth: column.maxWidth ?? column.width,
            boxSizing: 'border-box',
            bgcolor: 'commonColor.White',
          },
          isFixedColumn && {
            position: 'sticky',
            left: fixedColumnLeftMap.get(columnIndex),
            zIndex: 4,
          },
          !leftAlignedHeaderSticky && isLastFixedColumn && scrollState.left && STICKY_COLUMN_EDGE_SHADOW_SX,
          !isFixedColumn && leftAlignedHeaderSticky && align === 'left' && { clipPath: 'inset(0)' },
          ...toSxArray(column.headerCellSx),
        ]}
      >
        <Box
          component="span"
          sx={[
            {
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
            !isFixedColumn &&
              leftAlignedHeaderSticky &&
              align === 'left' && {
              position: 'sticky',
              left: leftAlignedHeaderStickyLeft,
              width: 'fit-content',
              maxWidth: '100%',
            },
          ]}
        >
          {column.headerName}
        </Box>
      </Box>
    )
  }

  const renderBodyCell = (row: T, rowIndex: number, column: NextGenMIStickyTableColumn<T>, columnIndex: number) => {
    if (column.shouldRenderCell && !column.shouldRenderCell({ row, rowIndex, column })) return null

    const align = getColumnAlign(column)
    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
    const isLastFixedColumn = fixedColumnIndexList.at(-1) === columnIndex
    return (
      <Box
        key={column.field}
        component="td"
        rowSpan={column.getRowSpan?.({ row, rowIndex, column }) ?? 1}
        data-fixed-column={isFixedColumn ? 'true' : undefined}
        sx={[
          {
            padding: `0 ${cellPadding}`,
            textAlign: align,
            fontSize: bodyFontSize,
            fontWeight: 500,
            color: 'contentText.Black',
            borderBottom: '1px solid',
            borderColor: 'contentBorder.Normal',
            verticalAlign: 'middle',
            height: rowHeight,
            lineHeight: bodyLineHeight,
            whiteSpace: 'nowrap',
            overflow: isFixedColumn ? 'visible' : 'hidden',
            textOverflow: 'ellipsis',
            width: column.width,
            minWidth: column.minWidth ?? column.width,
            maxWidth: column.maxWidth ?? column.width,
            boxSizing: 'border-box',
            bgcolor: 'commonColor.White',
          },
          isFixedColumn && {
            position: 'sticky',
            left: fixedColumnLeftMap.get(columnIndex),
            zIndex: 2,
          },
          isLastFixedColumn && scrollState.left && STICKY_COLUMN_EDGE_SHADOW_SX,
          ...toSxArray(column.cellSx),
        ]}
      >
        {isFixedColumn ? (
          <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {column.renderCell({ row, rowIndex, column })}
          </Box>
        ) : (
          column.renderCell({ row, rowIndex, column })
        )}
      </Box>
    )
  }

  return (
    <Box
      onMouseEnter={() => setIsScrollAreaHovered(true)}
      onMouseLeave={() => setIsScrollAreaHovered(false)}
      sx={{ position: 'relative', width: '100%', overflow: 'hidden', bgcolor: 'commonColor.White', borderRadius: '10px' }}
    >
      <Box
        ref={scrollRef}
        sx={{
          width: '100%',
          ...(maxHeight ? { maxHeight } : {}),
          overflowX: 'auto',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          pr: scrollState.vertical ? '16px' : 0,
          pb: scrollState.horizontal ? '18px' : 0,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          component="table"
          sx={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            tableLayout: 'auto',
          }}
        >
          <Box
            component="thead"
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 3,
              bgcolor: 'commonColor.White',
              boxShadow: scrollState.activeAxis === 'vertical' && scrollState.up ? NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP : 'none',
            }}
          >
            <Box component="tr">{columns.map((column, columnIndex) => renderHeaderCell(column, columnIndex))}</Box>
          </Box>

          <Box component="tbody">
            {loading
              ? Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <Box component="tr" key={`event-detail-sticky-table-skeleton-${rowIndex}`}>
                  {columns.map((column, columnIndex) => (
                    <Box
                      key={column.field}
                      component="td"
                      sx={{
                        padding: `0 ${cellPadding}`,
                        borderBottom: '1px solid',
                        borderColor: 'contentBorder.Normal',
                        height: rowHeight,
                        width: column.width,
                        minWidth: column.minWidth ?? column.width,
                        maxWidth: column.maxWidth ?? column.width,
                        boxSizing: 'border-box',
                        bgcolor: 'commonColor.White',
                        overflow: fixedColumnIndexSet.has(columnIndex) ? 'visible' : 'hidden',
                        ...(fixedColumnIndexSet.has(columnIndex)
                          ? {
                            position: 'sticky',
                            left: fixedColumnLeftMap.get(columnIndex),
                            zIndex: 2,
                          }
                          : {}),
                        ...(fixedColumnIndexList.at(-1) === columnIndex && scrollState.left ? STICKY_COLUMN_EDGE_SHADOW_SX : {}),
                      }}
                    >
                      <Skeleton variant="rounded" height="18px" width={getColumnAlign(column) === 'center' ? '60%' : '80%'} />
                    </Box>
                  ))}
                </Box>
              ))
              : rows.map((row, rowIndex) => (
                <Box
                  component="tr"
                  key={getRowKey(row, rowIndex)}
                  sx={{
                    transition: 'background-color 120ms ease',
                    '&:hover:not(:has([data-fixed-column="true"]:hover)) td:not([data-fixed-column="true"])': {
                      backgroundColor: 'gray.10',
                    },
                  }}
                >
                  {columns.map((column, columnIndex) => renderBodyCell(row, rowIndex, column, columnIndex))}
                </Box>
              ))}
            {!loading && rows.length === 0 && (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={columns.length}
                  sx={{ height: rowHeight, borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}
                >
                  <Stack height={rowHeight} alignItems="center" justifyContent="center">
                    <Typography variant="body2M14" color="contentText.Normal">
                      {noRowMessage}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {scrollState.activeAxis === 'vertical' && scrollState.down && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: scrollState.vertical ? '16px' : 0,
            bottom: scrollState.horizontal ? '18px' : 0,
            left: 0,
            height: '1px',
            pointerEvents: 'none',
            boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
            zIndex: 5,
          }}
        />
      )}

      {fixedColumnIndexList.length === 0 && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: leftAlignedHeaderSticky ? headerHeight : 0,
            left: 0,
            bottom: scrollState.horizontal ? '18px' : 0,
            width: '100px',
            pointerEvents: 'none',
            background: 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
            opacity: scrollState.left ? 1 : 0,
            transition: 'opacity 180ms ease',
            zIndex: 5,
          }}
        />
      )}

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: leftAlignedHeaderSticky ? headerHeight : 0,
          right: scrollState.vertical ? '16px' : 0,
          bottom: scrollState.horizontal ? '18px' : 0,
          width: '100px',
          pointerEvents: 'none',
          background: 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
          opacity: scrollState.right ? 1 : 0,
          transition: 'opacity 180ms ease',
          zIndex: 5,
        }}
      />

      {scrollState.horizontal && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: 0,
            right: scrollState.vertical ? '18px' : 0,
            bottom: '4px',
            height: '10px',
            borderRadius: '10px',
            bgcolor: 'transparent',
            opacity: showScrollbars ? 1 : 0,
            pointerEvents: showScrollbars ? 'auto' : 'none',
            transition: 'opacity 120ms ease',
            zIndex: 6,
          }}
        >
          <Box
            onPointerDown={handleScrollbarPointerDown('horizontal')}
            sx={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${horizontalThumbLeft}%`,
              width: `${horizontalThumbWidth}%`,
              borderRadius: '10px',
              bgcolor: dragAxis === 'horizontal' ? '#868E96' : '#ADB5BD',
              cursor: dragAxis === 'horizontal' ? 'grabbing' : 'grab',
              '&:hover': { bgcolor: '#868E96' },
            }}
          />
        </Box>
      )}

      {scrollState.vertical && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            right: '4px',
            bottom: scrollState.horizontal ? '22px' : 0,
            width: '10px',
            borderRadius: '10px',
            bgcolor: 'transparent',
            opacity: showScrollbars ? 1 : 0,
            pointerEvents: showScrollbars ? 'auto' : 'none',
            transition: 'opacity 120ms ease',
            zIndex: 6,
          }}
        >
          <Box
            onPointerDown={handleScrollbarPointerDown('vertical')}
            sx={{
              position: 'absolute',
              left: '2px',
              right: '2px',
              top: `${verticalThumbTop}%`,
              height: `${verticalThumbHeight}%`,
              borderRadius: '10px',
              bgcolor: dragAxis === 'vertical' ? '#868E96' : '#ADB5BD',
              cursor: dragAxis === 'vertical' ? 'grabbing' : 'grab',
              '&:hover': { bgcolor: '#868E96' },
            }}
          />
        </Box>
      )}
    </Box>
  )
}

export default NextGenMIStickyTable
