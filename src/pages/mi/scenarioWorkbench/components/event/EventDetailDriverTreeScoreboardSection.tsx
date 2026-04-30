import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import EventDetailSectionHeader from './EventDetailSectionHeader'
import EventIndexImpactDirectionCell from './EventIndexImpactDirectionCell'

import type { EventMarketDirection, EventMarketImpactLevel } from './types'

import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'

/** Driver Tree Scoreboard 표 행 */
export interface EventDetailDriverTreeRow {
  id: string
  category: string
  driver: string
  strengthLevel: EventMarketImpactLevel
  strengthDirection: EventMarketDirection
  rationale: string
}

interface EventDetailDriverTreeScoreboardSectionProps {
  rows: EventDetailDriverTreeRow[]
}

/** Driver Tree Scoreboard 섹션 */
const EventDetailDriverTreeScoreboardSection = ({ rows }: EventDetailDriverTreeScoreboardSectionProps) => {
  const columns: GridColDef<EventDetailDriverTreeRow>[] = [
    {
      field: 'category',
      headerName: '분류',
      width: 84,
      align: 'center',
      renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => <MITableCell value={params.value as string} />,
    },
    {
      field: 'driver',
      headerName: 'Driver',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
        <MITableCell value={params.value as string} tooltipContent={params.value as string} />
      ),
    },
    {
      field: 'strengthLevel',
      headerName: '강도',
      width: 120,
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
        <MITableCell>
          <EventIndexImpactDirectionCell level={params.row.strengthLevel} direction={params.row.strengthDirection} />
        </MITableCell>
      ),
    },
    {
      field: 'rationale',
      headerName: '근거',
      flex: 1,
      minWidth: 280,
      renderCell: (params: GridRenderCellParams<EventDetailDriverTreeRow>) => (
        <MITableCell value={params.value as string} tooltipContent={params.value as string} />
      ),
    },
  ]

  return (
    <Stack width="100%" py={7.5} gap={3} id="event-detail-section-driver-tree">
      <EventDetailSectionHeader
        icon={<AccountTreeIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
        title="Driver Tree Scoreboard"
        tooltipTitle="이벤트의 주요 드라이버를 분류별로 정리합니다."
      />
      <Box overflow="hidden">
        <Box>
          {rows.length === 0 ? (
            <Typography fontSize={14} fontWeight={500} color="contentText.Subtext" px={1.5} py={2}>
              표시할 데이터가 없습니다.
            </Typography>
          ) : (
            <MITable<EventDetailDriverTreeRow> columns={columns} rows={rows} rowId="id" rowHeight={50} hideFooter disableHover />
          )}
        </Box>
      </Box>
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
