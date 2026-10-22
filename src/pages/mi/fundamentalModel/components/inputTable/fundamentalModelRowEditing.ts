export const insertFundamentalModelRow = <Row>(
  rows: Row[],
  rowId: string | number,
  position: 'above' | 'below',
  newRow: Row,
  getRowId: (row: Row) => string | number,
) => {
  const index = rows.findIndex((row) => getRowId(row) === rowId)
  if (index < 0) return rows
  const nextRows = [...rows]
  nextRows.splice(index + (position === 'below' ? 1 : 0), 0, newRow)
  return nextRows
}

export const deleteFundamentalModelRow = <Row>(rows: Row[], rowId: string | number, getRowId: (row: Row) => string | number) =>
  rows.filter((row) => getRowId(row) !== rowId)
