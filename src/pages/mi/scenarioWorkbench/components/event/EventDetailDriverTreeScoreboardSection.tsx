import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import { Box, Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'

import type { IScenarioWorkbenchEventDriverTreeScoreboardItem } from '@/service/mi/scenarioWorkbench/event'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

const columns: GridColDef<IScenarioWorkbenchEventDriverTreeScoreboardItem>[] = [
  {
    field: 'lv1Label',
    headerName: '분류',
    width: 140,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv1Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'lv2Label',
    headerName: 'Driver',
    flex: 1,
    minWidth: 160,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv2Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'lv3Label',
    headerName: 'Sub Driver',
    flex: 1,
    minWidth: 160,
    align: 'left',
    sortable: false,
    renderCell: (params) => <ScenarioWorkbenchEventDetailTableBodyText value={String(params.row.lv3Label ?? '')} tooltipWhenTruncated />,
  },
  {
    field: 'marketImpactLevel',
    headerName: '강도',
    width: 80,
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
    flex: 2,
    minWidth: 240,
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
  <Stack width="100%" gap="12px">
    <EventDetailSectionHeader
      icon={<AccountTreeRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="Driver Tree Scoreboard"
      tooltipTitle=""
    />
    <Stack>
      <ScenarioWorkbenchTableHeader<IScenarioWorkbenchEventDriverTreeScoreboardItem>
        columns={columns}
        headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
        headerLabelColor="contentText.Black"
      />
      <ScenarioWorkbenchDataList<IScenarioWorkbenchEventDriverTreeScoreboardItem>
        getRowKey={(_row, index) => `driver-tree-${index}`}
        columns={columns}
        rows={driverTreeScoreboard}
        rowHeight={44}
        cellPreset="miCanvasEvent"
        loading={loading}
        skeletonRowCount={5}
        noRowMessage="표시할 데이터가 없습니다."
        disableHover
        hideInnerRowBorder
        hideLastRowBorder
      />
    </Stack>
  </Stack>
)

export default EventDetailDriverTreeScoreboardSection
