import type { FundamentalModelSheetData } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SummaryTemplateCoordinates } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateCoordinates'
import type { SummaryTemplateDefinition } from '@/pages/mi/fundamentalModel/components/sheetTemplates/summaryTemplateDefinitions'

export interface SummaryTemplateLayout {
  firstColumn: number
  lastColumn: number
  firstRow: number
  lastRow: number
  headerRow: number
  headerRows: number[]
  bodyStart: number
  fields: string[]
  editableFields: string[]
  forceEditableFields: string[]
  headerLabels: Record<string, string>
  periodYearRow?: number
  periodMonthRow?: number
  periodCountRow?: number
  addColumnAfter?: string
  inputRanges?: Array<{ firstColumn: number; lastColumn: number; firstRow: number; lastRow: number }>
  readOnlyFields: string[]
  protectedRowPattern?: string
  protectedRowFields: string[]
  clearFieldsOnEdit: Record<string, string[]>
}

const decodeColumn = (letters: string) => [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1

export const isSummaryTemplateRowProtected = (layout: SummaryTemplateLayout, row: FundamentalModelSheetData['rows'][number]) =>
  Boolean(
    layout.protectedRowPattern &&
      layout.protectedRowFields.some((field) => new RegExp(layout.protectedRowPattern!, 'i').test(String(row[field] ?? ''))),
  )

export const isSummaryTemplateCellEditable = (
  layout: SummaryTemplateLayout,
  row: FundamentalModelSheetData['rows'][number],
  field: string,
  inputCells: Set<number>,
  isNewRow = false,
  isNewColumn = false,
) => {
  if (layout.headerRows.includes(row.rowNumber) && (layout.fields.includes(field) || isNewColumn)) return false
  if (layout.readOnlyFields.includes(field) || isSummaryTemplateRowProtected(layout, row)) return false
  if (layout.inputRanges?.length === 0) return false
  if (isNewColumn) return true
  if (layout.inputRanges) {
    const column = Number(field.replace('column', ''))
    return layout.inputRanges.some(
      (range) =>
        column >= range.firstColumn &&
        column <= range.lastColumn &&
        (isNewRow ? range.lastRow >= layout.bodyStart : row.rowNumber >= range.firstRow && row.rowNumber <= range.lastRow),
    )
  }
  return (
    layout.forceEditableFields.includes(field) ||
    (isNewRow ? layout.editableFields.includes(field) : inputCells.has(row.rowNumber * 16384 + Number(field.replace('column', ''))))
  )
}

export const updateSummaryTemplateCell = (
  layout: SummaryTemplateLayout,
  row: FundamentalModelSheetData['rows'][number],
  field: string,
  value: string | number,
  originalRow?: FundamentalModelSheetData['rows'][number],
) => ({
  ...row,
  [field]: value,
  ...Object.fromEntries(
    (layout.clearFieldsOnEdit[field] ?? []).map((hiddenField) => [
      hiddenField,
      originalRow && String(value) === String(originalRow[field] ?? '') ? (originalRow[hiddenField] ?? '') : '',
    ]),
  ),
})

export const getSummaryTemplateLayout = (
  summary: SummaryTemplateDefinition,
  data: FundamentalModelSheetData,
  coordinates?: SummaryTemplateCoordinates,
): SummaryTemplateLayout => {
  const lastSourceColumn = Number(data.columns.at(-1)?.field.replace('column', '') ?? 0)
  const lastSourceRow = data.rows.at(-1)?.rowNumber ?? 1
  const ranges = [...summary.location.matchAll(/\b([A-Z]{1,3})(\d*)\s*:\s*([A-Z]{1,3})(\d*)\b/g)]
  const tableRange = ranges.at(-1)
  const openEndedRange = summary.location.match(/\b([A-Z]{1,3})(\d+):([A-Z]{1,3}) 이하/)
  const singleColumn = summary.location.match(/\b([A-Z]{1,3})열/)
  let firstColumn = tableRange
    ? decodeColumn(tableRange[1])
    : openEndedRange
      ? decodeColumn(openEndedRange[1])
      : singleColumn
        ? decodeColumn(singleColumn[1])
        : 0
  let lastColumn = tableRange
    ? decodeColumn(tableRange[3])
    : openEndedRange
      ? decodeColumn(openEndedRange[3])
      : singleColumn
        ? firstColumn
        : lastSourceColumn
  let firstRow = Number(tableRange?.[2] || openEndedRange?.[2] || summary.location.match(/(\d+)행부터/)?.[1] || 1)
  let lastRow = Number(tableRange?.[4] || lastSourceRow)

  if (/열 이후/.test(summary.location)) lastColumn = lastSourceColumn
  if (coordinates?.firstColumn) firstColumn = decodeColumn(coordinates.firstColumn)
  if (coordinates?.lastColumn) lastColumn = decodeColumn(coordinates.lastColumn)
  if (coordinates?.firstRow) firstRow = coordinates.firstRow
  if (coordinates?.lastRow) lastRow = coordinates.lastRow
  const selectedColumns = coordinates?.columns?.map(decodeColumn)
  if (selectedColumns?.length) {
    firstColumn = Math.min(...selectedColumns)
    lastColumn = Math.max(...selectedColumns)
  }
  firstColumn = Math.max(0, firstColumn)
  lastColumn = Math.max(firstColumn, Math.min(lastSourceColumn, lastColumn))
  lastRow = Math.max(firstRow, Math.min(lastSourceRow, lastRow))

  const singleRowRange = Boolean(tableRange?.[2] && tableRange?.[4] && tableRange[2] === tableRange[4])
  const headerLabelCount = (row: FundamentalModelSheetData['rows'][number]) =>
    Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) => String(row[`column${firstColumn + index}`] ?? '').trim()).filter(
      (value) => value && /[A-Za-z가-힣]/.test(value) && !value.startsWith('='),
    ).length
  const headerInRange =
    coordinates || singleRowRange
      ? undefined
      : data.rows
        .filter((row) => row.rowNumber >= firstRow && row.rowNumber <= Math.min(lastRow, firstRow + 3) && headerLabelCount(row) >= 2)
        .sort((left, right) => headerLabelCount(right) - headerLabelCount(left) || left.rowNumber - right.rowNumber)[0]
  const firstSourceRow = data.rows.find((row) => row.rowNumber === firstRow)
  const previousHeader =
    coordinates || singleRowRange
      ? undefined
      : data.rows.filter((row) => row.rowNumber < firstRow && row.rowNumber >= firstRow - 10 && headerLabelCount(row) >= 2).at(-1)
  const currentHeader =
    coordinates || singleRowRange || /행부터/.test(summary.location)
      ? undefined
      : (headerInRange ?? (firstSourceRow && headerLabelCount(firstSourceRow) > 0 ? firstSourceRow : undefined))
  const headerRow = coordinates?.headerRow ?? currentHeader?.rowNumber ?? previousHeader?.rowNumber ?? firstRow
  const headerRows = coordinates?.headerRows ?? [
    ...new Set([
      ...[coordinates?.periodYearRow, coordinates?.periodMonthRow, coordinates?.periodCountRow].filter(
        (row): row is number => row !== undefined,
      ),
      headerRow,
    ]),
  ]
  const periodFirstColumn = coordinates?.periodFirstColumn ? decodeColumn(coordinates.periodFirstColumn) : undefined
  const periodYear = data.rows.find(({ rowNumber }) => rowNumber === coordinates?.periodYearRow)
  const periodMonth = data.rows.find(({ rowNumber }) => rowNumber === coordinates?.periodMonthRow)
  const fields = (selectedColumns ?? Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) => firstColumn + index))
    .filter(
      (column) =>
        column <= lastSourceColumn &&
        (periodFirstColumn === undefined ||
          column < periodFirstColumn ||
          (periodYear?.[`column${column}`] && periodMonth?.[`column${column}`])),
    )
    .map((column) => `column${column}`)
  const fieldSet = new Set(fields)
  let firstInputRow: number | undefined
  const editableColumns = new Set<number>()
  for (const address of data.inputCells ?? []) {
    const row = Math.floor(address / 16384)
    const column = address % 16384
    if (
      row < (coordinates?.bodyStart ?? firstRow) ||
      row > lastRow ||
      (currentHeader && row <= currentHeader.rowNumber) ||
      !fieldSet.has(`column${column}`)
    )
      continue
    firstInputRow = firstInputRow === undefined ? row : Math.min(firstInputRow, row)
    editableColumns.add(column)
  }
  const bodyStart = coordinates?.bodyStart ?? (singleRowRange ? firstRow : Math.max(firstRow, firstInputRow ?? headerRow + 1))
  const forceEditableFields = coordinates?.forceEditableColumns?.map((column) => `column${decodeColumn(column)}`) ?? []

  return {
    firstColumn,
    lastColumn,
    firstRow,
    lastRow,
    headerRow,
    headerRows,
    bodyStart,
    fields,
    editableFields: [...new Set([...editableColumns].map((column) => `column${column}`).concat(forceEditableFields))],
    forceEditableFields,
    headerLabels: Object.fromEntries(
      Object.entries(coordinates?.headerLabels ?? {}).map(([column, label]) => [`column${decodeColumn(column)}`, label]),
    ),
    periodYearRow: coordinates?.periodYearRow,
    periodMonthRow: coordinates?.periodMonthRow,
    periodCountRow: coordinates?.periodCountRow,
    addColumnAfter: coordinates?.addColumnAfter && `column${decodeColumn(coordinates.addColumnAfter)}`,
    inputRanges: coordinates?.inputRanges?.map((range) => {
      const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
      if (!match) throw new Error(`입력 범위가 올바르지 않습니다: ${range}`)
      return {
        firstColumn: decodeColumn(match[1]),
        lastColumn: decodeColumn(match[3]),
        firstRow: Number(match[2]),
        lastRow: Number(match[4]),
      }
    }),
    readOnlyFields: coordinates?.readOnlyColumns?.map((column) => `column${decodeColumn(column)}`) ?? [],
    protectedRowPattern: coordinates?.protectedRowPattern,
    protectedRowFields: coordinates?.protectedRowColumns?.map((column) => `column${decodeColumn(column)}`) ?? [],
    clearFieldsOnEdit: Object.fromEntries(
      Object.entries(coordinates?.clearColumnsOnEdit ?? {}).map(([column, hiddenColumns]) => [
        `column${decodeColumn(column)}`,
        hiddenColumns.map((hiddenColumn) => `column${decodeColumn(hiddenColumn)}`),
      ]),
    ),
  }
}
