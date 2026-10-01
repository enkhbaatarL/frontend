import type { FundamentalModelSheetDataRow } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

export const UTILIZATION_ROW_HEIGHT = 42
export const UTILIZATION_HEADER_HEIGHT = 72
export const UTILIZATION_ACTION_WIDTH = 36

export const getSheetHeaderRows = (values: string[]) => {
  const populatedRows = values.flatMap((value, index) => (value.trim() ? [{ value, index }] : []))
  const lastPopulatedRow = populatedRows.at(-1)
  if (populatedRows.length > 1 && lastPopulatedRow && lastPopulatedRow.index < values.length - 1) {
    populatedRows.push({ value: '', index: lastPopulatedRow.index + 1 })
  }
  return populatedRows.map(({ value, index }, rowIndex) => ({
    value,
    rowSpan: (populatedRows[rowIndex + 1]?.index ?? values.length) - (rowIndex === 0 ? 0 : index),
  }))
}

export interface MonthlyColumn {
  field: string
  month: string
  period: string
  year: string
}

export interface UtilizationColumn extends MonthlyColumn {
  label: string
  isMonthly: boolean
  headerValues?: string[]
}

let headerMeasureContext: CanvasRenderingContext2D | null | undefined

const getContentWidth = (value: string | number) => {
  let width = 0
  for (const character of String(value)) width += character.charCodeAt(0) > 255 ? 14 : 8
  return width
}

export const getUtilizationColumnWidth = (column: UtilizationColumn, rows: FundamentalModelSheetDataRow[]) => {
  if (typeof document !== 'undefined') {
    if (headerMeasureContext === undefined) headerMeasureContext = document.createElement('canvas').getContext('2d')
    if (headerMeasureContext) {
      const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family-primary').trim() || 'sans-serif'
      headerMeasureContext.font = `500 14px ${fontFamily}`
    }
  }
  let width = Math.max(
    column.isMonthly ? 112 : 140,
    ...[column.label, column.year, column.month, column.period, ...(column.headerValues ?? [])].map(
      (value) => Math.ceil(Math.max(getContentWidth(value), headerMeasureContext?.measureText(value).width ?? 0)) + 64,
    ),
  )
  for (const row of rows) width = Math.max(width, getContentWidth(row[column.field] ?? '') + 40)
  return width
}

export const getVisibleRowRange = (
  rowCount: number,
  scrollTop: number,
  viewportHeight: number,
  headerHeight = UTILIZATION_HEADER_HEIGHT,
) => {
  const start = Math.min(Math.max(0, rowCount - 1), Math.max(0, Math.floor(scrollTop / UTILIZATION_ROW_HEIGHT) - 4))
  const end = Math.min(rowCount, Math.ceil((scrollTop + Math.max(0, viewportHeight - headerHeight)) / UTILIZATION_ROW_HEIGHT) + 4)
  return { start, end }
}

export const getVisibleColumnRange = (offsets: number[], scrollLeft: number, viewportWidth: number) => {
  const columnCount = offsets.length - 1
  let start = 0
  while (start < columnCount && offsets[start + 1] <= scrollLeft) start += 1
  let end = start
  while (end < columnCount && offsets[end] < scrollLeft + viewportWidth) end += 1
  return { start: Math.max(0, start - 2), end: Math.min(columnCount, end + 2) }
}

export const getRenderedIndices = (start: number, end: number, focusedIndex?: number) => {
  const indices = Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index)
  if (focusedIndex !== undefined && focusedIndex >= 0) {
    if (focusedIndex < start) indices.unshift(focusedIndex)
    else if (focusedIndex >= end) indices.push(focusedIndex)
  }
  return indices
}

export const getNextUtilizationCell = (
  rowIndex: number,
  columnIndex: number,
  rowCount: number,
  columnCount: number,
  backwards: boolean,
) => {
  if (rowIndex < 0) return undefined
  let nextRow = rowIndex
  let nextColumn = columnIndex
  if (backwards) {
    if (columnIndex === 0) {
      nextRow -= 1
      nextColumn = -1
    } else if (columnIndex === -1) nextColumn = columnCount - 1
    else nextColumn -= 1
  } else if (columnIndex === -1) {
    nextRow += 1
    nextColumn = 0
  } else if (columnIndex === columnCount - 1) nextColumn = -1
  else nextColumn += 1
  if (nextRow < 0 || nextRow >= rowCount) return undefined
  return { rowIndex: nextRow, columnIndex: nextColumn }
}
