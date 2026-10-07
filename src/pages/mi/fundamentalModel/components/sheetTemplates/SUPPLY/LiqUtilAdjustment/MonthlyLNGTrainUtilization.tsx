import { Box, Stack, Typography } from '@mui/material'
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

import type {
  FundamentalModelSheetDataColumn,
  FundamentalModelSheetDataRow,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import AddIcon from '@/components/common/icons/AddIcon'
import MoreVertIcon from '@/components/common/icons/MoreVertIcon'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import FundamentalModelColumnHeader from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelColumnHeader'
import FundamentalModelColumnPinButton from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelColumnPinButton'
import FundamentalModelEditedCellInput from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelEditedCellInput'
import FundamentalModelHorizontalScrollShadows, {
  FundamentalModelColumnScrollShadows,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelHorizontalScrollShadows'
import FundamentalModelRowMenu from '@/pages/mi/fundamentalModel/components/sheetTemplates/FundamentalModelRowMenu'
import {
  getNextUtilizationCell,
  getRenderedIndices,
  getUtilizationColumnWidth,
  getVisibleColumnRange,
  getVisibleRowRange,
  UTILIZATION_ACTION_WIDTH,
  UTILIZATION_HEADER_HEIGHT,
  UTILIZATION_ROW_HEIGHT,
  type MonthlyColumn,
  type UtilizationColumn,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/monthlyLNGTrainUtilizationLayout'
import useUtilizationViewport from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/useUtilizationViewport'
import useSheetColumnPinning from '@/pages/mi/fundamentalModel/components/sheetTemplates/useSheetColumnPinning'
import { MatrixHeaderRow } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionMatrixTable'

const baseColumns = [
  { field: 'column1', fallbackLabel: 'Country' },
  { field: 'column2', fallbackLabel: 'Plant' },
  { field: 'column3', fallbackLabel: 'Train' },
  { field: 'column4', fallbackLabel: 'Status' },
  { field: 'column5', fallbackLabel: 'Annual Nameplate' },
] as const

const getColumnIndex = (field: string) => Number.parseInt(field.replace('column', ''), 10)

const hasInputValue = (row: FundamentalModelSheetDataRow, fields: string[]) =>
  fields.some((field) => String(row[field] ?? '').trim().length > 0)

const getUtilizationRows = (rows: FundamentalModelSheetDataRow[], fields: string[]) =>
  rows.filter((row) => row.rowNumber >= 11 && row.rowNumber <= 407 && hasInputValue(row, fields))

const getNextMonthlyColumn = (lastColumn: MonthlyColumn | undefined, nextField: string): MonthlyColumn | undefined => {
  if (!lastColumn) return undefined

  const year = Number(lastColumn.year)
  const month = Number(lastColumn.month)
  if (!Number.isInteger(year) || year <= 0 || !Number.isInteger(month) || month < 1 || month > 12) return undefined
  const period = lastColumn.period.trim() ? Number(lastColumn.period) : Number.NaN

  return {
    field: nextField,
    year: String(month === 12 ? year + 1 : year),
    month: String(month === 12 ? 1 : month + 1),
    period: Number.isInteger(period) ? String(period + 1) : '',
  }
}

const getPreviousMonthlyColumn = (firstColumn: MonthlyColumn, nextField: string): MonthlyColumn | undefined => {
  const year = Number(firstColumn.year)
  const month = Number(firstColumn.month)
  if (!Number.isInteger(year) || year <= 0 || !Number.isInteger(month) || month < 1 || month > 12) return undefined
  const period = firstColumn.period.trim() ? Number(firstColumn.period) : Number.NaN

  return {
    field: nextField,
    year: String(month === 1 ? year - 1 : year),
    month: String(month === 1 ? 12 : month - 1),
    period: Number.isInteger(period) ? String(period - 1) : '',
  }
}

const createEmptyRow = (fields: string[]): FundamentalModelSheetDataRow =>
  Object.assign({ id: 0, rowNumber: 11 }, Object.fromEntries(fields.map((field) => [field, ''])))

const getMonthlyColumns = (
  columns: FundamentalModelSheetDataColumn[],
  yearRow?: FundamentalModelSheetDataRow,
  monthRow?: FundamentalModelSheetDataRow,
  periodRow?: FundamentalModelSheetDataRow,
) =>
  columns
    .filter(({ field }) => getColumnIndex(field) >= 6 && getColumnIndex(field) <= 89)
    .flatMap(({ field }) => {
      const year = String(yearRow?.[field] ?? '').trim()
      const month = String(monthRow?.[field] ?? '').trim()
      const period = String(periodRow?.[field] ?? '').trim()

      return year && month ? [{ field, year, month, period }] : []
    })

interface VisibleColumn extends UtilizationColumn {
  index: number
  isNew: boolean
  columnStyle: CSSProperties
  pinned: boolean
}

interface UtilizationHeaderCellProps extends VisibleColumn {
  viewportHeight: number
  scrollShadows: ReturnType<typeof useSheetColumnPinning>['scrollShadows']
  showPin: boolean
  headerHeight: number
  canDelete: boolean
  allowInsert: boolean
  isMenuOpen: boolean
  onMenuOpenChange: (field: string, open: boolean) => void
  onInsert: (field: string, position: 'left' | 'right') => void
  onDelete: (field: string) => void
  onPinToggle: (field: string) => void
}

const UtilizationCell = memo(
  ({
    rowId,
    field,
    index,
    isMonthly,
    isNew,
    isColumnActive,
    columnStyle,
    value,
    originalValue,
    onUpdate,
    onRestore,
    onWidthCommit,
  }: {
    rowId: number
    field: string
    index: number
    isMonthly: boolean
    isNew: boolean
    isColumnActive: boolean
    columnStyle: CSSProperties
    value: string | number
    originalValue?: string | number
    onUpdate: (rowId: number, field: string, value: string) => void
    onRestore: (rowId: number, field: string, value: string | number) => void
    onWidthCommit: (field: string) => void
  }) => (
    <Box role="cell" data-column-index={index} data-column-active={isColumnActive} data-new={isNew} style={columnStyle}>
      <FundamentalModelEditedCellInput
        value={value}
        originalValue={originalValue}
        isNew={isNew}
        unit={isMonthly ? '%' : undefined}
        onChange={(nextValue) => onUpdate(rowId, field, nextValue)}
        onBlur={() => onWidthCommit(field)}
        onRestore={() => {
          if (originalValue !== undefined) onRestore(rowId, field, originalValue)
        }}
        textAlign={isMonthly || field === 'column5' ? 'right' : 'left'}
      />
    </Box>
  ),
)
UtilizationCell.displayName = 'UtilizationCell'

const UtilizationHeaderCell = memo(
  ({
    field,
    index,
    label,
    year,
    month,
    period,
    isMonthly,
    isNew,
    columnStyle,
    pinned,
    viewportHeight,
    scrollShadows,
    showPin,
    headerHeight,
    canDelete,
    allowInsert,
    isMenuOpen,
    onMenuOpenChange,
    onInsert,
    onDelete,
    onPinToggle,
  }: UtilizationHeaderCellProps) => (
    <Box
      role="columnheader"
      data-column-index={index}
      data-column-active={isMenuOpen}
      data-new={isNew}
      style={{ position: 'relative', ...columnStyle, overflow: pinned ? 'visible' : undefined }}
    >
      {isMonthly ? (
        <Stack component="span" width="100%" minWidth={0}>
          <Stack
            component="span"
            direction="row"
            height="24px"
            alignItems="center"
            justifyContent="flex-end"
            padding="2px 8px"
            borderBottom="0.5px solid"
            borderColor="contentBorder.Active"
            boxSizing="border-box"
          >
            {year && (
              <Typography component="span" variant="body2M14" color="contentText.Black" flex={1} textAlign="right" noWrap>
                {year}
              </Typography>
            )}
            {(showPin || (isMonthly && (canDelete || allowInsert))) && (
              <Stack component="span" direction="row" alignItems="center" gap="0px" flexShrink={0} marginLeft="6px">
                {showPin && (
                  <FundamentalModelColumnPinButton
                    label={isMonthly ? `${year}년 ${month}월` : label}
                    pinned={pinned}
                    onClick={() => onPinToggle(field)}
                  />
                )}
                {isMonthly && (canDelete || allowInsert) && (
                  <Box component="span">
                    <MIDropdownMenu
                      label={<MoreVertIcon width="16px" height="16px" />}
                      aria-label={`${year}년 ${month}월 열 더보기`}
                      placement="bottom-end"
                      open={isMenuOpen}
                      onOpenChange={(open) => onMenuOpenChange(field, open)}
                      zIndex={1500}
                      buttonHoverBgColor="gray.10"
                      paperProps={{ sx: { minWidth: '168px' } }}
                      items={[
                        ...(allowInsert
                          ? [
                            { label: '왼쪽에 열 삽입', group: 'insert', action: () => onInsert(field, 'left') },
                            { label: '오른쪽에 열 삽입', group: 'insert', action: () => onInsert(field, 'right') },
                          ]
                          : []),
                        ...(canDelete
                          ? [
                            {
                              label: (
                                <Typography component="span" variant="body2M14" color="contentText.Error">
                                    열 삭제
                                </Typography>
                              ),
                              group: 'delete',
                              action: () => onDelete(field),
                            },
                          ]
                          : []),
                      ]}
                      groupDisplayType="divider"
                      sx={{
                        width: '16px',
                        minWidth: '16px',
                        height: '20px',
                        padding: '0',
                        borderRadius: '4px',
                        color: 'gray.60',
                        '&:hover': { color: 'gray.80' },
                      }}
                    />
                  </Box>
                )}
              </Stack>
            )}
          </Stack>
          <MatrixHeaderRow value={month || undefined} />
          <Stack height={`${headerHeight - 48}px`} borderBottom="0.5px solid" borderColor="contentBorder.Active" boxSizing="border-box">
            <MatrixHeaderRow value={period || undefined} border={headerHeight > UTILIZATION_HEADER_HEIGHT} />
          </Stack>
        </Stack>
      ) : (
        <FundamentalModelColumnHeader
          values={headerHeight > UTILIZATION_HEADER_HEIGHT ? [year, month, period, label] : ['', '', label]}
          label={label}
          align="left"
          pinned={pinned}
          showPin={showPin}
          onPinToggle={() => onPinToggle(field)}
        />
      )}
      <FundamentalModelColumnScrollShadows columnIndex={index} height={viewportHeight} offsets={scrollShadows} />
    </Box>
  ),
)
UtilizationHeaderCell.displayName = 'UtilizationHeaderCell'

interface MonthlyLNGTrainUtilizationRowProps {
  row: FundamentalModelSheetDataRow
  originalRow?: FundamentalModelSheetDataRow
  rowIndex: number
  columns: VisibleColumn[]
  activeColumnField?: string
  isMenuOpen: boolean
  onMenuOpenChange: (rowId: number, open: boolean) => void
  onInsert: (rowId: number, position: 'above' | 'below') => void
  onDelete: (rowId: number) => void
  onUpdate: (rowId: number, field: string, value: string) => void
  onRestore: (rowId: number, field: string, value: string | number) => void
  onWidthCommit: (field: string) => void
}

const MonthlyLNGTrainUtilizationRow = memo(
  ({
    row,
    originalRow,
    rowIndex,
    columns,
    activeColumnField,
    isMenuOpen,
    onMenuOpenChange,
    onInsert,
    onDelete,
    onUpdate,
    onRestore,
    onWidthCommit,
  }: MonthlyLNGTrainUtilizationRowProps) => (
    <Box
      role="row"
      data-row-id={row.id}
      data-even={rowIndex % 2 === 1}
      data-menu-open={isMenuOpen}
      data-new={!originalRow}
      style={{ position: 'absolute', top: rowIndex * UTILIZATION_ROW_HEIGHT, width: '100%' }}
    >
      {columns.map(({ field, isMonthly, isNew, index, columnStyle }) => (
        <UtilizationCell
          key={field}
          rowId={row.id}
          field={field}
          index={index}
          columnStyle={columnStyle}
          isMonthly={isMonthly}
          isNew={isNew || !originalRow}
          isColumnActive={field === activeColumnField}
          value={row[field] ?? ''}
          originalValue={originalRow && !isNew ? (originalRow[field] ?? '') : undefined}
          onUpdate={onUpdate}
          onRestore={onRestore}
          onWidthCommit={onWidthCommit}
        />
      ))}
      <Box role="cell" data-row-action="true" data-column-index={-1} data-new={!originalRow} style={{ gridColumn: -2 }}>
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
MonthlyLNGTrainUtilizationRow.displayName = 'MonthlyLNGTrainUtilizationRow'

const MonthlyLNGTrainUtilization = ({ data, restrictColumnChangesToEnd = true, draft, onDraftChange }: SheetTemplateProps) => {
  const yearRow = useMemo(() => data.rows.find((row) => row.rowNumber === 7), [data.rows])
  const monthRow = useMemo(() => data.rows.find((row) => row.rowNumber === 8), [data.rows])
  const periodRow = useMemo(() => data.rows.find((row) => row.rowNumber === 9), [data.rows])
  const labelRow = useMemo(() => data.rows.find((row) => row.rowNumber === 10), [data.rows])
  const sourceMonthlyColumns = useMemo(
    () => getMonthlyColumns(data.columns, yearRow, monthRow, periodRow),
    [data.columns, monthRow, periodRow, yearRow],
  )
  const [monthlyColumns, setMonthlyColumns] = useState<MonthlyColumn[]>(() => draft?.monthlyColumns ?? sourceMonthlyColumns)
  const nextColumnIndexRef = useRef(
    [...data.columns, ...(draft?.monthlyColumns ?? [])].reduce((maximum, { field }) => Math.max(maximum, getColumnIndex(field)), 5) + 1,
  )
  const sourceColumns = useMemo<UtilizationColumn[]>(
    () => [
      ...baseColumns.map(({ field, fallbackLabel }) => ({
        field,
        label: String(labelRow?.[field] ?? fallbackLabel),
        year: String(yearRow?.[field] ?? ''),
        month: String(monthRow?.[field] ?? ''),
        period: String(periodRow?.[field] ?? ''),
        isMonthly: false,
      })),
      ...sourceMonthlyColumns.map(({ field, year, month, period }) => ({ field, label: '', year, month, period, isMonthly: true })),
    ],
    [labelRow, monthRow, periodRow, sourceMonthlyColumns, yearRow],
  )
  const columns = useMemo(
    () => [
      ...sourceColumns.slice(0, baseColumns.length),
      ...monthlyColumns.map(({ field, year, month, period }) => ({ field, label: '', year, month, period, isMonthly: true })),
    ],
    [sourceColumns, monthlyColumns],
  )
  const headerHeight = sourceColumns
    .slice(0, baseColumns.length)
    .some(({ year, month, period }) => year.trim() || month.trim() || period.trim())
    ? 96
    : UTILIZATION_HEADER_HEIGHT
  const inputFields = useMemo(() => columns.map(({ field }) => field), [columns])
  const sourceInputFields = useMemo(
    () => [...baseColumns.map(({ field }) => field), ...sourceMonthlyColumns.map(({ field }) => field)],
    [sourceMonthlyColumns],
  )
  const sourceFieldSet = useMemo(() => new Set(sourceInputFields), [sourceInputFields])
  const utilizationRows = useMemo(() => getUtilizationRows(data.rows, sourceInputFields), [data.rows, sourceInputFields])
  const initialRows = useMemo(
    () => (utilizationRows.length > 0 ? utilizationRows : [createEmptyRow(inputFields)]),
    [inputFields, utilizationRows],
  )
  const originalRowsById = useMemo(() => new Map(utilizationRows.map((row) => [row.id, row])), [utilizationRows])
  const [rows, setRows] = useState(() => draft?.rows ?? initialRows)
  const rowsRef = useRef(rows)
  const nextRowIdRef = useRef([...data.rows, ...(draft?.rows ?? [])].reduce((maximum, { id }) => Math.max(maximum, id), 0) + 1)
  const inputFieldsRef = useRef(inputFields)
  const columnsRef = useRef(columns)
  const dirtyFieldsRef = useRef(new Set<string>())
  const { scrollRef, viewport } = useUtilizationViewport()
  const [activeColumnField, setActiveColumnField] = useState<string>()
  const [activeRowId, setActiveRowId] = useState<number>()
  const [focusedCell, setFocusedCell] = useState<{ rowId: number; columnIndex: number }>()
  const pendingFocusRef = useRef(false)
  const pendingScrollRef = useRef(false)
  const [committedColumnWidths, setCommittedColumnWidths] = useState(() =>
    Object.fromEntries(columns.map((column) => [column.field, getUtilizationColumnWidth(column, rows)])),
  )
  const columnWidths = useMemo(
    () => columns.map((column) => committedColumnWidths[column.field] ?? getUtilizationColumnWidth(column, [])),
    [columns, committedColumnWidths],
  )
  const fields = useMemo(() => columns.map(({ field }) => field), [columns])
  const {
    widths,
    offsets: columnOffsets,
    pinnedStyles,
    togglePin,
    getColumnStyle,
    includePinnedIndices,
    hasHorizontalScroll,
    scrollShadows,
  } = useSheetColumnPinning(fields, columnWidths, viewport, UTILIZATION_ACTION_WIDTH)
  const gridTemplateColumns = useMemo(() => [...widths.map((width) => `${width}px`), `${UTILIZATION_ACTION_WIDTH}px`].join(' '), [widths])
  const tableMinWidth = columnOffsets[columnOffsets.length - 1] + UTILIZATION_ACTION_WIDTH
  const rowRange = getVisibleRowRange(rows.length, viewport.scrollTop, viewport.height, headerHeight)
  const columnRange = getVisibleColumnRange(columnOffsets, viewport.scrollLeft, viewport.width)
  const focusedRowIndex = focusedCell ? rows.findIndex(({ id }) => id === focusedCell.rowId) : undefined
  const visibleRowIndices = useMemo(
    () => getRenderedIndices(rowRange.start, rowRange.end, focusedRowIndex),
    [rowRange.start, rowRange.end, focusedRowIndex],
  )
  const focusedColumnIndex = focusedCell?.columnIndex
  const visibleColumns = useMemo(
    () =>
      includePinnedIndices(getRenderedIndices(columnRange.start, columnRange.end, focusedColumnIndex)).map((index) => ({
        ...columns[index],
        index,
        isNew: !sourceFieldSet.has(columns[index].field),
        columnStyle: getColumnStyle(index),
        pinned: pinnedStyles.has(index),
      })),
    [columns, columnRange.start, columnRange.end, focusedColumnIndex, sourceFieldSet, includePinnedIndices, getColumnStyle, pinnedStyles],
  )

  useLayoutEffect(() => {
    inputFieldsRef.current = inputFields
    columnsRef.current = columns
  }, [inputFields, columns])

  useLayoutEffect(() => {
    rowsRef.current = rows
    onDraftChange?.({ monthlyColumns, rows })
  }, [monthlyColumns, onDraftChange, rows])

  const handleColumnMenuOpenChange = useCallback((field: string, open: boolean) => {
    if (open) setActiveRowId(undefined)
    setActiveColumnField((currentField) => (open ? field : currentField === field ? undefined : currentField))
  }, [])

  const handleRowMenuOpenChange = useCallback((rowId: number, open: boolean) => {
    if (open) setActiveColumnField(undefined)
    setActiveRowId((currentRowId) => (open ? rowId : currentRowId === rowId ? undefined : currentRowId))
  }, [])

  const updateValue = useCallback((rowId: number, field: string, value: string) => {
    dirtyFieldsRef.current.add(field)
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))

      rowsRef.current = nextRows
      return nextRows
    })
  }, [])

  const restoreValue = useCallback((rowId: number, field: string, value: string | number) => {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
      rowsRef.current = nextRows
      const column = columnsRef.current.find((item) => item.field === field)
      if (column) {
        setCommittedColumnWidths((current) => ({ ...current, [field]: getUtilizationColumnWidth(column, nextRows) }))
      }
      dirtyFieldsRef.current.delete(field)
      return nextRows
    })
  }, [])

  const commitColumnWidths = useCallback((field: string) => {
    if (!dirtyFieldsRef.current.delete(field)) return
    const column = columnsRef.current.find((item) => item.field === field)
    if (!column) return
    const width = getUtilizationColumnWidth(column, rowsRef.current)
    setCommittedColumnWidths((current) => (current[field] === width ? current : { ...current, [field]: width }))
  }, [])

  const deleteRow = useCallback((rowId: number) => {
    setActiveRowId(undefined)
    setRows((currentRows) => {
      const nextRows = currentRows.filter(({ id }) => id !== rowId)
      const nextEditableRows = (nextRows.length > 0 ? nextRows : [createEmptyRow(inputFieldsRef.current)]).map((row, index) => ({
        ...row,
        rowNumber: index + 11,
      }))

      rowsRef.current = nextEditableRows
      setCommittedColumnWidths(
        Object.fromEntries(columnsRef.current.map((column) => [column.field, getUtilizationColumnWidth(column, nextEditableRows)])),
      )
      return nextEditableRows
    })
  }, [])

  const insertRow = useCallback((rowId: number, position: 'above' | 'below') => {
    setRows((currentRows) => {
      const rowIndex = currentRows.findIndex(({ id }) => id === rowId)
      if (rowIndex < 0) return currentRows
      const nextRows = [...currentRows]
      nextRows.splice(rowIndex + (position === 'below' ? 1 : 0), 0, {
        ...createEmptyRow(inputFieldsRef.current),
        id: nextRowIdRef.current++,
      })
      const numberedRows = nextRows.map((row, index) => ({ ...row, rowNumber: index + 11 }))

      rowsRef.current = numberedRows
      return numberedRows
    })
  }, [])

  const fillNewColumn = useCallback((field: string) => {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) => ({ ...row, [field]: '' }))
      rowsRef.current = nextRows
      return nextRows
    })
  }, [])

  const addColumn = useCallback(() => {
    const nextColumn = getNextMonthlyColumn(monthlyColumns.at(-1) ?? sourceMonthlyColumns.at(-1), `column${nextColumnIndexRef.current}`)
    if (!nextColumn) return
    nextColumnIndexRef.current += 1
    pendingScrollRef.current = true
    setMonthlyColumns([...monthlyColumns, nextColumn])
    fillNewColumn(nextColumn.field)
    setActiveColumnField(undefined)
  }, [fillNewColumn, monthlyColumns, sourceMonthlyColumns])

  const insertColumn = useCallback(
    (field: string, position: 'left' | 'right') => {
      if (restrictColumnChangesToEnd) return
      const anchorIndex = monthlyColumns.findIndex((column) => column.field === field)
      if (anchorIndex < 0) return
      const insertIndex = anchorIndex + (position === 'right' ? 1 : 0)
      const nextField = `column${nextColumnIndexRef.current}`
      const insertedColumn =
        insertIndex === 0
          ? getPreviousMonthlyColumn(monthlyColumns[0], nextField)
          : getNextMonthlyColumn(monthlyColumns[insertIndex - 1], nextField)
      if (!insertedColumn) return

      const nextColumns = [...monthlyColumns]
      nextColumns.splice(insertIndex, 0, insertedColumn)
      for (let index = insertIndex + 1; index < nextColumns.length; index += 1) {
        const nextPeriod = getNextMonthlyColumn(nextColumns[index - 1], nextColumns[index].field)
        if (!nextPeriod) return
        nextColumns[index] = nextPeriod
      }
      nextColumnIndexRef.current += 1
      setMonthlyColumns(nextColumns)
      fillNewColumn(nextField)
      setActiveColumnField(undefined)
      setFocusedCell(undefined)
    },
    [fillNewColumn, monthlyColumns, restrictColumnChangesToEnd],
  )

  const deleteColumn = useCallback(
    (field: string) => {
      if (restrictColumnChangesToEnd && monthlyColumns.at(-1)?.field !== field) return
      setMonthlyColumns((currentColumns) => currentColumns.filter((column) => column.field !== field))
      setActiveColumnField(undefined)
      setFocusedCell(undefined)
      dirtyFieldsRef.current.delete(field)
      setRows((currentRows) => {
        const nextRows = currentRows.map((row) => {
          const nextRow = { ...row }
          delete nextRow[field]
          return nextRow
        })
        rowsRef.current = nextRows
        return nextRows
      })
      setCommittedColumnWidths((currentWidths) => {
        const nextWidths = { ...currentWidths }
        delete nextWidths[field]
        return nextWidths
      })
    },
    [monthlyColumns, restrictColumnChangesToEnd],
  )

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    if (pendingScrollRef.current) container.scrollLeft = container.scrollWidth
    pendingScrollRef.current = false
  }, [columns.length, rows.length, scrollRef])

  const handleCellKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !focusedCell) return
    const container = scrollRef.current
    if (!container) return

    const nextCell = getNextUtilizationCell(
      rows.findIndex(({ id }) => id === focusedCell.rowId),
      focusedCell.columnIndex,
      rows.length,
      columns.length,
      event.shiftKey,
    )
    if (!nextCell) return
    const { rowIndex, columnIndex } = nextCell

    event.preventDefault()
    const currentColumn = columns[focusedCell.columnIndex]
    if (currentColumn) commitColumnWidths(currentColumn.field)
    pendingFocusRef.current = true
    setFocusedCell({ rowId: rows[rowIndex].id, columnIndex })

    const rowTop = rowIndex * UTILIZATION_ROW_HEIGHT
    const rowBottom = rowTop + UTILIZATION_ROW_HEIGHT
    if (rowTop < container.scrollTop) container.scrollTop = rowTop
    else if (rowBottom > container.scrollTop + container.clientHeight - headerHeight) {
      container.scrollTop = rowBottom - container.clientHeight + headerHeight
    }
    // When the table fits, the grid distributes spare width and needs no horizontal scrolling.
    if (tableMinWidth > container.clientWidth) {
      const left = columnIndex < 0 ? columnOffsets.at(-1)! : columnOffsets[columnIndex]
      const right = columnIndex < 0 ? tableMinWidth : columnOffsets[columnIndex + 1]
      if (left < container.scrollLeft) container.scrollLeft = left
      else if (right > container.scrollLeft + container.clientWidth) container.scrollLeft = right - container.clientWidth
    }
  }

  useLayoutEffect(() => {
    if (!pendingFocusRef.current || !focusedCell) return
    pendingFocusRef.current = false
    scrollRef.current
      ?.querySelector<HTMLElement>(
        `[data-row-id="${focusedCell.rowId}"] [data-column-index="${focusedCell.columnIndex}"] ${focusedCell.columnIndex < 0 ? 'button' : 'input'}`,
      )
      ?.focus({ preventScroll: true })
  }, [focusedCell, scrollRef])

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
          sx={{
            flex: '1 1 0px',
            width: '100%',
            minWidth: 0,
            '& .scroll-wrapper-edge-shadow-top': { top: `${headerHeight}px` },
          }}
          styScroll={{ borderRadius: '1000px' }}
        >
          <Box
            width="100%"
            minWidth={`${tableMinWidth}px`}
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
            onKeyDown={handleCellKeyDown}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns,
                width: '100%',
                position: 'sticky',
                top: 0,
                zIndex: 3,
                '& [role="columnheader"]': {
                  minWidth: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  bgcolor: 'commonColor.White',
                },
                '& [role="columnheader"][data-column-active="true"]': { bgcolor: 'gray.10' },
                '& [role="columnheader"][data-new="true"]': { bgcolor: 'rgba(245, 159, 0, 0.1)' },
                '& [data-row-action="true"]': {
                  textAlign: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'contentBorder.Active',
                  position: 'sticky',
                  right: 0,
                  zIndex: 2,
                },
              }}
            >
              {visibleColumns.map((column) => (
                <UtilizationHeaderCell
                  key={column.field}
                  {...column}
                  viewportHeight={viewport.height}
                  scrollShadows={scrollShadows}
                  showPin={hasHorizontalScroll}
                  headerHeight={headerHeight}
                  canDelete={!restrictColumnChangesToEnd || column.field === monthlyColumns.at(-1)?.field}
                  allowInsert={!restrictColumnChangesToEnd}
                  isMenuOpen={activeColumnField === column.field}
                  onMenuOpenChange={handleColumnMenuOpenChange}
                  onInsert={insertColumn}
                  onDelete={deleteColumn}
                  onPinToggle={togglePin}
                />
              ))}
              <Stack
                role="columnheader"
                data-row-action="true"
                aria-label="열 추가"
                height={`${headerHeight}px`}
                alignItems="center"
                paddingTop="4px"
                boxSizing="border-box"
                style={{ gridColumn: -2 }}
              >
                <MIBaseButton
                  variant="outlined"
                  aria-label="마지막 열 오른쪽에 열 추가"
                  onClick={addColumn}
                  disabled={!monthlyColumns.length && !sourceMonthlyColumns.length}
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
                '& [role="row"]:hover [role="cell"]': { bgcolor: 'gray.10' },
                '& [role="cell"][data-column-active="true"]': { bgcolor: 'gray.10' },
                '& [role="row"][data-menu-open="true"] [role="cell"]': { bgcolor: 'gray.10' },
                '& [role="cell"][data-new="true"], & [role="row"]:hover [role="cell"][data-new="true"], & [role="cell"][data-column-active="true"][data-new="true"], & [role="row"][data-menu-open="true"] [role="cell"][data-new="true"]':
                  { bgcolor: 'rgba(245, 159, 0, 0.1)' },
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
              {visibleRowIndices.map((rowIndex) => {
                const row = rows[rowIndex]
                return (
                  <MonthlyLNGTrainUtilizationRow
                    key={row.id}
                    row={row}
                    originalRow={originalRowsById.get(row.id)}
                    rowIndex={rowIndex}
                    columns={visibleColumns}
                    activeColumnField={activeColumnField}
                    isMenuOpen={activeRowId === row.id}
                    onMenuOpenChange={handleRowMenuOpenChange}
                    onInsert={insertRow}
                    onDelete={deleteRow}
                    onUpdate={updateValue}
                    onRestore={restoreValue}
                    onWidthCommit={commitColumnWidths}
                  />
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

export default MonthlyLNGTrainUtilization
