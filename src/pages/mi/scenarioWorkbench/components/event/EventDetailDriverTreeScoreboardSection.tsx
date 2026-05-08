import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import { Box, Stack } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type { MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'

import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

/** Driver Tree Scoreboard 표 행 */
export interface EventDetailDriverTreeRow {
  id: string
  category: string
  driver: string
  strengthLevel: MarketImpactLevel
  strengthDirection?: MarketDirection
  rationale: string
}

interface EventDetailDriverTreeScoreboardSectionProps {
  rows: EventDetailDriverTreeRow[]
}

/** Driver Tree Scoreboard 섹션 */
const EventDetailDriverTreeScoreboardSection = ({ rows }: EventDetailDriverTreeScoreboardSectionProps) => {
  const columns: GridColDef<EventDetailDriverTreeRow>[] = useMemo(
    () => [
      {
        field: 'category',
        headerName: '분류',
        width: 100,
        align: 'left',
        sortable: false,
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 1,
        minWidth: 160,
        align: 'left',
        sortable: false,
        renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.value as string} tooltipWhenTruncated />
        ),
      },
      {
        field: 'strengthLevel',
        headerName: '강도',
        width: 80,
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImpactDotsCell level={params.row.strengthLevel} direction={params.row.strengthDirection} />
          </Box>
        ),
      },
      {
        field: 'rationale',
        headerName: '근거',
        flex: 1,
        minWidth: 200,
        align: 'left',
        sortable: false,
        renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.value as string} tooltipWhenTruncated />
        ),
      },
    ],
    [],
  )

  return (
    <Stack width="100%" gap={6}>
      <EventDetailSectionHeader
        icon={<AccountTreeRoundedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="Driver Tree Scoreboard"
        tooltipTitle="이벤트의 주요 드라이버를 분류별로 정리합니다."
      />
      <Stack>
        <ScenarioWorkbenchTableHeader<EventDetailDriverTreeRow>
          columns={columns}
          headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
          headerLabelColor="contentText.Black"
        />
        <ScenarioWorkbenchDataList<EventDetailDriverTreeRow>
          rowId="id"
          columns={columns}
          rows={rows}
          rowHeight={44}
          cellPreset="miCanvasEvent"
          noRowMessage="표시할 데이터가 없습니다."
          disableHover
          hideInnerRowBorder
          hideLastRowBorder
        />
      </Stack>
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
