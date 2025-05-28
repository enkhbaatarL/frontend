import { Box, Typography } from '@mui/material'
import { DataGrid, DataGridProps, GridColDef, GridRowModel } from '@mui/x-data-grid'
import { t } from 'i18next'
import { useMemo } from 'react'

import MITableCell from './MITableCell'
import MITableHeaderCell from './MITableHeaderCell'
import ErrorOutlineIcon from '../icons/ErrorOutlineIcon'

import theme from '@/theming'

export interface MITableProps<T extends GridRowModel> extends DataGridProps {
  rowId: keyof T
  columns: GridColDef[]
  rows?: T[]
  noRowMessage?: string
  hidePagination?: boolean
  disableHover?: boolean
}

const createNoRowsOverlay = (message?: string) => {
  const Component = () => (
    <Box display={'flex'} alignItems={'center'} justifyContent={'center'} bgcolor={'gray.5'} textAlign={'center'} height={'100%'}>
      <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
        <ErrorOutlineIcon />
        <Typography variant="body6" color="gray.60">
          {message ?? t('No results found')}
        </Typography>
      </Box>
    </Box>
  )
  Component.displayName = 'NoRowsOverlay'
  return Component
}

export default function MITable<T extends GridRowModel>(props: Readonly<MITableProps<T>>) {
  const ROW_HEIGHT = 40
  const HEADER_HEIGHT = 36

  const { columns, rows, noRowMessage, rowId, disableHover = false, ...dataGridProps } = props

  const memoizedColumns = useMemo(
    () =>
      columns.map((column) => ({
        renderHeader: () => <MITableHeaderCell>{column.headerName}</MITableHeaderCell>,
        renderCell: (params) => <MITableCell tooltipContent={params.value} value={params.value} />,
        ...column,
        headerAlign: column.align,
        width: rows?.length === 0 && columns.length > 4 ? 'auto' : column.width,
        minWidth: rows?.length === 0 && columns.length > 4 ? 'unset' : column.minWidth,
        flex: rows?.length === 0 && columns.length > 4 ? 1 : column.flex,
      })) as GridColDef<T>[],
    [columns, rows],
  )

  const noRowsOverlay = useMemo(() => createNoRowsOverlay(noRowMessage), [noRowMessage])

  return (
    <DataGrid
      slots={{
        noRowsOverlay,
      }}
      getRowId={(row) => row[rowId]}
      rows={rows ?? []}
      columns={memoizedColumns}
      rowHeight={ROW_HEIGHT}
      columnHeaderHeight={HEADER_HEIGHT}
      className="MITable"
      sx={{
        '--DataGrid-overlayHeight': '387px',
        '--DataGrid-containerBackground': theme.palette.gray[5],
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
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
        ...(disableHover
          ? {
            '& .MuiDataGrid-row:hover': {
              backgroundColor: `${theme.palette.common.white} !important`,
            },
          }
          : {
            '& .MuiDataGrid-row:hover *': {
              cursor: props.onRowClick ? 'pointer' : 'auto',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: `${theme.palette.gray[5]}`,
              fontHeight: 600,
              '& *': {
                fontWeight: 600,
              },
            },
          }),
        '& .MuiDataGrid-row:hover *': {
          cursor: props.onRowClick ? 'pointer' : 'auto',
        },
        '& .MuiDataGrid-row:hover .MuiDataGrid-cell button': {
          cursor: 'pointer',
        },
        '& .MuiDataGrid-row:hover .MuiDataGrid-cell button *': {
          cursor: 'pointer',
        },
        // '& .MuiDataGrid-row:hover': {
        //   backgroundColor: `${theme.palette.gray[5]}`,
        //   fontHeight: 600,
        //   '& *': {
        //     fontWeight: 600,
        //   },
        // },
        '& .MuiDataGrid-columnSeparator': {
          display: 'none !important',
        },
        '& .MuiDataGrid-columnHeaders': {
          pointerEvents: 'none',
          minHeight: HEADER_HEIGHT,
          maxHeight: HEADER_HEIGHT,
          height: HEADER_HEIGHT,
        },
        '& .MuiDataGrid-columnHeader': {
          minHeight: HEADER_HEIGHT,
          maxHeight: HEADER_HEIGHT,
          borderColor: theme.palette.gray['40'],
          borderWidth: '2px',
        },
        '& .MuiDataGrid-cell': {
          lineHeight: '20px',
          padding: '0',
          alignItems: 'center',
          display: 'flex',
        },
      }}
      disableColumnMenu
      disableColumnSorting
      disableColumnResize
      hideFooter
      {...dataGridProps}
    />
  )
}
