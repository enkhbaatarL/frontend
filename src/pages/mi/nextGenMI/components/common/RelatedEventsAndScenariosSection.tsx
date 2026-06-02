import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo, type MouseEvent } from 'react'

import type { MarketDirection, MarketImpactLevel } from '@/service/mi/nextGenMI/common'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/nextGenMI/components/common/ImpactDotsCell'
import NextGenMIEventDetailTableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import ProbabilityGaugeCell from '@/pages/mi/nextGenMI/components/common/ProbabilityGaugeCell'
import { findIndexImpact, formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'

interface RelatedEventLike {
  eventId: number
  eventName: string
  createdAt: string
  updatedAt: string
  eventCategoryLv1?: string
  eventCategoryLv1Label?: string
  indexImpacts?: {
    indexName: string
    marketImpactLevel: MarketImpactLevel
    direction?: MarketDirection
  }[]
}

interface RelatedScenarioLike {
  scenarioId: number
  scenarioName: string
  baseCase: boolean
  probability: number
  indexImpacts?: {
    indexName: string
    marketImpactLevel: MarketImpactLevel
  }[]
}

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

const getRelatedEventColumns = <T extends RelatedEventLike>(onDetailClick?: (row: T) => void): GridColDef<T>[] => [
  {
    field: 'eventName',
    headerName: '이벤트명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<T>) => {
      const dateIso = params.row.updatedAt || params.row.createdAt
      const dateLabel = formatNextGenMIDateTime(dateIso)
      const categoryLabel = params.row.eventCategoryLv1Label ?? params.row.eventCategoryLv1
      return (
        <Stack gap="4px" sx={{ py: '4px', minWidth: 0, width: '100%' }}>
          <NextGenMIEventDetailTableBodyText
            value={params.row.eventName}
            tooltipWhenTruncated
            sx={{ minWidth: 0 }}
            onClick={
              onDetailClick
                ? (e) => {
                  e.stopPropagation()
                  onDetailClick(params.row)
                }
                : undefined
            }
          />
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
    renderCell: (params: GridRenderCellParams<T>) => {
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
    renderCell: (params: GridRenderCellParams<T>) => {
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
    renderCell: (params: GridRenderCellParams<T>) => {
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
    renderCell: (params: GridRenderCellParams<T>) => (
      <DetailIconButton
        disabled={!onDetailClick}
        onClick={() => {
          onDetailClick?.(params.row)
        }}
      />
    ),
  },
]

const getRelatedScenarioColumns = <T extends RelatedScenarioLike>(onDetailClick?: (row: T) => void): GridColDef<T>[] => [
  {
    field: 'scenarioName',
    headerName: '시나리오명',
    flex: 1,
    minWidth: 192,
    renderCell: (params: GridRenderCellParams<T>) => (
      <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0, width: '100%' }}>
        <NextGenMIEventDetailTableBodyText
          value={params.row.scenarioName}
          tooltipWhenTruncated
          sx={{ flex: '0 1 auto', width: 'auto', minWidth: 0 }}
          onClick={
            onDetailClick
              ? (e) => {
                e.stopPropagation()
                onDetailClick(params.row)
              }
              : undefined
          }
        />
        {params.row.baseCase && (
          <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0, verticalAlign: 'middle' }}>
            <NextGenMIBaseCaseChip />
          </Box>
        )}
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
    renderCell: (params: GridRenderCellParams<T>) => (
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
    renderCell: (params: GridRenderCellParams<T>) => (
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
    renderCell: (params: GridRenderCellParams<T>) => (
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
    renderCell: (params: GridRenderCellParams<T>) => <ProbabilityGaugeCell probability={params.row.probability} />,
  },
  {
    field: 'scenarioId',
    headerName: '상세',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<T>) => (
      <DetailIconButton
        disabled={!onDetailClick}
        onClick={() => {
          onDetailClick?.(params.row)
        }}
      />
    ),
  },
]

export interface RelatedEventsAndScenariosSectionProps<TEvent extends RelatedEventLike, TScenario extends RelatedScenarioLike> {
  events: TEvent[]
  scenarios: TScenario[]
  onEventRowClick?: (row: TEvent) => void
  onScenarioRowClick?: (row: TScenario) => void
  loading?: boolean
}

const RelatedEventsAndScenariosSection = <TEvent extends RelatedEventLike, TScenario extends RelatedScenarioLike>({
  events,
  scenarios,
  onEventRowClick,
  onScenarioRowClick,
  loading = false,
}: RelatedEventsAndScenariosSectionProps<TEvent, TScenario>) => {
  const relatedEventColumns = useMemo(() => getRelatedEventColumns<TEvent>(onEventRowClick), [onEventRowClick])
  const relatedScenarioColumns = useMemo(() => getRelatedScenarioColumns<TScenario>(onScenarioRowClick), [onScenarioRowClick])

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
            <MIDataTableHeader<TEvent> columns={relatedEventColumns} />
            <MIDataTableBody<TEvent>
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
            <MIDataTableHeader<TScenario> columns={relatedScenarioColumns} />
            <MIDataTableBody<TScenario>
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
