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
  fixedLeftColumnIndexes?: number[]
  fixedRightColumnIndexes?: number[]
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

const STICKY_LEFT_COLUMN_EDGE_SHADOW_SX = {
  '--next-gen-mi-sticky-column-shadow-opacity': 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: '-16px',
    bottom: 0,
    width: '16px',
    pointerEvents: 'none',
    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
    opacity: 'var(--next-gen-mi-sticky-column-shadow-opacity)',
    transition: 'opacity 180ms ease',
  },
} as const

const STICKY_RIGHT_COLUMN_EDGE_SHADOW_SX = {
  '--next-gen-mi-sticky-column-shadow-opacity': 0,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '-16px',
    width: '16px',
    pointerEvents: 'none',
    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
    opacity: 'var(--next-gen-mi-sticky-column-shadow-opacity)',
    transition: 'opacity 180ms ease',
  },
} as const

const getStickyColumnShadowOpacitySx = (visible: boolean) => ({
  '--next-gen-mi-sticky-column-shadow-opacity': visible ? 1 : 0,
})

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

const normalizeFixedRightColumnIndexes = (indexes: number[] | undefined, columnCount: number) =>
  normalizeFixedColumnIndexes(
    indexes?.map((index) => (index < 0 ? columnCount + index : index)),
    columnCount,
  )

const toCssCalc = (parts: string[]) => (parts.length > 0 ? `calc(${parts.join(' + ')})` : '0px')

const getColumnAlign = <T,>(column: NextGenMIStickyTableColumn<T>) => column.align ?? 'left'

const getColumnStickyWidth = <T,>(column: NextGenMIStickyTableColumn<T>) => column.minWidth ?? column.width

const isLastFixedLeftColumnSticky = (scrollRoot: HTMLDivElement) => {
  const lastFixedColumn = scrollRoot.querySelector<HTMLElement>('thead [data-last-fixed-left-column="true"]')
  if (!lastFixedColumn) return false

  const stickyLeft = Number.parseFloat(globalThis.getComputedStyle(lastFixedColumn).left)
  if (!Number.isFinite(stickyLeft)) return false

  const stickyOffset = lastFixedColumn.getBoundingClientRect().left - scrollRoot.getBoundingClientRect().left - stickyLeft
  return stickyOffset <= 1
}

const isFirstFixedRightColumnSticky = (scrollRoot: HTMLDivElement) => {
  const firstFixedColumn = scrollRoot.querySelector<HTMLElement>('thead [data-first-fixed-right-column="true"]')
  if (!firstFixedColumn) return false

  const stickyRight = Number.parseFloat(globalThis.getComputedStyle(firstFixedColumn).right)
  if (!Number.isFinite(stickyRight)) return false

  const stickyOffset = scrollRoot.getBoundingClientRect().right - firstFixedColumn.getBoundingClientRect().right - stickyRight
  return stickyOffset <= 1
}

const getFixedColumnWidth = (scrollRoot: HTMLDivElement, selector: string) =>
  Array.from(scrollRoot.querySelectorAll<HTMLElement>(selector)).reduce((sum, column) => sum + column.getBoundingClientRect().width, 0)

const NextGenMIStickyTable = <T,>({
  columns,
  rows,
  getRowKey,
  fixedLeftColumnIndexes,
  fixedRightColumnIndexes,
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
  const fixedLeftColumnIndexList = useMemo(
    () => normalizeFixedColumnIndexes(fixedLeftColumnIndexes, columns.length),
    [columns.length, fixedLeftColumnIndexes],
  )
  const fixedRightColumnIndexList = useMemo(
    () =>
      normalizeFixedRightColumnIndexes(fixedRightColumnIndexes, columns.length).filter(
        (columnIndex) => !fixedLeftColumnIndexList.includes(columnIndex),
      ),
    [columns.length, fixedLeftColumnIndexList, fixedRightColumnIndexes],
  )
  const fixedLeftColumnIndexSet = useMemo(() => new Set(fixedLeftColumnIndexList), [fixedLeftColumnIndexList])
  const fixedRightColumnIndexSet = useMemo(() => new Set(fixedRightColumnIndexList), [fixedRightColumnIndexList])
  const fixedColumnIndexSet = useMemo(
    () => new Set([...fixedLeftColumnIndexList, ...fixedRightColumnIndexList]),
    [fixedLeftColumnIndexList, fixedRightColumnIndexList],
  )
  const lastFixedLeftColumnIndex = fixedLeftColumnIndexList.at(-1)
  const firstFixedRightColumnIndex = fixedRightColumnIndexList.at(0)
  const fixedLeftColumnLeftMap = useMemo(() => {
    const next = new Map<number, string | number>()
    const widthParts: string[] = []

    fixedLeftColumnIndexList.forEach((columnIndex) => {
      const column = columns.at(columnIndex)
      if (!column) return
      next.set(columnIndex, widthParts.length > 0 ? toCssCalc(widthParts) : 0)
      widthParts.push(getColumnStickyWidth(column))
    })

    return next
  }, [columns, fixedLeftColumnIndexList])
  const fixedRightColumnRightMap = useMemo(() => {
    const next = new Map<number, string | number>()
    const widthParts: string[] = []

    fixedRightColumnIndexList
      .slice()
      .reverse()
      .forEach((columnIndex) => {
        const column = columns.at(columnIndex)
        if (!column) return
        next.set(columnIndex, widthParts.length > 0 ? toCssCalc(widthParts) : 0)
        widthParts.push(getColumnStickyWidth(column))
      })

    return next
  }, [columns, fixedRightColumnIndexList])
  const fixedLeftColumnsWidthParts = useMemo(
    () =>
      fixedLeftColumnIndexList.flatMap((columnIndex) => {
        const column = columns.at(columnIndex)
        return column ? [getColumnStickyWidth(column)] : []
      }),
    [columns, fixedLeftColumnIndexList],
  )
  const leftAlignedHeaderStickyLeft =
    fixedLeftColumnsWidthParts.length > 0 ? `calc(${fixedLeftColumnsWidthParts.join(' + ')} + ${cellPadding})` : cellPadding
  const canInsetHorizontalScrollbar =
    fixedLeftColumnIndexList.every((columnIndex, index) => columnIndex === index) &&
    fixedRightColumnIndexList.every((columnIndex, index) => columnIndex === columns.length - fixedRightColumnIndexList.length + index)

  const [scrollState, setScrollState] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
    horizontal: false,
    vertical: false,
    fixedLeftColumnShadow: false,
    fixedRightColumnShadow: false,
    activeAxis: null as ScrollAxis,
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
    fixedLeftColumnWidth: 0,
    fixedRightColumnWidth: 0,
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
      const left = scrollLeft > 1
      const right = scrollLeft < maxLeft - 1
      const fixedLeftColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-left-column="true"]') : 0
      const fixedRightColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-right-column="true"]') : 0
      const next = {
        left,
        right,
        up: scrollTop > 1,
        down: scrollTop < maxTop - 1,
        horizontal: maxLeft > 1,
        vertical: maxTop > 1,
        fixedLeftColumnShadow: left && fixedLeftColumnIndexList.length > 0 && isLastFixedLeftColumnSticky(el),
        fixedRightColumnShadow: right && fixedRightColumnIndexList.length > 0 && isFirstFixedRightColumnSticky(el),
        scrollLeft,
        scrollTop,
        scrollWidth,
        scrollHeight,
        clientWidth,
        clientHeight,
        fixedLeftColumnWidth,
        fixedRightColumnWidth,
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
          prev.fixedLeftColumnShadow === next.fixedLeftColumnShadow &&
          prev.fixedRightColumnShadow === next.fixedRightColumnShadow &&
          prev.activeAxis === nextActiveAxis &&
          prev.scrollLeft === next.scrollLeft &&
          prev.scrollTop === next.scrollTop &&
          prev.scrollWidth === next.scrollWidth &&
          prev.scrollHeight === next.scrollHeight &&
          prev.clientWidth === next.clientWidth &&
          prev.clientHeight === next.clientHeight &&
          prev.fixedLeftColumnWidth === next.fixedLeftColumnWidth &&
          prev.fixedRightColumnWidth === next.fixedRightColumnWidth
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
  }, [
    columns.length,
    canInsetHorizontalScrollbar,
    fixedLeftColumnIndexList.length,
    fixedRightColumnIndexList.length,
    firstFixedRightColumnIndex,
    lastFixedLeftColumnIndex,
    loading,
    rows.length,
  ])

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
  const canUseInsetHorizontalScrollbar =
    canInsetHorizontalScrollbar &&
    scrollState.clientWidth > scrollState.fixedLeftColumnWidth + scrollState.fixedRightColumnWidth + (scrollState.vertical ? 18 : 0) + 24
  const horizontalScrollbarLeft =
    canUseInsetHorizontalScrollbar && scrollState.fixedLeftColumnWidth > 0 ? `${scrollState.fixedLeftColumnWidth}px` : 0
  const horizontalScrollbarRightWidth =
    (canUseInsetHorizontalScrollbar ? scrollState.fixedRightColumnWidth : 0) + (scrollState.vertical ? 18 : 0)
  const horizontalScrollbarRight = horizontalScrollbarRightWidth > 0 ? `${horizontalScrollbarRightWidth}px` : 0

  const renderHeaderCell = (column: NextGenMIStickyTableColumn<T>, columnIndex: number) => {
    const align = column.headerAlign ?? getColumnAlign(column)
    const isFixedLeftColumn = fixedLeftColumnIndexSet.has(columnIndex)
    const isFixedRightColumn = fixedRightColumnIndexSet.has(columnIndex)
    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
    const isLastFixedLeftColumn = lastFixedLeftColumnIndex === columnIndex
    const isFirstFixedRightColumn = firstFixedRightColumnIndex === columnIndex
    const shouldStickyLeftAlignedHeader =
      !isFixedColumn && leftAlignedHeaderSticky && align === 'left' && columnIndex > (lastFixedLeftColumnIndex ?? -1)

    return (
      <Box
        key={column.field}
        component="th"
        data-fixed-column={isFixedColumn ? 'true' : undefined}
        data-fixed-left-column={isFixedLeftColumn ? 'true' : undefined}
        data-last-fixed-left-column={isLastFixedLeftColumn ? 'true' : undefined}
        data-fixed-right-column={isFixedRightColumn ? 'true' : undefined}
        data-first-fixed-right-column={isFirstFixedRightColumn ? 'true' : undefined}
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
          isFixedLeftColumn && {
            position: 'sticky',
            left: fixedLeftColumnLeftMap.get(columnIndex),
            zIndex: 4,
          },
          isFixedRightColumn && {
            position: 'sticky',
            right: fixedRightColumnRightMap.get(columnIndex),
            zIndex: 4,
          },
          !leftAlignedHeaderSticky && isLastFixedLeftColumn && STICKY_LEFT_COLUMN_EDGE_SHADOW_SX,
          !leftAlignedHeaderSticky && isLastFixedLeftColumn && getStickyColumnShadowOpacitySx(scrollState.fixedLeftColumnShadow),
          !leftAlignedHeaderSticky && isFirstFixedRightColumn && STICKY_RIGHT_COLUMN_EDGE_SHADOW_SX,
          !leftAlignedHeaderSticky && isFirstFixedRightColumn && getStickyColumnShadowOpacitySx(scrollState.fixedRightColumnShadow),
          shouldStickyLeftAlignedHeader && { clipPath: 'inset(0)' },
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
            shouldStickyLeftAlignedHeader && {
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
    const isFixedLeftColumn = fixedLeftColumnIndexSet.has(columnIndex)
    const isFixedRightColumn = fixedRightColumnIndexSet.has(columnIndex)
    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
    const isLastFixedLeftColumn = lastFixedLeftColumnIndex === columnIndex
    const isFirstFixedRightColumn = firstFixedRightColumnIndex === columnIndex
    const rowSpan = column.getRowSpan?.({ row, rowIndex, column }) ?? 1
    const isMergedFixedColumn = isFixedColumn && rowSpan > 1

    return (
      <Box
        key={column.field}
        component="td"
        rowSpan={rowSpan}
        data-fixed-column={isFixedColumn ? 'true' : undefined}
        data-merged-fixed-column={isMergedFixedColumn ? 'true' : undefined}
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
          isFixedLeftColumn && {
            position: 'sticky',
            left: fixedLeftColumnLeftMap.get(columnIndex),
            zIndex: 2,
          },
          isFixedRightColumn && {
            position: 'sticky',
            right: fixedRightColumnRightMap.get(columnIndex),
            zIndex: 2,
          },
          isLastFixedLeftColumn && STICKY_LEFT_COLUMN_EDGE_SHADOW_SX,
          isLastFixedLeftColumn && getStickyColumnShadowOpacitySx(scrollState.fixedLeftColumnShadow),
          isFirstFixedRightColumn && STICKY_RIGHT_COLUMN_EDGE_SHADOW_SX,
          isFirstFixedRightColumn && getStickyColumnShadowOpacitySx(scrollState.fixedRightColumnShadow),
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
                  {columns.map((column, columnIndex) => {
                    const isFixedLeftColumn = fixedLeftColumnIndexSet.has(columnIndex)
                    const isFixedRightColumn = fixedRightColumnIndexSet.has(columnIndex)
                    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
                    const isLastFixedLeftColumn = lastFixedLeftColumnIndex === columnIndex
                    const isFirstFixedRightColumn = firstFixedRightColumnIndex === columnIndex

                    return (
                      <Box
                        key={column.field}
                        component="td"
                        sx={[
                          {
                            padding: `0 ${cellPadding}`,
                            borderBottom: '1px solid',
                            borderColor: 'contentBorder.Normal',
                            height: rowHeight,
                            width: column.width,
                            minWidth: column.minWidth ?? column.width,
                            maxWidth: column.maxWidth ?? column.width,
                            boxSizing: 'border-box',
                            bgcolor: 'commonColor.White',
                            overflow: isFixedColumn ? 'visible' : 'hidden',
                          },
                          isFixedLeftColumn && {
                            position: 'sticky',
                            left: fixedLeftColumnLeftMap.get(columnIndex),
                            zIndex: 2,
                          },
                          isFixedRightColumn && {
                            position: 'sticky',
                            right: fixedRightColumnRightMap.get(columnIndex),
                            zIndex: 2,
                          },
                          isLastFixedLeftColumn && STICKY_LEFT_COLUMN_EDGE_SHADOW_SX,
                          isLastFixedLeftColumn && getStickyColumnShadowOpacitySx(scrollState.fixedLeftColumnShadow),
                          isFirstFixedRightColumn && STICKY_RIGHT_COLUMN_EDGE_SHADOW_SX,
                          isFirstFixedRightColumn && getStickyColumnShadowOpacitySx(scrollState.fixedRightColumnShadow),
                        ]}
                      >
                        <Skeleton variant="rounded" height="18px" width={getColumnAlign(column) === 'center' ? '60%' : '80%'} />
                      </Box>
                    )
                  })}
                </Box>
              ))
              : rows.map((row, rowIndex) => (
                <Box
                  component="tr"
                  key={getRowKey(row, rowIndex)}
                  sx={{
                    transition: 'background-color 120ms ease',
                    '&:hover:not(:has([data-merged-fixed-column="true"]:hover)) td:not([data-merged-fixed-column="true"])': {
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

      {fixedLeftColumnIndexList.length === 0 && (
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

      {fixedRightColumnIndexList.length === 0 && (
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
      )}

      {scrollState.horizontal && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: horizontalScrollbarLeft,
            right: horizontalScrollbarRight,
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
