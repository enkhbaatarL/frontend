import { Box, Stack, Typography } from '@mui/material'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'

const MATRIX_ROW_HOVERED_ATTRIBUTE = 'data-matrix-row-hovered'

export const MatrixHeaderRow = ({
  value,
  align = 'right',
  border = true,
}: {
  value?: string
  align?: 'left' | 'right'
  border?: boolean
}) => {
  const { ref, isEllipsis } = useEllipsisDetection(value)
  const content = (
    <Stack
      component="span"
      alignItems={align === 'right' ? 'flex-end' : 'flex-start'}
      justifyContent="center"
      flexShrink={0}
      width="100%"
      height="24px"
      minWidth={0}
      padding="2px 8px"
      borderBottom={border ? '0.5px solid' : 'none'}
      borderColor="contentBorder.Active"
      boxSizing="border-box"
      overflow="hidden"
    >
      {value !== undefined && (
        <Typography
          ref={ref}
          component="span"
          variant="body2M14"
          color="contentText.Black"
          width="100%"
          minWidth={0}
          textAlign={align}
          noWrap
        >
          {value}
        </Typography>
      )}
    </Stack>
  )

  if (value === undefined || !isEllipsis) return content

  return <NextGenMIFollowCursorTooltip title={value}>{content}</NextGenMIFollowCursorTooltip>
}

interface ScenarioModelExecutionMatrixTableProps<T> {
  columns: NextGenMIStickyTableColumn<T>[]
  headerHeight: string
  leftScrollContainerRef: { current: HTMLDivElement | null }
  maxHeight?: string
  rightScrollContainerRef: { current: HTMLDivElement | null }
  rowKeyPrefix: string
  rows: T[]
  xAxisStartColumnIndex: number
  xAxisHeaderLabels: string[]
}

const ScenarioModelExecutionMatrixTable = <T,>({
  columns,
  headerHeight,
  leftScrollContainerRef,
  maxHeight,
  rightScrollContainerRef,
  rowKeyPrefix,
  rows,
  xAxisStartColumnIndex,
  xAxisHeaderLabels,
}: ScenarioModelExecutionMatrixTableProps<T>) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const splitterCleanupRef = useRef<(() => void) | null>(null)
  const splitterAnimationFrameRef = useRef(0)
  const hoverSyncAnimationFrameRef = useRef(0)
  const leftPaneWidthDraftRef = useRef(0)
  const synchronizedRowElementsRef = useRef<HTMLTableRowElement[][]>([])
  const synchronizedHoveredRowIndexRef = useRef<number | null>(null)
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null)
  const [rootWidth, setRootWidth] = useState(0)
  const [leftPaneWidth, setLeftPaneWidth] = useState<number>()
  const [isSplitterDragging, setIsSplitterDragging] = useState(false)
  const leftColumns = useMemo(() => columns.slice(0, xAxisStartColumnIndex), [columns, xAxisStartColumnIndex])
  const rightColumns = useMemo(() => columns.slice(xAxisStartColumnIndex), [columns, xAxisStartColumnIndex])
  const leftContentWidth = useMemo(() => leftColumns.reduce((width, column) => width + Number.parseFloat(column.width), 0), [leftColumns])
  const maximumLeftPaneWidth = rootWidth > 0 ? Math.min(leftContentWidth, Math.max(0, rootWidth - 120)) : leftContentWidth
  const minimumLeftPaneWidth = Math.min(120, maximumLeftPaneWidth)
  const resolvedLeftPaneWidth = Math.max(minimumLeftPaneWidth, Math.min(leftPaneWidth ?? maximumLeftPaneWidth, maximumLeftPaneWidth))

  const clearSynchronizedRowHover = useCallback(() => {
    const hoveredRowIndex = synchronizedHoveredRowIndexRef.current
    if (hoveredRowIndex !== null) {
      synchronizedRowElementsRef.current[hoveredRowIndex]?.forEach((rowElement) => {
        rowElement.removeAttribute(MATRIX_ROW_HOVERED_ATTRIBUTE)
      })
    }
    synchronizedHoveredRowIndexRef.current = null
  }, [])

  const updateSynchronizedRowHover = useCallback(
    (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        clearSynchronizedRowHover()
        return
      }

      const rowElement = target.closest<HTMLTableRowElement>('tbody > tr')
      const rowIndex = rowElement?.sectionRowIndex
      const synchronizedRowElements = rowIndex === undefined ? undefined : synchronizedRowElementsRef.current[rowIndex]

      if (
        !rowElement ||
        rowIndex === undefined ||
        !synchronizedRowElements?.includes(rowElement) ||
        target.closest('[data-merged-fixed-column="true"]')
      ) {
        clearSynchronizedRowHover()
        return
      }
      if (synchronizedHoveredRowIndexRef.current === rowIndex) return

      clearSynchronizedRowHover()
      synchronizedRowElements.forEach((synchronizedRowElement) => {
        synchronizedRowElement.setAttribute(MATRIX_ROW_HOVERED_ATTRIBUTE, 'true')
      })
      synchronizedHoveredRowIndexRef.current = rowIndex
    },
    [clearSynchronizedRowHover],
  )

  const scheduleSynchronizedRowHoverUpdate = useCallback(() => {
    if (hoverSyncAnimationFrameRef.current || !pointerPositionRef.current) return

    hoverSyncAnimationFrameRef.current = globalThis.requestAnimationFrame(() => {
      hoverSyncAnimationFrameRef.current = 0
      const pointerPosition = pointerPositionRef.current
      if (!pointerPosition) return
      updateSynchronizedRowHover(globalThis.document.elementFromPoint(pointerPosition.x, pointerPosition.y))
    })
  }, [updateSynchronizedRowHover])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const updateRootWidth = () => {
      const nextWidth = Math.floor(root.getBoundingClientRect().width)
      setRootWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth))
    }

    updateRootWidth()
    const resizeObserver = new ResizeObserver(updateRootWidth)
    resizeObserver.observe(root)

    return () => resizeObserver.disconnect()
  }, [])

  useLayoutEffect(() => {
    clearSynchronizedRowHover()

    const leftRowElements = leftScrollContainerRef.current?.querySelector<HTMLTableSectionElement>('tbody')?.rows
    const rightRowElements = rightScrollContainerRef.current?.querySelector<HTMLTableSectionElement>('tbody')?.rows
    synchronizedRowElementsRef.current = rows.map((_, rowIndex) => {
      const synchronizedRowElements: HTMLTableRowElement[] = []
      const leftRowElement = leftRowElements?.item(rowIndex)
      const rightRowElement = rightRowElements?.item(rowIndex)
      if (leftRowElement) synchronizedRowElements.push(leftRowElement)
      if (rightRowElement) synchronizedRowElements.push(rightRowElement)
      return synchronizedRowElements
    })

    const pointerPosition = pointerPositionRef.current
    if (pointerPosition) {
      updateSynchronizedRowHover(globalThis.document.elementFromPoint(pointerPosition.x, pointerPosition.y))
    }

    return () => {
      clearSynchronizedRowHover()
      synchronizedRowElementsRef.current = []
    }
  }, [
    clearSynchronizedRowHover,
    leftColumns,
    leftScrollContainerRef,
    rightColumns,
    rightScrollContainerRef,
    rows,
    updateSynchronizedRowHover,
  ])

  useEffect(() => {
    const leftScrollContainer = leftScrollContainerRef.current
    const rightScrollContainer = rightScrollContainerRef.current
    if (!leftScrollContainer || !rightScrollContainer) return undefined

    const syncScrollTop = (source: HTMLDivElement, target: HTMLDivElement) => {
      if (Math.abs(source.scrollTop - target.scrollTop) < 1) return
      target.scrollTop = source.scrollTop
    }
    const syncFromLeft = () => {
      syncScrollTop(leftScrollContainer, rightScrollContainer)
      scheduleSynchronizedRowHoverUpdate()
    }
    const syncFromRight = () => {
      syncScrollTop(rightScrollContainer, leftScrollContainer)
      scheduleSynchronizedRowHoverUpdate()
    }

    leftScrollContainer.addEventListener('scroll', syncFromLeft, { passive: true })
    rightScrollContainer.addEventListener('scroll', syncFromRight, { passive: true })

    return () => {
      leftScrollContainer.removeEventListener('scroll', syncFromLeft)
      rightScrollContainer.removeEventListener('scroll', syncFromRight)
    }
  }, [columns.length, leftScrollContainerRef, rightScrollContainerRef, rows.length, scheduleSynchronizedRowHoverUpdate])

  useEffect(
    () => () => {
      if (splitterAnimationFrameRef.current) globalThis.cancelAnimationFrame(splitterAnimationFrameRef.current)
      if (hoverSyncAnimationFrameRef.current) globalThis.cancelAnimationFrame(hoverSyncAnimationFrameRef.current)
      splitterCleanupRef.current?.()
      pointerPositionRef.current = null
      clearSynchronizedRowHover()
    },
    [clearSynchronizedRowHover],
  )

  useEffect(() => {
    const clearPointerHover = () => {
      pointerPositionRef.current = null
      clearSynchronizedRowHover()
    }
    const handleVisibilityChange = () => {
      if (globalThis.document.hidden) clearPointerHover()
    }

    globalThis.addEventListener('blur', clearPointerHover)
    globalThis.document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      globalThis.removeEventListener('blur', clearPointerHover)
      globalThis.document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearSynchronizedRowHover])

  const constrainLeftPaneWidth = (width: number) => Math.max(minimumLeftPaneWidth, Math.min(width, maximumLeftPaneWidth))
  const applyLeftPaneWidthDraft = (width: number) => {
    leftPaneWidthDraftRef.current = width
    if (splitterAnimationFrameRef.current) return

    splitterAnimationFrameRef.current = globalThis.requestAnimationFrame(() => {
      splitterAnimationFrameRef.current = 0
      rootRef.current?.style.setProperty('--matrix-parameter-left-pane-width', `${leftPaneWidthDraftRef.current}px`)
    })
  }
  const commitLeftPaneWidth = (width: number) => {
    if (splitterAnimationFrameRef.current) {
      globalThis.cancelAnimationFrame(splitterAnimationFrameRef.current)
      splitterAnimationFrameRef.current = 0
    }

    const nextWidth = constrainLeftPaneWidth(width)
    leftPaneWidthDraftRef.current = nextWidth
    rootRef.current?.style.setProperty('--matrix-parameter-left-pane-width', `${nextWidth}px`)
    setLeftPaneWidth(nextWidth)
  }
  const handleSplitterPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (minimumLeftPaneWidth === maximumLeftPaneWidth) return

    event.preventDefault()
    event.stopPropagation()
    splitterCleanupRef.current?.()

    const startX = event.clientX
    const renderedLeftPaneWidth = Number.parseFloat(rootRef.current?.style.getPropertyValue('--matrix-parameter-left-pane-width') ?? '')
    const startWidth = Number.isFinite(renderedLeftPaneWidth) ? renderedLeftPaneWidth : resolvedLeftPaneWidth
    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    const abortController = new AbortController()
    leftPaneWidthDraftRef.current = startWidth
    const handlePointerMove = (moveEvent: PointerEvent) => {
      applyLeftPaneWidthDraft(constrainLeftPaneWidth(Math.round(startWidth + moveEvent.clientX - startX)))
    }
    const cleanup = () => {
      abortController.abort()
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      if (splitterCleanupRef.current === cleanup) splitterCleanupRef.current = null
    }
    const finishResize = () => {
      cleanup()
      commitLeftPaneWidth(leftPaneWidthDraftRef.current)
      setIsSplitterDragging(false)
    }

    setIsSplitterDragging(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    splitterCleanupRef.current = cleanup
    globalThis.addEventListener('pointermove', handlePointerMove, { passive: true, signal: abortController.signal })
    globalThis.addEventListener('pointerup', finishResize, { once: true, signal: abortController.signal })
    globalThis.addEventListener('pointercancel', finishResize, { once: true, signal: abortController.signal })
  }
  const handleSplitterKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    event.preventDefault()
    commitLeftPaneWidth(resolvedLeftPaneWidth + (event.key === 'ArrowRight' ? 20 : -20))
  }
  const handleMatrixPointerOver = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      pointerPositionRef.current = null
      clearSynchronizedRowHover()
      return
    }

    pointerPositionRef.current = { x: event.clientX, y: event.clientY }
    updateSynchronizedRowHover(event.target)
  }
  const handleMatrixPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    pointerPositionRef.current = { x: event.clientX, y: event.clientY }
  }
  const handleMatrixPointerEnd = () => {
    pointerPositionRef.current = null
    clearSynchronizedRowHover()
  }
  const renderTable = (
    paneColumns: NextGenMIStickyTableColumn<T>[],
    scrollContainerRef: { current: HTMLDivElement | null },
    options: {
      cellEdgeInsetLeft?: boolean
      cellEdgeInsetRight?: boolean
      hideVerticalScrollbar?: boolean
      leftScrollEdgeEffect?: 'gradient' | 'shadow' | 'none'
      rightScrollEdgeEffect?: 'gradient' | 'shadow' | 'none'
    },
  ) => (
    <NextGenMIStickyTable<T>
      columns={paneColumns}
      rows={rows}
      getRowKey={(_, index) => `${rowKeyPrefix}-${index}`}
      rowHeight="42px"
      headerHeight={headerHeight}
      cellPaddingX="8px"
      cellEdgeInsetLeft={options.cellEdgeInsetLeft}
      cellEdgeInsetRight={options.cellEdgeInsetRight}
      cellPaddingY="6px"
      headerFontSize="14px"
      bodyFontSize="12px"
      noRowMessage="파라미터 데이터가 없습니다."
      maxHeight={maxHeight}
      containerShell={false}
      scrollContainerRef={scrollContainerRef}
      hideVerticalScrollbar={options.hideVerticalScrollbar}
      leftScrollEdgeEffect={options.leftScrollEdgeEffect}
      rightScrollEdgeEffect={options.rightScrollEdgeEffect}
      reserveHorizontalScrollbarGutter
      oddBackground
    />
  )

  return (
    <Stack
      ref={rootRef}
      direction="row"
      position="relative"
      width="100%"
      minWidth={0}
      overflow="hidden"
      style={{ '--matrix-parameter-left-pane-width': `${resolvedLeftPaneWidth}px` } as CSSProperties}
      onPointerOver={handleMatrixPointerOver}
      onPointerMove={handleMatrixPointerMove}
      onPointerLeave={handleMatrixPointerEnd}
      onPointerCancel={handleMatrixPointerEnd}
      sx={{
        [`& tbody > tr[${MATRIX_ROW_HOVERED_ATTRIBUTE}="true"] > td:not([data-merged-fixed-column="true"])`]: {
          backgroundColor: 'gray.10',
        },
      }}
    >
      <Box
        position="relative"
        width="var(--matrix-parameter-left-pane-width)"
        flex="0 0 var(--matrix-parameter-left-pane-width)"
        minWidth={0}
        overflow="hidden"
      >
        {renderTable(leftColumns, leftScrollContainerRef, {
          cellEdgeInsetRight: false,
          hideVerticalScrollbar: true,
          leftScrollEdgeEffect: 'gradient',
          rightScrollEdgeEffect: 'none',
        })}
        {xAxisHeaderLabels.length > 0 && (
          <Stack
            aria-hidden
            position="absolute"
            top="0px"
            right="0px"
            zIndex={6}
            width={leftColumns[leftColumns.length - 1]?.width}
            maxWidth="100%"
            bgcolor="commonColor.White"
            sx={{ pointerEvents: 'none' }}
          >
            {xAxisHeaderLabels.map((label, index) => (
              <MatrixHeaderRow key={`${label}-${index}`} value={label} />
            ))}
          </Stack>
        )}
      </Box>
      <Box flex="1 1 0" minWidth={0} overflow="hidden">
        {renderTable(rightColumns, rightScrollContainerRef, { cellEdgeInsetLeft: false, leftScrollEdgeEffect: 'shadow' })}
      </Box>
      <Stack
        role="separator"
        aria-label="고정 열 영역 너비 조절"
        aria-orientation="vertical"
        aria-valuemin={minimumLeftPaneWidth}
        aria-valuemax={maximumLeftPaneWidth}
        aria-valuenow={resolvedLeftPaneWidth}
        tabIndex={0}
        position="absolute"
        top="0px"
        bottom="0px"
        left="calc(var(--matrix-parameter-left-pane-width) - 6px)"
        width="12px"
        alignItems="center"
        justifyContent="center"
        onPointerDown={handleSplitterPointerDown}
        onKeyDown={handleSplitterKeyDown}
        sx={{
          cursor: minimumLeftPaneWidth === maximumLeftPaneWidth ? 'default' : 'col-resize',
          outline: 'none',
          touchAction: 'none',
          zIndex: 7,
          '&:hover .matrix-parameter-splitter-track, &:focus-visible .matrix-parameter-splitter-track': {
            opacity: 1,
          },
        }}
      >
        <Stack
          className="matrix-parameter-splitter-track"
          width="100%"
          height="100%"
          padding="10px 0"
          alignItems="center"
          justifyContent="center"
          boxSizing="border-box"
          sx={{ opacity: isSplitterDragging ? 1 : 0, transition: 'opacity 120ms ease' }}
        >
          <Stack
            width="4px"
            flex={1}
            minHeight={0}
            sx={(theme) => ({
              background: `linear-gradient(0deg, transparent 0%, ${theme.palette.mari.Primary} 50%, transparent 100%)`,
            })}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioModelExecutionMatrixTable
