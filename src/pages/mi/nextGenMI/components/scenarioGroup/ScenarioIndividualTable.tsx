import { Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  IScenarioDimension,
  IScenarioGroupRef,
  IScenarioIndividualItem,
  ScenarioJudgementStatus,
} from '@/service/mi/nextGenMI/scenarioGroup'

import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import ScenarioRoleBadge from '@/pages/mi/nextGenMI/components/common/ScenarioRoleBadge'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

const isDiscardedScenario = (status?: ScenarioJudgementStatus) => status === 'discarded'
const isRealizedScenario = (status?: ScenarioJudgementStatus) => status === 'realized'

const ScenarioStatusBadge = ({ status, label }: { status: ScenarioJudgementStatus; label?: string }) => {
  if (!isDiscardedScenario(status) && !isRealizedScenario(status)) return null

  return (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      height="20px"
      padding="1px 4px"
      borderRadius="8px"
      bgcolor="contentBG.Disabled"
      boxSizing="border-box"
      flexShrink={0}
    >
      <Typography
        component="span"
        color={isRealizedScenario(status) ? 'mari.Primary' : 'contentText.Disabled'}
        fontSize="12px"
        fontWeight={600}
        lineHeight={1.4}
        noWrap
      >
        {label?.trim() || (isRealizedScenario(status) ? '실현' : '폐기')}
      </Typography>
    </Stack>
  )
}

/** 시나리오 셀 상단 메타: 그룹명 칩 + 표시 순서 + (baseCase면 BC) + 생성일시 */
const GroupRefMeta = ({
  group,
  displayOrder,
  baseCase,
  disabled = false,
}: {
  group: IScenarioGroupRef
  displayOrder: number
  baseCase: boolean
  disabled?: boolean
}) => (
  <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      justifyContent="center"
      height="20px"
      padding="2px 4px"
      borderRadius="4px"
      border="0.5px solid"
      borderColor={disabled ? 'contentBorder.Disabled' : 'contentBorder.Normal'}
      bgcolor="commonColor.White"
      maxWidth="200px"
      boxSizing="border-box"
    >
      <NextGenMITableBodyText
        value={group.groupName}
        component="span"
        color={disabled ? 'contentText.Disabled' : 'contentText.Normal'}
        tooltipWhenTruncated
        sx={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.22px' }}
      />
    </Stack>
    <NextGenMIDisplayOrderBadge
      value={displayOrder}
      height="20px"
      borderRadius="4px"
      border="0.5px solid"
      borderColor="contentBorder.Normal"
      disabled={disabled}
    />
    {baseCase && <NextGenMIBaseCaseChip disabled={disabled} borderRadius="4px" />}
    <Typography
      color={disabled ? 'contentText.Disabled' : 'contentText.Subtext'}
      noWrap
      sx={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.22px', px: '4px' }}
    >
      {formatNextGenMIDateTime(group.createdAt)}
    </Typography>
  </Stack>
)

/** 주요 가정 strip: dimensions[]를 상단 label(11 SemiBold) / 하단 valueLabel(14 Medium) 2줄 좌측정렬 셀(160px)로 나열 */
const DimensionStrip = ({ dimensions, disabled = false }: { dimensions: IScenarioDimension[]; disabled?: boolean }) => (
  <Stack direction="row" alignItems="center" width="max-content">
    {dimensions.map((dimension) => {
      const rationale = dimension.rationale?.trim()
      const value = (
        <NextGenMITableBodyText
          value={dimension.valueLabel?.trim() || '-'}
          variant="body2M14"
          color={disabled ? 'contentText.Disabled' : 'contentText.Black'}
          tooltipWhenTruncated={!rationale}
          sx={{ width: '100%' }}
        />
      )

      return (
        <Stack key={dimension.key} width="160px" minWidth="160px" padding="0 6px">
          <NextGenMITableBodyText
            value={dimension.label}
            color={disabled ? 'contentText.Disabled' : 'contentText.Normal'}
            tooltipWhenTruncated
            sx={{ width: '100%', fontSize: '11px', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.22px' }}
          />
          {rationale ? <NextGenMIFollowCursorTooltip title={rationale}>{value}</NextGenMIFollowCursorTooltip> : value}
        </Stack>
      )
    })}
  </Stack>
)

interface ScenarioIndividualTableProps {
  scenarios: IScenarioIndividualItem[]
  loading: boolean
  skeletonRowCount: number
}

const ScenarioIndividualTable = ({ scenarios, loading, skeletonRowCount }: ScenarioIndividualTableProps) => {
  const navigate = useNavigate()
  const columns = useMemo<NextGenMIStickyTableColumn<IScenarioIndividualItem>[]>(
    () => [
      {
        field: 'scenario',
        headerName: '시나리오',
        width: '360px',
        align: 'left',
        renderCell: ({ row }) => {
          const discarded = isDiscardedScenario(row.status)

          return (
            <Stack gap="4px" minWidth={0}>
              <GroupRefMeta group={row.group} displayOrder={row.displayOrder} baseCase={row.baseCase} disabled={discarded} />
              <Stack direction="row" alignItems="center" gap="4px" width="100%" minWidth={0} maxWidth="100%">
                <ScenarioRoleBadge role={row.scenarioRole} type={row.scenarioType} label={row.scenarioRoleLabel} />
                <ScenarioStatusBadge status={row.status} label={row.statusLabel} />
                {discarded ? (
                  <NextGenMITableBodyText
                    value={row.scenarioName}
                    variant="body1SB16"
                    color="contentText.Disabled"
                    tooltipWhenTruncated
                    sx={{ flex: '1 1 auto' }}
                  />
                ) : (
                  <Stack minWidth={0} flex="1 1 auto">
                    <NextGenMIHoverLinkCell
                      value={row.scenarioName}
                      variant="body1SB16"
                      onClick={() => navigate(getNextGenMIScenarioGroupDetailPath(row.group.scenarioGroupId, row.scenarioId))}
                    />
                  </Stack>
                )}
              </Stack>
            </Stack>
          )
        },
      },
      {
        field: 'assumptions',
        headerName: '주요 가정',
        width: 'max-content',
        minWidth: '240px',
        align: 'left',
        cellSx: { overflow: 'visible' },
        renderCell: ({ row }) => <DimensionStrip dimensions={row.dimensions} disabled={isDiscardedScenario(row.status)} />,
      },
      {
        field: 'probability',
        headerName: '발생가능성',
        width: '100px',
        align: 'center',
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center">
            <ScenarioPossibilityGauge probability={row.adjustedProbability ?? row.probability} disabled={isDiscardedScenario(row.status)} />
          </Stack>
        ),
      },
    ],
    [navigate],
  )

  return (
    <NextGenMIStickyTable<IScenarioIndividualItem>
      columns={columns}
      rows={scenarios}
      getRowKey={(row) => row.scenarioId}
      fixedLeftColumnIndexes={[0]}
      fixedRightColumnIndexes={[-1]}
      leftAlignedHeaderSticky
      loading={loading}
      skeletonRowCount={skeletonRowCount}
      noRowMessage="조건에 맞는 시나리오가 없습니다."
      rowHeight="60px"
      containerShell={false}
    />
  )
}

export default ScenarioIndividualTable
