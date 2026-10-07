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
    const column = Number(field.replace('column', ''))
    if (column < 6 || column > 16) return []
    const year = getYear(header?.[field])
    return year === undefined ? [] : [{ field, year }]
  })
}

export const getRegasMonthFields = (data: FundamentalModelSheetData): RegasMonthField[] => {
  const years = data.rows.find(({ rowNumber }) => rowNumber === 9)
  const months = data.rows.find(({ rowNumber }) => rowNumber === 10)
  return data.columns.flatMap(({ field }) => {
    const column = Number(field.replace('column', ''))
    if (column < 7 || column > 114) return []
    const year = getYear(years?.[field])
    const month = Number(months?.[field])
    return year === undefined || !Number.isInteger(month) || month < 1 || month > 12 ? [] : [{ field, year, month }]
  })
}

export const getRegasInputRows = (data: FundamentalModelSheetData, firstRow: number, lastRow: number) =>
  data.rows.filter(
    (row) =>
      row.rowNumber >= firstRow && row.rowNumber <= lastRow && [1, 2, 3, 4, 5].some((index) => String(row[`column${index}`] ?? '').trim()),
  )

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

export const getLinkedRegasColumns = (data: FundamentalModelSheetData, sourceDraft: SheetTemplateDraft | undefined) => {
  const months = getRegasMonthFields(data)
  let nextColumnIndex = Math.max(0, ...data.columns.map(({ field }) => Number(field.replace('column', '')))) + 1
  return (sourceDraft?.addedColumns ?? []).flatMap(({ year }) => {
    const annualYear = getYear(year)
    if (annualYear === undefined) return []
    return Array.from({ length: 12 }, (_, index) => index + 1)
      .filter((month) => !months.some((column) => column.year === annualYear && column.month === month))
      .map((month) => ({
        field: `column${nextColumnIndex++}`,
        label: `${month}월`,
        year: String(annualYear),
        month: String(month),
      }))
  })
}

export const reconcileRegasRows = (
  originals: FundamentalModelSheetDataRow[],
  targetDraft: SheetTemplateDraft | undefined,
  sourceDraft: SheetTemplateDraft | undefined,
  months: RegasMonthField[],
  sourceData?: FundamentalModelSheetData,
) => {
  const savedRows = new Map(targetDraft?.rows.map((row) => [row.id, row]))
  const directInputFields = months.filter(({ year }) => year === 2023 || year === 2024).map(({ field }) => field)
  const restoreInputs = (row: FundamentalModelSheetDataRow) => {
    const saved = savedRows.get(row.id)
    const restored = { ...row }
    for (const field of directInputFields) {
      if (saved?.[field] !== undefined) restored[field] = saved[field]
    }
    return restored
  }
  if (!sourceData) return { rows: originals.map(restoreInputs) }

  const sourceOriginals = getRegasInputRows(sourceData, 8, 379)
  const sourceOriginalsById = new Map(sourceOriginals.map((row) => [row.id, row]))
  const targetOriginalsByRowNumber = new Map(originals.map((row) => [row.rowNumber, row]))
  const originalYears = getRegasAnnualYearFields(sourceData)
  const annualYears = sourceDraft?.annualYearFields ?? originalYears
  const rows = (sourceDraft?.rows ?? sourceOriginals).map((source, index) => {
    const originalSource = sourceOriginalsById.get(source.id)
    const originalTarget = originalSource ? targetOriginalsByRowNumber.get(originalSource.rowNumber + 3) : undefined
    const derived = createLinkedRegasRow(source, annualYears, months)
    const row = restoreInputs({ ...derived, ...originalTarget, id: originalTarget?.id ?? derived.id, rowNumber: index + 11 })

    for (let column = 1; column <= 5; column += 1) row[`column${column}`] = derived[`column${column}`]
    if (!originalTarget || annualYears.some(({ field }) => getCapacity(source[field]) !== getCapacity(originalSource?.[field])))
      row.column6 = derived.column6

    for (const { field, year } of months) {
      if (year === 2023 || year === 2024) continue
      const annualField = annualYears.find((column) => column.year === year)?.field
      const originalAnnualField = originalYears.find((column) => column.year === year)?.field
      if (
        !originalTarget ||
        originalTarget[field] === undefined ||
        getCapacity(annualField ? source[annualField] : undefined) !==
          getCapacity(originalAnnualField ? originalSource?.[originalAnnualField] : undefined)
      )
        row[field] = derived[field]
    }
    return row
  })

  return { rows }
}
