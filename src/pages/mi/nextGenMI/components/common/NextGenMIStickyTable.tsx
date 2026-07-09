import { Box, Skeleton, Stack, Typography, type SxProps, type Theme } from '@mui/material'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import ArrowUpward from '@/components/common/icons/ArrowUpward'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import {
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_BOTTOM,
  NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'

type NextGenMIStickyTableAlign = 'left' | 'center' | 'right'
type NextGenMIStickyTableSortDirection = 'asc' | 'desc'
type ScrollAxis = 'horizontal' | 'vertical' | null
type FixedColumnResizeSide = 'left' | 'right' | null
type NextGenMIStickyTableSortState = { field: string; direction: NextGenMIStickyTableSortDirection } | null

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
  sortable?: boolean
  sortComparator?: (firstRow: T, secondRow: T, column: NextGenMIStickyTableColumn<T>) => number
  tooltipWhenHeaderTruncated?: boolean
  headerTooltipTitle?: ReactNode
  cellSx?: SxProps<Theme>
  headerCellSx?: SxProps<Theme>
  headerContentSx?: SxProps<Theme>
}

type NextGenMIStickyTableProps<T> = {
  columns: NextGenMIStickyTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  fixedLeftColumnIndexes?: number[]
  fixedRightColumnIndexes?: number[]
  resizableFixedColumns?: boolean
  leftAlignedHeaderSticky?: boolean
  /** 헤더(thead)를 렌더하지 않음 — 컬럼 헤더를 외부(페이지 sticky 슬롯 등)에서 따로 그릴 때 사용 */
  hideHeader?: boolean
  /** 페이지 스크롤 기준으로 실제 테이블 헤더(thead)를 sticky 처리할 때 사용 */
  pageStickyHeaderTop?: number | string
  pageStickyHeaderZIndex?: number
  /** 페이지 sticky 헤더와 함께 붙고 풀릴 상단 컨텐츠 */
  pageStickyHeaderBefore?: ReactNode
  pageStickyHeaderGap?: string
  /** sticky 헤더가 마지막 행을 덮기 전 해제되도록 하단 경계를 앞당길 때 사용 */
  pageStickyHeaderReleaseOffsetBottom?: number | string
  /** 마지막 렌더 행 높이를 실측해 sticky 헤더 하단 경계로 사용 */
  pageStickyHeaderReleaseOnLastRow?: boolean
  loading?: boolean
  noRowMessage?: string
  noRowMinHeight?: string
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
  disableHorizontalScroll?: boolean
  onRowClick?: (row: T, rowIndex: number) => void
}

// 피그마: 행 컨테이너 px-8 + 셀 px-6 구조 → 외곽 14px(8+6) / 셀 사이 12px(6+6). 8px가 첫/마지막 컬럼에 붙는 엣지 인셋.
const CELL_EDGE_INSET = '8px'
const FIXED_COLUMN_RESIZE_HANDLE_WIDTH = 12
const FIXED_COLUMN_RESIZE_MIN_WIDTH = 120

const STICKY_COLUMN_EDGE_SHADOW_VERTICAL_MASK_IMAGE =
  'linear-gradient(to bottom, transparent 0%, #000 20px, #000 calc(100% - 20px), transparent 100%)'

const STICKY_LEFT_COLUMN_EDGE_SHADOW_OVERLAY_SX = {
  position: 'absolute',
  left: 'var(--next-gen-mi-sticky-left-column-shadow-left)',
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
  position: 'absolute',
  right: 'var(--next-gen-mi-sticky-right-column-shadow-right)',
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

const toCssLength = (value: number | string) => (typeof value === 'number' ? `${value}px` : value)

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

const getNextSortState = (current: NextGenMIStickyTableSortState, field: string): NextGenMIStickyTableSortState => {
  if (current?.field !== field) return { field, direction: 'asc' }
  if (current.direction === 'asc') return { field, direction: 'desc' }
  return null
}

const compareSortValues = (firstValue: unknown, secondValue: unknown) => {
  if (firstValue === secondValue) return 0
  if (firstValue === null || firstValue === undefined) return 1
  if (secondValue === null || secondValue === undefined) return -1

  if (typeof firstValue === 'number' && typeof secondValue === 'number') return firstValue - secondValue

  return String(firstValue).localeCompare(String(secondValue), 'ko', { numeric: true, sensitivity: 'base' })
}

const getDefaultSortValue = <T,>(row: T, field: string) => (row as Record<string, unknown>)[field]

const NextGenMIStickyTableHeaderLabel = ({
  label,
  tooltipTitle,
  tooltipWhenTruncated = false,
}: {
  label: ReactNode
  tooltipTitle?: ReactNode
  tooltipWhenTruncated?: boolean
}) => {
  const { ref, isEllipsis } = useEllipsisDetection(label)

  const content = (
    <Box
      ref={ref}
      component="span"
      sx={{
        display: 'block',
        flex: '1 1 0%',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  )

  if (!tooltipWhenTruncated || !isEllipsis) return content

  return <NextGenMIFollowCursorTooltip title={tooltipTitle ?? label}>{content}</NextGenMIFollowCursorTooltip>
}

const getPixelValue = (value?: string) => {
  const pixelValue = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(pixelValue) ? pixelValue : undefined
}

const getColumnStickyWidth = <T,>(
  column: NextGenMIStickyTableColumn<T>,
  columnIndex: number,
  resizedFixedColumnWidths: Record<number, number>,
) => {
  const resizedWidth = resizedFixedColumnWidths[columnIndex]
  return typeof resizedWidth === 'number' ? `${resizedWidth}px` : (column.minWidth ?? column.width)
}

const queryColumnElement = (scrollRoot: HTMLDivElement, selector: string) =>
  scrollRoot.querySelector<HTMLElement>(`thead ${selector}`) ?? scrollRoot.querySelector<HTMLElement>(selector)

const getFixedColumnWidth = (scrollRoot: HTMLDivElement, selector: string) => {
  const selectedColumns = Array.from(scrollRoot.querySelectorAll<HTMLElement>(selector))
  const fallbackSelector = selector.startsWith('thead ') ? selector.slice('thead '.length) : selector
  const columns = selectedColumns.length > 0 ? selectedColumns : Array.from(scrollRoot.querySelectorAll<HTMLElement>(fallbackSelector))
  const widthsByColumnIndex = new Map<string, number>()

  columns.forEach((column) => {
    const columnIndex = column.dataset.nextGenMiStickyTableColumnIndex ?? `column-${widthsByColumnIndex.size}`
    if (widthsByColumnIndex.has(columnIndex)) return
    widthsByColumnIndex.set(columnIndex, column.getBoundingClientRect().width)
  })

  return Array.from(widthsByColumnIndex.values()).reduce((sum, width) => sum + width, 0)
}

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

const getFixedColumnShadowOffsets = (scrollRoot: HTMLDivElement, root: HTMLDivElement) => {
  const rootRect = root.getBoundingClientRect()
  const lastFixedLeftColumn = queryColumnElement(scrollRoot, '[data-last-fixed-left-column="true"]')
  const firstFixedRightColumn = queryColumnElement(scrollRoot, '[data-first-fixed-right-column="true"]')

  return {
    left: lastFixedLeftColumn ? lastFixedLeftColumn.getBoundingClientRect().right - rootRect.left : null,
    right: firstFixedRightColumn ? rootRect.right - firstFixedRightColumn.getBoundingClientRect().left : null,
  }
}

const getFixedColumnResizeMaxWidth = (
  scrollRoot: HTMLDivElement | null,
  side: Exclude<FixedColumnResizeSide, null>,
  columnIndex: number,
  configuredMaxWidth: number | undefined,
  minWidth: number,
) => {
  const configuredMaxWidthValue = configuredMaxWidth && configuredMaxWidth >= minWidth ? configuredMaxWidth : Number.POSITIVE_INFINITY
  if (!scrollRoot) return configuredMaxWidthValue

  const fixedColumnSelector = side === 'left' ? '[data-fixed-left-column="true"]' : '[data-fixed-right-column="true"]'
  const fixedColumnWidthMap = new Map<string, number>()

  Array.from(scrollRoot.querySelectorAll<HTMLElement>(fixedColumnSelector)).forEach((fixedColumn) => {
    const fixedColumnIndex = fixedColumn.dataset.nextGenMiStickyTableColumnIndex
    if (!fixedColumnIndex || fixedColumnIndex === String(columnIndex) || fixedColumnWidthMap.has(fixedColumnIndex)) return

    fixedColumnWidthMap.set(fixedColumnIndex, fixedColumn.getBoundingClientRect().width)
  })

  const otherFixedColumnWidth = Array.from(fixedColumnWidthMap.values()).reduce((sum, width) => sum + width, 0)
  const viewportMaxWidth = Math.max(minWidth, Math.floor(scrollRoot.clientWidth * 0.8 - otherFixedColumnWidth))

  return Math.min(configuredMaxWidthValue, viewportMaxWidth)
}

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
  resizableFixedColumns = false,
  leftAlignedHeaderSticky = false,
  hideHeader = false,
  pageStickyHeaderTop,
  pageStickyHeaderZIndex = 24,
  pageStickyHeaderBefore,
  pageStickyHeaderGap = '0px',
  pageStickyHeaderReleaseOffsetBottom,
  pageStickyHeaderReleaseOnLastRow = false,
  loading = false,
  noRowMessage = '표시할 데이터가 없습니다.',
  noRowMinHeight,
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
  disableHorizontalScroll = false,
  onRowClick,
}: NextGenMIStickyTableProps<T>) => {
  const tableRootRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pageStickyHeaderScrollRef = useRef<HTMLDivElement | null>(null)
  const stickyHorizontalScrollbarRef = useRef<HTMLDivElement | null>(null)
  const lastScrollPositionRef = useRef({ left: 0, top: 0 })
  const lastActiveAxisRef = useRef<ScrollAxis>(null)
  const pendingAxisUpdateRef = useRef(false)
  const scrollAnimationFrameRef = useRef(0)
  const syncScrollVisualStateRef = useRef<(updateAxis?: boolean) => void>(() => undefined)
  const sortSkeletonTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
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
  const [resizedFixedColumnWidths, setResizedFixedColumnWidths] = useState<Record<number, number>>({})
  const [sortState, setSortState] = useState<NextGenMIStickyTableSortState>(null)
  const [sortSkeletonVisible, setSortSkeletonVisible] = useState(false)
  const [pageStickyHeaderLastRowHeightPx, setPageStickyHeaderLastRowHeightPx] = useState(0)
  const [pageStickyHeaderColumnWidths, setPageStickyHeaderColumnWidths] = useState<Record<number, number>>({})
  const fixedLeftColumnLeftMap = useMemo(() => {
    const next = new Map<number, string | number>()
    const widthParts: string[] = []

    fixedLeftColumnIndexList.forEach((columnIndex) => {
      const column = columns.at(columnIndex)
      if (!column) return
      next.set(columnIndex, widthParts.length > 0 ? toCssCalc(widthParts) : 0)
      widthParts.push(getColumnStickyWidth(column, columnIndex, resizedFixedColumnWidths))
    })

    return next
  }, [columns, fixedLeftColumnIndexList, resizedFixedColumnWidths])
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
        widthParts.push(getColumnStickyWidth(column, columnIndex, resizedFixedColumnWidths))
      })

    return next
  }, [columns, fixedRightColumnIndexList, resizedFixedColumnWidths])
  const sortedRows = useMemo(() => {
    if (!sortState) return rows

    const activeColumn = columns.find((column) => column.field === sortState.field && column.sortable)
    if (!activeColumn) return rows

    return rows
      .map((row, index) => ({ row, index }))
      .sort((first, second) => {
        const comparison =
          activeColumn.sortComparator?.(first.row, second.row, activeColumn) ??
          compareSortValues(getDefaultSortValue(first.row, activeColumn.field), getDefaultSortValue(second.row, activeColumn.field))
        const normalizedComparison = Number.isFinite(comparison) ? comparison : 0

        if (normalizedComparison === 0) return first.index - second.index
        return sortState.direction === 'asc' ? normalizedComparison : -normalizedComparison
      })
      .map(({ row }) => row)
  }, [columns, rows, sortState])
  const fixedLeftColumnsWidthParts = useMemo(
    () =>
      fixedLeftColumnIndexList.flatMap((columnIndex) => {
        const column = columns.at(columnIndex)
        return column ? [getColumnStickyWidth(column, columnIndex, resizedFixedColumnWidths)] : []
      }),
    [columns, fixedLeftColumnIndexList, resizedFixedColumnWidths],
  )
  const fixedRightColumnsWidthParts = useMemo(
    () =>
      fixedRightColumnIndexList.flatMap((columnIndex) => {
        const column = columns.at(columnIndex)
        return column ? [getColumnStickyWidth(column, columnIndex, resizedFixedColumnWidths)] : []
      }),
    [columns, fixedRightColumnIndexList, resizedFixedColumnWidths],
  )
  const fixedLeftColumnsWidth = fixedLeftColumnsWidthParts.length > 0 ? toCssCalc(fixedLeftColumnsWidthParts) : '0px'
  const fixedRightColumnsWidth = fixedRightColumnsWidthParts.length > 0 ? toCssCalc(fixedRightColumnsWidthParts) : '0px'
  const showSkeletonRows = loading || sortSkeletonVisible
  const activeSkeletonRowCount = loading ? skeletonRowCount : rows.length
  const hasPageStickyHeader = pageStickyHeaderTop !== undefined && !hideHeader
  const showPageStickyHeader = hasPageStickyHeader
  const hasPageStickyHeaderBefore = pageStickyHeaderBefore !== undefined && pageStickyHeaderBefore !== null
  const pageStickyHeaderReleaseBottomGapPx = hasPageStickyHeaderBefore && containerShell ? (getPixelValue(containerPadding) ?? 0) : 0
  const pageStickyHeaderMeasuredReleaseOffset =
    pageStickyHeaderReleaseOnLastRow && pageStickyHeaderLastRowHeightPx > 0
      ? `${pageStickyHeaderLastRowHeightPx + pageStickyHeaderReleaseBottomGapPx}px`
      : undefined
  const pageStickyHeaderReleaseOffset =
    pageStickyHeaderReleaseOffsetBottom !== undefined
      ? toCssLength(pageStickyHeaderReleaseOffsetBottom)
      : pageStickyHeaderMeasuredReleaseOffset
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
  const getColumnWidthSx = (column: NextGenMIStickyTableColumn<T>, columnIndex: number, isFixedColumn: boolean) => {
    const resizedWidth = resizableFixedColumns && isFixedColumn ? resizedFixedColumnWidths[columnIndex] : undefined
    if (typeof resizedWidth === 'number') {
      const width = `${resizedWidth}px`
      return {
        width,
        minWidth: width,
        maxWidth: width,
      }
    }

    return {
      width: column.width,
      minWidth: column.minWidth ?? column.width,
      maxWidth: column.maxWidth ?? column.width,
    }
  }
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
  const [fixedColumnResizeSide, setFixedColumnResizeSide] = useState<FixedColumnResizeSide>(null)
  const handleScrollAreaMouseEnter = () => setIsScrollAreaHovered(true)
  const handleScrollAreaMouseLeave = () => setIsScrollAreaHovered(false)
  const setElementScrollLeft = useCallback((element: HTMLDivElement, nextScrollLeft: number) => {
    if (Math.abs(element.scrollLeft - nextScrollLeft) < 1) return
    element.scrollLeft = nextScrollLeft
    syncScrollVisualStateRef.current(true)
  }, [])
  const syncPageStickyHeaderScrollLeft = useCallback(
    (source: HTMLDivElement, target: HTMLDivElement) => {
      setElementScrollLeft(target, source.scrollLeft)
    },
    [setElementScrollLeft],
  )
  const handleBodyScrollLeft = useCallback(() => {
    const bodyScrollEl = scrollRef.current
    const headerScrollEl = pageStickyHeaderScrollRef.current
    if (!showPageStickyHeader || !bodyScrollEl || !headerScrollEl) return

    syncPageStickyHeaderScrollLeft(bodyScrollEl, headerScrollEl)
  }, [showPageStickyHeader, syncPageStickyHeaderScrollLeft])
  const handlePageStickyHeaderScrollLeft = useCallback(() => {
    const bodyScrollEl = scrollRef.current
    const headerScrollEl = pageStickyHeaderScrollRef.current
    if (!showPageStickyHeader || !bodyScrollEl || !headerScrollEl) return

    syncPageStickyHeaderScrollLeft(headerScrollEl, bodyScrollEl)
  }, [showPageStickyHeader, syncPageStickyHeaderScrollLeft])
  const handleScrollContainerRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollRef.current = element
      if (scrollContainerRef) scrollContainerRef.current = element
    },
    [scrollContainerRef],
  )

  const clearSortSkeletonTimer = useCallback(() => {
    if (sortSkeletonTimerRef.current !== undefined) {
      clearTimeout(sortSkeletonTimerRef.current)
      sortSkeletonTimerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    setResizedFixedColumnWidths((current) => {
      const fixedColumnIndexes = new Set([...fixedLeftColumnIndexList, ...fixedRightColumnIndexList])
      const next = Object.fromEntries(
        Object.entries(current).filter(([columnIndex]) => resizableFixedColumns && fixedColumnIndexes.has(Number(columnIndex))),
      )

      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [fixedLeftColumnIndexList, fixedRightColumnIndexList, resizableFixedColumns])

  useEffect(() => {
    setSortState((current) => {
      if (!current || columns.some((column) => column.field === current.field && column.sortable)) return current
      return null
    })
  }, [columns])

  useEffect(
    () => () => {
      clearSortSkeletonTimer()
    },
    [clearSortSkeletonTimer],
  )

  useLayoutEffect(() => {
    if (!pageStickyHeaderReleaseOnLastRow || showSkeletonRows || sortedRows.length === 0) {
      setPageStickyHeaderLastRowHeightPx(0)
      return undefined
    }

    const root = tableRootRef.current
    if (!root) {
      setPageStickyHeaderLastRowHeightPx(0)
      return undefined
    }

    let animationFrameId = 0

    const measureLastRow = () => {
      animationFrameId = 0
      const bodyRows = root.querySelectorAll<HTMLElement>('tbody tr')
      const lastRow = bodyRows.item(bodyRows.length - 1)
      const nextHeight = lastRow ? Math.ceil(lastRow.getBoundingClientRect().height) : 0
      setPageStickyHeaderLastRowHeightPx((current) => (current === nextHeight ? current : nextHeight))
    }

    const scheduleMeasure = () => {
      if (animationFrameId !== 0) return
      animationFrameId = globalThis.requestAnimationFrame(measureLastRow)
    }

    measureLastRow()

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(root)
    const bodyRows = root.querySelectorAll<HTMLElement>('tbody tr')
    const lastRow = bodyRows.item(bodyRows.length - 1)
    if (lastRow) resizeObserver.observe(lastRow)
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (animationFrameId !== 0) globalThis.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      globalThis.removeEventListener('resize', scheduleMeasure)
    }
  }, [columns.length, pageStickyHeaderReleaseOnLastRow, showSkeletonRows, sortedRows])

  useLayoutEffect(() => {
    if (!showPageStickyHeader) {
      setPageStickyHeaderColumnWidths({})
      return undefined
    }

    const root = tableRootRef.current
    if (!root) {
      setPageStickyHeaderColumnWidths({})
      return undefined
    }

    let animationFrameId = 0

    const measureColumnWidths = () => {
      animationFrameId = 0
      const nextWidths: Record<number, number> = {}
      const bodyCells = root.querySelectorAll<HTMLElement>('tbody [data-next-gen-mi-sticky-table-column-index]')

      bodyCells.forEach((cell) => {
        const columnIndex = Number(cell.dataset.nextGenMiStickyTableColumnIndex)
        if (!Number.isInteger(columnIndex)) return

        const width = Math.ceil(cell.getBoundingClientRect().width)
        if (width <= 0) return

        nextWidths[columnIndex] = Math.max(nextWidths[columnIndex] ?? 0, width)
      })

      setPageStickyHeaderColumnWidths((current) => {
        const currentKeys = Object.keys(current)
        const nextKeys = Object.keys(nextWidths)
        const hasSameWidths =
          currentKeys.length === nextKeys.length && nextKeys.every((key) => current[Number(key)] === nextWidths[Number(key)])

        return hasSameWidths ? current : nextWidths
      })
    }

    const scheduleMeasure = () => {
      if (animationFrameId !== 0) return
      animationFrameId = globalThis.requestAnimationFrame(measureColumnWidths)
    }

    measureColumnWidths()

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(root)
    root.querySelectorAll<HTMLElement>('tbody [data-next-gen-mi-sticky-table-column-index]').forEach((cell) => resizeObserver.observe(cell))
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (animationFrameId !== 0) globalThis.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      globalThis.removeEventListener('resize', scheduleMeasure)
    }
  }, [columns.length, resizedFixedColumnWidths, showPageStickyHeader, showSkeletonRows, sortedRows])

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
      const horizontal = !disableHorizontalScroll && maxLeft > 1
      const vertical = maxTop > 1
      const nextActiveAxis = horizontal || vertical ? (activeAxis ?? lastActiveAxisRef.current) : null
      const left = horizontal && scrollLeft > 1
      const right = horizontal && scrollLeft < maxLeft - 1
      const fixedLeftColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-left-column="true"]') : 0
      const fixedRightColumnWidth = canInsetHorizontalScrollbar ? getFixedColumnWidth(el, 'thead [data-fixed-right-column="true"]') : 0
      const fixedColumnShadowOffsets = getFixedColumnShadowOffsets(el, root)
      const fixedLeftColumnShadow =
        left && fixedLeftColumnIndexList.length > 0 && (canInsetHorizontalScrollbar || isLastFixedLeftColumnSticky(el))
      const fixedRightColumnShadow =
        right && fixedRightColumnIndexList.length > 0 && (canInsetHorizontalScrollbar || isFirstFixedRightColumnSticky(el))
      const horizontalThumbWidth = horizontal ? getScrollThumbSizePercent(clientWidth, scrollWidth) : 0
      const verticalThumbHeight = vertical ? getScrollThumbSizePercent(clientHeight, scrollHeight) : 0
      const applyScrollVisualState = (
        target: HTMLElement,
        columnShadowOffsets: ReturnType<typeof getFixedColumnShadowOffsets> = fixedColumnShadowOffsets,
      ) => {
        target.style.setProperty('--next-gen-mi-sticky-left-column-shadow-opacity', fixedLeftColumnShadow ? '1' : '0')
        target.style.setProperty('--next-gen-mi-sticky-right-column-shadow-opacity', fixedRightColumnShadow ? '1' : '0')
        target.style.setProperty('--next-gen-mi-sticky-left-column-shadow-left', `${columnShadowOffsets.left ?? 0}px`)
        target.style.setProperty('--next-gen-mi-sticky-right-column-shadow-right', `${columnShadowOffsets.right ?? 0}px`)
        target.style.setProperty('--next-gen-mi-scroll-left-edge-opacity', left ? '1' : '0')
        target.style.setProperty('--next-gen-mi-scroll-right-edge-opacity', right ? '1' : '0')
        target.style.setProperty('--next-gen-mi-scroll-right-edge-transition-duration', right ? '180ms' : '360ms')
        target.style.setProperty(
          '--next-gen-mi-scroll-top-edge-shadow',
          nextActiveAxis === 'vertical' && scrollTop > 1 ? NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP : 'none',
        )
        target.style.setProperty(
          '--next-gen-mi-scroll-bottom-edge-opacity',
          nextActiveAxis === 'vertical' && scrollTop < maxTop - 1 ? '1' : '0',
        )
        target.style.setProperty('--next-gen-mi-horizontal-thumb-width', `${horizontalThumbWidth}%`)
        target.style.setProperty(
          '--next-gen-mi-horizontal-thumb-left',
          `${getScrollThumbPositionPercent(scrollLeft, clientWidth, scrollWidth, horizontalThumbWidth)}%`,
        )
        target.style.setProperty('--next-gen-mi-vertical-thumb-height', `${verticalThumbHeight}%`)
        target.style.setProperty(
          '--next-gen-mi-vertical-thumb-top',
          `${getScrollThumbPositionPercent(scrollTop, clientHeight, scrollHeight, verticalThumbHeight)}%`,
        )
      }

      lastActiveAxisRef.current = nextActiveAxis
      applyScrollVisualState(root)

      const pageStickyHeaderScrollEl = pageStickyHeaderScrollRef.current
      if (pageStickyHeaderScrollEl) {
        applyScrollVisualState(pageStickyHeaderScrollEl, getFixedColumnShadowOffsets(pageStickyHeaderScrollEl, pageStickyHeaderScrollEl))
      }

      const stickyHorizontalScrollbarEl = stickyHorizontalScrollbarRef.current
      if (stickyHorizontalScrollbarEl) applyScrollVisualState(stickyHorizontalScrollbarEl)

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
    syncScrollVisualStateRef.current = sync
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
      if (syncScrollVisualStateRef.current === sync) syncScrollVisualStateRef.current = () => undefined
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [
    columns.length,
    canInsetHorizontalScrollbar,
    disableHorizontalScroll,
    fixedLeftColumnIndexList.length,
    fixedRightColumnIndexList.length,
    firstFixedRightColumnIndex,
    lastFixedLeftColumnIndex,
    loading,
    pageStickyHeaderColumnWidths,
    rows.length,
    showPageStickyHeader,
  ])

  useEffect(() => {
    if (!showPageStickyHeader) return undefined

    const bodyScrollEl = scrollRef.current
    const headerScrollEl = pageStickyHeaderScrollRef.current
    if (!bodyScrollEl || !headerScrollEl) return undefined

    const syncFromBody = () => syncPageStickyHeaderScrollLeft(bodyScrollEl, headerScrollEl)
    const syncFromHeader = () => syncPageStickyHeaderScrollLeft(headerScrollEl, bodyScrollEl)

    headerScrollEl.scrollLeft = bodyScrollEl.scrollLeft
    bodyScrollEl.addEventListener('scroll', syncFromBody, { passive: true })
    headerScrollEl.addEventListener('scroll', syncFromHeader, { passive: true })

    return () => {
      bodyScrollEl.removeEventListener('scroll', syncFromBody)
      headerScrollEl.removeEventListener('scroll', syncFromHeader)
    }
  }, [showPageStickyHeader, syncPageStickyHeaderScrollLeft])

  const setHorizontalScrollLeft = useCallback(
    (nextScrollLeft: number) => {
      if (scrollRef.current) setElementScrollLeft(scrollRef.current, nextScrollLeft)
      if (showPageStickyHeader && pageStickyHeaderScrollRef.current) setElementScrollLeft(pageStickyHeaderScrollRef.current, nextScrollLeft)
    },
    [setElementScrollLeft, showPageStickyHeader],
  )

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
        setHorizontalScrollLeft(nextScroll)
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

  const handleFixedColumnResizePointerDown =
    (side: Exclude<FixedColumnResizeSide, null>, columnIndex: number) => (event: ReactPointerEvent<HTMLDivElement>) => {
      const column = columns.at(columnIndex)
      if (!resizableFixedColumns || !column) return

      event.preventDefault()
      event.stopPropagation()
      setFixedColumnResizeSide(side)

      const scrollRoot = scrollRef.current
      const columnElement =
        scrollRoot?.querySelector<HTMLElement>(`thead [data-next-gen-mi-sticky-table-column-index="${columnIndex}"]`) ??
        scrollRoot?.querySelector<HTMLElement>(`[data-next-gen-mi-sticky-table-column-index="${columnIndex}"]`)
      const configuredMinWidth = getPixelValue(column.minWidth)
      const configuredMaxWidth = column.maxWidth === 'none' ? undefined : getPixelValue(column.maxWidth)
      const minWidth = configuredMinWidth ?? FIXED_COLUMN_RESIZE_MIN_WIDTH
      const maxWidth = getFixedColumnResizeMaxWidth(scrollRoot, side, columnIndex, configuredMaxWidth, minWidth)
      const startX = event.clientX
      const startWidth = Math.max(
        minWidth,
        Math.min(
          resizedFixedColumnWidths[columnIndex] ?? columnElement?.getBoundingClientRect().width ?? getPixelValue(column.width) ?? minWidth,
          maxWidth,
        ),
      )
      const previousUserSelect = document.body.style.userSelect
      const previousCursor = document.body.style.cursor

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = side === 'left' ? moveEvent.clientX - startX : startX - moveEvent.clientX
        const nextWidth = Math.round(Math.max(minWidth, Math.min(startWidth + delta, maxWidth)))

        setResizedFixedColumnWidths((current) => (current[columnIndex] === nextWidth ? current : { ...current, [columnIndex]: nextWidth }))
      }

      const handlePointerUp = () => {
        setFixedColumnResizeSide(null)
        document.body.style.userSelect = previousUserSelect
        document.body.style.cursor = previousCursor
        globalThis.removeEventListener('pointermove', handlePointerMove)
        globalThis.removeEventListener('pointerup', handlePointerUp)
        globalThis.removeEventListener('pointercancel', handlePointerUp)
      }

      globalThis.addEventListener('pointermove', handlePointerMove)
      globalThis.addEventListener('pointerup', handlePointerUp, { once: true })
      globalThis.addEventListener('pointercancel', handlePointerUp, { once: true })
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
  const hasStickyHeaderRow = !hideHeader && leftAlignedHeaderSticky && !showPageStickyHeader
  const showPageStickyHeaderFixedColumnShadow = hasPageStickyHeader && !leftAlignedHeaderSticky
  const stickyColumnShadowOverlaySx = {
    top: hasStickyHeaderRow ? headerHeight : 0,
    bottom: scrollLayoutState.horizontal ? '18px' : 0,
  }
  const initialScrollVisualStateSx = {
    '--next-gen-mi-sticky-left-column-shadow-opacity': 0,
    '--next-gen-mi-sticky-right-column-shadow-opacity': 0,
    '--next-gen-mi-sticky-left-column-shadow-left': fixedLeftColumnsWidth,
    '--next-gen-mi-sticky-right-column-shadow-right': fixedRightColumnsWidth,
    '--next-gen-mi-scroll-left-edge-opacity': 0,
    '--next-gen-mi-scroll-right-edge-opacity': 0,
    '--next-gen-mi-scroll-right-edge-transition-duration': '360ms',
    '--next-gen-mi-scroll-top-edge-shadow': 'none',
    '--next-gen-mi-scroll-bottom-edge-opacity': 0,
    '--next-gen-mi-horizontal-thumb-left': '0%',
    '--next-gen-mi-horizontal-thumb-width': '0%',
    '--next-gen-mi-vertical-thumb-top': '0%',
    '--next-gen-mi-vertical-thumb-height': '0%',
  } as const
  const tableWidthSx = disableHorizontalScroll
    ? {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
    }
    : {
      width: 'max-content',
      minWidth: '100%',
    }
  const pageStickyHeaderTableWidthPx = columns.reduce((sum, _, columnIndex) => sum + (pageStickyHeaderColumnWidths[columnIndex] ?? 0), 0)
  const pageStickyHeaderTableWidthSx =
    pageStickyHeaderTableWidthPx > 0
      ? {
        width: `${pageStickyHeaderTableWidthPx}px`,
        minWidth: '100%',
      }
      : tableWidthSx
  const noRowContentMinHeight = noRowMinHeight ?? rowHeight
  const renderFixedColumnResizeHandle = (side: Exclude<FixedColumnResizeSide, null>, columnIndex: number) => {
    const active = fixedColumnResizeSide === side
    const halfWidth = `${FIXED_COLUMN_RESIZE_HANDLE_WIDTH / 2}px`
    const positionSx =
      side === 'left'
        ? { left: `calc(${fixedLeftColumnsWidth} - ${halfWidth})` }
        : { right: `calc(${fixedRightColumnsWidth} + ${scrollLayoutState.vertical ? '16px' : '0px'} - ${halfWidth})` }

    return (
      <Box
        key={`fixed-column-resize-handle-${side}-${columnIndex}`}
        aria-hidden
        onPointerDown={handleFixedColumnResizePointerDown(side, columnIndex)}
        sx={(theme) => ({
          position: 'absolute',
          top: 0,
          bottom: scrollLayoutState.horizontal ? '18px' : 0,
          width: `${FIXED_COLUMN_RESIZE_HANDLE_WIDTH}px`,
          ...positionSx,
          cursor: 'col-resize',
          touchAction: 'none',
          zIndex: 7,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            left: '4px',
            width: '4px',
            background: `linear-gradient(0deg, transparent 0%, ${theme.palette.mari.Primary} 50%, transparent 100%)`,
            opacity: active ? 1 : 0,
            transition: 'opacity 120ms ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        })}
      />
    )
  }

  const handleSortableHeaderClick = (field: string) => {
    setSortState((current) => getNextSortState(current, field))

    if (loading || rows.length === 0) return

    clearSortSkeletonTimer()
    setSortSkeletonVisible(true)
    sortSkeletonTimerRef.current = setTimeout(() => {
      setSortSkeletonVisible(false)
      sortSkeletonTimerRef.current = undefined
    }, 300)
  }

  const renderHeaderCell = (column: NextGenMIStickyTableColumn<T>, columnIndex: number, sticky: boolean) => {
    const align = column.headerAlign ?? getColumnAlign(column)
    const sortable = Boolean(column.sortable)
    const sortDirection = sortState?.field === column.field ? sortState.direction : null
    const isFixedLeftColumn = fixedLeftColumnIndexSet.has(columnIndex)
    const isFixedRightColumn = fixedRightColumnIndexSet.has(columnIndex)
    const isFixedColumn = fixedColumnIndexSet.has(columnIndex)
    const isLastFixedLeftColumn = lastFixedLeftColumnIndex === columnIndex
    const isFirstFixedRightColumn = firstFixedRightColumnIndex === columnIndex
    const pageStickyHeaderColumnWidth = hasPageStickyHeader ? pageStickyHeaderColumnWidths[columnIndex] : undefined
    const headerColumnWidthSx =
      pageStickyHeaderColumnWidth !== undefined
        ? {
          width: `${pageStickyHeaderColumnWidth}px`,
          minWidth: `${pageStickyHeaderColumnWidth}px`,
          maxWidth: `${pageStickyHeaderColumnWidth}px`,
        }
        : getColumnWidthSx(column, columnIndex, isFixedColumn)
    const shouldStickyLeftAlignedHeader =
      !isFixedColumn && leftAlignedHeaderSticky && align === 'left' && columnIndex > (lastFixedLeftColumnIndex ?? -1)
    const headerStickyTop = hasPageStickyHeader ? toCssLength(pageStickyHeaderTop!) : 0
    const headerStickyZIndex = hasPageStickyHeader ? pageStickyHeaderZIndex : 3
    const fixedHeaderStickyZIndex = hasPageStickyHeader ? pageStickyHeaderZIndex + 1 : 4

    return (
      <Box
        key={column.field}
        component="th"
        aria-sort={sortable ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
        data-next-gen-mi-sticky-table-column-index={columnIndex}
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
            whiteSpace: 'nowrap',
            userSelect: 'none',
            ...headerColumnWidthSx,
            boxSizing: 'border-box',
            bgcolor: 'commonColor.White',
          },
          sticky && {
            position: 'sticky',
            top: headerStickyTop,
            zIndex: headerStickyZIndex,
            boxShadow: hasPageStickyHeader ? NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP : 'var(--next-gen-mi-scroll-top-edge-shadow)',
          },
          isFixedLeftColumn && {
            position: 'sticky',
            left: fixedLeftColumnLeftMap.get(columnIndex),
            zIndex: fixedHeaderStickyZIndex,
          },
          showPageStickyHeaderFixedColumnShadow &&
            isLastFixedLeftColumn && {
            overflow: 'visible',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: '-16px',
              bottom: 0,
              width: '16px',
              pointerEvents: 'none',
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
              opacity: 'var(--next-gen-mi-sticky-left-column-shadow-opacity)',
              transition: 'opacity 180ms ease',
            },
          },
          isFixedRightColumn && {
            position: 'sticky',
            right: fixedRightColumnRightMap.get(columnIndex),
            zIndex: fixedHeaderStickyZIndex,
          },
          showPageStickyHeaderFixedColumnShadow &&
            isFirstFixedRightColumn && {
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-16px',
              bottom: 0,
              width: '16px',
              pointerEvents: 'none',
              background: 'linear-gradient(to left, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
              opacity: 'var(--next-gen-mi-sticky-right-column-shadow-opacity)',
              transition: 'opacity 180ms ease',
            },
          },
          shouldStickyLeftAlignedHeader && { clipPath: 'inset(0)' },
          ...toSxArray(column.headerCellSx),
        ]}
      >
        {sortable ? (
          <Box
            component="button"
            type="button"
            aria-label={`${typeof column.headerName === 'string' ? column.headerName : column.field} 정렬`}
            onClick={() => handleSortableHeaderClick(column.field)}
            sx={[
              {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
                gap: '4px',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                padding: 0,
                border: 0,
                overflow: 'hidden',
                bgcolor: 'transparent',
                color: sortDirection ? 'contentText.Black' : 'inherit',
                font: 'inherit',
                fontWeight: 'inherit',
                textAlign: align,
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': { color: 'contentText.Black' },
              },
              shouldStickyLeftAlignedHeader && {
                position: 'sticky',
                left: leftAlignedHeaderStickyLeft,
                width: 'fit-content',
                maxWidth: '100%',
              },
              ...toSxArray(column.headerContentSx),
            ]}
          >
            <NextGenMIStickyTableHeaderLabel
              label={column.headerName}
              tooltipTitle={column.headerTooltipTitle}
              tooltipWhenTruncated={column.tooltipWhenHeaderTruncated}
            />
            <Box
              component="span"
              aria-hidden
              sx={{
                display: 'inline-flex',
                flexShrink: 0,
                color: sortDirection ? 'mari.Primary' : 'gray.50',
                opacity: sortDirection ? 1 : 0.5,
                transform: sortDirection === 'desc' ? 'rotate(180deg)' : undefined,
                transition: 'transform 120ms ease, color 120ms ease, opacity 120ms ease',
              }}
            >
              <ArrowUpward />
            </Box>
          </Box>
        ) : (
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
              ...toSxArray(column.headerContentSx),
            ]}
          >
            {column.headerName}
          </Box>
        )}
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
    const isBottomRow = rowIndex + rowSpan - 1 === sortedRows.length - 1

    return (
      <Box
        key={column.field}
        component="td"
        rowSpan={rowSpan}
        data-next-gen-mi-sticky-table-column-index={columnIndex}
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
            height: rowHeight === 'auto' ? 'auto' : rowHeight,
            minHeight: rowHeight === 'auto' ? '40px' : undefined,
            lineHeight: bodyLineHeight,
            whiteSpace: 'nowrap',
            overflow: isFixedColumn ? 'visible' : 'hidden',
            textOverflow: 'ellipsis',
            ...getColumnWidthSx(column, columnIndex, isFixedColumn),
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

  const renderTableHeader = (sticky: boolean) => (
    <Box
      component="thead"
      sx={{
        position: 'relative',
        zIndex: sticky && hasPageStickyHeader ? pageStickyHeaderZIndex : 3,
        ...(!sticky ? { boxShadow: NEXT_GEN_MI_SCROLL_EDGE_SHADOW_TOP } : {}),
        bgcolor: 'commonColor.White',
      }}
    >
      <Box component="tr">{columns.map((column, columnIndex) => renderHeaderCell(column, columnIndex, sticky))}</Box>
    </Box>
  )

  const renderHorizontalScrollbar = (sx?: SxProps<Theme>) =>
    scrollLayoutState.horizontal ? (
      <Box
        aria-hidden
        sx={[
          {
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
          },
          ...toSxArray(sx),
        ]}
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
    ) : null

  const pageStickyHeaderTable = showPageStickyHeader ? (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        ref={pageStickyHeaderScrollRef}
        onMouseEnter={handleScrollAreaMouseEnter}
        onMouseLeave={handleScrollAreaMouseLeave}
        onScroll={handlePageStickyHeaderScrollLeft}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: disableHorizontalScroll ? 'hidden' : 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'none',
          scrollbarWidth: 'none',
          pr: scrollLayoutState.vertical ? '16px' : 0,
          ...initialScrollVisualStateSx,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            ...pageStickyHeaderTableWidthSx,
          }}
        >
          <Box
            component="table"
            sx={{
              gridArea: '1 / 1',
              ...pageStickyHeaderTableWidthSx,
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: disableHorizontalScroll ? 'fixed' : 'auto',
            }}
          >
            {renderTableHeader(false)}
          </Box>
        </Box>
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: `calc(${headerHeight} - 1px)`,
          right: scrollLayoutState.vertical ? '16px' : 0,
          left: 0,
          height: '1px',
          pointerEvents: 'none',
          bgcolor: 'contentBorder.Active',
          zIndex: pageStickyHeaderZIndex + 2,
        }}
      />
    </Box>
  ) : null

  const stickyHorizontalScrollbar = scrollLayoutState.horizontal ? (
    <Box
      ref={stickyHorizontalScrollbarRef}
      onMouseEnter={handleScrollAreaMouseEnter}
      onMouseLeave={handleScrollAreaMouseLeave}
      sx={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        height: '18px',
        mt: '-18px',
        pointerEvents: 'none',
        zIndex: showPageStickyHeader ? pageStickyHeaderZIndex : 6,
        ...initialScrollVisualStateSx,
      }}
    >
      {renderHorizontalScrollbar({ zIndex: 1 })}
    </Box>
  ) : null

  const pageStickyHeader = showPageStickyHeader ? (
    <Box
      sx={{
        position: 'sticky',
        top: toCssLength(pageStickyHeaderTop!),
        zIndex: pageStickyHeaderZIndex,
        minHeight: hasPageStickyHeaderBefore ? undefined : headerHeight,
        bgcolor: 'commonColor.White',
        transition: `top ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          top: hasPageStickyHeaderBefore ? '-20px' : '-12px',
          height: hasPageStickyHeaderBefore ? '20px' : '12px',
          bgcolor: 'commonColor.White',
          pointerEvents: 'none',
        },
      }}
    >
      {hasPageStickyHeaderBefore ? (
        <>
          {pageStickyHeaderBefore}
          <Box
            sx={{
              width: '100%',
              minWidth: 0,
              mt: pageStickyHeaderGap,
              bgcolor: 'commonColor.White',
              borderRadius: containerShell ? '10px 10px 0 0' : undefined,
              padding: containerShell ? containerPadding : undefined,
              paddingBottom: containerShell ? 0 : undefined,
              boxSizing: 'border-box',
            }}
          >
            {pageStickyHeaderTable}
          </Box>
        </>
      ) : (
        pageStickyHeaderTable
      )}
    </Box>
  ) : null

  const tableContent = (
    <Box
      ref={tableRootRef}
      onMouseEnter={handleScrollAreaMouseEnter}
      onMouseLeave={handleScrollAreaMouseLeave}
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        ...initialScrollVisualStateSx,
      }}
    >
      <Box
        ref={handleScrollContainerRef}
        onScroll={handleBodyScrollLeft}
        sx={{
          width: '100%',
          ...(maxHeight ? { maxHeight } : {}),
          overflowX: disableHorizontalScroll ? 'hidden' : 'auto',
          overflowY: 'auto',
          overscrollBehaviorX: 'none',
          scrollbarWidth: 'none',
          pr: scrollLayoutState.vertical ? '16px' : 0,
          pb: scrollLayoutState.horizontal && !disableHorizontalScroll ? '18px' : 0,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            ...tableWidthSx,
          }}
        >
          <Box
            component="table"
            sx={{
              gridArea: '1 / 1',
              ...tableWidthSx,
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: disableHorizontalScroll ? 'fixed' : 'auto',
            }}
          >
            {!hideHeader && !showPageStickyHeader && renderTableHeader(true)}

            <Box component="tbody">
              {showSkeletonRows &&
                Array.from({ length: activeSkeletonRowCount }).map((_, rowIndex) => {
                  const isLastSkeletonRow = rowIndex === activeSkeletonRowCount - 1
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
                            data-next-gen-mi-sticky-table-column-index={columnIndex}
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
                                ...getColumnWidthSx(column, columnIndex, isFixedColumn),
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
              {!showSkeletonRows &&
                sortedRows.map((row, rowIndex) => (
                  <Box
                    component="tr"
                    key={getRowKey(row, rowIndex)}
                    onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    sx={{
                      transition: 'background-color 120ms ease',
                      ...(onRowClick ? { cursor: 'pointer' } : {}),
                      '&:hover:not(:has([data-merged-fixed-column="true"]:hover)) td:not([data-merged-fixed-column="true"])': {
                        backgroundColor: 'gray.10',
                      },
                    }}
                  >
                    {columns.map((column, columnIndex) => renderBodyCell(row, rowIndex, column, columnIndex))}
                  </Box>
                ))}
              {!showSkeletonRows && sortedRows.length === 0 && (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={columns.length}
                    sx={{ height: noRowContentMinHeight, borderBottom: 'none', borderColor: 'contentBorder.Normal' }}
                  >
                    <Stack minHeight={noRowContentMinHeight} alignItems="center" justifyContent="center">
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
      </Box>

      {!hideHeader && !showPageStickyHeader && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: `calc(${headerHeight} - 1px)`,
            right: scrollLayoutState.vertical ? '16px' : 0,
            left: 0,
            height: '1px',
            pointerEvents: 'none',
            bgcolor: 'contentBorder.Active',
            zIndex: 5,
          }}
        />
      )}

      {fixedLeftColumnIndexList.length > 0 && (
        <Box
          aria-hidden
          sx={{
            ...STICKY_LEFT_COLUMN_EDGE_SHADOW_OVERLAY_SX,
            ...stickyColumnShadowOverlaySx,
          }}
        />
      )}

      {fixedRightColumnIndexList.length > 0 && (
        <Box
          aria-hidden
          sx={{
            ...STICKY_RIGHT_COLUMN_EDGE_SHADOW_OVERLAY_SX,
            ...stickyColumnShadowOverlaySx,
          }}
        />
      )}

      {resizableFixedColumns && lastFixedLeftColumnIndex !== undefined && renderFixedColumnResizeHandle('left', lastFixedLeftColumnIndex)}

      {resizableFixedColumns &&
        firstFixedRightColumnIndex !== undefined &&
        renderFixedColumnResizeHandle('right', firstFixedRightColumnIndex)}

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
            top: hasStickyHeaderRow ? headerHeight : 0,
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
            top: hasStickyHeaderRow ? headerHeight : 0,
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

  const renderPageStickyTable = (bodyContent: ReactNode) => (
    <Box
      position="relative"
      width="100%"
      minWidth={0}
      sx={pageStickyHeaderReleaseOffset ? { mb: pageStickyHeaderReleaseOffset, overflow: 'visible' } : undefined}
    >
      {pageStickyHeader}
      {pageStickyHeaderReleaseOffset ? <Box sx={{ mb: `calc(0px - ${pageStickyHeaderReleaseOffset})` }}>{bodyContent}</Box> : bodyContent}
    </Box>
  )

  const tableContentWithStickyHorizontalScrollbar = (
    <>
      {tableContent}
      {stickyHorizontalScrollbar}
    </>
  )
  const tableWithPageStickyHeader = showPageStickyHeader
    ? renderPageStickyTable(tableContentWithStickyHorizontalScrollbar)
    : tableContentWithStickyHorizontalScrollbar

  if (!containerShell) return tableWithPageStickyHeader

  if (showPageStickyHeader && hasPageStickyHeaderBefore) {
    return renderPageStickyTable(
      <Box
        sx={{
          width: '100%',
          bgcolor: 'commonColor.White',
          borderRadius: '0 0 10px 10px',
          padding: containerPadding,
          paddingTop: 0,
          boxSizing: 'border-box',
        }}
      >
        {tableContent}
        {stickyHorizontalScrollbar}
      </Box>,
    )
  }

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
      {tableWithPageStickyHeader}
    </Box>
  )
}

export default NextGenMIStickyTable
