import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useMemo, type MouseEvent } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { EventCategoryLv1 } from '@/service/mi/scenarioWorkbench/common'
import { IRelatedEvent, IRelatedScenario } from '@/service/mi/scenarioWorkbench/scenario'

const EVENT_CATEGORY_LABEL: Record<EventCategoryLv1, string> = {
  [EventCategoryLv1.GEOPOLITICAL_RISK]: '지정학적 리스크',
  [EventCategoryLv1.WEATHER_CLIMATE]: '기상/기후',
  [EventCategoryLv1.INFRASTRUCTURE_FACILITY]: '인프라/설비',
  [EventCategoryLv1.SUPPLY_DEMAND_BALANCE]: '수급밸런스',
  [EventCategoryLv1.LOGISTICS_SHIPPING]: '물류/해운',
  [EventCategoryLv1.ENERGY_MIX_TRANSITION]: '에너지 믹스 전환',
  [EventCategoryLv1.MACROECONOMY_POLICY]: '거시경제/정책',
  [EventCategoryLv1.MARKET_TRADING_STRUCTURE]: '시장/거래 구조',
}

const findIndexImpact = <T extends { indexName: string }>(impacts: T[], indexName: string): T | undefined =>
  impacts.find((i) => (i.indexName ?? '').toUpperCase() === indexName)

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

const getRelatedEventColumns = (onDetailClick?: (row: IRelatedEvent) => void): GridColDef<IRelatedEvent>[] => [
  {
    field: 'eventName',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<IRelatedEvent>) => {
      const dateIso = params.row.updatedAt || params.row.createdAt
      const dateLabel = dateIso && dayjs(dateIso).isValid() ? dayjs(dateIso).format('MM-DD HH:mm') : '-'
      const categoryLabel = EVENT_CATEGORY_LABEL[params.row.eventCategoryLv1] ?? params.row.eventCategoryLv1
      return (
        <Stack gap="4px" sx={{ py: '4px', minWidth: 0, width: '100%' }}>
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.eventName} tooltipWhenTruncated sx={{ minWidth: 0 }} />
          <Stack direction="row" alignItems="center" gap="8px">
            <Typography variant="body3M12" sx={{ color: 'contentText.Subtext' }}>
              {dateLabel}
            </Typography>
            <Typography variant="body3M12" sx={{ color: 'contentText.Subtext' }}>
              |
            </Typography>
            <Typography variant="body3M12" sx={{ color: 'contentText.Subtext' }}>
              {categoryLabel}
            </Typography>
          </Stack>
        </Stack>
      )
    },
  },
  {
    field: 'jkm',
    headerName: 'JKM',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedEvent>) => {
      const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
      return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
    },
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedEvent>) => {
      const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
      return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
    },
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedEvent>) => {
      const impact = findIndexImpact(params.row.indexImpacts, 'HH')
      return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
    },
  },
  {
    field: 'eventId',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedEvent>) => (
      <DetailIconButton
        disabled={!onDetailClick}
        onClick={() => {
          onDetailClick?.(params.row)
        }}
      />
    ),
  },
]

const baseCaseChip = () => (
  <MIChip
    label="BC"
    sx={{
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: 'mari.Primary',
      color: 'commonColor.White',
    }}
    disableHover
  />
)

const getRelatedScenarioColumns = (onDetailClick?: (row: IRelatedScenario) => void): GridColDef<IRelatedScenario>[] => [
  {
    field: 'scenarioName',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => (
      <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0, width: '100%' }}>
        <ScenarioWorkbenchEventDetailTableBodyText
          value={params.row.scenarioName}
          tooltipWhenTruncated
          sx={{ flex: '0 1 auto', width: 'auto', minWidth: 0 }}
        />
        {params.row.baseCase && <Box sx={{ flex: '0 0 auto' }}>{baseCaseChip()}</Box>}
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
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => (
      <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'JKM')?.marketImpactLevel} />
    ),
  },
  {
    field: 'ttf',
    headerName: 'TTF',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => (
      <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'TTF')?.marketImpactLevel} />
    ),
  },
  {
    field: 'hh',
    headerName: 'HH',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => (
      <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'HH')?.marketImpactLevel} />
    ),
  },
  {
    field: 'probability',
    headerName: '가능성',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => <ProbabilityGaugeCell probability={params.row.probability} />,
  },
  {
    field: 'scenarioId',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<IRelatedScenario>) => (
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
  events: IRelatedEvent[]
  scenarios: IRelatedScenario[]
  onEventRowClick?: (row: IRelatedEvent) => void
  onScenarioRowClick?: (row: IRelatedScenario) => void
  loading?: boolean
}

const RelatedEventsAndScenariosSection = ({
  events,
  scenarios,
  onEventRowClick,
  onScenarioRowClick,
  loading = false,
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
            <ScenarioWorkbenchTableHeader<IRelatedEvent> columns={relatedEventColumns} />
            <ScenarioWorkbenchDataList<IRelatedEvent>
              rowId="eventId"
              columns={relatedEventColumns}
              rows={events}
              rowHeight={50}
              loading={loading}
              skeletonRowCount={2}
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
            <ScenarioWorkbenchTableHeader<IRelatedScenario> columns={relatedScenarioColumns} />
            <ScenarioWorkbenchDataList<IRelatedScenario>
              rowId="scenarioId"
              columns={relatedScenarioColumns}
              rows={scenarios}
              rowHeight={50}
              loading={loading}
              skeletonRowCount={3}
              noRowMessage="관련 시나리오가 없습니다."
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default RelatedEventsAndScenariosSection
