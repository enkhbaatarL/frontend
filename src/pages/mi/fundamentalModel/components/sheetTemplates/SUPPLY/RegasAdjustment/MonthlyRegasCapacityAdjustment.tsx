import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import RegasEditableTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/RegasEditableTable'
import {
  getRegasInputRows,
  getRegasMonthFields,
  reconcileRegasRows,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/regasRowLink'

const MonthlyRegasCapacityAdjustment = ({ data, draft, linkedSourceDraft, onDraftChange }: SheetTemplateProps) => {
  const originals = useMemo(() => getRegasInputRows(data, 11), [data])
  const originalRowNumbers = useMemo(() => new Map(originals.map(({ id, rowNumber }) => [id, rowNumber])), [originals])
  const inputCells = useMemo(() => new Set(data.inputCells ?? []), [data.inputCells])
  const monthFields = useMemo(() => getRegasMonthFields(data), [data])
  const [addedColumns, setAddedColumns] = useState(() => draft?.addedColumns ?? [])
  const allMonthFields = useMemo(
    () => [...monthFields, ...addedColumns.map(({ field, year, month }) => ({ field, year: Number(year), month: Number(month) }))],
    [addedColumns, monthFields],
  )
  const header = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === 10), [data])
  const yearHeader = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === 9), [data])
  const [state, setState] = useState(() => reconcileRegasRows(originals, draft, linkedSourceDraft, allMonthFields))
  const firstNewRowId = useMemo(() => Math.max(0, ...data.rows.map(({ id }) => id)) + 1, [data])
  const nextId = useRef(Math.max(firstNewRowId, ...state.rows.map(({ id }) => id + 1)))
  const nextColumnIndex = useRef(
    Math.max(
      0,
      ...data.columns.map(({ field }) => Number(field.replace('column', ''))),
      ...addedColumns.map(({ field }) => Number(field.replace('column', ''))),
    ) + 1,
  )
  const columns = useMemo(
    () => [
      ...[1, 2, 3, 4, 5, 6].map((index) => ({
        field: `column${index}`,
        label: String(header?.[`column${index}`] ?? ['Region', 'Subregion', 'Country', 'Facility', 'Status', 'Max Capacity'][index - 1]),
        year: String(yearHeader?.[`column${index}`] ?? ''),
      })),
      ...allMonthFields.map(({ field, year, month }) => ({
        field,
        label: '',
        year: String(year),
        month: String(month),
        isNew: addedColumns.some((column) => column.field === field),
      })),
    ],
    [addedColumns, allMonthFields, header, yearHeader],
  )

  useLayoutEffect(() => {
    onDraftChange?.({ ...state, addedColumns })
  }, [addedColumns, onDraftChange, state])

  return (
    <RegasEditableTable
      columns={columns}
      rows={state.rows}
      originalRows={originals}
      firstNewRowId={firstNewRowId}
      isReadOnly={(row, field) =>
        originalRowNumbers.has(row.id) && !inputCells.has(originalRowNumbers.get(row.id)! * 16384 + Number(field.replace('column', '')))
      }
      onInsert={(anchorId, position) => {
        setState((current) => {
          const index = current.rows.findIndex((row) => row.id === anchorId)
          if (index < 0) return current
          const rows = [...current.rows]
          rows.splice(index + (position === 'below' ? 1 : 0), 0, {
            id: nextId.current++,
            rowNumber: 0,
            ...Object.fromEntries(columns.map(({ field }) => [field, ''])),
          })
          return { ...current, rows: rows.map((row, rowIndex) => ({ ...row, rowNumber: rowIndex + 11 })) }
        })
      }}
      onAddColumn={() => {
        const last = allMonthFields.at(-1)
        if (!last) return
        const year = last.month === 12 ? last.year + 1 : last.year
        const month = last.month === 12 ? 1 : last.month + 1
        setAddedColumns((current) => [
          ...current,
          { field: `column${nextColumnIndex.current++}`, label: `${month}월`, year: String(year), month: String(month) },
        ])
      }}
      onDelete={(id) =>
        setState((current) => ({
          ...current,
          rows: current.rows.filter((row) => row.id !== id).map((row, rowIndex) => ({ ...row, rowNumber: rowIndex + 11 })),
          deletedLinkedSourceRowIds: id < 0 ? [...current.deletedLinkedSourceRowIds, -id] : current.deletedLinkedSourceRowIds,
        }))
      }
      onUpdate={(id, field, value) =>
        setState((current) => ({
          ...current,
          rows: current.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
        }))
      }
    />
  )
}

export default MonthlyRegasCapacityAdjustment
