import { Box } from '@mui/material'
import { GridRowModel } from '@mui/x-data-grid'
import { ReactNode } from 'react'

import MITable, { MITableProps } from './MITable'
import MITablePagination from './MITablePagination'

export interface MITableUsertProps<T extends GridRowModel> {
  tableHeader?: ReactNode
  tableProps: MITableProps<T>
  hidePagination?: boolean
}

export default function MITableUser<T extends GridRowModel>(props: Readonly<MITableUsertProps<T>>) {
  const { tableHeader, tableProps, hidePagination } = props

  return (
    <Box>
      {tableHeader && <Box mb={5}>{tableHeader}</Box>}
      <MITable {...tableProps} />
      {!hidePagination && <MITablePagination />}
    </Box>
  )
}
