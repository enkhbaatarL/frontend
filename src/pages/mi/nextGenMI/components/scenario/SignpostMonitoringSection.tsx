import { Box } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import NextGenMITableBodyText, {
  NEXT_GEN_MI_TABLE_BODY_CELL_PY,
  NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT,
  NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT,
  NEXT_GEN_MI_TABLE_CELL_PX,
} from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { IScenarioSignpost } from '@/service/mi/nextGenMI/scenario'

const columns: GridColDef<IScenarioSignpost>[] = [
  {
    field: 'keyEvent',
    headerName: 'Signpost 이벤트 요약',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'currentStatusSummary',
    headerName: '현재 상태 요약',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'marketImpactInterpretation',
    headerName: '시장 영향 해석',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'observationTrigger',
    headerName: '관찰 포인트 (Trigger)',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'sources',
    headerName: '출처',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => <NextGenMITableBodyText value={(params.row.sources ?? []).join(', ')} tooltipWhenTruncated />,
  },
]

interface SignpostMonitoringSectionProps {
  signposts: IScenarioSignpost[]
  loading?: boolean
}

const SignpostMonitoringSection = ({ signposts, loading = false }: SignpostMonitoringSectionProps) => (
  <Box sx={{ position: 'relative', paddingY: '24px' }}>
    <MIDataTableHeader<IScenarioSignpost> columns={columns} />
    <MIDataTableBody<IScenarioSignpost>
      getRowKey={(row, index) => `${row.keyEvent}-${index}`}
      columns={columns}
      rows={signposts}
      rowHeight={42}
      primitiveCellTypographyVariant={NEXT_GEN_MI_TABLE_BODY_TEXT_VARIANT}
      primitiveCellLineHeight={NEXT_GEN_MI_TABLE_BODY_LINE_HEIGHT}
      cellPx={NEXT_GEN_MI_TABLE_CELL_PX}
      cellPy={NEXT_GEN_MI_TABLE_BODY_CELL_PY}
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
    />
  </Box>
)

export default SignpostMonitoringSection
