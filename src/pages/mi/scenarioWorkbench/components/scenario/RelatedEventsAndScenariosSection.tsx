import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { RelatedEvent, RelatedScenario } from './types'

import MIBaseButton from '@/components/common/button/MIBaseButton'
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
        <Typography variant="body2M14" sx={{ color: 'contentText.Normal' }}>
          {params.row.name}
        </Typography>
        <Stack direction="row" alignItems="center" gap="8px">
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            {params.row.date}
          </Typography>
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            |
          </Typography>
          <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
            {params.row.category}
          </Typography>
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
      <Typography variant="body2SB14" sx={{ color: params.row.marketImpactColor }}>
        {params.value as string}
      </Typography>
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
          <ArrowUpwardIcon sx={{ fontSize: '14px', color: 'increase.main' }} />
        ) : (
          <RemoveIcon sx={{ fontSize: '18px', color: 'contentText.Disabled' }} />
        )}
        <Typography variant="body2SB14" sx={{ color: params.row.direction === 'up' ? 'increase.main' : 'contentText.Disabled' }}>
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
      <MIBaseButton variant="outlined" sx={{ width: '41px', height: '36px', padding: '8px' }}>
        상세
      </MIBaseButton>
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
            sx={{ height: '21px', padding: '2px 6px', backgroundColor: 'gray.80', color: 'commonColor.White', borderRadius: '6px' }}
          />
        )}
        <Typography variant="body2SB14" sx={{ color: 'contentText.Normal' }}>
          {params.row.name}
        </Typography>
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
      <Typography variant="body2SB14" sx={{ color: params.row.marketImpactColor }}>
        {params.value as string}
      </Typography>
    ),
  },
  {
    field: 'priceImpact',
    headerName: '가격영향',
    flex: 1,
    width: 70,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Typography variant="body2SB14" sx={{ color: params.row.priceImpactColor }}>
        {params.value as string}
      </Typography>
    ),
  },
  {
    field: 'initialProbability',
    headerName: '초기가능성',
    flex: 1,
    width: 70,
    align: 'center',
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Typography variant="body2SB14" sx={{ color: 'contentText.Normal' }}>
        {params.value as string}
      </Typography>
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
      <MIBaseButton variant="outlined" sx={{ width: '41px', height: '36px', padding: '8px' }}>
        상세
      </MIBaseButton>
    ),
  },
]

const tableStyle = {
  '& .MuiDataGrid-columnHeaders': {
    padding: '0 12px !important',
    marginBottom: '4px',
  },
  '& .MuiDataGrid-columnHeader': {
    border: 'none !important',
    borderBottom: '0.5px solid gray.60 !important',
    padding: '0 !important',

    '& .MuiTypography-root': {
      fontSize: 14,
      fontWeight: 600,
      color: 'contentText.Normal',
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
  '& .MuiDataGrid-row': {
    borderRadius: '10px',
    '&:hover': {
      backgroundColor: 'gray.10',
    },
  },
}

interface RelatedEventsAndScenariosSectionProps {
  events: RelatedEvent[]
  scenarios: RelatedScenario[]
}

const RelatedEventsAndScenariosSection = ({ events, scenarios }: RelatedEventsAndScenariosSectionProps) => (
  <Box sx={{ bgcolor: 'gray.5', p: '24px', borderRadius: '10px' }}>
    <Stack direction="row" gap="12px" alignItems="flex-start">
      {/* 관련 이벤트 */}
      <Box flex="1" minWidth={0}>
        <Typography
          variant="body1SB16"
          sx={{ color: 'contentText.Black', px: '12px', height: '36px', display: 'flex', alignItems: 'center' }}
        >
          관련 이벤트
        </Typography>

        <Box sx={tableStyle}>
          <MITable columns={eventColumns} rows={events} rowId="id" rowHeight={50} hideFooter />
        </Box>
      </Box>

      {/* 관련 시나리오 */}
      <Box flex="1" minWidth={0}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: '12px' }}>
          <Typography variant="body1SB16" sx={{ color: 'contentText.Black', height: '36px', display: 'flex', alignItems: 'center' }}>
            관련 시나리오
          </Typography>
          <Typography variant="body3R12" sx={{ color: 'contentText.Normal', textAlign: 'right' }}>
            동일 이벤트로부터 생성된 시나리오 목록
          </Typography>
        </Stack>
        <Box sx={tableStyle}>
          <MITable columns={scenarioColumns} rows={scenarios} rowId="id" rowHeight={50} hideFooter />
        </Box>
      </Box>
    </Stack>
  </Box>
)

export default RelatedEventsAndScenariosSection
