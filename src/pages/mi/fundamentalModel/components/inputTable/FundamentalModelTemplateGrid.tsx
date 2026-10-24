import { Box, Stack } from '@mui/material'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import FundamentalModelColumnHeader from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelColumnHeader'
import FundamentalModelHorizontalScrollShadows, {
  FundamentalModelColumnScrollShadows,
} from '@/pages/mi/fundamentalModel/components/inputTable/FundamentalModelHorizontalScrollShadows'
import {
  getRenderedIndices,
  getVisibleColumnRange,
  FUNDAMENTAL_MODEL_ACTION_WIDTH,
  FUNDAMENTAL_MODEL_ROW_HEIGHT,
} from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelTableLayout'
import useFundamentalModelTableViewport from '@/pages/mi/fundamentalModel/components/inputTable/useFundamentalModelTableViewport'
import useSheetColumnPinning from '@/pages/mi/fundamentalModel/components/inputTable/useSheetColumnPinning'

interface TemplateGridColumn {
  field: string
  label: string
  headerValues: string[]
  isNew?: boolean
}

interface Props<Row, Column extends TemplateGridColumn> {
  rows: Row[]
  columns: Column[]
  columnWidths: number[]
  headerHeight: number
  getRowId: (row: Row) => string | number
  getColumnLabel?: (column: Column) => string
  renderCell: (row: Row, column: Column) => ReactNode
  isNewRow?: (row: Row) => boolean
  isRowMenuOpen?: (row: Row) => boolean
  actionHeader?: ReactNode
  actionHeaderPaddingTop?: string
  renderRowAction?: (row: Row) => ReactNode
  renderColumnAction?: (column: Column) => ReactNode
  onViewportChange?: (viewport: { height: number; scrollTop: number }) => void
  scrollTarget?: { rowIndex?: number; columnIndex?: number }
}

const FundamentalModelTemplateGrid = <Row, Column extends TemplateGridColumn>({
  rows,
  columns,
  columnWidths,
  headerHeight,
  getRowId,
  getColumnLabel,
  renderCell,
  isNewRow,
  isRowMenuOpen,
  actionHeader,
  actionHeaderPaddingTop,
  renderRowAction,
  renderColumnAction,
  onViewportChange,
  scrollTarget,
}: Props<Row, Column>) => {
  const { scrollRef, viewport } = useFundamentalModelTableViewport()
  const handledScrollTargetRef = useRef<typeof scrollTarget>(undefined)
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; columnIndex: number }>()
  const fields = useMemo(() => columns.map(({ field }) => field), [columns])
  const showActions = useMemo(
    () => Boolean(actionHeader || (renderRowAction && rows.some((row) => renderRowAction(row)))),
    [actionHeader, renderRowAction, rows],
  )
  const hasFocusedCell = Boolean(focusedCell)
  const rowIndexById = useMemo(() => {
    if (!hasFocusedCell) return undefined
    const index = new Map<string, number>()
    rows.forEach((row, rowIndex) => {
      const id = String(getRowId(row))
      if (!index.has(id)) index.set(id, rowIndex)
    })
    return index
  }, [getRowId, hasFocusedCell, rows])
  const {
    widths,
    offsets: columnOffsets,
    pinnedStyles,
    togglePin,
    getColumnStyle,
    includePinnedIndices,
    hasHorizontalScroll,
    scrollShadows,
  } = useSheetColumnPinning(fields, columnWidths, viewport, showActions ? FUNDAMENTAL_MODEL_ACTION_WIDTH : 0)
  const tableMinWidth = columnOffsets.at(-1)! + (showActions ? FUNDAMENTAL_MODEL_ACTION_WIDTH : 0)
  const gridTemplateColumns = [
    ...widths.map((width) => `${width}px`),
    ...(showActions ? [`${FUNDAMENTAL_MODEL_ACTION_WIDTH}px`] : []),
  ].join(' ')
  const rowStart = Math.min(rows.length, Math.max(0, Math.floor(viewport.scrollTop / FUNDAMENTAL_MODEL_ROW_HEIGHT) - 4))
  const rowEnd = Math.min(
    rows.length,
    Math.ceil((viewport.scrollTop + Math.max(0, viewport.height - headerHeight)) / FUNDAMENTAL_MODEL_ROW_HEIGHT) + 4,
  )
  const focusedRowIndex = focusedCell ? (rowIndexById?.get(focusedCell.rowId) ?? -1) : undefined
  const visibleRowIndices = getRenderedIndices(rowStart, rowEnd, focusedRowIndex)
  const columnRange = getVisibleColumnRange(columnOffsets, viewport.scrollLeft, viewport.width)
  const visibleColumns = includePinnedIndices(getRenderedIndices(columnRange.start, columnRange.end, focusedCell?.columnIndex))
    .map((index) => columns[index] && { ...columns[index], index })
    .filter((column) => Boolean(column))

  useEffect(() => {
    onViewportChange?.({ height: viewport.height, scrollTop: viewport.scrollTop })
  }, [onViewportChange, viewport.height, viewport.scrollTop])

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container || !scrollTarget || handledScrollTargetRef.current === scrollTarget) return
    if (scrollTarget.rowIndex !== undefined) {
      const rowIndex = scrollTarget.rowIndex
      if (rowIndex < 0 || rowIndex >= rows.length) return
      const bottom = headerHeight + (rowIndex + 1) * FUNDAMENTAL_MODEL_ROW_HEIGHT
      if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight
    }
    if (scrollTarget.columnIndex !== undefined) {
      const right = columnOffsets[scrollTarget.columnIndex + 1]
      if (right === undefined) return
      const visibleRight = right + (showActions ? FUNDAMENTAL_MODEL_ACTION_WIDTH : 0)
      if (visibleRight > container.scrollLeft + container.clientWidth) container.scrollLeft = visibleRight - container.clientWidth
    }
    handledScrollTargetRef.current = scrollTarget
  }, [columnOffsets, headerHeight, rows, scrollRef, scrollTarget, showActions])

  return (
    <Stack position="relative" flex={1} minWidth={0} minHeight={0}>
      <ScrollWrapper
        ref={scrollRef}
        height="100%"
        maxHeight="100%"
        contentKey={rows.length}
        thumbInsetTop={headerHeight + 6}
        thumbInsetBottom={6}
        thumbWidth={8}
        thumbMinHeight={120}
        showScrollbarOnHover
        showScrollEdgeShadow
        overflowX="auto"
        showHorizontalScrollbar
        scrollbarOutside
        scrollbarOutsideRightGutter={12}
        scrollbarOutsideBottomGutter={12}
        sx={{ flex: '1 1 0px', width: '100%', minWidth: 0, '& .scroll-wrapper-edge-shadow-top': { top: `${headerHeight}px` } }}
        styScroll={{ borderRadius: '1000px' }}
      >
        <Box
          width="100%"
          minWidth={`${tableMinWidth}px`}
          onFocusCapture={(event) => {
            const target = event.target as HTMLElement
            const rowId = target.closest<HTMLElement>('[data-row-id]')?.dataset.rowId
            const columnIndex = target.closest<HTMLElement>('[data-column-index]')?.dataset.columnIndex
            if (rowId !== undefined && columnIndex !== undefined) setFocusedCell({ rowId, columnIndex: Number(columnIndex) })
            else setFocusedCell(undefined)
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedCell(undefined)
          }}
        >
          <Box
            role="row"
            sx={{
              display: 'grid',
              gridTemplateColumns,
              width: '100%',
              position: 'sticky',
              top: 0,
              zIndex: 3,
              '& [role="columnheader"]': { minWidth: 0, boxSizing: 'border-box', overflow: 'hidden', bgcolor: 'commonColor.White' },
              '& [role="columnheader"][data-new="true"]': { bgcolor: '#FEF5E6' },
              '& [data-row-action="true"]': {
                borderBottom: '1px solid',
                borderColor: 'contentBorder.Active',
                position: 'sticky',
                right: 0,
                zIndex: 2,
              },
            }}
          >
            {visibleColumns.map((column) => (
              <Box
                key={column.field}
                role="columnheader"
                data-column-index={column.index}
                data-new={column.isNew}
                style={{
                  position: 'relative',
                  ...getColumnStyle(column.index),
                  overflow: pinnedStyles.has(column.index) ? 'visible' : undefined,
                }}
              >
                <FundamentalModelColumnHeader
                  values={column.headerValues}
                  label={getColumnLabel?.(column) ?? column.label}
                  pinned={pinnedStyles.has(column.index)}
                  showPin={hasHorizontalScroll}
                  onPinToggle={() => togglePin(column.field)}
                  action={renderColumnAction?.(column)}
                />
                <FundamentalModelColumnScrollShadows columnIndex={column.index} height={viewport.height} offsets={scrollShadows} />
              </Box>
            ))}
            {showActions && (
              <Stack
                role="columnheader"
                data-row-action="true"
                height={`${headerHeight}px`}
                alignItems="center"
                paddingTop={actionHeaderPaddingTop}
                boxSizing="border-box"
                style={{ gridColumn: -2 }}
              >
                {actionHeader}
              </Stack>
            )}
          </Box>
          <Box
            role="rowgroup"
            style={{ height: rows.length * FUNDAMENTAL_MODEL_ROW_HEIGHT }}
            sx={{
              position: 'relative',
              overscrollBehavior: 'contain',
              overflowAnchor: 'none',
              '& [role="row"]': { display: 'grid', gridTemplateColumns },
              '& [role="cell"]': {
                height: `${FUNDAMENTAL_MODEL_ROW_HEIGHT}px`,
                padding: '6px 8px',
                borderBottom: '1px solid',
                borderColor: 'contentBorder.Normal',
                boxSizing: 'border-box',
                overflow: 'hidden',
                bgcolor: 'commonColor.White',
              },
              '& [data-even="true"] [role="cell"]': { bgcolor: 'gray.5' },
              '& [role="row"]:hover [role="cell"]': { bgcolor: 'gray.10' },
              '& [role="row"][data-menu-open="true"] [role="cell"]': { bgcolor: 'gray.10' },
              '& [role="cell"][data-new="true"], & [role="row"]:hover [role="cell"][data-new="true"]': {
                bgcolor: 'rgba(245, 159, 0, 0.1)',
              },
              '& [data-row-action="true"]': {
                width: `${FUNDAMENTAL_MODEL_ACTION_WIDTH}px`,
                minWidth: `${FUNDAMENTAL_MODEL_ACTION_WIDTH}px`,
                maxWidth: `${FUNDAMENTAL_MODEL_ACTION_WIDTH}px`,
                textAlign: 'center',
                padding: '3px 0',
                position: 'sticky',
                right: 0,
                zIndex: 1,
              },
            }}
          >
            {visibleRowIndices.map((rowIndex) => {
              const row = rows[rowIndex]
              return (
                <Box
                  key={getRowId(row)}
                  role="row"
                  data-row-id={getRowId(row)}
                  data-even={rowIndex % 2 === 1}
                  data-menu-open={isRowMenuOpen?.(row)}
                  data-new={isNewRow?.(row)}
                  style={{ position: 'absolute', top: rowIndex * FUNDAMENTAL_MODEL_ROW_HEIGHT, width: '100%' }}
                >
                  {visibleColumns.map((column) => (
                    <Box
                      key={column.field}
                      role="cell"
                      data-column-index={column.index}
                      data-new={column.isNew || isNewRow?.(row)}
                      style={getColumnStyle(column.index)}
                    >
                      {renderCell(row, column)}
                    </Box>
                  ))}
                  {showActions && (
                    <Box role="cell" data-row-action="true" data-column-index={-1} data-new={isNewRow?.(row)} style={{ gridColumn: -2 }}>
                      {renderRowAction?.(row)}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      </ScrollWrapper>
      <FundamentalModelHorizontalScrollShadows viewport={viewport} offsets={scrollShadows} />
    </Stack>
  )
}

export default FundamentalModelTemplateGrid
