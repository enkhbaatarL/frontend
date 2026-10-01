import { Box, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import type { FundamentalModelSheetDataRow } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import AddIcon from '@/components/common/icons/AddIcon'
import FundamentalModelColumnHeader from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelColumnHeader'
import FundamentalModelEditedCellInput from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelEditedCellInput'
import FundamentalModelHorizontalScrollShadows, {
  FundamentalModelColumnScrollShadows,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelHorizontalScrollShadows'
import FundamentalModelRowMenu from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelRowMenu'
import getSheetCellTextAlign from '@/pages/mi/fundamentalModel/components/sheetTemplates/getSheetCellTextAlign'
import {
  getRenderedIndices,
  getUtilizationColumnWidth,
  getVisibleColumnRange,
  UTILIZATION_ACTION_WIDTH,
  UTILIZATION_ROW_HEIGHT,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/monthlyLNGTrainUtilizationLayout'
import useUtilizationViewport from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/useUtilizationViewport'
import useSheetColumnPinning from '@/pages/mi/fundamentalModel/components/sheetTemplates/useSheetColumnPinning'

interface RegasEditableTableProps {
  columns: { field: string; label: string; year?: string; month?: string; isNew?: boolean }[]
  rows: FundamentalModelSheetDataRow[]
  originalRows: FundamentalModelSheetDataRow[]
  firstNewRowId: number
  onInsert: (id: number, position: 'above' | 'below') => void
  onDelete: (id: number) => void
  onUpdate: (id: number, field: string, value: string) => void
  onAddColumn: () => void
  isReadOnly?: (row: FundamentalModelSheetDataRow, field: string) => boolean
}

const RegasEditableTable = ({
  columns,
  rows,
  originalRows,
  firstNewRowId,
  onInsert,
  onDelete,
  onUpdate,
  onAddColumn,
  isReadOnly,
}: RegasEditableTableProps) => {
  const [activeRowId, setActiveRowId] = useState<number>()
  const [focusedCell, setFocusedCell] = useState<{ rowId: number; columnIndex: number }>()
  const { scrollRef, viewport } = useUtilizationViewport()
  const originals = useMemo(() => new Map(originalRows.map((row) => [row.id, row])), [originalRows])
  const hasPeriodHeaders = columns.some(({ year, month }) => year && month)
  const headerHeight = hasPeriodHeaders ? 48 : 24
  const minimumWidths = useMemo(
    () =>
      columns.map((column) =>
        getUtilizationColumnWidth(
          { ...column, year: column.year ?? '', month: column.month ?? '', period: '', isMonthly: Boolean(column.year && column.month) },
          originalRows,
        ),
      ),
    [columns, originalRows],
  )
  const fields = useMemo(() => columns.map(({ field }) => field), [columns])
  const { widths, offsets, pinnedStyles, togglePin, getColumnStyle, includePinnedIndices, hasHorizontalScroll, scrollShadows } =
    useSheetColumnPinning(fields, minimumWidths, viewport, UTILIZATION_ACTION_WIDTH)
  const gridTemplateColumns = [...widths.map((width) => `${width}px`), `${UTILIZATION_ACTION_WIDTH}px`].join(' ')
  const rowStart = Math.max(0, Math.floor(viewport.scrollTop / UTILIZATION_ROW_HEIGHT) - 4)
  const rowEnd = Math.min(
    rows.length,
    Math.ceil((viewport.scrollTop + Math.max(0, viewport.height - headerHeight)) / UTILIZATION_ROW_HEIGHT) + 4,
  )
  const focusedRowIndex = focusedCell ? rows.findIndex(({ id }) => id === focusedCell.rowId) : undefined
  const visibleRows = getRenderedIndices(rowStart, rowEnd, focusedRowIndex)
  const visibleRange = getVisibleColumnRange(offsets, viewport.scrollLeft, viewport.width)
  const visibleColumns = includePinnedIndices(getRenderedIndices(visibleRange.start, visibleRange.end, focusedCell?.columnIndex))

  return (
    <Stack flex={1} minWidth={0} minHeight={0} padding="10px 8px 10px 20px" overflow="hidden">
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
            minWidth={`${offsets.at(-1)! + UTILIZATION_ACTION_WIDTH}px`}
            onFocusCapture={(event) => {
              const target = event.target as HTMLElement
              const rowId = target.closest<HTMLElement>('[data-row-id]')?.dataset.rowId
              const columnIndex = target.closest<HTMLElement>('[data-column-index]')?.dataset.columnIndex
              if (rowId !== undefined && columnIndex !== undefined)
                setFocusedCell({ rowId: Number(rowId), columnIndex: Number(columnIndex) })
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
                '& [role="columnheader"][data-new="true"]': { bgcolor: 'commonColor.Primarylight1' },
                '& [data-row-action="true"]': {
                  borderBottom: '1px solid',
                  borderColor: 'contentBorder.Active',
                  position: 'sticky',
                  right: 0,
                  zIndex: 2,
                },
              }}
            >
              {visibleColumns.map((index) => {
                const column = columns[index]
                return (
                  <Box
                    key={column.field}
                    role="columnheader"
                    data-column-index={index}
                    data-new={column.isNew}
                    style={{ position: 'relative', ...getColumnStyle(index), overflow: pinnedStyles.has(index) ? 'visible' : undefined }}
                  >
                    <FundamentalModelColumnHeader
                      values={hasPeriodHeaders ? [column.year ?? '', column.month || column.label] : [column.label]}
                      label={column.year && column.month ? `${column.year}년 ${column.month}월` : column.label}
                      align={column.month ? 'right' : 'left'}
                      pinned={pinnedStyles.has(index)}
                      showPin={hasHorizontalScroll}
                      onPinToggle={() => togglePin(column.field)}
                    />
                    <FundamentalModelColumnScrollShadows columnIndex={index} height={viewport.height} offsets={scrollShadows} />
                  </Box>
                )
              })}
              <Stack
                role="columnheader"
                data-row-action="true"
                height={`${headerHeight}px`}
                alignItems="center"
                paddingTop={hasPeriodHeaders ? '4px' : '0px'}
                boxSizing="border-box"
                style={{ gridColumn: -2 }}
              >
                <MIBaseButton
                  variant="outlined"
                  aria-label="마지막 열 오른쪽에 열 추가"
                  onClick={onAddColumn}
                  sx={{ width: '24px', minWidth: '24px', height: '24px', padding: '0', borderRadius: '4px' }}
                >
                  <AddIcon width="18px" height="18px" color="#868E96" />
                </MIBaseButton>
              </Stack>
            </Box>
            <Box
              role="rowgroup"
              style={{ height: rows.length * UTILIZATION_ROW_HEIGHT }}
              sx={{
                position: 'relative',
                overscrollBehavior: 'contain',
                overflowAnchor: 'none',
                '& [role="row"]': { display: 'grid', gridTemplateColumns },
                '& [role="cell"]': {
                  height: `${UTILIZATION_ROW_HEIGHT}px`,
                  padding: '6px 8px',
                  borderBottom: '1px solid',
                  borderColor: 'contentBorder.Normal',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  bgcolor: 'commonColor.White',
                },
                '& [data-even="true"] [role="cell"]': { bgcolor: 'gray.5' },
                '& [role="row"]:hover [role="cell"], & [role="row"][data-menu-open="true"] [role="cell"]': { bgcolor: 'gray.10' },
                '& [role="cell"][data-new="true"], & [role="row"]:hover [role="cell"][data-new="true"]': {
                  bgcolor: 'commonColor.Primarylight1',
                },
                '& [data-row-action="true"]': {
                  width: `${UTILIZATION_ACTION_WIDTH}px`,
                  minWidth: `${UTILIZATION_ACTION_WIDTH}px`,
                  maxWidth: `${UTILIZATION_ACTION_WIDTH}px`,
                  textAlign: 'center',
                  padding: '3px 0',
                  position: 'sticky',
                  right: 0,
                  zIndex: 1,
                },
              }}
            >
              {visibleRows.map((rowIndex) => {
                const row = rows[rowIndex]
                const original = originals.get(row.id)
                const isNew = row.id < 0 || row.id >= firstNewRowId
                return (
                  <Box
                    key={row.id}
                    role="row"
                    data-row-id={row.id}
                    data-even={rowIndex % 2 === 1}
                    data-menu-open={activeRowId === row.id}
                    style={{ position: 'absolute', top: rowIndex * UTILIZATION_ROW_HEIGHT, width: '100%' }}
                  >
                    {visibleColumns.map((index) => {
                      const column = columns[index]
                      return (
                        <Box
                          key={column.field}
                          role="cell"
                          data-column-index={index}
                          data-new={isNew || column.isNew}
                          style={getColumnStyle(index)}
                        >
                          {isReadOnly?.(row, column.field) && !column.isNew ? (
                            <Stack height="100%" minWidth={0} justifyContent="center">
                              <Typography
                                variant="body2M14"
                                color="contentText.Normal"
                                textAlign={getSheetCellTextAlign(row[column.field] ?? '')}
                                noWrap
                                title={String(row[column.field] ?? '')}
                              >
                                {row[column.field] ?? ''}
                              </Typography>
                            </Stack>
                          ) : (
                            <FundamentalModelEditedCellInput
                              value={row[column.field] ?? ''}
                              originalValue={original?.[column.field] ?? ''}
                              isNew={isNew || column.isNew}
                              textAlign={Number(column.field.replace('column', '')) >= 6 ? 'right' : 'left'}
                              onChange={(value) => onUpdate(row.id, column.field, value)}
                              onBlur={() => undefined}
                              onRestore={() => onUpdate(row.id, column.field, String(original?.[column.field] ?? ''))}
                            />
                          )}
                        </Box>
                      )
                    })}
                    <Box role="cell" data-row-action="true" data-column-index={-1} data-new={isNew} style={{ gridColumn: -2 }}>
                      <FundamentalModelRowMenu
                        rowNumber={row.rowNumber}
                        open={activeRowId === row.id}
                        onOpenChange={(open) => setActiveRowId((current) => (open ? row.id : current === row.id ? undefined : current))}
                        onInsertAbove={() => onInsert(row.id, 'above')}
                        onInsertBelow={() => onInsert(row.id, 'below')}
                        onDelete={() => onDelete(row.id)}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </ScrollWrapper>
        <FundamentalModelHorizontalScrollShadows viewport={viewport} offsets={scrollShadows} />
      </Stack>
    </Stack>
  )
}

export default RegasEditableTable
