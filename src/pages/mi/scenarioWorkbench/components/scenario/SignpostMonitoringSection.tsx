import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import { SignpostItem } from './types'

import MITable from '@/components/common/table/MITable'

const textCell = (value: string) => (
  <Typography
    sx={{
      fontSize: 14,
      fontWeight: 500,
      color: '#495057',
      lineHeight: 1.4,
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
      '& .MuiDataGrid-columnHeader': {
        border: 'none !important',
        borderBottom: '0.5px solid #868E96 !important',
        backgroundColor: 'white !important',
        padding: '8px 16px !important',

        '& .MuiTypography-root': {
          fontSize: 14,
          fontWeight: 600,
          color: '#495057',
        },
      },
      '& .MuiDataGrid-cell': {
        padding: '10px 12px !important',
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
        background: 'linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
      }}
    />
  </Box>
)

export default SignpostMonitoringSection
