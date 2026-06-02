import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import type { IScenarioWorkbenchEventRelatedScenarioGroup } from '@/service/mi/scenarioWorkbench/event'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { ScenarioWorkbenchBaseCaseChip } from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchPossibilityDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchPossibilityDotsCell'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

type RelatedScenarioRow = IScenarioWorkbenchEventRelatedScenarioGroup['scenarios'][number]

interface EventDetailRelatedScenariosSectionProps {
  relatedScenarioGroup?: IScenarioWorkbenchEventRelatedScenarioGroup
  onScenarioRowClick?: (row: RelatedScenarioRow) => void
  loading?: boolean
}

const EventDetailRelatedScenariosSection = ({
  relatedScenarioGroup,
  onScenarioRowClick,
  loading = false,
}: EventDetailRelatedScenariosSectionProps) => {
  const rows = relatedScenarioGroup?.scenarios ?? []

  const columns: GridColDef<RelatedScenarioRow>[] = useMemo(
    () => [
      {
        field: 'baseCase',
        headerName: '',
        width: 40,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) =>
          params.row.baseCase ? (
            <Box sx={{ display: 'inline-flex', lineHeight: 0 }}>
              <ScenarioWorkbenchBaseCaseChip />
            </Box>
          ) : null,
      },
      {
        field: 'scenarioName',
        headerName: '시나리오',
        width: 300,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText
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
        field: 'duration',
        headerName: '기간',
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.duration} />
        ),
      },
      {
        field: 'transportDisruption',
        headerName: '운송 차질',
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.transportDisruption} />
        ),
      },
      {
        field: 'supplyDisruptionIntensity',
        headerName: '공급 차질 강도',
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.supplyDisruptionIntensity} />
        ),
      },
      {
        field: 'supplyRecoveryPattern',
        headerName: '공급 회복 패턴',
        flex: 1,
        minWidth: 160,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.supplyRecoveryPattern} tooltipWhenTruncated />
        ),
      },
      {
        field: 'normalizationConfirmation',
        headerName: '정상화 확인',
        flex: 1,
        minWidth: 160,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.row.normalizationConfirmation} tooltipWhenTruncated />
        ),
      },
      {
        field: 'feasibility',
        headerName: '실행가능성',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenarioRow>) => (
          <ScenarioWorkbenchPossibilityDotsCell probability={params.row.feasibility} />
        ),
      },
    ],
    [onScenarioRowClick],
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py="30px">
        <EventDetailSectionHeader
          icon={<FormatListBulletedIcon sx={{ fontSize: 30, color: 'contentText.Normal' }} />}
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
    <Stack width="100%" gap="12px" py="30px">
      <EventDetailSectionHeader
        icon={<FormatListBulletedIcon sx={{ fontSize: 30, color: 'contentText.Normal' }} />}
        title="관련 시나리오"
        tooltipTitle=""
      />
      <Box bgcolor="gray.5" borderRadius="10px" p="24px">
        <Stack gap="8px" py="6px" mb="8px">
          <Typography variant="body2SB14" color="contentText.Normal" px="6px" lineHeight={1.4}>
            시나리오 그룹
          </Typography>
          <Typography variant="body1B16" color="contentText.Black" px="6px" lineHeight={1.4}>
            {relatedScenarioGroup?.groupName ?? '-'}
          </Typography>
        </Stack>
        <Box bgcolor="commonColor.White" border="1px solid" borderColor="contentBorder.Normal" borderRadius="10px" p="12px">
          <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <MIDataTableHeader<RelatedScenarioRow> columns={columns} />
            <MIDataTableBody<RelatedScenarioRow>
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
