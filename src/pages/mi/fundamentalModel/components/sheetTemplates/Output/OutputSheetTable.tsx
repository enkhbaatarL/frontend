import { Stack } from '@mui/material'

import type { FundamentalModelSheetDataRow } from '@/pages/mi/fundamentalModel/components/FundamentalModelSheetDataTable.types'
import type { SheetTemplateProps } from '@/pages/mi/fundamentalModel/components/sheetTemplates/sheetTemplateRegistry'

import MITable from '@/components/common/table/MITable'

interface OutputSheetTableProps extends SheetTemplateProps {
  firstColumn: number
  lastColumn: number
  firstRow: number
  lastRow: number
  headers?: string[]
}

const OutputSheetTable = ({ data, firstColumn, lastColumn, firstRow, lastRow, headers }: OutputSheetTableProps) => {
  const headerRow = headers ? undefined : data.rows.find((row) => row.rowNumber === firstRow)
  const columns = data.columns
    .filter(({ field }) => {
      const columnIndex = Number(field.slice('column'.length))
      return columnIndex >= firstColumn && columnIndex <= lastColumn
    })
    .map(({ field, headerName }, index) => ({
      field,
      headerName: headers?.[index] ?? String(headerRow?.[field] || headerName),
      minWidth: 150,
      flex: 1,
    }))
  const rows = data.rows.filter((row) => row.rowNumber >= firstRow + (headers ? 0 : 1) && row.rowNumber <= lastRow)

  return (
    <Stack flex={1} minWidth={0} minHeight={0}>
      <MITable<FundamentalModelSheetDataRow> rowId="id" columns={columns} rows={rows} disableHover />
    </Stack>
  )
}

export default OutputSheetTable
