import type { GridColDef, GridRowModel } from '@mui/x-data-grid'

export interface DataTableGridTemplateOptions {
  /**
   * - false (기본): 가변 열 `minmax(0, fr)` — 컨테이너에 맞춰 줄어듦
   * - true: 가변 열 `minmax(col.minWidth ?? 0, fr)` — minWidth 우선, 가로 스크롤 가능
   */
  enableHorizontalScroll?: boolean
}

export const dataTableColDefToGridTrack = <T extends GridRowModel>(
  col: GridColDef<T>,
  options: DataTableGridTemplateOptions = {},
): string => {
  if (col.width !== undefined && col.width !== null) {
    return `${col.width}px`
  }
  const flex = col.flex ?? 1
  const minWidth = options.enableHorizontalScroll ? (col.minWidth ?? 0) : 0
  return `minmax(${minWidth}px, ${flex}fr)`
}

export const dataTableColumnsToGridTemplate = <T extends GridRowModel>(
  columns: GridColDef<T>[],
  options: DataTableGridTemplateOptions = {},
): string => columns.map((col) => dataTableColDefToGridTrack(col, options)).join(' ')
