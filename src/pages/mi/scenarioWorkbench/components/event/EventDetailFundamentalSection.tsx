import ContentPasteSearchOutlinedIcon from '@mui/icons-material/ContentPasteSearchOutlined'
import { Stack } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { useMemo } from 'react'

import type {
  EventDetailFundamentalIndicatorRow,
  EventDetailFundamentalMetricRow,
} from '@/pages/mi/scenarioWorkbench/components/event/types'

import ScenarioWorkbenchEventDetailTableBodyText, {
  SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'

/** Fundamental Deep-dive 섹션 Props */
interface EventDetailFundamentalSectionProps {
  metricRows: EventDetailFundamentalMetricRow[]
  indicatorRows: EventDetailFundamentalIndicatorRow[]
}

/** Fundamental Deep-dive 표 행(퍼블리싱) */
interface EventDetailFundamentalItemRow {
  id: string
  item: string
}

/** Fundamental Deep-dive — 항목 1열 리스트(퍼블리싱) */
const EventDetailFundamentalSection = ({ metricRows, indicatorRows }: EventDetailFundamentalSectionProps) => {
  /** API 연동 전 기본 항목 목록 */
  const fallbackItems = ['EU 총 저장 용량', 'EU 평균 재고율', '독일 재고율', '이탈리아 재고율', '4월 초 예상 재고율']

  const columns: GridColDef<EventDetailFundamentalItemRow>[] = useMemo(
    () => [
      {
        field: 'item',
        headerName: '항목',
        flex: 1,
        minWidth: 240,
        align: 'left',
        sortable: false,
        renderCell: (params: GridRenderCellParams<EventDetailFundamentalItemRow>) => (
          <ScenarioWorkbenchEventDetailTableBodyText value={params.value as string} tooltipWhenTruncated sx={{ fontWeight: 500 }} />
        ),
      },
    ],
    [],
  )

  const metricList = metricRows.map((r) => ({ id: r.id, item: r.item })).filter((r) => Boolean(r.item))
  const indicatorList = indicatorRows.map((r) => ({ id: r.id, item: r.indicator })).filter((r) => Boolean(r.item))
  const rows: EventDetailFundamentalItemRow[] =
    metricList.length > 0
      ? (metricList as EventDetailFundamentalItemRow[])
      : indicatorList.length > 0
        ? (indicatorList as EventDetailFundamentalItemRow[])
        : fallbackItems.map((item) => ({ id: item, item }))

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
        tooltipTitle="펀더멘털 지표와 해석입니다."
      />
      <Stack>
        <ScenarioWorkbenchTableHeader<EventDetailFundamentalItemRow>
          columns={columns}
          headerCellPy={SCENARIO_WORKBENCH_EVENT_DETAIL_TABLE_HEADER_CELL_PY}
          headerLabelColor="contentText.Black"
        />
        <ScenarioWorkbenchDataList<EventDetailFundamentalItemRow>
          rowId="id"
          columns={columns}
          rows={rows}
          rowHeight={44}
          cellPreset="miCanvasEvent"
          noRowMessage="표시할 데이터가 없습니다."
        />
      </Stack>
    </Stack>
  )
}

export default EventDetailFundamentalSection
