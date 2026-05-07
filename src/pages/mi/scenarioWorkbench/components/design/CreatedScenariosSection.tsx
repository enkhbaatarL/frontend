import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, Stack, Typography } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { useCallback, useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { SCENARIO_WORKBENCH_BASE_PATH } from '../../scenarioWorkbenchRoutes'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

export interface CreatedScenarioRow {
  id: number
  name: string
  date: string
  tags: string[]
  isCurrent?: boolean
  type?: 'BC' | 'NOISE'
  jkm: number
  ttf: number
  hh: number
  probability: number
}

interface CreatedScenariosSectionProps {
  scenarios: CreatedScenarioRow[]
  onScenarioDetailClick?: (row: CreatedScenarioRow) => void
}

const ScenarioTypeChip = ({ type }: { type: 'BC' | 'NOISE' }) => (
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

const CreatedScenariosSection = ({ scenarios }: CreatedScenariosSectionProps) => {
  const navigate = useNavigate()

  const onScenarioDetailClick = useCallback(
    (row: CreatedScenarioRow) => {
      navigate(`${SCENARIO_WORKBENCH_BASE_PATH}/scenarios/${encodeURIComponent(String(row.id))}`)
    },
    [navigate],
  )

  const columns = useMemo<GridColDef<CreatedScenarioRow>[]>(
    () => [
      {
        field: 'name',
        headerName: '시나리오',
        flex: 1,
        minWidth: 630,
        sortable: false,
        renderCell: (params: GridRenderCellParams<CreatedScenarioRow>) => (
          <Stack gap="4px" sx={{ py: '6px', minWidth: 0, width: '100%' }}>
            <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0 }}>
              <ScenarioWorkbenchEventDetailTableBodyText
                value={params.row.name}
                variant="body1M16"
                tooltipWhenTruncated
                sx={{ flex: '0 1 auto', width: 'auto', minWidth: 0 }}
              />
              {params.row.isCurrent && params.row.type && (
                <Box sx={{ flex: '0 0 auto' }}>
                  <ScenarioTypeChip type={params.row.type} />
                </Box>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
              <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
                {params.row.date}
              </Typography>
              {params.row.tags.length > 0 && (
                <Typography variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
                  |
                </Typography>
              )}
              {params.row.tags.map((tag, i) => (
                <Typography key={`${tag}-${i}`} variant="body3M12" sx={{ color: 'contentText.Subtext', lineHeight: 1.4 }}>
                  #{tag}
                </Typography>
              ))}
            </Stack>
          </Stack>
        ),
      },
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.jkm} size={7} />,
      },
      {
        field: 'ttf',
        headerName: 'TTF',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.ttf} size={7} />,
      },
      {
        field: 'hh',
        headerName: 'HH',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.hh} size={7} />,
      },
      {
        field: 'probability',
        headerName: '가능성',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ProbabilityGaugeCell level={params.row.probability} />,
      },
      {
        field: 'detail',
        headerName: '상세',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <DetailIconButton disabled={!onScenarioDetailClick} onClick={() => onScenarioDetailClick?.(params.row)} />,
      },
    ],
    [onScenarioDetailClick],
  )

  return (
    <Box sx={{ px: '24px', pb: '70px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      <ScenarioWorkbenchTableHeader<CreatedScenarioRow> columns={columns} headerCellPx="12px" headerCellPy="8px" />
      <ScenarioWorkbenchDataList<CreatedScenarioRow>
        rowId="id"
        columns={columns}
        rows={scenarios}
        rowHeight={56}
        noRowMessage="생성된 시나리오가 없습니다."
      />
    </Box>
  )
}

export default CreatedScenariosSection
