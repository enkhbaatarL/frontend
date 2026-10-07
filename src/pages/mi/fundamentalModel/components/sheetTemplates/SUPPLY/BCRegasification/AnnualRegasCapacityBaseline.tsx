import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import RegasEditableTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/RegasEditableTable'
import { getRegasAnnualYearFields, getRegasInputRows } from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/regasRowLink'

const AnnualRegasCapacityBaseline = ({ data, draft, onDraftChange }: SheetTemplateProps) => {
  const originals = useMemo(() => getRegasInputRows(data, 8, 379), [data])
  const annualYearFields = useMemo(() => getRegasAnnualYearFields(data), [data])
  const header = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === 7), [data])
  const firstNewRowId = useMemo(() => Math.max(0, ...data.rows.map(({ id }) => id)) + 1, [data])
  const [state, setState] = useState(() => ({
    rows: draft?.rows ?? (originals.length ? originals : [{ id: firstNewRowId, rowNumber: 8 }]),
    addedRowIds: draft?.addedRowIds ?? (originals.length ? [] : [firstNewRowId]),
  }))
  const [addedColumns, setAddedColumns] = useState(() => draft?.addedColumns ?? [])
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
      ...[1, 2, 3, 4, 5].map((index) => ({
        field: `column${index}`,
        label: String(header?.[`column${index}`] ?? ['Region', 'Subregion', 'Country', 'Facility', 'Status'][index - 1]),
      })),
      ...[...annualYearFields, ...addedColumns.map(({ field, year }) => ({ field, year: Number(year) }))].map(({ field, year }) => ({
        field,
        label: String(year),
        isNew: addedColumns.some((column) => column.field === field),
      })),
    ],
    [addedColumns, annualYearFields, header],
  )

  useLayoutEffect(() => {
    onDraftChange?.({
      ...state,
      annualYearFields: [...annualYearFields, ...addedColumns.map(({ field, year }) => ({ field, year: Number(year) }))],
      addedColumns,
    })
  }, [addedColumns, annualYearFields, onDraftChange, state])

  return (
    <RegasEditableTable
      columns={columns}
      rows={state.rows}
      originalRows={originals}
      firstNewRowId={firstNewRowId}
      onInsert={(anchorId, position) => {
        setState((current) => {
          const id = nextId.current++
          const index = current.rows.findIndex((row) => row.id === anchorId)
          if (index < 0) return current
          const rows = [...current.rows]
          rows.splice(index + (position === 'below' ? 1 : 0), 0, {
            id,
            rowNumber: 0,
            ...Object.fromEntries(columns.map(({ field }) => [field, ''])),
          })
          return {
            rows: rows.map((row, rowIndex) => ({ ...row, rowNumber: rowIndex + 8 })),
            addedRowIds: [...current.addedRowIds, id],
          }
        })
      }}
      onAddColumn={() => {
        const lastYear = Number(addedColumns.at(-1)?.year ?? annualYearFields.at(-1)?.year)
        if (!Number.isInteger(lastYear)) return
        setAddedColumns((current) => [
          ...current,
          { field: `column${nextColumnIndex.current++}`, label: String(lastYear + 1), year: String(lastYear + 1) },
        ])
      }}
      onDelete={(id) =>
        setState((current) => {
          const rows = current.rows.filter((row) => row.id !== id)
          const addedRowIds = current.addedRowIds.filter((addedId) => addedId !== id)
          if (!rows.length) {
            const emptyId = nextId.current++
            rows.push({ id: emptyId, rowNumber: 8 })
            addedRowIds.push(emptyId)
          }
          return { rows: rows.map((row, rowIndex) => ({ ...row, rowNumber: rowIndex + 8 })), addedRowIds }
        })
      }
      onUpdate={(id, field, value) =>
        setState((current) => ({ ...current, rows: current.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }))
      }
    />
  )
}

export default AnnualRegasCapacityBaseline
