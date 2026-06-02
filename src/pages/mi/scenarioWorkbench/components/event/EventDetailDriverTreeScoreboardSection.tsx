import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import { Box, Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import type { IScenarioWorkbenchEventDriverTreeScoreboardItem } from '@/service/mi/scenarioWorkbench/event'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailHorizontalScrollTableShell from '@/pages/mi/scenarioWorkbench/components/event/EventDetailHorizontalScrollTableShell'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

const columns: GridColDef<IScenarioWorkbenchEventDriverTreeScoreboardItem>[] = [
  {
    field: 'lv1Label',
    headerName: '분류',
    width: 100,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv1Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'lv2Label',
    headerName: 'Driver',
    width: 240,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv2Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'lv3Label',
    headerName: 'Sub Driver',
    width: 260,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv3Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'marketImpactLevel',
    headerName: '강도',
    width: 140,
    align: 'center',
    sortable: false,
    renderCell: (params) => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImpactDotsCell level={params.row.marketImpactLevel} direction={params.row.direction} />
      </Box>
    ),
  },
  {
    field: 'reason',
    headerName: '근거',
    width: 520,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.reason ?? '')} tooltipWhenTruncated />,
  },
]

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: IScenarioWorkbenchEventDriverTreeScoreboardItem[]
  loading?: boolean
}

const EventDetailDriverTreeScoreboardSection = ({
  driverTreeScoreboard = [],
  loading = false,
}: EventDetailDriverTreeScoreboardSectionProps) => (
  <Stack width="100%" gap="12px" py="30px">
    <EventDetailSectionHeader
      icon={<AccountTreeRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="Index Driver별 영향도 분석"
      tooltipTitle=""
    />
    <EventDetailHorizontalScrollTableShell>
      <MIDataTableHeader<IScenarioWorkbenchEventDriverTreeScoreboardItem>
        columns={columns}
        headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
        headerLabelColor="contentText.Black"
        enableHorizontalScroll
        rowHeader={{ colIndex: 0 }}
      />
      <MIDataTableBody<IScenarioWorkbenchEventDriverTreeScoreboardItem>
        getRowKey={(_row, index) => `driver-tree-${index}`}
        columns={columns}
        rows={driverTreeScoreboard}
        rowHeight={48}
        primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
        primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
        cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
        cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
        loading={loading}
        skeletonRowCount={5}
        noRowMessage="표시할 데이터가 없습니다."
        hideInnerRowBorder
        scroll={{
          overflowX: 'auto',
          type: 'floating',
          showThumbOnHover: true,
        }}
        rowHeader={{ colIndex: 0 }}
      />
    </EventDetailHorizontalScrollTableShell>
  </Stack>
)

export default EventDetailDriverTreeScoreboardSection
