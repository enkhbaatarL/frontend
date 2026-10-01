import type {
  FundamentalModelSheetData,
  FundamentalModelSheetDataRow,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SheetTemplateDraft } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

export interface RegasYearField {
  field: string
  year: number
}

export interface RegasMonthField extends RegasYearField {
  month: number
}

const getYear = (value: string | number | undefined) => {
  const year = Number(value)
  return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : undefined
}

const getCapacity = (value: string | number | undefined) => {
  if (value === undefined || String(value).trim() === '') return undefined
  const capacity = Number(String(value).replaceAll(',', ''))
  return Number.isFinite(capacity) ? capacity : undefined
}

export const getRegasAnnualYearFields = (data: FundamentalModelSheetData): RegasYearField[] => {
  const header = data.rows.find(({ rowNumber }) => rowNumber === 7)
  return data.columns.flatMap(({ field }) => {
    if (Number(field.replace('column', '')) < 6) return []
    const year = getYear(header?.[field])
    return year === undefined ? [] : [{ field, year }]
  })
}

export const getRegasMonthFields = (data: FundamentalModelSheetData): RegasMonthField[] => {
  const years = data.rows.find(({ rowNumber }) => rowNumber === 9)
  const months = data.rows.find(({ rowNumber }) => rowNumber === 10)
  return data.columns.flatMap(({ field }) => {
    if (Number(field.replace('column', '')) < 7) return []
    const year = getYear(years?.[field])
    const month = Number(months?.[field])
    return year === undefined || !Number.isInteger(month) || month < 1 || month > 12 ? [] : [{ field, year, month }]
  })
}

export const getRegasInputRows = (data: FundamentalModelSheetData, firstRow: number) =>
  data.rows.filter((row) => row.rowNumber >= firstRow && [1, 2, 3, 4, 5].some((index) => String(row[`column${index}`] ?? '').trim()))

export const createLinkedRegasRow = (
  source: FundamentalModelSheetDataRow,
  annualYears: RegasYearField[],
  months: RegasMonthField[],
): FundamentalModelSheetDataRow => {
  const row: FundamentalModelSheetDataRow = { id: -source.id, rowNumber: 0 }
  for (let column = 1; column <= 5; column += 1) row[`column${column}`] = source[`column${column}`] ?? ''

  const annualValues = annualYears.map(({ field }) => getCapacity(source[field])).filter((value): value is number => value !== undefined)
  row.column6 = annualValues.length ? Math.max(...annualValues) : ''

  for (const { field, year } of months) {
    const annualField = annualYears.find((column) => column.year === year)?.field
    const value = annualField === undefined ? undefined : getCapacity(source[annualField])
    row[field] = year >= 2025 && value !== undefined ? value / 12 : ''
  }

  return row
}

export const reconcileRegasRows = (
  originals: FundamentalModelSheetDataRow[],
  targetDraft: SheetTemplateDraft | undefined,
  sourceDraft: SheetTemplateDraft | undefined,
  months: RegasMonthField[],
) => {
  const rows = [...(targetDraft?.rows ?? originals)]
  const deleted = targetDraft?.deletedLinkedSourceRowIds ?? []
  const snapshots = { ...targetDraft?.linkedSourceSnapshots }
  const annualYears = sourceDraft?.annualYearFields ?? []

  for (const source of sourceDraft?.rows.filter((row) => sourceDraft.addedRowIds?.includes(row.id)) ?? []) {
    if (deleted.includes(source.id)) continue
    const derived = createLinkedRegasRow(source, annualYears, months)
    const index = rows.findIndex((row) => row.id === derived.id)
    const previousSnapshot = snapshots[source.id]

    if (index < 0) {
      rows.push({ ...derived, rowNumber: Math.max(source.rowNumber + 3, ...rows.map(({ rowNumber }) => rowNumber + 1), 11) })
    } else if (previousSnapshot) {
      const updated = { ...rows[index] }
      for (const [field, value] of Object.entries(derived)) {
        if (field === 'id' || field === 'rowNumber') continue
        if (String(updated[field] ?? '') === String(previousSnapshot[field] ?? '')) updated[field] = value
      }
      rows[index] = updated
    }
    snapshots[source.id] = derived
  }

  return { rows, deletedLinkedSourceRowIds: deleted, linkedSourceSnapshots: snapshots }
}
