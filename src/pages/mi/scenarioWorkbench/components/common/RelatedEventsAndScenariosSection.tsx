import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo, type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import { RelatedEvent, RelatedScenario } from '@/pages/mi/scenarioWorkbench/components/scenario/types'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

const DetailIconButton = ({ onClick, disabled }: { onClick?: (e: MouseEvent) => void; disabled?: boolean }) => (
  <MIBaseButton
    variant="outlined"
    enableHoverBackground
    disabled={disabled}
    aria-label="상세 보기"
    onClick={(e) => {
      e.stopPropagation()
      onClick?.(e)
    }}
    sx={{
      width: '22px',
      minWidth: '0px',
      height: '22px',
      padding: '3px',
      borderRadius: '4px',
      backgroundColor: 'commonColor.White',
    }}
  >
    <OpenInNewIcon sx={{ fontSize: 14, color: 'contentIcon.Enabled' }} />
  </MIBaseButton>
)

const getRelatedEventColumns = (onDetailClick?: (row: RelatedEvent) => void): GridColDef<RelatedEvent>[] => [
  {
    field: 'name',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <Stack gap="4px" sx={{ py: '4px', minWidth: 0, width: '100%' }}>
        <ScenarioWorkbenchEventDetailTableBodyText value={params.row.name} tooltipWhenTruncated sx={{ minWidth: 0 }} />
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
    field: 'jkm',
    headerName: 'JKM',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <ImpactDotsCell level={params.row.jkm} direction={params.row.jkmDirection} />
    ),
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <ImpactDotsCell level={params.row.ttf} direction={params.row.ttfDirection} />
    ),
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => <ImpactDotsCell level={params.row.hh} direction={params.row.hhDirection} />,
  },
  {
    field: 'id',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedEvent>) => (
      <DetailIconButton
        disabled={!onDetailClick}
        onClick={() => {
          onDetailClick?.(params.row)
        }}
      />
    ),
  },
]

const scenarioTypeChip = (type: 'BC' | 'NOISE') => (
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

const getRelatedScenarioColumns = (onDetailClick?: (row: RelatedScenario) => void): GridColDef<RelatedScenario>[] => [
  {
    field: 'name',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0, width: '100%' }}>
        <ScenarioWorkbenchEventDetailTableBodyText
          value={params.row.name}
          tooltipWhenTruncated
          sx={{ flex: '0 1 auto', width: 'auto', minWidth: 0 }}
        />
        {params.row.isCurrent && params.row.type && <Box sx={{ flex: '0 0 auto' }}>{scenarioTypeChip(params.row.type)}</Box>}
      </Stack>
    ),
  },
  {
    field: 'jkm',
    headerName: 'JKM',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.jkm} />,
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.ttf} />,
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ImpactDotsCell level={params.row.hh} />,
  },
  {
    field: 'probability',
    headerName: '가능성',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ProbabilityGaugeCell level={params.row.probability} />,
  },
  {
    field: 'id',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
      <DetailIconButton
        disabled={!onDetailClick}
        onClick={() => {
          onDetailClick?.(params.row)
        }}
      />
    ),
  },
]

export interface RelatedEventsAndScenariosSectionProps {
  events: RelatedEvent[]
  scenarios: RelatedScenario[]
  onEventRowClick?: (row: RelatedEvent) => void
  onScenarioRowClick?: (row: RelatedScenario) => void
}

const RelatedEventsAndScenariosSection = ({
  events,
  scenarios,
  onEventRowClick,
  onScenarioRowClick,
}: RelatedEventsAndScenariosSectionProps) => {
  const relatedEventColumns = useMemo(() => getRelatedEventColumns(onEventRowClick), [onEventRowClick])
  const relatedScenarioColumns = useMemo(() => getRelatedScenarioColumns(onScenarioRowClick), [onScenarioRowClick])

  return (
    <Box sx={{ bgcolor: 'gray.5', p: '24px', borderRadius: '10px' }}>
      <Stack direction="row" gap="12px" alignItems="flex-start">
        <Box flex="1" minWidth={0}>
          <Typography
            variant="body1SB16"
            sx={{ color: 'contentText.Black', px: '12px', height: '36px', display: 'flex', alignItems: 'center' }}
          >
            관련 이벤트
          </Typography>

          <Box sx={{ px: '12px', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <ScenarioWorkbenchTableHeader<RelatedEvent> columns={relatedEventColumns} />
            <ScenarioWorkbenchDataList<RelatedEvent>
              rowId="id"
              columns={relatedEventColumns}
              rows={events}
              rowHeight={50}
              noRowMessage="관련 이벤트가 없습니다."
            />
          </Box>
        </Box>

        <Box flex="1" minWidth={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: '12px' }}>
            <Typography variant="body1SB16" sx={{ color: 'contentText.Black', height: '36px', display: 'flex', alignItems: 'center' }}>
              관련 시나리오
            </Typography>
            <Typography variant="body3R12" sx={{ color: 'contentText.Normal', textAlign: 'right' }}>
              동일 이벤트로부터 생성된 시나리오 목록
            </Typography>
          </Stack>
          <Box sx={{ px: '12px', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <ScenarioWorkbenchTableHeader<RelatedScenario> columns={relatedScenarioColumns} />
            <ScenarioWorkbenchDataList<RelatedScenario>
              rowId="id"
              columns={relatedScenarioColumns}
              rows={scenarios}
              rowHeight={50}
              noRowMessage="관련 시나리오가 없습니다."
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default RelatedEventsAndScenariosSection
