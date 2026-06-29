import { Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioDimension, IScenarioGroupRef, IScenarioIndividualItem } from '@/service/mi/nextGenMI/scenarioGroup'

import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import { getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'

/** 시나리오 셀 상단 메타: 그룹명 칩 + 표시 순서 + (baseCase면 BC) + 생성일시 */
const GroupRefMeta = ({ group, displayOrder, baseCase }: { group: IScenarioGroupRef; displayOrder: number; baseCase: boolean }) => (
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
      borderColor="contentBorder.Normal"
      bgcolor="commonColor.White"
      maxWidth="220px"
      boxSizing="border-box"
    >
      <Typography
        component="span"
        color="contentText.Normal"
        noWrap
        sx={{ fontSize: '11px', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.22px' }}
      >
        {group.groupName}
      </Typography>
    </Stack>
    <NextGenMIDisplayOrderBadge
      value={displayOrder}
      height="20px"
      borderRadius="4px"
      border="0.5px solid"
      borderColor="contentBorder.Normal"
    />
    {baseCase && <NextGenMIBaseCaseChip />}
    <Typography color="contentText.Subtext" noWrap sx={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.22px' }}>
      {formatNextGenMIDateTime(group.createdAt)}
    </Typography>
  </Stack>
)

/** 주요 가정 strip: dimensions[]를 상단 label(11 SemiBold) / 하단 valueLabel(14 Medium) 2줄 좌측정렬 셀(160px)로 나열 */
const DimensionStrip = ({ dimensions }: { dimensions: IScenarioDimension[] }) => (
  <Stack direction="row" alignItems="center" width="max-content">
    {dimensions.map((dimension) => (
      <Stack key={dimension.key} width="160px" minWidth="160px" padding="0 6px">
        <Typography
          color="contentText.Normal"
          noWrap
          sx={{ width: '100%', fontSize: '11px', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.22px' }}
        >
          {dimension.label}
        </Typography>
        <Typography variant="body2M14" color="contentText.Black" noWrap sx={{ width: '100%' }}>
          {dimension.valueLabel?.trim() || '-'}
        </Typography>
      </Stack>
    ))}
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
        renderCell: ({ row }) => (
          <Stack gap="4px" minWidth={0}>
            <GroupRefMeta group={row.group} displayOrder={row.displayOrder} baseCase={row.baseCase} />
            <NextGenMIHoverLinkCell
              value={row.scenarioName}
              variant="body1SB16"
              onClick={() => navigate(getNextGenMIScenarioGroupDetailPath(row.group.scenarioGroupId, row.scenarioId))}
            />
          </Stack>
        ),
      },
      {
        field: 'assumptions',
        headerName: '주요 가정',
        width: 'max-content',
        minWidth: '240px',
        align: 'left',
        cellSx: { overflow: 'visible' },
        renderCell: ({ row }) => <DimensionStrip dimensions={row.dimensions} />,
      },
      {
        field: 'probability',
        headerName: '발생가능성',
        width: '100px',
        align: 'center',
        renderCell: ({ row }) => (
          <Stack width="100%" alignItems="center">
            <ScenarioPossibilityGauge probability={row.adjustedProbability ?? row.probability} />
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
