import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import { useMemo } from 'react'

import AdminPagination from '@/components/admin/AdminPagination'
import { adminTableBaseProps } from '@/constants/admin'

interface AdminTableProps<T extends GridRowModel> {
  getRowId?: (row: T) => string | number
  columns: GridColDef[]
  rows?: T[]
  isLoading?: boolean
}

const AdminTable = <T extends GridRowModel>({ getRowId, columns, rows, isLoading }: AdminTableProps<T>) => {
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
      <div className="full-width">
        <DataGrid getRowId={getRowId} rows={rows ?? []} columns={memoizedColumns} {...adminTableBaseProps} loading={isLoading} />
      </div>
      <AdminPagination />
    </>
  )
}

export default AdminTable
