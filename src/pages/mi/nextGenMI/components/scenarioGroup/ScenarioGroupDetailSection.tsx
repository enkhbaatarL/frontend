import { Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type {
  IScenarioDimension,
  IScenarioGroupDetailRow,
  IScenarioSignpostDefinition,
  IScenarioSignpostMonitoring,
} from '@/service/mi/nextGenMI/scenarioGroup'

import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import { probabilityToLikelihoodLabel } from '@/pages/mi/nextGenMI/utils/probabilityFormatting'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

interface ScenarioSelectSidebarProps {
  scenarios: IScenarioGroupDetailRow[]
  selectedScenarioId?: number
  loading?: boolean
  onSelect: (scenarioId: number) => void
}

const ScenarioSelectSidebar = ({ scenarios, selectedScenarioId, loading = false, onSelect }: ScenarioSelectSidebarProps) => (
  <Stack width="300px" flexShrink={0} gap="6px">
    {loading
      ? Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={`skeleton-${index}`} variant="rounded" height={48} sx={{ borderRadius: '10px' }} />
      ))
      : scenarios.map((scenario) => {
        const isSelected = scenario.scenarioId === selectedScenarioId
        return (
          <Stack
            key={scenario.scenarioId}
            role="button"
            tabIndex={0}
            direction="row"
            alignItems="center"
            gap="6px"
            height="48px"
            padding="10px 12px"
            borderRadius="10px"
            onClick={() => onSelect(scenario.scenarioId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(scenario.scenarioId)
              }
            }}
            sx={{
              boxSizing: 'border-box',
              cursor: 'pointer',
              bgcolor: isSelected ? 'contentBG.Active' : 'transparent',
              border: '1px solid',
              borderColor: isSelected ? 'contentBorder.Active' : 'transparent',
              transition: 'background-color 120ms ease, border-color 120ms ease',
              '&:hover': { bgcolor: isSelected ? 'contentBG.Active' : 'gray.10' },
            }}
          >
            {scenario.baseCase && <NextGenMIBaseCaseChip />}
            <Typography
              variant={isSelected ? 'body1SB16' : 'body1M16'}
              color={isSelected ? 'contentText.Black' : 'contentText.Normal'}
              noWrap
              title={scenario.scenarioName}
              sx={{ minWidth: 0 }}
            >
              {scenario.scenarioName}
            </Typography>
          </Stack>
        )
      })}
  </Stack>
)

interface ScenarioAssumptionCardsProps {
  dimensions: IScenarioDimension[]
  loading?: boolean
}

const ScenarioAssumptionCards = ({ dimensions, loading = false }: ScenarioAssumptionCardsProps) => {
  if (loading) {
    return (
      <Stack direction="row" gap="16px">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} variant="rounded" height={77} sx={{ flex: 1, minWidth: 0, borderRadius: '10px' }} />
        ))}
      </Stack>
    )
  }

  const rows: IScenarioDimension[][] = []
  for (let i = 0; i < dimensions.length; i += 3) {
    rows.push(dimensions.slice(i, i + 3))
  }

  return (
    <Stack gap="8px">
      {rows.map((row, rowIndex) => (
        <Stack key={`assumption-row-${rowIndex}`} direction="row" gap="8px">
          {row.map((dimension) => (
            <Stack
              key={dimension.key}
              flex={1}
              minWidth={0}
              height="77px"
              alignItems="center"
              justifyContent="center"
              padding="16px"
              bgcolor="gray.5"
              borderRadius="10px"
              boxSizing="border-box"
            >
              <Stack width="100%" padding="8px" gap="4px">
                <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6} noWrap title={dimension.label}>
                  {dimension.label}
                </Typography>
                <Typography color="contentText.Black" fontSize="15px" fontWeight={500} lineHeight={1.6}>
                  {dimension.valueLabel}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

const SIGNPOST_FIRST_HEADER_CELL_SX = {
  fontSize: '14px',
} as const

const RATIONALE_WRAP_CELL_SX = {
  whiteSpace: 'normal',
  wordBreak: 'break-word',
} as const

interface SignpostDefinitionTableProps {
  definitions: IScenarioSignpostDefinition[]
  loading?: boolean
}

const SignpostDefinitionTable = ({ definitions, loading = false }: SignpostDefinitionTableProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<IScenarioSignpostDefinition>[]>(
    () => [
      {
        field: 'label',
        headerName: 'Signpost Label',
        width: '400px',
        headerCellSx: SIGNPOST_FIRST_HEADER_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.label} color="contentText.Black" tooltipWhenTruncated />,
      },
      {
        field: 'directionLabel',
        headerName: '방향',
        width: '120px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <NextGenMITableBodyText value={row.directionLabel} color="contentText.Black" align="center" tooltipWhenTruncated />
        ),
      },
      {
        field: 'strength',
        headerName: '영향도',
        width: '120px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => <NextGenMITableBodyText value={`${row.strength}%`} color="contentText.Black" align="center" />,
      },
      {
        field: 'rationale',
        headerName: '핵심 근거',
        width: 'max-content',
        minWidth: '376px',
        cellSx: RATIONALE_WRAP_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.rationale} color="contentText.Black" sx={RATIONALE_WRAP_CELL_SX} />,
      },
    ],
    [],
  )

  return (
    <NextGenMIStickyTable<IScenarioSignpostDefinition>
      columns={columns}
      rows={definitions}
      getRowKey={(row, index) => `${row.label}-${index}`}
      headerFontSize="13px"
      rowHeight="40px"
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
      containerShell={false}
    />
  )
}

const formatProbabilityUpdate = (probability: number, delta: number) => {
  const sign = delta > 0 ? '+' : ''
  return `${probability}% (${sign}${delta}%)`
}

interface SignpostMonitoringTableProps {
  monitorings: IScenarioSignpostMonitoring[]
  loading?: boolean
}

const SignpostMonitoringTable = ({ monitorings, loading = false }: SignpostMonitoringTableProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<IScenarioSignpostMonitoring>[]>(
    () => [
      {
        field: 'updatedAt',
        headerName: '업데이트 일시',
        width: '100px',
        headerCellSx: SIGNPOST_FIRST_HEADER_CELL_SX,
        renderCell: ({ row }) => (
          <NextGenMITableBodyText value={formatNextGenMIDateTime(row.updatedAt, 'YYYY-MM-DD')} color="contentText.Black" />
        ),
      },
      {
        field: 'eventSummary',
        headerName: 'Signpost 이벤트 요약',
        width: '400px',
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.eventSummary} color="contentText.Black" tooltipWhenTruncated />,
      },
      {
        field: 'probability',
        headerName: '시나리오 확률 업데이트',
        width: '160px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <NextGenMITableBodyText
            value={formatProbabilityUpdate(row.probability, row.probabilityDelta)}
            color="contentText.Black"
            align="center"
          />
        ),
      },
      {
        field: 'rationale',
        headerName: '상세 내역 (Signpost 매칭 근거)',
        width: 'max-content',
        minWidth: '356px',
        cellSx: RATIONALE_WRAP_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.rationale} color="contentText.Black" sx={RATIONALE_WRAP_CELL_SX} />,
      },
    ],
    [],
  )

  return (
    <NextGenMIStickyTable<IScenarioSignpostMonitoring>
      columns={columns}
      rows={monitorings}
      getRowKey={(row, index) => `${row.updatedAt}-${index}`}
      headerFontSize="13px"
      rowHeight="40px"
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
      containerShell={false}
    />
  )
}

interface ScenarioGroupDetailSectionProps {
  scenarioGroupId: string
  scenarios: IScenarioGroupDetailRow[]
  selectedScenarioId?: number
  listLoading?: boolean
  onSelectScenario: (scenarioId: number) => void
}

const SubHeading = ({ label }: { label: string }) => (
  <Typography fontSize="18px" fontWeight={600} lineHeight={1.4} color="contentText.Black">
    {label}
  </Typography>
)

const ScenarioGroupDetailSection = ({
  scenarioGroupId,
  scenarios,
  selectedScenarioId,
  listLoading = false,
  onSelectScenario,
}: ScenarioGroupDetailSectionProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['nextGenMIScenarioGroupScenarioDetail', scenarioGroupId, selectedScenarioId],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioDetail(scenarioGroupId, selectedScenarioId ?? ''),
    enabled: Boolean(scenarioGroupId && selectedScenarioId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const detailLoading = isLoading || (Boolean(selectedScenarioId) && !data)

  return (
    <Stack direction="row" gap="24px" alignItems="flex-start">
      <ScenarioSelectSidebar
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        loading={listLoading}
        onSelect={onSelectScenario}
      />

      <Stack flex={1} minWidth={0} gap="24px">
        <Stack gap="6px" width="100%" pb="40px" sx={{ borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}>
          {detailLoading ? (
            <>
              <Skeleton variant="rounded" width={120} height={20} sx={{ borderRadius: '6px' }} />
              <Skeleton variant="rounded" width="min(480px, 80%)" height={32} sx={{ borderRadius: '6px' }} />
            </>
          ) : (
            <>
              <Typography fontSize="14px" fontWeight={500} color="contentText.Normal">
                Scenario
              </Typography>
              <Typography fontSize="22px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
                {data?.scenarioName ?? '-'}
              </Typography>
            </>
          )}
        </Stack>

        <Stack py="24px" gap="50px">
          <Stack direction="row" gap="24px" alignItems="stretch">
            <Stack flex={1} minWidth={0} gap="12px">
              <SubHeading label="시나리오 내러티브" />
              {detailLoading ? (
                <Skeleton variant="rounded" height={120} sx={{ borderRadius: '10px' }} />
              ) : (
                <Stack bgcolor="gray.5" borderRadius="10px" padding="16px">
                  <Typography variant="body1M16" color="contentText.Black" lineHeight={1.6} sx={{ whiteSpace: 'pre-line' }}>
                    {data?.narrative ?? '-'}
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Stack width="200px" flexShrink={0} gap="12px">
              <SubHeading label="시나리오 발생 확률" />
              {detailLoading ? (
                <Skeleton variant="rounded" sx={{ flex: 1, borderRadius: '10px' }} />
              ) : (
                <Stack flex={1} alignItems="flex-start" gap="4px" bgcolor="gray.5" borderRadius="10px" padding="20px 16px">
                  <ScenarioPossibilityGauge probability={data?.probability ?? 0} hideBackground />
                  <Typography fontSize="15px" fontWeight={500} lineHeight={1.6} color="contentText.Black">
                    {typeof data?.probability === 'number' ? probabilityToLikelihoodLabel(data.probability / 100) : '-'}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

          <Stack gap="12px">
            <SubHeading label="시나리오 주요 가정" />
            <ScenarioAssumptionCards dimensions={data?.dimensions ?? []} loading={detailLoading} />
          </Stack>

          <Stack gap="12px">
            <SubHeading label="Signpost 정의" />
            <SignpostDefinitionTable definitions={data?.signpostDefinitions ?? []} loading={detailLoading} />
          </Stack>

          <Stack gap="12px">
            <SubHeading label="Signpost 모니터링 현황" />
            <SignpostMonitoringTable monitorings={data?.signpostMonitorings ?? []} loading={detailLoading} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioGroupDetailSection
