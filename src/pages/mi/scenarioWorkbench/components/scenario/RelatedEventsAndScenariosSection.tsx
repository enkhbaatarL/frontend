import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Button, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { RelatedEvent, RelatedScenario } from './types'

import MIChip from '@/components/common/chip/MIChip'
import MITable from '@/components/common/table/MITable'

const eventColumns: GridColDef<RelatedEvent>[] = [
  {
    field: 'name',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 380,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack gap="4px">
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#495057', lineHeight: 1.4 }}>{params.row.name}</Typography>
        <Stack direction="row" alignItems="center" gap="8px">
          <Typography sx={{ fontSize: 12, color: '#868E96', lineHeight: 1.4 }}>{params.row.date}</Typography>
          <Typography sx={{ fontSize: 12, color: '#868E96', lineHeight: 1.4 }}>|</Typography>
          <Typography sx={{ fontSize: 12, color: '#868E96', lineHeight: 1.4 }}>{params.row.category}</Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    field: 'marketImpact',
    headerName: '시장 영향도',
    flex: 1,
    width: 56,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: params.row.marketImpactColor }}>{params.value as string}</Typography>
    ),
  },
  {
    field: 'direction',
    headerName: '시장 방향',
    flex: 1,
    width: 56,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack direction="row" alignItems="center" gap="2px">
        {params.row.direction === 'up' ? (
          <ArrowUpwardIcon sx={{ fontSize: 14, color: '#498B47' }} />
        ) : (
          <RemoveIcon sx={{ fontSize: 18, color: '#ADB5BD' }} />
        )}
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: params.row.direction === 'up' ? '#498B47' : '#ADB5BD' }}>
          {params.row.directionLabel}
        </Typography>
      </Stack>
    ),
  },
  {
    field: 'id',
    headerName: '상세',
    flex: 1,
    width: 36,
    align: 'center',
    sortable: false,
    renderCell: () => (
      <Button
        variant="outlined"
        size="small"
        sx={{
          fontSize: 12,
          fontWeight: 600,
          borderColor: '#DEE2E6',
          color: '#495057',
          borderRadius: '10px',
          padding: '8px',
          textTransform: 'none',
          minWidth: 'unset',
        }}
      >
        상세
      </Button>
    ),
  },
]

const scenarioColumns: GridColDef<RelatedScenario>[] = [
  {
    field: 'name',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 330,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Stack direction="row" alignItems="center" gap="8px">
        {params.row.isCurrent && (
          <MIChip
            label="현재"
            disableHover
            sx={{ height: '21px', padding: '2px 6px', backgroundColor: '#343A40', color: '#FFFFFF', borderRadius: '6px' }}
          />
        )}
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#495057', lineHeight: 1.4 }}>{params.row.name}</Typography>
      </Stack>
    ),
  },
  {
    field: 'marketImpact',
    headerName: '시장영향',
    flex: 1,
    width: 70,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: params.row.marketImpactColor }}>{params.value as string}</Typography>
    ),
  },
  {
    field: 'priceImpact',
    headerName: '가격영향',
    flex: 1,
    width: 70,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: params.row.priceImpactColor }}>{params.value as string}</Typography>
    ),
  },
  {
    field: 'initialProbability',
    headerName: '초기가능성',
    flex: 1,
    width: 70,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#495057' }}>{params.value as string}</Typography>
    ),
  },
  {
    field: 'id',
    headerName: '상세',
    flex: 1,
    width: 60,
    align: 'center',
    sortable: false,
    renderCell: () => (
      <Button
        variant="outlined"
        size="small"
        sx={{
          fontSize: 12,
          fontWeight: 600,
          borderColor: '#DEE2E6',
          color: '#495057',
          borderRadius: '10px',
          padding: '8px',
          textTransform: 'none',
          minWidth: 'unset',
        }}
      >
        상세
      </Button>
    ),
  },
]

const tableStyle = {
  '& .MuiDataGrid-columnHeaders': {
    padding: '0 12px !important',
  },
  '& .MuiDataGrid-columnHeader': {
    border: 'none !important',
    borderBottom: '0.5px solid #868E96 !important',
    padding: '0 !important',

    '& .MuiTypography-root': {
      fontSize: 14,
      fontWeight: 600,
      color: '#495057',
      padding: '8px 12px !important',
    },
  },
  '& .MuiDataGrid-virtualScrollerRenderZone': {
    padding: '0 12px !important',
  },
  '& .MuiBox-root': {
    padding: '0 !important',
  },
  '& .MuiDataGrid-cell': {
    padding: '10px 12px !important',
  },
}

interface RelatedEventsAndScenariosSectionProps {
  events: RelatedEvent[]
  scenarios: RelatedScenario[]
}

const RelatedEventsAndScenariosSection = ({ events, scenarios }: RelatedEventsAndScenariosSectionProps) => (
  <Box sx={{ bgcolor: '#F8F9FA', p: '24px', borderRadius: '10px' }}>
    <Stack direction="row" gap="12px" alignItems="flex-start">
      {/* 관련 이벤트 */}
      <Box flex="1" minWidth={0}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#212529', px: '12px', height: '36px', alignContent: 'center' }}>
          관련 이벤트
        </Typography>

        <Box sx={tableStyle}>
          <MITable columns={eventColumns} rows={events} rowId="id" hideFooter rowHeight={50} />
        </Box>
      </Box>

      {/* 관련 시나리오 */}
      <Box flex="1" minWidth={0}>
        <Stack direction="row" justifyContent="space-between" px="12px">
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#212529', px: '12px', height: '36px', alignContent: 'center' }}>
            관련 시나리오
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 400, color: '#495057', alignContent: 'center' }}>
            동일 이벤트로부터 생성된 시나리오 목록
          </Typography>
        </Stack>
        <Box sx={tableStyle}>
          <MITable columns={scenarioColumns} rows={scenarios} rowId="id" hideFooter rowHeight={50} />
        </Box>
      </Box>
    </Stack>
  </Box>
)

export default RelatedEventsAndScenariosSection
