import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import ImpactDotsCell from '../ImpactDotsCell'
import PriceDirectionIcon from '../PriceDirectionIcon'
import ProbabilityGaugeCell from '../ProbabilityGaugeCell'
import { RelatedEvent, RelatedScenario } from './types'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import MITable from '@/components/common/table/MITable'

const DetailIconButton = () => (
  <MIBaseButton
    variant="outlined"
    prefix={<OpenInNewIcon sx={{ fontSize: 20, color: 'contentIcon.Enabled' }} />}
    sx={{
      width: '36px',
      height: '34px',
    }}
  />
)

const eventColumns: GridColDef<RelatedEvent>[] = [
  {
    field: 'name',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 240,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack gap="4px" sx={{ py: '4px' }}>
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
    width: 88,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => <ImpactDotsCell level={params.row.marketImpact} />,
  },
  {
    field: 'direction',
    headerName: '시장 방향',
    width: 76,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack alignItems="center" justifyContent="center" width="100%" height="100%">
        <PriceDirectionIcon direction={params.row.direction} size={14} />
      </Stack>
    ),
  },
  {
    field: 'id',
    headerName: '상세',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: () => <DetailIconButton />,
  },
]

const scenarioChip = (type: 'BC' | 'NOISE') => (
  <MIChip
    label={type}
    sx={{
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: type === 'BC' ? 'mari.Primary' : 'gray.20',
      color: type === 'BC' ? 'commonColor.White' : 'contentText.Normal',
    }}
    disableHover
  />
)

const scenarioColumns: GridColDef<RelatedScenario>[] = [
  {
    field: 'name',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 200,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Stack direction="row" alignItems="center" gap="8px">
        <Typography variant="body2M14" sx={{ color: 'contentText.Normal' }}>
          {params.row.name}
        </Typography>
        {params.row.isCurrent && params.row.type && scenarioChip(params.row.type)}
      </Stack>
    ),
  },
  {
    field: 'jkm',
    headerName: 'JKM',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.jkm} />,
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.ttf} />,
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.hh} />,
  },
  {
    field: 'probability',
    headerName: '가능성',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ProbabilityGaugeCell level={params.row.probability} />,
  },
  {
    field: 'id',
    headerName: '상세',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: () => <DetailIconButton />,
  },
]

const tableStyle = {
  '& .MuiDataGrid-columnHeaders': {
    padding: '0 12px !important',
    marginBottom: '4px',
  },
  '& .MuiDataGrid-columnHeader': {
    borderBottom: '0.5px solid contentBorder.Active !important',
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
          <MITable columns={eventColumns} rows={events} rowId="id" rowHeight={50} hideFooter disableRowSelectionOnClick />
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
          <MITable columns={scenarioColumns} rows={scenarios} rowId="id" rowHeight={50} hideFooter disableRowSelectionOnClick />
        </Box>
      </Box>
    </Stack>
  </Box>
)

export default RelatedEventsAndScenariosSection
