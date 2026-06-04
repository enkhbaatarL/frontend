import ListIcon from '@mui/icons-material/List'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import type { RelatedEventScenario, RelatedScenario } from '@/service/mi/nextGenMI/event'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/nextGenMI/components/common/ImpactDotsCell'
import NextGenMIEventDetailTableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import ProbabilityGaugeCell from '@/pages/mi/nextGenMI/components/common/ProbabilityGaugeCell'
import { findIndexImpact } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'

interface EventDetailRelatedScenariosSectionProps {
  relatedEventScenario?: RelatedEventScenario | null
  onScenarioRowClick?: (row: RelatedScenario) => void
  loading?: boolean
}

const EventDetailRelatedScenariosSection = ({
  relatedEventScenario,
  onScenarioRowClick,
  loading = false,
}: EventDetailRelatedScenariosSectionProps) => {
  const rows = relatedEventScenario?.scenarios ?? []

  const columns: GridColDef<RelatedScenario>[] = useMemo(
    () => [
      {
        field: 'baseCase',
        headerName: '',
        width: 40,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) =>
          params.row.baseCase ? (
            <Box sx={{ display: 'inline-flex', lineHeight: 0 }}>
              <NextGenMIBaseCaseChip />
            </Box>
          ) : null,
      },
      {
        field: 'scenarioName',
        headerName: '시나리오',
        width: 300,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMIEventDetailTableBodyText
            value={params.row.scenarioName}
            sx={{ fontWeight: 600 }}
            tooltipWhenTruncated
            onClick={
              onScenarioRowClick
                ? (e) => {
                  e.stopPropagation()
                  onScenarioRowClick(params.row)
                }
                : undefined
            }
          />
        ),
      },
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'JKM')?.marketImpactLevel} />
        ),
      },
      {
        field: 'ttf',
        headerName: 'TTF',
        width: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'TTF')?.marketImpactLevel} />
        ),
      },
      {
        field: 'hh',
        headerName: 'HH',
        width: 80,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <ImpactDotsCell level={findIndexImpact(params.row.indexImpacts, 'HH')?.marketImpactLevel} />
        ),
      },
      {
        field: 'probability',
        headerName: '발생가능성',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => <ProbabilityGaugeCell probability={params.row.probability} />,
      },
    ],
    [onScenarioRowClick],
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py="20px">
        <EventDetailSectionHeader
          icon={<ListIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
          title="관련 시나리오"
          tooltipTitle=""
        />
        <Box bgcolor="gray.5" borderRadius="10px" p="24px">
          <Skeleton variant="rounded" width={200} height={20} sx={{ mb: '8px' }} />
          <Skeleton variant="rounded" height={200} />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<ListIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
        title="관련 시나리오"
        tooltipTitle=""
      />
      <Box bgcolor="gray.5" borderRadius="10px" p="24px">
        <Stack gap="8px" py="6px" mb="8px">
          <Typography variant="body2SB14" color="contentText.Normal" px="6px" lineHeight={1.4}>
            시나리오 그룹
          </Typography>
          <Typography variant="body1B16" color="contentText.Black" px="6px" lineHeight={1.4}>
            {'-'}
          </Typography>
        </Stack>
        <Box bgcolor="commonColor.White" border="1px solid" borderColor="contentBorder.Normal" borderRadius="10px" p="12px">
          <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <MIDataTableHeader<RelatedScenario> columns={columns} />
            <MIDataTableBody<RelatedScenario>
              rowId="scenarioId"
              columns={columns}
              rows={rows}
              rowHeight={42}
              loading={loading}
              noRowMessage="관련 시나리오가 없습니다."
            />
          </Box>
        </Box>
      </Box>
    </Stack>
  )
}

export default EventDetailRelatedScenariosSection
