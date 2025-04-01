import { Box, Typography } from '@mui/material'
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import clsx from 'clsx'
import { useMemo } from 'react'

import style from './AdminTable.module.scss'

import AdminPagination from '@/components/admin/AdminPagination'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import { adminTableBaseProps } from '@/constants/admin'

interface AdminTableProps<T extends GridRowModel> {
  getRowId?: (row: T) => string | number
  columns: GridColDef[]
  rows?: T[]
  isLoading?: boolean
  noRowMessage?: string
}

const AdminTable = <T extends GridRowModel>({ getRowId, columns, rows, isLoading, noRowMessage }: AdminTableProps<T>) => {
  const memoizedColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        headerAlign: column.align,
      })),
    [columns],
  )

  return (
    <>
      <DataGrid
        slots={{
          noRowsOverlay: () => (
            <Box className={clsx(style.adminTableNoRowsOverlay)}>
              <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
                <ErrorOutlineIcon />
                <Typography variant="body6" color="gray.60">
                  {noRowMessage ?? '표시할 데이터가 없습니다'}
                </Typography>
              </Box>
            </Box>
          ),
        }}
        getRowId={getRowId}
        rows={rows ?? []}
        columns={memoizedColumns}
        {...adminTableBaseProps}
        loading={isLoading}
      />
      <Box display="flex" justifyContent="center" pt="20px" pb="10px">
        <AdminPagination />
      </Box>
    </>
  )
}

export default AdminTable
