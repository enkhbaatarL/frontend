import { Box, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import { SignpostItem } from './types'
import ScenarioWorkbenchDataList from '../table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '../table/ScenarioWorkbenchTableHeader'

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
    field: 'marketImpactSummary',
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
  <Box sx={{ position: 'relative', paddingY: '24px' }}>
    <ScenarioWorkbenchTableHeader<SignpostItem> columns={columns} sx={{ mb: 0 }} />
    <ScenarioWorkbenchDataList<SignpostItem>
      rowId="id"
      columns={columns}
      rows={rows}
      rowHeight={42}
      noRowMessage="데이터를 수집 중입니다."
    />
  </Box>
)

export default SignpostMonitoringSection
