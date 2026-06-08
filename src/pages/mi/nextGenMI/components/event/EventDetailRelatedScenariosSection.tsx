import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import ListIcon from '@mui/icons-material/List'
import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { RelatedEventScenario, RelatedScenario } from '@/service/mi/nextGenMI/event'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIPossibilityDotsCell from '@/pages/mi/nextGenMI/components/common/NextGenMIPossibilityDotsCell'
import NextGenMITableBodyText, {
  NEXT_GEN_MI_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT,
  NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT,
  NEXT_GEN_MI_TABLE_CELL_PX,
  NEXT_GEN_MI_TABLE_HEADER_CELL_PY,
  NEXT_GEN_MI_TABLE_HEADER_LABEL_COLOR,
} from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import { getNextGenMITabPath, NEXT_GEN_MI_BASE_PATH } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

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
  const navigate = useNavigate()
  const rows = relatedEventScenario?.scenarios ?? []
  const scenarioGroupLabel = relatedEventScenario?.event?.eventName?.trim() ?? ''

  const hasScenarioGroupLink = scenarioGroupLabel.length > 0 && rows.length > 0
  const handleScenarioGroupClick = hasScenarioGroupLink
    ? () => {
      navigate(`${NEXT_GEN_MI_BASE_PATH}/scenarios/${encodeURIComponent(String(rows[0]!.scenarioId))}`)
    }
    : undefined

  const handleScenarioDesignClick = () => {
    navigate(getNextGenMITabPath('scenarios'))
  }

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
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => {
          if (!onScenarioRowClick) {
            return <NextGenMITableBodyText value={params.row.scenarioName} tooltipWhenTruncated />
          }

          return (
            <NextGenMIHoverLinkCell value={params.row.scenarioName} variant="body2SB14" onClick={() => onScenarioRowClick(params.row)} />
          )
        },
      },
      {
        field: 'period',
        headerName: '기간',
        flex: 1,
        minWidth: 100,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMITableBodyText value={params.row.period ?? ''} tooltipWhenTruncated />
        ),
      },
      {
        field: 'transportDisruption',
        headerName: '운송 차질',
        flex: 1,
        minWidth: 100,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMITableBodyText value={params.row.transportDisruption ?? ''} tooltipWhenTruncated />
        ),
      },
      {
        field: 'supplyDisruptionIntensity',
        headerName: '공급 차질 강도',
        flex: 1,
        minWidth: 120,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMITableBodyText value={params.row.supplyDisruptionIntensity ?? ''} tooltipWhenTruncated />
        ),
      },
      {
        field: 'supplyRecoveryPattern',
        headerName: '공급 회복 패턴',
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMITableBodyText value={params.row.supplyRecoveryPattern ?? ''} tooltipWhenTruncated />
        ),
      },
      {
        field: 'normalizationCheck',
        headerName: '정상화 확인',
        flex: 1,
        minWidth: 140,
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMITableBodyText value={params.row.normalizationCheck ?? ''} tooltipWhenTruncated />
        ),
      },
      {
        field: 'probability',
        headerName: '실행가능성',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<RelatedScenario>) => (
          <NextGenMIPossibilityDotsCell probability={params.row.probability} />
        ),
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
          <NextGenMIEventDetailBlockSkeleton height="280px" />
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
      {rows.length === 0 ? (
        <Box
          position="relative"
          height="260px"
          bgcolor="gray.5"
          borderRadius="10px"
          borderBottom="1px solid"
          borderColor="gray.30"
          overflow="hidden"
        >
          <Stack position="absolute" top="50%" left="50%" alignItems="center" gap="10px" sx={{ transform: 'translate(-50%, -50%)' }}>
            <ErrorOutlineRoundedIcon sx={{ fontSize: 24, color: 'gray.60' }} />
            <Typography variant="body3SB12" color="gray.60" lineHeight={1.4}>
              생성된 시나리오가 없습니다
            </Typography>
            <MIBaseButton
              variant="contained"
              prefix={<AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={handleScenarioDesignClick}
              sx={{ height: '36px', borderRadius: '8px', padding: '6px 10px' }}
            >
              시나리오 설계
            </MIBaseButton>
          </Stack>
        </Box>
      ) : (
        <Box bgcolor="gray.5" borderRadius="10px" p="24px">
          <Stack gap="8px" py="6px" mb="8px">
            <Typography variant="body2SB14" color="contentText.Normal" px="6px" lineHeight={1.4}>
              시나리오 그룹
            </Typography>
            {handleScenarioGroupClick ? (
              <Box px="6px" sx={{ width: 'fit-content', maxWidth: '100%' }}>
                <NextGenMIHoverLinkCell value={scenarioGroupLabel} variant="body1B16" onClick={handleScenarioGroupClick} />
              </Box>
            ) : (
              <Typography variant="body1B16" color="contentText.Black" px="6px" lineHeight={1.4}>
                {'-'}
              </Typography>
            )}
          </Stack>
          <Box bgcolor="commonColor.White" border="1px solid" borderColor="contentBorder.Normal" borderRadius="10px" p="12px">
            <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <MIDataTableHeader<RelatedScenario>
                columns={columns}
                headerCellPx={NEXT_GEN_MI_TABLE_CELL_PX}
                headerCellPy={NEXT_GEN_MI_TABLE_HEADER_CELL_PY}
                headerLabelColor={NEXT_GEN_MI_TABLE_HEADER_LABEL_COLOR}
              />
              <MIDataTableBody<RelatedScenario>
                rowId="scenarioId"
                columns={columns}
                rows={rows}
                rowHeight={48}
                loading={loading}
                noRowMessage="관련 시나리오가 없습니다."
                primitiveCellTypographyVariant={NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT}
                primitiveCellLineHeight={NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT}
                cellPx={NEXT_GEN_MI_TABLE_CELL_PX}
                cellPy={NEXT_GEN_MI_TABLE_BODY_CELL_PY}
                hideLastRowBorder={true}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

export default EventDetailRelatedScenariosSection
