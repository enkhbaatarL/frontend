import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { forwardRef } from 'react'
import { TableVirtuoso, TableComponents } from 'react-virtuoso'

import styles from './AdminTable.module.scss'

import AdminPagination from '@/components/admin/AdminPagination'

interface AdminTableProps<T extends GridRowModel> {
  columns: GridColDef[]
  data: T[]
  height?: number
}

const VirtuosoTableComponents = <T,>(): TableComponents<T> => ({
  Scroller: forwardRef<HTMLDivElement>(function Scroller (props, ref) {
    return <TableContainer component={Paper} {...props} ref={ref} />
  }),
  Table: (props) => <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />,
  TableHead: forwardRef<HTMLTableSectionElement>(function TableHeadComponent (props, ref) {
    return <TableHead {...props} ref={ref} className={styles.header} />
  }),
  TableRow,
  TableBody: forwardRef<HTMLTableSectionElement>(function TableBodyComponent (props, ref) {
    return <TableBody {...props} ref={ref} />
  }),
})

const AdminTable = <T extends GridRowModel>({ columns, data, height = 400 }: AdminTableProps<T>) => {
  const fixedHeaderContent = () => (
    <TableRow className={styles.header}>
      {columns.map((column) => (
        <TableCell key={column.field} variant="head" align={column.align} style={{ width: column.width }}>
          {column.headerName}
        </TableCell>
      ))}
    </TableRow>
  )

  const rowContent = (_index: number, row: T) => (
    <>
      {columns.map((column) => (
        <TableCell key={column.field} align={column.align}>
          {row[column.field]}
        </TableCell>
      ))}
    </>
  )

  return (
    <>
      <Paper style={{ height, width: '100%' }}>
        <TableVirtuoso
          data={data}
          components={VirtuosoTableComponents<T>()}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
        />
      </Paper>
      <AdminPagination />
    </>
  )
}

export default AdminTable
