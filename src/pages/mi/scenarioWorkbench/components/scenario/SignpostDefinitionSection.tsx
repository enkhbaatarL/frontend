import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import { marketDirectionToLabel, signpostStrengthToLabel } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { IScenarioSignpostDefinition } from '@/service/mi/scenarioWorkbench/scenario'

interface SignpostDefinitionRow extends IScenarioSignpostDefinition {
  id: number
}

const columns: GridColDef<SignpostDefinitionRow>[] = [
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

const SignpostDefinitionSection = ({ definitions, loading = false }: SignpostDefinitionSectionProps) => {
  const rows: SignpostDefinitionRow[] = definitions.map((d, idx) => ({ ...d, id: idx }))
  return (
    <Box sx={{ position: 'relative', paddingY: '24px' }}>
      <ScenarioWorkbenchTableHeader<SignpostDefinitionRow> columns={columns} />
      <ScenarioWorkbenchDataList<SignpostDefinitionRow>
        rowId="id"
        columns={columns}
        rows={rows}
        rowHeight={60}
        cellPreset="miCanvasEvent"
        loading={loading}
        skeletonRowCount={4}
        noRowMessage="데이터를 수집 중입니다."
      />
    </Box>
  )
}

export default SignpostDefinitionSection
