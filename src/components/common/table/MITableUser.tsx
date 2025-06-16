import { Box } from '@mui/material'
import { GridRowModel } from '@mui/x-data-grid'
import { ReactNode } from 'react'

import MIPagination, { MIPaginationProps } from '@/components/common/pagination/MIPagination'
import MITable, { MITableProps } from '@/components/common/table/MITable'

export interface MITableUserProps<T extends GridRowModel> {
  tableHeader?: ReactNode
  tableProps: MITableProps<T>
  hidePagination?: boolean
  paginationProps?: MIPaginationProps<T>
  unstable_rowSpanning?: boolean
}

export default function MITableUser<T extends GridRowModel>(props: Readonly<MITableUserProps<T>>) {
  const { tableHeader, tableProps, hidePagination, paginationProps } = props

  return (
    <Box>
      {tableHeader && <Box mb={5}>{tableHeader}</Box>}
      <MITable {...tableProps} />
      {!hidePagination && <MIPagination {...paginationProps} />}
    </Box>
  )
}
