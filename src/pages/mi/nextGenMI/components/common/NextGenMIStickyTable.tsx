import { Box, Skeleton, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

import {
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'

type NextGenMIStickyTableAlign = 'left' | 'center' | 'right'
type ScrollAxis = 'horizontal' | 'vertical' | null

export type NextGenMIStickyTableColumn<T> = {
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

type NextGenMIStickyTableProps<T> = {
  columns: NextGenMIStickyTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  fixedLeftColumnIndexes?: number[]
  fixedRightColumnIndexes?: number[]
  leftAlignedHeaderSticky?: boolean
  /** 헤더(thead)를 렌더하지 않음 — 컬럼 헤더를 외부(페이지 sticky 슬롯 등)에서 따로 그릴 때 사용 */
  hideHeader?: boolean
  loading?: boolean
  noRowMessage?: string
  maxHeight?: string
  rowHeight?: string
  headerHeight?: string
  /** 셀 좌우 패딩 (셀 사이 간격 = cellPaddingX * 2). 외곽(첫/마지막 컬럼)에는 CELL_EDGE_INSET 만큼 추가 인셋이 붙는다 */
  cellPaddingX?: string
  /** 셀 상하 패딩. box-sizing: border-box + 고정 height 이므로 행 높이를 키우지 않는다 */
  cellPaddingY?: string
  headerFontSize?: string
  bodyFontSize?: string
  bodyLineHeight?: number | string
  skeletonRowCount?: number
  containerPadding?: string
  containerShell?: boolean
  scrollContainerRef?: { current: HTMLDivElement | null }
  rightScrollEdgeOffset?: string
}

// 피그마: 행 컨테이너 px-8 + 셀 px-6 구조 → 외곽 14px(8+6) / 셀 사이 12px(6+6). 8px가 첫/마지막 컬럼에 붙는 엣지 인셋.
const CELL_EDGE_INSET = '8px'

const STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE =
  'linear-gradient(to bottom, transparent 0%, #000 20px, #000 calc(100% - 20px), transparent 100%)'

const STICKY_LEFT_COLUMN_EDGE_SHADOW_OVERLAY_SX = {
  gridArea: '1 / 1',
  position: 'sticky',
  alignSelf: 'stretch',
  left: 'var(--next-gen-mi-sticky-left-column-shadow-inset)',
  marginLeft: 'var(--next-gen-mi-sticky-left-column-shadow-inset)',
  width: '16px',
  pointerEvents: 'none',
  background: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  WebkitMaskImage: STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE,
  maskImage: STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE,
  opacity: 'var(--next-gen-mi-sticky-left-column-shadow-opacity)',
  transition: 'opacity 180ms ease',
  zIndex: 5,
} as const

const STICKY_RIGHT_COLUMN_EDGE_SHADOW_OVERLAY_SX = {
  gridArea: '1 / 1',
  position: 'sticky',
  alignSelf: 'stretch',
  right: 'var(--next-gen-mi-sticky-right-column-shadow-inset)',
  justifySelf: 'end',
  marginRight: 'var(--next-gen-mi-sticky-right-column-shadow-inset)',
  width: '16px',
  pointerEvents: 'none',
  background: 'linear-gradient(to left, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  WebkitMaskImage: STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE,
  maskImage: STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE,
  opacity: 'var(--next-gen-mi-sticky-right-column-shadow-opacity)',
  transition: 'opacity 180ms ease',
  zIndex: 5,
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

const normalizeFixedRightColumnIndexes = (indexes: number[] | undefined, columnCount: number) =>
  normalizeFixedColumnIndexes(
    indexes?.map((index) => (index < 0 ? columnCount + index : index)),
    columnCount,
  )

const toCssCalc = (parts: string[]) => (parts.length > 0 ? `calc(${parts.join(' + ')})` : '0px')

const getColumnAlign = <T,>(column: NextGenMIStickyTableColumn<T>) => column.align ?? 'left'

const getColumnStickyWidth = <T,>(column: NextGenMIStickyTableColumn<T>) => column.minWidth ?? column.width

const queryColumnElement = (scrollRoot: HTMLDivElement, selector: string) =>
  scrollRoot.querySelector<HTMLElement>(`thead ${selector}`) ?? scrollRoot.querySelector<HTMLElement>(selector)

const isLastFixedLeftColumnSticky = (scrollRoot: HTMLDivElement) => {
  const lastFixedColumn = queryColumnElement(scrollRoot, '[data-last-fixed-left-column="true"]')
  if (!lastFixedColumn) return false

  const stickyLeft = Number.parseFloat(globalThis.getComputedStyle(lastFixedColumn).left)
  if (!Number.isFinite(stickyLeft)) return false

  const stickyOffset = lastFixedColumn.getBoundingClientRect().left - scrollRoot.getBoundingClientRect().left - stickyLeft
  return stickyOffset <= 1
}

const isFirstFixedRightColumnSticky = (scrollRoot: HTMLDivElement) => {
  const firstFixedColumn = queryColumnElement(scrollRoot, '[data-first-fixed-right-column="true"]')
  if (!firstFixedColumn) return false

  const stickyRight = Number.parseFloat(globalThis.getComputedStyle(firstFixedColumn).right)
  if (!Number.isFinite(stickyRight)) return false

  const stickyOffset = scrollRoot.getBoundingClientRect().right - firstFixedColumn.getBoundingClientRect().right - stickyRight
  return stickyOffset <= 1
}

const getFixedColumnWidth = (scrollRoot: HTMLDivElement, selector: string) =>
  Array.from(scrollRoot.querySelectorAll<HTMLElement>(selector)).reduce((sum, column) => sum + column.getBoundingClientRect().width, 0)

const getScrollThumbSizePercent = (clientSize: number, scrollSize: number) =>
  scrollSize > 0 ? Math.max((clientSize / scrollSize) * 100, 8) : 0

const getScrollThumbPositionPercent = (scrollPosition: number, clientSize: number, scrollSize: number, thumbSize: number) =>
  scrollSize > clientSize ? (scrollPosition / (scrollSize - clientSize)) * (100 - thumbSize) : 0

const NextGenMIStickyTable = <T,>({
  columns,
  rows,
  getRowKey,
  fixedLeftColumnIndexes,
  fixedRightColumnIndexes,
  leftAlignedHeaderSticky = false,
  hideHeader = false,
  loading = false,
  noRowMessage = '표시할 데이터가 없습니다.',
  maxHeight,
  rowHeight = '48px',
  headerHeight = '38px',
  cellPaddingX = '6px',
  cellPaddingY = '10px',
  headerFontSize = '14px',
  bodyFontSize = '14px',
  bodyLineHeight = 1.4,
  skeletonRowCount = 8,
  containerPadding = '12px',
  containerShell = true,
  scrollContainerRef,
  rightScrollEdgeOffset = '0px',
}: NextGenMIStickyTableProps<T>) => {
  const tableRootRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastScrollPositionRef = useRef({ left: 0, top: 0 })
  const lastActiveAxisRef = useRef<ScrollAxis>(null)
  const pendingAxisUpdateRef = useRef(false)
  const scrollAnimationFrameRef = useRef(0)
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
  const fixedRightColumnsWidthParts = useMemo(
    () =>
      fixedRightColumnIndexList.flatMap((columnIndex) => {
        const column = columns.at(columnIndex)
        return column ? [getColumnStickyWidth(column)] : []
      }),
    [columns, fixedRightColumnIndexList],
  )
  const fixedLeftColumnsWidth = fixedLeftColumnsWidthParts.length > 0 ? toCssCalc(fixedLeftColumnsWidthParts) : '0px'
  const fixedRightColumnsWidth = fixedRightColumnsWidthParts.length > 0 ? toCssCalc(fixedRightColumnsWidthParts) : '0px'
  // 고정-좌측 컬럼이 있으면 sticky 라벨은 첫 컬럼이 아니므로 엣지 인셋이 없는 cellPaddingX 만 더한다.
  // 고정-좌측 컬럼이 없으면 sticky 라벨이 첫 컬럼(외곽)일 수 있으므로 엣지 인셋(8px)을 포함한 14px를 적용한다.
  const leftAlignedHeaderStickyLeft =
    fixedLeftColumnsWidthParts.length > 0
      ? `calc(${fixedLeftColumnsWidthParts.join(' + ')} + ${cellPaddingX})`
      : `calc(${cellPaddingX} + ${CELL_EDGE_INSET})`
  const getCellPaddingSx = (columnIndex: number) => ({
    paddingTop: cellPaddingY,
    paddingBottom: cellPaddingY,
    paddingLeft: columnIndex === 0 ? `calc(${cellPaddingX} + ${CELL_EDGE_INSET})` : cellPaddingX,
    paddingRight: columnIndex === columns.length - 1 ? `calc(${cellPaddingX} + ${CELL_EDGE_INSET})` : cellPaddingX,
  })
  const canInsetHorizontalScrollbar =
    fixedLeftColumnIndexList.every((columnIndex, index) => columnIndex === index) &&
    fixedRightColumnIndexList.every((columnIndex, index) => columnIndex === columns.length - fixedRightColumnIndexList.length + index)

  const [scrollLayoutState, setScrollLayoutState] = useState({
    horizontal: false,
    vertical: false,
    scrollWidth: 0,
    scrollHeight: 0,
    clientWidth: 0,
    clientHeight: 0,
    fixedLeftColumnWidth: 0,
    fixedRightColumnWidth: 0,
  })
  const scrollLayoutStateRef = useRef(scrollLayoutState)
  const [isScrollAreaHovered, setIsScrollAreaHovered] = useState(false)
  const [dragAxis, setDragAxis] = useState<ScrollAxis>(null)
  const handleScrollContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element
      if (scrollContainerRef) scrollContainerRef.current = element
    },
    [scrollContainerRef],
  )

  useEffect(() => {
    const el = scrollRef.current
    const root = tableRootRef.current
    if (!el || !root) return undefined

    const sync = (updateAxis = false) => {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = el
      const maxLeft = Math.max(0, scrollWidth - clientWidth)
      const maxTop = Math.max(0, scrollHeight - clientHeight)
      const deltaLeft = Math.abs(scrollLeft - lastScrollPositionRef.current.left)
      const deltaTop = Math.abs(scrollTop - lastScrollPositionRef.current.top)
      const activeAxis = resolveActiveScrollAxis(updateAxis, deltaLeft, deltaTop)
      const horizontal = maxLeft > 1
      const vertical = maxTop > 1
      const nextActiveAxis = horizontal || vertical ? (activeAxis ?? lastActiveAxisRef.current) : null
      const left = scrollLeft > 1
      const right = scrollLeft < maxLeft - 1
      const fixedLeftColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-left-column="true"]') : 0
      const fixedRightColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-right-column="true"]') : 0
      const fixedLeftColumnShadow =
        left && fixedLeftColumnIndexList.length > 0 && (canInsetHorizontalScrollbar || isLastFixedLeftColumnSticky(el))
      const fixedRightColumnShadow =
        right && fixedRightColumnIndexList.length > 0 && (canInsetHorizontalScrollbar || isFirstFixedRightColumnSticky(el))
      const horizontalThumbWidth = horizontal ? getScrollThumbSizePercent(clientWidth, scrollWidth) : 0
      const verticalThumbHeight = vertical ? getScrollThumbSizePercent(clientHeight, scrollHeight) : 0

      lastActiveAxisRef.current = nextActiveAxis
      root.style.setProperty('--next-gen-mi-sticky-left-column-shadow-opacity', fixedLeftColumnShadow ? '1' : '0')
      root.style.setProperty('--next-gen-mi-sticky-right-column-shadow-opacity', fixedRightColumnShadow ? '1' : '0')
      root.style.setProperty('--next-gen-mi-scroll-left-edge-opacity', left ? '1' : '0')
      root.style.setProperty('--next-gen-mi-scroll-right-edge-opacity', right ? '1' : '0')
      root.style.setProperty('--next-gen-mi-scroll-right-edge-transition-duration', right ? '180ms' : '360ms')
      root.style.setProperty(
        '--next-gen-mi-scroll-top-edge-shadow',
        nextActiveAxis === 'vertical' && scrollTop > 1 ? NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP : 'none',
      )
      root.style.setProperty(
        '--next-gen-mi-scroll-bottom-edge-opacity',
        nextActiveAxis === 'vertical' && scrollTop < maxTop - 1 ? '1' : '0',
      )
      root.style.setProperty('--next-gen-mi-horizontal-thumb-width', `${horizontalThumbWidth}%`)
      root.style.setProperty(
        '--next-gen-mi-horizontal-thumb-left',
        `${getScrollThumbPositionPercent(scrollLeft, clientWidth, scrollWidth, horizontalThumbWidth)}%`,
      )
      root.style.setProperty('--next-gen-mi-vertical-thumb-height', `${verticalThumbHeight}%`)
      root.style.setProperty(
        '--next-gen-mi-vertical-thumb-top',
        `${getScrollThumbPositionPercent(scrollTop, clientHeight, scrollHeight, verticalThumbHeight)}%`,
      )

      const next = {
        horizontal,
        vertical,
        scrollWidth,
        scrollHeight,
        clientWidth,
        clientHeight,
        fixedLeftColumnWidth,
        fixedRightColumnWidth,
      }

      lastScrollPositionRef.current = { left: scrollLeft, top: scrollTop }

      const prev = scrollLayoutStateRef.current
      if (
        prev.horizontal === next.horizontal &&
        prev.vertical === next.vertical &&
        prev.scrollWidth === next.scrollWidth &&
        prev.scrollHeight === next.scrollHeight &&
        prev.clientWidth === next.clientWidth &&
        prev.clientHeight === next.clientHeight &&
        prev.fixedLeftColumnWidth === next.fixedLeftColumnWidth &&
        prev.fixedRightColumnWidth === next.fixedRightColumnWidth
      ) {
        return
      }

      scrollLayoutStateRef.current = next
      setScrollLayoutState(next)
    }

    const scheduleSync = (updateAxis = false) => {
      pendingAxisUpdateRef.current = pendingAxisUpdateRef.current || updateAxis
      if (scrollAnimationFrameRef.current) return

      scrollAnimationFrameRef.current = globalThis.requestAnimationFrame(() => {
        scrollAnimationFrameRef.current = 0
        const shouldUpdateAxis = pendingAxisUpdateRef.current
        pendingAxisUpdateRef.current = false
        sync(shouldUpdateAxis)
      })
    }

    sync()
    const handleScroll = () => scheduleSync(true)
    el.addEventListener('scroll', handleScroll, { passive: true })
    const ro = new ResizeObserver(() => scheduleSync())
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    return () => {
      if (scrollAnimationFrameRef.current) {
        globalThis.cancelAnimationFrame(scrollAnimationFrameRef.current)
        scrollAnimationFrameRef.current = 0
      }
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
  const canUseInsetHorizontalScrollbar =
    canInsetHorizontalScrollbar &&
    scrollLayoutState.clientWidth >
      scrollLayoutState.fixedLeftColumnWidth + scrollLayoutState.fixedRightColumnWidth + (scrollLayoutState.vertical ? 18 : 0) + 24
  const horizontalScrollbarLeft =
    canUseInsetHorizontalScrollbar && scrollLayoutState.fixedLeftColumnWidth > 0 ? `${scrollLayoutState.fixedLeftColumnWidth}px` : 0
  const horizontalScrollbarRightWidth =
    (canUseInsetHorizontalScrollbar ? scrollLayoutState.fixedRightColumnWidth : 0) + (scrollLayoutState.vertical ? 18 : 0)
  const horizontalScrollbarRight = horizontalScrollbarRightWidth > 0 ? `${horizontalScrollbarRightWidth}px` : 0
  const stickyColumnShadowVerticalSx = !hideHeader && leftAlignedHeaderSticky ? { mt: headerHeight } : {}

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
            ...getCellPaddingSx(columnIndex),
            textAlign: align,
            fontSize: headerFontSize,
            fontWeight: 600,
            color: 'contentText.Normal',
            borderBottom: '0.5px solid',
            borderColor: 'contentBorder.Active',
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
    const isBottomRow = rowIndex + rowSpan - 1 === rows.length - 1

    return (
      <Box
        key={column.field}
        component="td"
        rowSpan={rowSpan}
        data-fixed-column={isFixedColumn ? 'true' : undefined}
        data-fixed-left-column={isFixedLeftColumn ? 'true' : undefined}
        data-last-fixed-left-column={isLastFixedLeftColumn ? 'true' : undefined}
        data-fixed-right-column={isFixedRightColumn ? 'true' : undefined}
        data-first-fixed-right-column={isFirstFixedRightColumn ? 'true' : undefined}
        data-merged-fixed-column={isMergedFixedColumn ? 'true' : undefined}
        sx={[
          {
            ...getCellPaddingSx(columnIndex),
            textAlign: align,
            fontSize: bodyFontSize,
            fontWeight: 500,
            color: 'contentText.Normal',
            borderBottom: isBottomRow ? 'none' : '1px solid',
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

  const tableContent = (
    <Box
      ref={tableRootRef}
      onMouseEnter={() => setIsScrollAreaHovered(true)}
      onMouseLeave={() => setIsScrollAreaHovered(false)}
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        '--next-gen-mi-sticky-left-column-shadow-opacity': 0,
        '--next-gen-mi-sticky-right-column-shadow-opacity': 0,
        '--next-gen-mi-sticky-left-column-shadow-inset': fixedLeftColumnsWidth,
        '--next-gen-mi-sticky-right-column-shadow-inset': fixedRightColumnsWidth,
        '--next-gen-mi-scroll-left-edge-opacity': 0,
        '--next-gen-mi-scroll-right-edge-opacity': 0,
        '--next-gen-mi-scroll-right-edge-transition-duration': '360ms',
        '--next-gen-mi-scroll-top-edge-shadow': 'none',
        '--next-gen-mi-scroll-bottom-edge-opacity': 0,
        '--next-gen-mi-horizontal-thumb-left': '0%',
        '--next-gen-mi-horizontal-thumb-width': '0%',
        '--next-gen-mi-vertical-thumb-top': '0%',
        '--next-gen-mi-vertical-thumb-height': '0%',
      }}
    >
      <Box
        ref={handleScrollContainerRef}
        sx={{
          width: '100%',
          ...(maxHeight ? { maxHeight } : {}),
          overflowX: 'auto',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          pr: scrollLayoutState.vertical ? '16px' : 0,
          pb: scrollLayoutState.horizontal ? '18px' : 0,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            width: 'max-content',
            minWidth: '100%',
          }}
        >
          <Box
            component="table"
            sx={{
              gridArea: '1 / 1',
              width: 'max-content',
              minWidth: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'auto',
            }}
          >
            {!hideHeader && (
              <Box
                component="thead"
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 3,
                  bgcolor: 'commonColor.White',
                  boxShadow: 'var(--next-gen-mi-scroll-top-edge-shadow)',
                }}
              >
                <Box component="tr">{columns.map((column, columnIndex) => renderHeaderCell(column, columnIndex))}</Box>
              </Box>
            )}

            <Box component="tbody">
              {loading &&
                Array.from({ length: skeletonRowCount }).map((_, rowIndex) => {
                  const isLastSkeletonRow = rowIndex === skeletonRowCount - 1
                  return (
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
                            data-fixed-column={isFixedColumn ? 'true' : undefined}
                            data-fixed-left-column={isFixedLeftColumn ? 'true' : undefined}
                            data-last-fixed-left-column={isLastFixedLeftColumn ? 'true' : undefined}
                            data-fixed-right-column={isFixedRightColumn ? 'true' : undefined}
                            data-first-fixed-right-column={isFirstFixedRightColumn ? 'true' : undefined}
                            sx={[
                              {
                                ...getCellPaddingSx(columnIndex),
                                borderBottom: isLastSkeletonRow ? 'none' : '1px solid',
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
                            ]}
                          >
                            <Skeleton variant="rounded" height="18px" width={getColumnAlign(column) === 'center' ? '60%' : '80%'} />
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })}
              {!loading &&
                rows.map((row, rowIndex) => (
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
                    sx={{ height: rowHeight, borderBottom: 'none', borderColor: 'contentBorder.Normal' }}
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

          {fixedLeftColumnIndexList.length > 0 && (
            <Box
              aria-hidden
              sx={{
                ...STICKY_LEFT_COLUMN_EDGE_SHADOW_OVERLAY_SX,
                ...stickyColumnShadowVerticalSx,
              }}
            />
          )}

          {fixedRightColumnIndexList.length > 0 && (
            <Box
              aria-hidden
              sx={{
                ...STICKY_RIGHT_COLUMN_EDGE_SHADOW_OVERLAY_SX,
                ...stickyColumnShadowVerticalSx,
              }}
            />
          )}
        </Box>
      </Box>

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          right: scrollLayoutState.vertical ? '16px' : 0,
          bottom: scrollLayoutState.horizontal ? '18px' : 0,
          left: 0,
          height: '1px',
          pointerEvents: 'none',
          boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
          opacity: 'var(--next-gen-mi-scroll-bottom-edge-opacity)',
          transition: 'opacity 180ms ease',
          zIndex: 5,
        }}
      />

      {fixedLeftColumnIndexList.length === 0 && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: leftAlignedHeaderSticky ? headerHeight : 0,
            left: 0,
            bottom: scrollLayoutState.horizontal ? '18px' : 0,
            width: '100px',
            pointerEvents: 'none',
            background: 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
            opacity: 'var(--next-gen-mi-scroll-left-edge-opacity)',
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
            right: scrollLayoutState.vertical ? '16px' : 0,
            bottom: scrollLayoutState.horizontal ? '18px' : 0,
            width: `calc(100px + ${rightScrollEdgeOffset})`,
            pointerEvents: 'none',
            background: `linear-gradient(to left, #ffffff 0, #ffffff ${rightScrollEdgeOffset}, rgba(255, 255, 255, 0) 100%)`,
            opacity: 'var(--next-gen-mi-scroll-right-edge-opacity)',
            transition: 'opacity var(--next-gen-mi-scroll-right-edge-transition-duration) ease',
            zIndex: 5,
          }}
        />
      )}

      {scrollLayoutState.horizontal && (
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
              left: 'var(--next-gen-mi-horizontal-thumb-left)',
              width: 'var(--next-gen-mi-horizontal-thumb-width)',
              borderRadius: '10px',
              bgcolor: dragAxis === 'horizontal' ? '#868E96' : '#ADB5BD',
              cursor: dragAxis === 'horizontal' ? 'grabbing' : 'grab',
              '&:hover': { bgcolor: '#868E96' },
            }}
          />
        </Box>
      )}

      {scrollLayoutState.vertical && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            right: '4px',
            bottom: scrollLayoutState.horizontal ? '22px' : 0,
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
              top: 'var(--next-gen-mi-vertical-thumb-top)',
              height: 'var(--next-gen-mi-vertical-thumb-height)',
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

  if (!containerShell) return tableContent

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'commonColor.White',
        borderRadius: '10px',
        padding: containerPadding,
        boxSizing: 'border-box',
      }}
    >
      {tableContent}
    </Box>
  )
}

export default NextGenMIStickyTable
