import { Box, Stack } from '@mui/material'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelSheetDataRow } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import FundamentalModelEditedCellInput from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelEditedCellInput'
import FundamentalModelRowMenu from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelRowMenu'

const inputColumns = [
  { field: 'column8', fallbackLabel: 'Year' },
  { field: 'column9', fallbackLabel: 'Month' },
  { field: 'column10', fallbackLabel: 'Country' },
  { field: 'column12', fallbackLabel: 'Volumes (Mt)' },
] as const

const hasInputValue = (row: FundamentalModelSheetDataRow) => inputColumns.some(({ field }) => String(row[field] ?? '').trim().length > 0)

const createEmptyRow = (): FundamentalModelSheetDataRow => ({
  id: 0,
  rowNumber: 8,
  column8: '',
  column9: '',
  column10: '',
  column12: '',
})

const getProductionRows = (rows: FundamentalModelSheetDataRow[]) => rows.filter((row) => row.rowNumber >= 8 && hasInputValue(row))

const getContentWidth = (value: string | number) =>
  Array.from(String(value)).reduce((width, character) => width + (character.charCodeAt(0) > 255 ? 14 : 8), 0)

type ProductionColumn = { field: (typeof inputColumns)[number]['field']; label: string }

interface ProductionAdjustmentRowProps {
  row: FundamentalModelSheetDataRow
  originalRow?: FundamentalModelSheetDataRow
  columns: ProductionColumn[]
  isMenuOpen: boolean
  onMenuOpenChange: (rowId: number, open: boolean) => void
  onInsert: (rowId: number, position: 'above' | 'below') => void
  onDelete: (rowId: number) => void
  onUpdate: (rowId: number, field: (typeof inputColumns)[number]['field'], value: string) => void
  onRestore: (rowId: number, field: (typeof inputColumns)[number]['field'], value: string | number) => void
  onWidthCommit: () => void
}

const ProductionAdjustmentRow = memo(
  ({
    row,
    originalRow,
    columns,
    isMenuOpen,
    onMenuOpenChange,
    onInsert,
    onDelete,
    onUpdate,
    onRestore,
    onWidthCommit,
  }: ProductionAdjustmentRowProps) => (
    <Box role="row" data-menu-open={isMenuOpen} data-new={!originalRow}>
      {columns.map(({ field }) => (
        <Box key={field} role="cell">
          <FundamentalModelEditedCellInput
            value={row[field] ?? ''}
            originalValue={originalRow ? (originalRow[field] ?? '') : undefined}
            isNew={!originalRow}
            onChange={(value) => onUpdate(row.id, field, value)}
            onBlur={onWidthCommit}
            onRestore={() => {
              if (originalRow) onRestore(row.id, field, originalRow[field] ?? '')
            }}
            textAlign={field === 'column12' ? 'right' : 'left'}
          />
        </Box>
      ))}
      <Box role="cell" data-row-action="true">
        <FundamentalModelRowMenu
          rowNumber={row.rowNumber}
          open={isMenuOpen}
          onOpenChange={(open) => onMenuOpenChange(row.id, open)}
          onInsertAbove={() => onInsert(row.id, 'above')}
          onInsertBelow={() => onInsert(row.id, 'below')}
          onDelete={() => onDelete(row.id)}
        />
      </Box>
    </Box>
  ),
)

ProductionAdjustmentRow.displayName = 'ProductionAdjustmentRow'

const PNGProductionAdjustment = ({ data, draft, onDraftChange }: SheetTemplateProps) => {
  const productionRows = useMemo(() => getProductionRows(data.rows), [data.rows])
  const initialRows = useMemo(() => (productionRows.length > 0 ? productionRows : [createEmptyRow()]), [productionRows])
  const originalRowsById = useMemo(() => new Map(productionRows.map((row) => [row.id, row])), [productionRows])
  const headerRow = useMemo(() => data.rows.find((row) => row.rowNumber === 7), [data.rows])
  const columns = useMemo(
    () => inputColumns.map((column) => ({ ...column, label: String(headerRow?.[column.field] ?? column.fallbackLabel) })),
    [headerRow],
  )
  const [rows, setRows] = useState(() => draft?.rows ?? initialRows)
  const [activeRowId, setActiveRowId] = useState<number>()
  const [columnWidthRows, setColumnWidthRows] = useState(rows)
  const [isScrollable, setIsScrollable] = useState(false)
  const [scrollLeft, setScrollLeft] = useState(0)
  const rowsRef = useRef(rows)
  const nextRowIdRef = useRef([...data.rows, ...(draft?.rows ?? [])].reduce((maximum, { id }) => Math.max(maximum, id), 0) + 1)
  const tableBodyRef = useRef<HTMLDivElement>(null)
  const columnWidths = useMemo(
    () =>
      Object.fromEntries(
        columns.map(({ field, label }) => [
          field,
          `${Math.max(140, ...[label, ...columnWidthRows.map((row) => row[field] ?? '')].map((value) => getContentWidth(value) + 40))}px`,
        ]),
      ),
    [columnWidthRows, columns],
  )
  const gridTemplateColumns = useMemo(
    () => [...columns.map(({ field }) => `minmax(${columnWidths[field]}, 1fr)`), '36px'].join(' '),
    [columnWidths, columns],
  )
  const tableMinWidth = useMemo(
    () => 36 + columns.reduce((width, { field }) => width + Number.parseInt(columnWidths[field], 10), 0),
    [columnWidths, columns],
  )

  useLayoutEffect(() => {
    rowsRef.current = rows
    onDraftChange?.({ rows })
  }, [onDraftChange, rows])

  const updateValue = useCallback((rowId: number, field: (typeof inputColumns)[number]['field'], value: string) => {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))

      rowsRef.current = nextRows
      return nextRows
    })
  }, [])

  const restoreValue = useCallback((rowId: number, field: (typeof inputColumns)[number]['field'], value: string | number) => {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
      rowsRef.current = nextRows
      setColumnWidthRows(nextRows)
      return nextRows
    })
  }, [])

  const commitColumnWidths = useCallback(() => setColumnWidthRows(rowsRef.current), [])

  const handleRowMenuOpenChange = useCallback((rowId: number, open: boolean) => {
    setActiveRowId((currentRowId) => (open ? rowId : currentRowId === rowId ? undefined : currentRowId))
  }, [])

  const deleteRow = useCallback((rowId: number) => {
    setActiveRowId(undefined)
    setRows((currentRows) => {
      const nextRows = currentRows.filter(({ id }) => id !== rowId)
      const nextEditableRows = (nextRows.length > 0 ? nextRows : [createEmptyRow()]).map((row, index) => ({ ...row, rowNumber: index + 8 }))

      rowsRef.current = nextEditableRows
      setColumnWidthRows(nextEditableRows)
      return nextEditableRows
    })
  }, [])

  const insertRow = useCallback((rowId: number, position: 'above' | 'below') => {
    setRows((currentRows) => {
      const rowIndex = currentRows.findIndex(({ id }) => id === rowId)
      if (rowIndex < 0) return currentRows
      const insertIndex = rowIndex + (position === 'below' ? 1 : 0)
      const nextRows = [...currentRows]
      nextRows.splice(insertIndex, 0, { ...createEmptyRow(), id: nextRowIdRef.current++ })
      const numberedRows = nextRows.map((row, index) => ({ ...row, rowNumber: index + 8 }))

      rowsRef.current = numberedRows
      return numberedRows
    })
  }, [])

  useEffect(() => {
    const tableBody = tableBodyRef.current

    if (!tableBody) return () => undefined

    const handleScroll = () => setScrollLeft(tableBody.scrollLeft)

    tableBody.addEventListener('scroll', handleScroll)
    return () => tableBody.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Stack flex={1} minWidth={0} minHeight={0} padding="10px 8px 10px 20px" overflow="hidden">
      <Box flexShrink={0} paddingRight={isScrollable ? '12px' : 0} overflow="hidden">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            width: '100%',
            minWidth: `${tableMinWidth}px`,
            transform: `translateX(-${scrollLeft}px)`,
            '& [role="columnheader"]': {
              height: '40px',
              padding: '6px 8px',
              borderBottom: '1px solid',
              borderColor: 'contentBorder.Active',
              boxSizing: 'border-box',
              overflow: 'hidden',
              bgcolor: 'commonColor.White',
              color: 'contentText.Normal',
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'right',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            },
            '& [data-row-action="true"]': { textAlign: 'center' },
          }}
        >
          {columns.map(({ field, label }) => (
            <Box key={field} role="columnheader">
              {label}
            </Box>
          ))}
          <Box role="columnheader" data-row-action="true" aria-label="행 메뉴" />
        </Box>
      </Box>
      <ScrollWrapper
        ref={tableBodyRef}
        height="calc(100% - 40px)"
        maxHeight="calc(100% - 40px)"
        contentKey={rows.length}
        scrollbarGap={12}
        scrollbarOffsetRight={2}
        thumbInsetTop={6}
        thumbInsetBottom={6}
        thumbWidth={8}
        thumbMinHeight={120}
        showScrollbarOnHover
        showScrollEdgeShadow
        overflowX="auto"
        showHorizontalScrollbar
        onScrollableChange={setIsScrollable}
        sx={{
          flex: '1 1 0px',
          width: '100%',
          minWidth: 0,
        }}
        styScroll={{ borderRadius: '1000px' }}
      >
        <Box
          width="100%"
          minWidth={`${tableMinWidth}px`}
          sx={{
            position: 'relative',
            overscrollBehavior: 'contain',
            overflowAnchor: 'none',
            '& [role="row"]': { display: 'grid', gridTemplateColumns },
            '& [role="cell"]': {
              height: '42px',
              padding: '6px 8px',
              borderBottom: '1px solid',
              borderColor: 'contentBorder.Normal',
              boxSizing: 'border-box',
              overflow: 'hidden',
              bgcolor: 'commonColor.White',
            },
            '& [role="row"]:nth-of-type(even) [role="cell"]': { bgcolor: 'gray.5' },
            '& [role="row"]:hover [role="cell"]': { bgcolor: 'gray.10' },
            '& [role="row"][data-menu-open="true"] [role="cell"]': { bgcolor: 'gray.10' },
            '& [role="row"][data-new="true"] [role="cell"]': { bgcolor: 'commonColor.Primarylight1' },
            '& [data-row-action="true"]': {
              width: '36px',
              minWidth: '36px',
              maxWidth: '36px',
              textAlign: 'center',
              padding: '3px 0',
              position: 'sticky',
              right: 0,
            },
          }}
        >
          <Box role="rowgroup">
            {rows.map((row) => (
              <ProductionAdjustmentRow
                key={row.id}
                row={row}
                originalRow={originalRowsById.get(row.id)}
                columns={columns}
                isMenuOpen={activeRowId === row.id}
                onMenuOpenChange={handleRowMenuOpenChange}
                onInsert={insertRow}
                onDelete={deleteRow}
                onUpdate={updateValue}
                onRestore={restoreValue}
                onWidthCommit={commitColumnWidths}
              />
            ))}
          </Box>
        </Box>
      </ScrollWrapper>
    </Stack>
  )
}

export default PNGProductionAdjustment
