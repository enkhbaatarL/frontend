import type { GridColDef, GridRowModel } from '@mui/x-data-grid'

/**
 * Scenario workbench 테이블·헤더·아코디언 요약 행이 동일한 column split을 쓰도록 통일.
 * `minmax(col.minWidth, 1fr)`는 고정 열 합이 컨테이너보다 크면 그리드가 가로로 넘치므로
 * 가변 열은 `minmax(0, fr)`로 두고, 셀은 `minWidth: 0` + 말줄임으로 처리한다.
 */
export const scenarioWorkbenchColDefToGridTrack = <T extends GridRowModel>(col: GridColDef<T>): string => {
  if (col.width !== undefined && col.width !== null) {
    return `${col.width}px`
  }
  const flex = col.flex ?? 1
  return `minmax(0, ${flex}fr)`
}

export const scenarioWorkbenchColumnsToGridTemplate = <T extends GridRowModel>(columns: GridColDef<T>[]): string =>
  columns.map(scenarioWorkbenchColDefToGridTrack).join(' ')
