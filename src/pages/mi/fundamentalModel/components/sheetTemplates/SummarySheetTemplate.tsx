import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { FundamentalModelSheetDataRow } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SheetTemplate, SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

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
import { getSummaryTemplateLayout } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateLayout'
import {
  getRenderedIndices,
  getUtilizationColumnWidth,
  getVisibleColumnRange,
  UTILIZATION_ACTION_WIDTH,
  UTILIZATION_ROW_HEIGHT,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/monthlyLNGTrainUtilizationLayout'
import useUtilizationViewport from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/LiqUtilAdjustment/useUtilizationViewport'
import useSheetColumnPinning from '@/pages/mi/fundamentalModel/components/sheetTemplates/useSheetColumnPinning'

interface SummarySheetTemplateProps extends SheetTemplateProps {
  template: SheetTemplate
}

const SummarySheetTemplate = ({ data, template, draft, onDraftChange }: SummarySheetTemplateProps) => {
  const layout = useMemo(() => getSummaryTemplateLayout(template, data, template.coordinates), [data, template])
  const inputCells = useMemo(() => new Set(data.inputCells ?? []), [data.inputCells])
  const sourceFields = useMemo(() => layout?.fields ?? [], [layout])
  const sourceRows = useMemo(() => {
    if (!layout) return []
    return data.rows.filter(
      (row) =>
        row.rowNumber >= layout.bodyStart &&
        row.rowNumber <= layout.lastRow &&
        sourceFields.some((field) => String(row[field] ?? '').trim()),
    )
  }, [data.rows, layout, sourceFields])
  const canAddRows = template.rowPolicy === '가능'
  const canAddColumns = template.columnPolicy === '가능' && template.name !== 'LNG Demand Mode'
  const firstNewRowId = useMemo(() => data.rows.reduce((maximum, row) => Math.max(maximum, row.id), 0) + 1, [data.rows])
  const initialRows = useMemo(
    () =>
      sourceRows.length || !canAddRows
        ? sourceRows
        : [
          {
            id: firstNewRowId,
            rowNumber: layout?.bodyStart ?? 1,
            ...Object.fromEntries(sourceFields.map((field) => [field, ''])),
          },
        ],
    [canAddRows, firstNewRowId, layout?.bodyStart, sourceFields, sourceRows],
  )
  const [rows, setRows] = useState<FundamentalModelSheetDataRow[]>(() => draft?.rows ?? initialRows)
  const [addedRowIds, setAddedRowIds] = useState<number[]>(
    () => draft?.addedRowIds ?? (sourceRows.length || !canAddRows ? [] : [firstNewRowId]),
  )
  const [addedColumns, setAddedColumns] = useState(() => draft?.addedColumns ?? [])
  const [activeRowId, setActiveRowId] = useState<number>()
  const [focusedCell, setFocusedCell] = useState<{ rowId: number; columnIndex: number }>()
  const { scrollRef, viewport } = useUtilizationViewport()
  const rowsRef = useRef(rows)
  const nextRowId = useRef(
    Math.max(
      firstNewRowId - 1,
      (draft?.rows ?? []).reduce((maximum, row) => Math.max(maximum, row.id), 0),
      initialRows.reduce((maximum, row) => Math.max(maximum, row.id), 0),
    ) + 1,
  )
  const nextColumnIndex = useRef(
    Math.max(
      data.columns.reduce((maximum, { field }) => Math.max(maximum, Number(field.replace('column', ''))), 0),
      (draft?.addedColumns ?? []).reduce((maximum, { field }) => Math.max(maximum, Number(field.replace('column', ''))), 0),
    ) + 1,
  )
  const header = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === layout?.headerRow), [data.rows, layout?.headerRow])
  const originalRows = useMemo(() => new Map(sourceRows.map((row) => [row.id, row])), [sourceRows])
  const editableFields = useMemo(() => new Set(layout?.editableFields ?? []), [layout?.editableFields])
  const forceEditableFields = useMemo(() => new Set(layout?.forceEditableFields ?? []), [layout?.forceEditableFields])
  const fields = useMemo(() => {
    const insertionIndex = sourceFields.indexOf(layout?.addColumnAfter ?? '')
    const newFields = addedColumns.map(({ field }) => field)
    return insertionIndex < 0
      ? [...sourceFields, ...newFields]
      : [...sourceFields.slice(0, insertionIndex + 1), ...newFields, ...sourceFields.slice(insertionIndex + 1)]
  }, [addedColumns, layout?.addColumnAfter, sourceFields])
  const yearRow = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === layout?.periodYearRow), [data.rows, layout?.periodYearRow])
  const monthRow = useMemo(
    () => data.rows.find(({ rowNumber }) => rowNumber === layout?.periodMonthRow),
    [data.rows, layout?.periodMonthRow],
  )
  const periodRow = useMemo(
    () => data.rows.find(({ rowNumber }) => rowNumber === layout?.periodCountRow),
    [data.rows, layout?.periodCountRow],
  )
  const headerRowsByNumber = useMemo(
    () => new Map(data.rows.filter(({ rowNumber }) => layout?.headerRows.includes(rowNumber)).map((row) => [row.rowNumber, row])),
    [data.rows, layout?.headerRows],
  )
  const hasPeriodHeaders = Boolean(yearRow && monthRow && sourceFields.some((field) => yearRow[field] && monthRow[field]))
  const headerHeight = (layout?.headerRows.length ?? 1) * 24

  useLayoutEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    onDraftChange?.({ rows, addedRowIds, addedColumns })
  }, [addedColumns, addedRowIds, onDraftChange, rows])

  const insertRow = useCallback(
    (rowId: number, position: 'above' | 'below') => {
      const currentRows = rowsRef.current
      const index = currentRows.findIndex(({ id }) => id === rowId)
      if (index < 0 || !layout) return
      const id = nextRowId.current++
      const nextRows = [...currentRows]
      nextRows.splice(index + (position === 'below' ? 1 : 0), 0, {
        id,
        rowNumber: 0,
        ...Object.fromEntries(fields.map((field) => [field, ''])),
      })
      const numberedRows = nextRows.map((row, rowIndex) => ({ ...row, rowNumber: layout.bodyStart + rowIndex }))
      rowsRef.current = numberedRows
      setRows(numberedRows)
      setAddedRowIds((current) => [...current, id])
      setActiveRowId(undefined)
    },
    [fields, layout],
  )

  const deleteRow = useCallback(
    (rowId: number) => {
      if (!layout) return
      const nextRows = rowsRef.current.filter(({ id }) => id !== rowId)
      let emptyRowId: number | undefined
      if (!nextRows.length) {
        emptyRowId = nextRowId.current++
        nextRows.push({ id: emptyRowId, rowNumber: layout.bodyStart, ...Object.fromEntries(fields.map((field) => [field, ''])) })
      }
      const numberedRows = nextRows.map((row, index) => ({ ...row, rowNumber: layout.bodyStart + index }))
      rowsRef.current = numberedRows
      setRows(numberedRows)
      setAddedRowIds((current) => [...current.filter((id) => id !== rowId), ...(emptyRowId === undefined ? [] : [emptyRowId])])
      setActiveRowId(undefined)
    },
    [fields, layout],
  )

  const addColumn = useCallback(() => {
    const lastField = layout?.addColumnAfter ?? sourceFields.at(-1)
    if (hasPeriodHeaders) {
      const previous = addedColumns.at(-1)
      const year = Number(previous?.year ?? (lastField ? yearRow?.[lastField] : undefined))
      const month = Number(previous?.month ?? (lastField ? monthRow?.[lastField] : undefined))
      const period = Number(previous?.period ?? (lastField ? periodRow?.[lastField] : undefined))
      if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
        setAddedColumns((current) => [
          ...current,
          {
            field: `column${nextColumnIndex.current++}`,
            label: '',
            year: String(month === 12 ? year + 1 : year),
            month: String(month === 12 ? 1 : month + 1),
            period: Number.isInteger(period) ? String(period + 1) : '',
          },
        ])
        return
      }
    }
    const lastLabel = addedColumns.at(-1)?.label ?? String(lastField ? (header?.[lastField] ?? '') : '')
    const lastYear = Number(lastLabel.match(/\d{4}/)?.[0])
    const label = Number.isInteger(lastYear) && lastYear > 0 ? String(lastYear + 1) : `추가 열 ${addedColumns.length + 1}`
    setAddedColumns((current) => [...current, { field: `column${nextColumnIndex.current++}`, label }])
  }, [addedColumns, hasPeriodHeaders, header, layout?.addColumnAfter, monthRow, periodRow, sourceFields, yearRow])

  const columns = useMemo(() => {
    if (!layout) return []
    return fields.map((field, index) => {
      const addedColumn = addedColumns.find((column) => column.field === field)
      const headerValue = String(header?.[field] ?? '').trim()
      const label =
        addedColumn?.label ??
        (layout.headerLabels[field] || headerValue || data.columns.find((column) => column.field === field)?.headerName || field)
      const year = hasPeriodHeaders ? String(addedColumn?.year ?? yearRow?.[field] ?? '').trim() : ''
      const month = hasPeriodHeaders ? String(addedColumn?.month ?? monthRow?.[field] ?? '').trim() : ''
      const period = hasPeriodHeaders ? String(addedColumn?.period ?? periodRow?.[field] ?? '').trim() : ''
      const headerValues = layout.headerRows.map((rowNumber, rowIndex) => {
        if (!addedColumn) {
          const sourceValue = String(headerRowsByNumber.get(rowNumber)?.[field] ?? '').trim()
          return sourceValue || (rowIndex === layout.headerRows.length - 1 && !(year && month) ? label : '')
        }
        if (rowNumber === layout.periodYearRow) return year
        if (rowNumber === layout.periodMonthRow) return month
        if (rowNumber === layout.periodCountRow) return period
        if (rowIndex === layout.headerRows.length - 1) return label
        const anchorIndex = sourceFields.indexOf(layout.addColumnAfter ?? sourceFields.at(-1) ?? '')
        for (let sourceIndex = anchorIndex; sourceIndex >= 0; sourceIndex -= 1) {
          const groupValue = String(headerRowsByNumber.get(rowNumber)?.[sourceFields[sourceIndex]] ?? '').trim()
          if (groupValue) return groupValue
        }
        return ''
      })
      return {
        field,
        label: year && month ? '' : label,
        year,
        month,
        period,
        headerValues,
        isMonthly: Boolean(year && month),
        isNew: Boolean(addedColumn),
        index,
      }
    })
  }, [addedColumns, data.columns, fields, hasPeriodHeaders, header, headerRowsByNumber, layout, monthRow, periodRow, sourceFields, yearRow])
  const columnWidths = useMemo(() => columns.map((column) => getUtilizationColumnWidth(column, sourceRows)), [columns, sourceRows])
  const showActions = canAddRows || canAddColumns
  const {
    widths,
    offsets: columnOffsets,
    pinnedStyles,
    togglePin,
    getColumnStyle,
    includePinnedIndices,
    hasHorizontalScroll,
    scrollShadows,
  } = useSheetColumnPinning(fields, columnWidths, viewport, showActions ? UTILIZATION_ACTION_WIDTH : 0)
  const tableMinWidth = columnOffsets.at(-1)! + (showActions ? UTILIZATION_ACTION_WIDTH : 0)
  const gridTemplateColumns = [...widths.map((width) => `${width}px`), ...(showActions ? [`${UTILIZATION_ACTION_WIDTH}px`] : [])].join(' ')
  const rowStart = Math.max(0, Math.floor(viewport.scrollTop / UTILIZATION_ROW_HEIGHT) - 4)
  const rowEnd = Math.min(
    rows.length,
    Math.ceil((viewport.scrollTop + Math.max(0, viewport.height - headerHeight)) / UTILIZATION_ROW_HEIGHT) + 4,
  )
  const focusedRowIndex = focusedCell ? rows.findIndex(({ id }) => id === focusedCell.rowId) : undefined
  const visibleRowIndices = getRenderedIndices(rowStart, rowEnd, focusedRowIndex)
  const columnRange = getVisibleColumnRange(columnOffsets, viewport.scrollLeft, viewport.width)
  const visibleColumns = includePinnedIndices(getRenderedIndices(columnRange.start, columnRange.end, focusedCell?.columnIndex))
    .map((index) => columns[index])
    .filter(Boolean)

  const renderCell = (row: FundamentalModelSheetDataRow, column: (typeof columns)[number]) => {
    const originalRow = originalRows.get(row.id)
    const isNewRow = !originalRow
    const sourceRowNumber = originalRow?.rowNumber ?? row.rowNumber
    const isEditable =
      column.isNew ||
      forceEditableFields.has(column.field) ||
      (isNewRow ? editableFields.has(column.field) : inputCells.has(sourceRowNumber * 16384 + Number(column.field.replace('column', ''))))
    const value = row[column.field] ?? ''
    const textAlign = getSheetCellTextAlign(value)
    if (!isEditable)
      return (
        <Stack height="100%" minWidth={0} justifyContent="center">
          <Typography variant="body2M14" color="contentText.Normal" textAlign={textAlign} noWrap title={String(value)}>
            {value}
          </Typography>
        </Stack>
      )
    return (
      <FundamentalModelEditedCellInput
        value={value}
        originalValue={originalRow?.[column.field] ?? ''}
        isNew={isNewRow || column.isNew}
        textAlign={textAlign}
        onChange={(nextValue) =>
          setRows((current) => current.map((item) => (item.id === row.id ? { ...item, [column.field]: nextValue } : item)))
        }
        onBlur={() => undefined}
        onRestore={() =>
          setRows((current) =>
            current.map((item) => (item.id === row.id ? { ...item, [column.field]: originalRow?.[column.field] ?? '' } : item)),
          )
        }
      />
    )
  }

  if (!layout) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Typography variant="body2M14">표 설정을 찾지 못했습니다.</Typography>
      </Stack>
    )
  }

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
                    label={column.year && column.month ? `${column.year}년 ${column.month}월` : column.label}
                    pinned={pinnedStyles.has(column.index)}
                    showPin={hasHorizontalScroll}
                    onPinToggle={() => togglePin(column.field)}
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
                  paddingTop={hasPeriodHeaders ? '4px' : '0px'}
                  boxSizing="border-box"
                  style={{ gridColumn: -2 }}
                >
                  {canAddColumns && (
                    <MIBaseButton
                      variant="outlined"
                      aria-label="마지막 열 오른쪽에 열 추가"
                      onClick={addColumn}
                      sx={{ width: '24px', minWidth: '24px', height: '24px', padding: '0', borderRadius: '4px' }}
                    >
                      <AddIcon width="18px" height="18px" color="#868E96" />
                    </MIBaseButton>
                  )}
                </Stack>
              )}
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
                '& [role="row"][data-menu-open="true"] [role="cell"]': { bgcolor: 'gray.10' },
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
              {visibleRowIndices.map((rowIndex) => {
                const row = rows[rowIndex]
                return (
                  <Box
                    key={row.id}
                    role="row"
                    data-row-id={row.id}
                    data-even={rowIndex % 2 === 1}
                    data-menu-open={activeRowId === row.id}
                    data-new={!originalRows.has(row.id)}
                    style={{ position: 'absolute', top: rowIndex * UTILIZATION_ROW_HEIGHT, width: '100%' }}
                  >
                    {visibleColumns.map((column) => (
                      <Box
                        key={column.field}
                        role="cell"
                        data-column-index={column.index}
                        data-new={column.isNew || !originalRows.has(row.id)}
                        style={getColumnStyle(column.index)}
                      >
                        {renderCell(row, column)}
                      </Box>
                    ))}
                    {showActions && (
                      <Box
                        role="cell"
                        data-row-action="true"
                        data-column-index={-1}
                        data-new={!originalRows.has(row.id)}
                        style={{ gridColumn: -2 }}
                      >
                        {canAddRows && (
                          <FundamentalModelRowMenu
                            rowNumber={row.rowNumber}
                            open={activeRowId === row.id}
                            onOpenChange={(open) => setActiveRowId((current) => (open ? row.id : current === row.id ? undefined : current))}
                            onInsertAbove={() => insertRow(row.id, 'above')}
                            onInsertBelow={() => insertRow(row.id, 'below')}
                            onDelete={() => deleteRow(row.id)}
                          />
                        )}
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
    </Stack>
  )
}

export default SummarySheetTemplate
