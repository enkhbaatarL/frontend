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
import { marketDirectionToLabel, signpostStrengthToLabel } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import { IScenarioSignpostDefinition } from '@/service/mi/nextGenMI/scenario'

const columns: GridColDef<IScenarioSignpostDefinition>[] = [
  {
    field: 'category',
    headerName: '분류',
    width: 120,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'label',
    headerName: 'Signpost Label',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => <NextGenMITableBodyText value={String(params.value ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'direction',
    headerName: '방향',
    width: 100,
    renderCell: (params) => <NextGenMITableBodyText value={marketDirectionToLabel(params.row.direction)} tooltipWhenTruncated />,
  },
  {
    field: 'impactLevel',
    headerName: '영향도',
    width: 100,
    renderCell: (params) => <NextGenMITableBodyText value={signpostStrengthToLabel(params.row.signpostImpactLevel)} tooltipWhenTruncated />,
  },
  {
    field: 'rationale',
    headerName: '핵심 근거',
    flex: 1,
    minWidth: 180,
    renderCell: (params) => (
      <NextGenMITableBodyText
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

export default SignpostDefinitionSection
