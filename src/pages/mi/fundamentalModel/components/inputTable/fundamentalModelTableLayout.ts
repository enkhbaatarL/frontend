export const FUNDAMENTAL_MODEL_ROW_HEIGHT = 42
export const FUNDAMENTAL_MODEL_ACTION_WIDTH = 36

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

interface TableColumn {
  field: string
  label: string
  headerValues: string[]
}

let headerMeasureContext: CanvasRenderingContext2D | null | undefined

const getContentWidth = (value: unknown) => {
  let width = 0
  for (const character of String(value)) width += character.charCodeAt(0) > 255 ? 14 : 8
  return width
}

export const getFundamentalModelColumnContentWidths = (fields: string[], rows: Record<string, unknown>[]) => {
  const widths = new Map<string, number>()
  for (const field of fields) {
    let width = 0
    for (const row of rows) width = Math.max(width, getContentWidth(row[field] ?? '') + 40)
    widths.set(field, width)
  }
  return widths
}

export const createFundamentalModelColumnWidthCache = () => {
  const cache = new WeakMap<object, Map<string, number>>()
  return (page: object, fields: string[], getRows: () => Record<string, unknown>[]) => {
    const previous = cache.get(page)
    if (previous && fields.every((field) => previous.has(field))) return previous
    const widths = getFundamentalModelColumnContentWidths(fields, getRows())
    cache.set(page, widths)
    return widths
  }
}

export const getFundamentalModelColumnWidth = (column: TableColumn, rows: Record<string, unknown>[], contentWidth?: number) => {
  if (typeof document !== 'undefined') {
    if (headerMeasureContext === undefined) headerMeasureContext = document.createElement('canvas').getContext('2d')
    if (headerMeasureContext) {
      const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-family-primary').trim() || 'sans-serif'
      headerMeasureContext.font = `500 14px ${fontFamily}`
    }
  }
  let width = Math.max(
    140,
    ...[column.label, ...column.headerValues].map(
      (value) => Math.ceil(Math.max(getContentWidth(value), headerMeasureContext?.measureText(value).width ?? 0)) + 64,
    ),
  )
  if (contentWidth !== undefined) return Math.max(width, contentWidth)
  for (const row of rows) width = Math.max(width, getContentWidth(row[column.field] ?? '') + 40)
  return width
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
