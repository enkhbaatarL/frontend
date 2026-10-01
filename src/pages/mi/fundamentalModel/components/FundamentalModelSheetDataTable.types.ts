export interface FundamentalModelSheetDataColumn {
  field: string
  headerName: string
}

export interface FundamentalModelSheetDataRow {
  id: number
  rowNumber: number
  [field: string]: string | number
}

export type FundamentalModelInputRole = 'scenario' | 'reference' | 'conditional'

export interface FundamentalModelInputGuideRule {
  sheetName: string
  range: string
  role: FundamentalModelInputRole
  item: string
  emptyHandling: string
  startRow: number
  endRow: number
  startColumn: number
  endColumn: number
}

export interface FundamentalModelSheetData {
  columns: FundamentalModelSheetDataColumn[]
  rows: FundamentalModelSheetDataRow[]
  inputCells?: number[]
  inputGuideRules?: FundamentalModelInputGuideRule[]
}
