import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { IScenarioSignpost } from '@/service/mi/scenarioWorkbench/scenario'

interface SignpostRow extends IScenarioSignpost {
  id: number
}

const columns: GridColDef<SignpostRow>[] = [
  {
    field: 'keyEvent',
    headerName: '핵심이벤트',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'currentStatusSummary',
    headerName: '현재 상태 요약',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'marketImpactInterpretation',
    headerName: '시장 영향 해석',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'observationTrigger',
    headerName: '관찰 포인트 (Trigger)',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'sources',
    headerName: '출처',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => (
      <ScenarioWorkbenchEventDetailTableBodyText value={(params.row.sources ?? []).join(', ')} tooltipWhenTruncated />
    ),
  },
]

interface SignpostMonitoringSectionProps {
  signposts: IScenarioSignpost[]
  loading?: boolean
}

const SignpostMonitoringSection = ({ signposts, loading = false }: SignpostMonitoringSectionProps) => {
  const rows: SignpostRow[] = signposts.map((s, idx) => ({ ...s, id: idx }))
  return (
    <Box sx={{ position: 'relative', paddingY: '24px' }}>
      <ScenarioWorkbenchTableHeader<SignpostRow> columns={columns} />
      <ScenarioWorkbenchDataList<SignpostRow>
        rowId="id"
        columns={columns}
        rows={rows}
        rowHeight={42}
        cellPreset="miCanvasEvent"
        loading={loading}
        skeletonRowCount={4}
        noRowMessage="데이터를 수집 중입니다."
      />
    </Box>
  )
}

export default SignpostMonitoringSection
