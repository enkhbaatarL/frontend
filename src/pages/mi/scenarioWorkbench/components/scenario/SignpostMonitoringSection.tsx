import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import { SignpostItem } from '@/pages/mi/scenarioWorkbench/components/scenario/types'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

const columns: GridColDef<SignpostItem>[] = [
  {
    field: 'coreEvent',
    headerName: '핵심이벤트',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'currentStatus',
    headerName: '현재 상태 요약',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'marketImpactSummary',
    headerName: '시장 영향 해석',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'observationPoint',
    headerName: '관찰 포인트 (Trigger)',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'source',
    headerName: '출처',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
]

interface SignpostMonitoringSectionProps {
  signposts: SignpostItem[]
}

const SignpostMonitoringSection = ({ signposts }: SignpostMonitoringSectionProps) => (
  <Box sx={{ position: 'relative', paddingY: '24px' }}>
    <ScenarioWorkbenchTableHeader<SignpostItem> columns={columns} />
    <ScenarioWorkbenchDataList<SignpostItem>
      rowId="id"
      columns={columns}
      rows={signposts}
      rowHeight={42}
      cellPreset="miCanvasEvent"
      noRowMessage="데이터를 수집 중입니다."
    />
  </Box>
)

export default SignpostMonitoringSection
