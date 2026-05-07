import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import type {
  SignpostDefinition,
  SignpostDefinitionDirection,
  SignpostDefinitionImpactStrength,
} from '@/pages/mi/scenarioWorkbench/components/scenario/types'

import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

const SIGNPOST_DIRECTION_LABEL: Record<SignpostDefinitionDirection, string> = {
  up: '상승',
  down: '하락',
  flat: '보합',
}

const SIGNPOST_IMPACT_STRENGTH_LABEL: Record<SignpostDefinitionImpactStrength, string> = {
  strong: '강함',
  medium: '보통',
  weak: '약함',
}

const columns: GridColDef<SignpostDefinition>[] = [
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
    renderCell: (params) => {
      const v = params.value as SignpostDefinitionDirection | undefined
      return <ScenarioWorkbenchEventDetailTableBodyText value={v ? SIGNPOST_DIRECTION_LABEL[v] : ''} tooltipWhenTruncated />
    },
  },
  {
    field: 'impactStrength',
    headerName: '영향도',
    width: 100,
    renderCell: (params) => {
      const v = params.value as SignpostDefinitionImpactStrength | undefined
      return <ScenarioWorkbenchEventDetailTableBodyText value={v ? SIGNPOST_IMPACT_STRENGTH_LABEL[v] : ''} tooltipWhenTruncated />
    },
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
  definitions: SignpostDefinition[]
}

const SignpostDefinitionSection = ({ definitions }: SignpostDefinitionSectionProps) => (
  <Box sx={{ position: 'relative', paddingY: '24px' }}>
    <ScenarioWorkbenchTableHeader<SignpostDefinition> columns={columns} />
    <ScenarioWorkbenchDataList<SignpostDefinition>
      rowId="id"
      columns={columns}
      rows={definitions}
      rowHeight={60}
      cellPreset="miCanvasEvent"
      noRowMessage="데이터를 수집 중입니다."
    />
  </Box>
)

export default SignpostDefinitionSection
