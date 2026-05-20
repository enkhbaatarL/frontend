import ContentPasteSearchOutlinedIcon from '@mui/icons-material/ContentPasteSearchOutlined'
import { Stack } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type { IScenarioWorkbenchFundamentalIndicator, IScenarioWorkbenchFundamentalMetric } from '@/service/mi/scenarioWorkbench/event'

import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX,
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

/** Fundamental Deep-dive 섹션 Props */
interface EventDetailFundamentalSectionProps {
  metrics: IScenarioWorkbenchFundamentalMetric[]
  indicators: IScenarioWorkbenchFundamentalIndicator[]
}

type EventDetailFundamentalItem = IScenarioWorkbenchFundamentalMetric | IScenarioWorkbenchFundamentalIndicator

/** Fundamental Deep-dive — 항목 리스트 섹션 */
const EventDetailFundamentalSection = ({ metrics, indicators }: EventDetailFundamentalSectionProps) => {
  const columns: GridColDef<EventDetailFundamentalItem>[] = useMemo(
    () => [
      {
        field: 'item',
        headerName: '항목',
        flex: 1,
        minWidth: 240,
        align: 'left',
        sortable: false,
        renderCell: (params: GridRenderCellParams<EventDetailFundamentalItem>) => {
          const value = 'metricName' in params.row ? params.row.metricName : params.row.indicatorName
          return <ScenarioWorkbenchEventDetailTableBodyText value={value} tooltipWhenTruncated sx={{ fontWeight: 500 }} />
        },
      },
    ],
    [],
  )

  const rows = metrics.length > 0 ? metrics : indicators

  return (
    <Stack
      width="100%"
      gap={6}
      sx={{
        bgcolor: 'common.white',
        borderBottom: '1px solid',
        borderColor: 'contentBorder.Normal',
        py: '30px',
      }}
    >
      <EventDetailSectionHeader
        icon={<ContentPasteSearchOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="Fundamental Deep-dive"
        tooltipTitle=""
      />
      <Stack>
        <MIDataTableHeader<EventDetailFundamentalItem>
          columns={columns}
          headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
          headerLabelColor="contentText.Black"
        />
        <MIDataTableBody<EventDetailFundamentalItem>
          getRowKey={(row) => ('metricName' in row ? row.metricName : row.indicatorName)}
          columns={columns}
          rows={rows}
          rowHeight={44}
          primitiveCellTypographyVariant={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_TEXT_VARIANT}
          primitiveCellLineHeight={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_LINE_HEIGHT}
          cellPx={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_CELL_PX}
          cellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_BODY_CELL_PY}
          noRowMessage="표시할 데이터가 없습니다."
          hideInnerRowBorder
          hideLastRowBorder
        />
      </Stack>
    </Stack>
  )
}

export default EventDetailFundamentalSection
