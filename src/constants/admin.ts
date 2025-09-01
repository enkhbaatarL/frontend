export const DRAWER_WIDTH = {
  OPEN: 240,
  CLOSED: 68,
} as const

export const adminTableBaseProps = {
  sx: {
    '--DataGrid-overlayHeight': '387px',
    '--DataGrid-containerBackground': '#F8F9FA',
    '& .MuiDataGrid-overlayWrapper': {
      top: '36px',
    },
    borderTop: 'none',
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
    '& .MuiDataGrid-columnSeparator': {
      display: 'none !important',
    },
    '& .MuiDataGrid-columnHeaders': {
      pointerEvents: 'none',
      minHeight: 36,
      maxHeight: 36,
      height: 36,
    },
    '& .MuiDataGrid-columnHeader': {
      minHeight: 36,
      maxHeight: 36,
      borderColor: '#CED4DA',
      borderWidth: '2px',
    },
    '& .MuiDataGrid-cell': {
      lineHeight: '20px',
      padding: '0',
      alignItems: 'center',
      display: 'flex',
    },
  },
  disableColumnMenu: true,
  disableColumnSorting: true,
  disableColumnResize: true,
  hideFooter: true,
}
