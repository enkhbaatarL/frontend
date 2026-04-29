import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import { SignpostItem } from './types'

import MITable from '@/components/common/table/MITable'

const textCell = (value: string) => (
  <Typography
    variant="body2M14"
    sx={{
      color: 'contentText.Normal',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {value}
  </Typography>
)

const columns: GridColDef<SignpostItem>[] = [
  {
    field: 'coreEvent',
    headerName: '핵심이벤트',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => textCell(params.value as string),
  },
  {
    field: 'currentStatus',
    headerName: '현재 상태 요약',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => textCell(params.value as string),
  },
  {
    field: 'marketImpact',
    headerName: '시장 영향 해석',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => textCell(params.value as string),
  },
  {
    field: 'observationPoint',
    headerName: '관찰 포인트 (Trigger)',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => textCell(params.value as string),
  },
  {
    field: 'source',
    headerName: '출처',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => textCell(params.value as string),
  },
]

interface SignpostMonitoringSectionProps {
  rows: SignpostItem[]
}

const SignpostMonitoringSection = ({ rows }: SignpostMonitoringSectionProps) => (
  <Box
    sx={{
      position: 'relative',
      paddingY: '24px',
      '& .MuiDataGrid-columnHeaders': {
        marginBottom: '4px',
      },
      '& .MuiDataGrid-columnHeader': {
        border: 'none !important',
        borderBottom: '0.5px solid gray.60 !important',
        backgroundColor: 'white !important',

        '& .MuiTypography-root': {
          fontSize: 14,
          fontWeight: 600,
          color: 'contentText.Normal',
        },
      },
      '& .MuiDataGrid-cell': {
        padding: '10px 12px !important',
      },
      '& .MuiDataGrid-row': {
        borderRadius: '10px',
        '&:hover': {
          backgroundColor: 'gray.10',
        },
      },
    }}
  >
    <MITable columns={columns} rows={rows} rowId="id" hideFooter getRowHeight={() => 'auto'} />
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100px',
        pointerEvents: 'none',
      }}
    />
  </Box>
)

export default SignpostMonitoringSection
