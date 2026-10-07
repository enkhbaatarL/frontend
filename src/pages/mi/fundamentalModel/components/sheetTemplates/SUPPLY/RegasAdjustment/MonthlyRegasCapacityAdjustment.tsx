import { useLayoutEffect, useMemo, useState } from 'react'

import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import RegasEditableTable from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/RegasEditableTable'
import {
  getLinkedRegasColumns,
  getRegasInputRows,
  getRegasMonthFields,
  reconcileRegasRows,
} from '@/pages/mi/fundamentalModel/components/sheetTemplates/SUPPLY/regasRowLink'

const MonthlyRegasCapacityAdjustment = ({ data, draft, linkedSourceDraft, linkedSourceData, onDraftChange }: SheetTemplateProps) => {
  const originals = useMemo(() => getRegasInputRows(data, 11, 382), [data])
  const monthFields = useMemo(() => getRegasMonthFields(data), [data])
  const directInputFields = useMemo(
    () => new Set(monthFields.filter(({ year }) => year === 2023 || year === 2024).map(({ field }) => field)),
    [monthFields],
  )
  const addedColumns = useMemo(() => getLinkedRegasColumns(data, linkedSourceDraft), [data, linkedSourceDraft])
  const allMonthFields = useMemo(
    () => [...monthFields, ...addedColumns.map(({ field, year, month }) => ({ field, year: Number(year), month: Number(month) }))],
    [addedColumns, monthFields],
  )
  const header = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === 10), [data])
  const yearHeader = useMemo(() => data.rows.find(({ rowNumber }) => rowNumber === 9), [data])
  const firstNewRowId = useMemo(() => Math.max(0, ...data.rows.map(({ id }) => id)) + 1, [data])
  const [editedRows, setEditedRows] = useState(() => draft?.rows ?? originals)
  const { rows } = useMemo(
    () => reconcileRegasRows(originals, { rows: editedRows }, linkedSourceDraft, allMonthFields, linkedSourceData),
    [allMonthFields, editedRows, linkedSourceData, linkedSourceDraft, originals],
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
    onDraftChange?.({ rows, addedColumns })
  }, [addedColumns, onDraftChange, rows])

  return (
    <RegasEditableTable
      columns={columns}
      rows={rows}
      originalRows={originals}
      firstNewRowId={firstNewRowId}
      isReadOnly={(_row, field) => !directInputFields.has(field)}
      onUpdate={(id, field, value) => {
        if (!directInputFields.has(field)) return
        setEditedRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
      }}
    />
  )
}

export default MonthlyRegasCapacityAdjustment
