import * as XLSX from 'xlsx-js-style'

import type {
  FundamentalModelSheetData,
  FundamentalModelSheetDataRow,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { FundamentalModelInputGuideRule } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'

const isCellAddress = (address: string) => /^[A-Z]+\d+$/.test(address)

const hasCellValue = (cell: XLSX.CellObject | undefined) =>
  cell?.v !== undefined || cell?.w !== undefined || (typeof cell?.f === 'string' && cell.f.length > 0)

const getCellValue = (cell: XLSX.CellObject | undefined) => {
  if (!cell) return ''
  if (cell.w !== undefined) return cell.w
  if (cell.v !== undefined && cell.v !== null) return String(cell.v)
  return cell.f ? `=${cell.f}` : ''
}

const isMarkedInput = (cell: XLSX.CellObject) => {
  if (cell.f || cell.s?.patternType !== 'solid') return false
  const rgb = cell.s.fgColor?.rgb
  if (!rgb) return false
  const color = rgb.slice(-6)
  const red = Number.parseInt(color.slice(0, 2), 16)
  const green = Number.parseInt(color.slice(2, 4), 16)
  const blue = Number.parseInt(color.slice(4, 6), 16)
  return red >= 220 && green >= 175 && blue <= 120
}

export const getFundamentalModelSheetData = (
  worksheet: XLSX.WorkSheet,
  inputGuideRules?: FundamentalModelInputGuideRule[],
): FundamentalModelSheetData => {
  let firstColumn = Number.POSITIVE_INFINITY
  let lastColumn = Number.NEGATIVE_INFINITY
  const rowsByIndex = new Map<number, FundamentalModelSheetDataRow>()
  const inputCells: number[] = []

  for (const [address, cell] of Object.entries(worksheet)) {
    if (!isCellAddress(address)) continue

    const { c, r } = XLSX.utils.decode_cell(address)
    if (!inputGuideRules && isMarkedInput(cell)) inputCells.push((r + 1) * 16384 + c)
    if (!hasCellValue(cell)) continue
    firstColumn = Math.min(firstColumn, c)
    lastColumn = Math.max(lastColumn, c)
    let row = rowsByIndex.get(r)
    if (!row) {
      row = { id: r, rowNumber: r + 1 }
      rowsByIndex.set(r, row)
    }
    row[`column${c}`] = getCellValue(cell)
  }

  if (inputGuideRules) {
    for (const rule of inputGuideRules) {
      for (let row = rule.startRow; row <= rule.endRow; row += 1) {
        for (let column = rule.startColumn; column <= rule.endColumn; column += 1) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: row - 1, c: column })]
          if (!cell?.f) inputCells.push(row * 16384 + column)
        }
      }
    }
  }

  if (rowsByIndex.size === 0) return { columns: [], rows: [], inputCells, inputGuideRules }

  const columns = Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) => {
    const column = firstColumn + index
    return { field: `column${column}`, headerName: XLSX.utils.encode_col(column) }
  })
  const rows = [...rowsByIndex.values()].sort((left, right) => left.rowNumber - right.rowNumber)

  return { columns, rows, inputCells, inputGuideRules }
}
