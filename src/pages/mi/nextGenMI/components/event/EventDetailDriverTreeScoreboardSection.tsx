import MarginRoundedIcon from '@mui/icons-material/MarginRounded'
import { Stack } from '@mui/material'
import { useMemo } from 'react'

import type { INextGenMIEventDriverTreeScoreboardItem } from '@/service/mi/nextGenMI/event'

import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

const getIndexName = (row: INextGenMIEventDriverTreeScoreboardItem) => String(row.indexName ?? '').trim()

const shouldShowIndexCell = (rows: INextGenMIEventDriverTreeScoreboardItem[], rowIndex: number) => {
  const currentRow = rows.at(rowIndex)
  if (!currentRow) return false
  const indexName = getIndexName(currentRow)
  if (!indexName) return true
  if (rowIndex === 0) return true
  const prevRow = rows.at(rowIndex - 1)
  return !prevRow || getIndexName(prevRow) !== indexName
}

const getIndexCellRowSpan = (rows: INextGenMIEventDriverTreeScoreboardItem[], rowIndex: number) => {
  const currentRow = rows.at(rowIndex)
  if (!currentRow) return 1
  const indexName = getIndexName(currentRow)
  if (!indexName) return 1

  let rowSpan = 1
  for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
    const nextRow = rows.at(nextIndex)
    if (!nextRow || getIndexName(nextRow) !== indexName) break
    rowSpan += 1
  }
  return rowSpan
}

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: INextGenMIEventDriverTreeScoreboardItem[]
}

const EventDetailDriverTreeScoreboardSection = ({ driverTreeScoreboard = [] }: EventDetailDriverTreeScoreboardSectionProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<INextGenMIEventDriverTreeScoreboardItem>[]>(
    () => [
      {
        field: 'indexName',
        headerName: '대상',
        width: '80px',
        renderCell: ({ row }) => getIndexName(row) || '-',
        shouldRenderCell: ({ rowIndex }) => shouldShowIndexCell(driverTreeScoreboard, rowIndex),
        getRowSpan: ({ rowIndex }) => getIndexCellRowSpan(driverTreeScoreboard, rowIndex),
        cellSx: {
          fontWeight: 600,
        },
      },
      {
        field: 'lv1Label',
        headerName: 'Driver Lv1',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => String(row.lv1Label ?? ''),
      },
      {
        field: 'lv2Label',
        headerName: 'Driver Lv2',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => String(row.lv2Label ?? ''),
      },
      {
        field: 'lv3Label',
        headerName: 'Driver Lv3',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => String(row.lv3Label ?? ''),
      },
      {
        field: 'marketImpactLevel',
        headerName: '단기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => {
          const indexName = getIndexName(row)
          return (
            <Stack direction="row" justifyContent="center">
              <EventIndexSignalCell
                indexLabel={indexName}
                level={row.marketImpactLevel}
                direction={row.direction}
                term="short"
                showTermBadge={false}
                size={20}
              />
            </Stack>
          )
        },
      },
      {
        field: 'midLongTermImpactLevel',
        headerName: '중장기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => {
          const indexName = getIndexName(row)
          return (
            <Stack direction="row" justifyContent="center">
              <EventIndexSignalCell
                indexLabel={indexName}
                level={row.midLongTermImpactLevel}
                direction={row.midLongTermDirection}
                term="long"
                showTermBadge={false}
                size={20}
              />
            </Stack>
          )
        },
      },
      {
        field: 'reason',
        headerName: '근거',
        width: 'max-content',
        minWidth: '520px',
        maxWidth: 'none',
        renderCell: ({ row }) => String(row.reason ?? ''),
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [driverTreeScoreboard],
  )

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<MarginRoundedIcon sx={{ fontSize: '26px', color: 'contentText.Normal' }} />}
        title="Index Driver별 영향도 분석"
        tooltipTitle=""
      />
      <NextGenMIStickyTable
        columns={columns}
        rows={driverTreeScoreboard}
        getRowKey={(row, rowIndex) => `${getIndexName(row) || 'no-index'}-${rowIndex}`}
        fixedColumnIndexes={[0]}
        maxHeight="min(520px, calc(100vh - 320px))"
      />
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
