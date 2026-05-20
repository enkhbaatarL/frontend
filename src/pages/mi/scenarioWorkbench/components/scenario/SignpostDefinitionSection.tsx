import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { marketDirectionToLabel, signpostStrengthToLabel } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import { IScenarioSignpostDefinition } from '@/service/mi/scenarioWorkbench/scenario'

const columns: GridColDef<IScenarioSignpostDefinition>[] = [
  {
    field: 'category',
    headerName: '분류',
    width: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'label',
    headerName: 'Label',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'direction',
    headerName: '방향',
    width: 100,
    renderCell: (params) => (
      <ScenarioWorkbenchEventDetailTableBodyText value={marketDirectionToLabel(params.row.direction)} tooltipWhenTruncated />
    ),
  },
  {
    field: 'impactLevel',
    headerName: '영향도',
    width: 100,
    renderCell: (params) => (
      <ScenarioWorkbenchEventDetailTableBodyText value={signpostStrengthToLabel(params.row.signpostImpactLevel)} tooltipWhenTruncated />
    ),
  },
  {
    field: 'rationale',
    headerName: '핵심 근거',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => (
      <ScenarioWorkbenchEventDetailTableBodyText
        value={String(params.value ?? '')}
        tooltipWhenTruncated
        sx={{
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      />
    ),
  },
]

interface SignpostDefinitionSectionProps {
  definitions: IScenarioSignpostDefinition[]
  loading?: boolean
}

const SignpostDefinitionSection = ({ definitions, loading = false }: SignpostDefinitionSectionProps) => (
  <Box sx={{ position: 'relative', paddingY: '24px' }}>
    <MIDataTableHeader<IScenarioSignpostDefinition> columns={columns} />
    <MIDataTableBody<IScenarioSignpostDefinition>
      getRowKey={(row, index) => `${row.category}-${row.label}-${index}`}
      columns={columns}
      rows={definitions}
      rowHeight={60}
      primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
      primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
      cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
      cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
    />
  </Box>
)

export default SignpostDefinitionSection
