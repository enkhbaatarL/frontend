export const DRAWER_WIDTH = {
  OPEN: 240,
  CLOSED: 48,
} as const

export const adminTableBaseProps = {
  sx: {
    '--DataGrid-overlayHeight': '387px',
    '--DataGrid-containerBackground': '#ffffff',
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-row.Mui-selected': {
      backgroundColor: 'transparent !important',
    },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
      outline: 'none',
    },
    '& .no-click': {
      pointerEvents: 'none',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: '#f5f5f5 !important',
    },
    '& .MuiDataGrid-columnSeparator': {
      display: 'none !important',
    },
    '& .MuiDataGrid-columnHeaders': {
      pointerEvents: 'none',
    },
  },
  disableColumnMenu: true,
  disableColumnSorting: true,
  disableColumnResize: true,
  hideFooter: true,
}
