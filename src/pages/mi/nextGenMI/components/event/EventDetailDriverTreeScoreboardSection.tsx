import MarginRoundedIcon from '@mui/icons-material/MarginRounded'
import { Stack } from '@mui/material'
import { useMemo } from 'react'

import type { DriverTreeScoreboard, EventDriverTreeIndex, EventImpactIndexTerm } from '@/service/mi/nextGenMI/event'

import NextGenMIEventDetailBlockSkeleton from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailBlockSkeleton'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

const getIndexName = (row: EventDriverTreeIndex) => String(row.indexName ?? '').trim()

const getDrivers = (row: EventDriverTreeIndex) => row.drivers ?? []

interface EventDriverTreeScoreboardTableRow {
  indexName: string
  driver?: DriverTreeScoreboard
  indexRowSpan: number
  isFirstIndexRow: boolean
}

const renderDriverImpactList = (
  indexName: string,
  driver: DriverTreeScoreboard | undefined,
  getValue: (driver: DriverTreeScoreboard) => EventImpactIndexTerm | null | undefined,
  term: 'short' | 'long',
) => {
  const impact = driver ? getValue(driver) : undefined

  return (
    <Stack direction="row" justifyContent="center">
      <EventIndexSignalCell
        indexLabel={indexName || undefined}
        level={impact?.marketImpactLevel}
        levelLabel={impact?.marketImpactLevelLabel}
        direction={impact?.direction}
        directionLabel={impact?.directionLabel}
        term={term}
        showTermBadge={false}
        size={20}
      />
    </Stack>
  )
}

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: EventDriverTreeIndex[]
  loading?: boolean
}

const EventDetailDriverTreeScoreboardSection = ({
  driverTreeScoreboard = [],
  loading = false,
}: EventDetailDriverTreeScoreboardSectionProps) => {
  const tableRows = useMemo<EventDriverTreeScoreboardTableRow[]>(
    () =>
      driverTreeScoreboard.flatMap<EventDriverTreeScoreboardTableRow>((row) => {
        const indexName = getIndexName(row)
        const drivers = getDrivers(row)
        const indexRowSpan = Math.max(drivers.length, 1)

        if (drivers.length === 0) {
          return [{ indexName, driver: undefined, indexRowSpan, isFirstIndexRow: true }]
        }

        return drivers.map((driver, driverIndex) => ({
          indexName,
          driver,
          indexRowSpan,
          isFirstIndexRow: driverIndex === 0,
        }))
      }),
    [driverTreeScoreboard],
  )

  const columns = useMemo<NextGenMIStickyTableColumn<EventDriverTreeScoreboardTableRow>[]>(
    () => [
      {
        field: 'indexName',
        headerName: '대상',
        width: '100px',
        renderCell: ({ row }) => row.indexName || '-',
        shouldRenderCell: ({ row }) => row.isFirstIndexRow,
        getRowSpan: ({ row }) => row.indexRowSpan,
        cellSx: {
          fontSize: '16px',
          fontWeight: 600,
          color: 'contentText.Black',
        },
      },
      {
        field: 'lv1Label',
        headerName: 'Driver Lv1',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => row.driver?.lv1Label || '-',
      },
      {
        field: 'lv2Label',
        headerName: 'Driver Lv2',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => row.driver?.lv2Label || '-',
      },
      {
        field: 'lv3Label',
        headerName: 'Driver Lv3',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => row.driver?.lv3Label || '-',
      },
      {
        field: 'shortTerm',
        headerName: '단기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => renderDriverImpactList(row.indexName, row.driver, (driver) => driver.shortTerm, 'short'),
      },
      {
        field: 'midLongTerm',
        headerName: '중장기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => renderDriverImpactList(row.indexName, row.driver, (driver) => driver.midLongTerm, 'long'),
      },
      {
        field: 'reason',
        headerName: '근거',
        width: 'max-content',
        maxWidth: 'none',
        renderCell: ({ row }) => row.driver?.reason || '-',
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [],
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py="20px">
        <EventDetailSectionHeader
          icon={<MarginRoundedIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
          title="Index Driver별 영향도 분석"
          tooltipTitle=""
        />
        <NextGenMIEventDetailBlockSkeleton height="400px" />
      </Stack>
    )
  }

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<MarginRoundedIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
        title="Index Driver별 영향도 분석"
        tooltipTitle=""
      />
      <NextGenMIStickyTable
        columns={columns}
        rows={tableRows}
        fixedLeftColumnIndexes={[0]}
        leftAlignedHeaderSticky
        getRowKey={(row, rowIndex) =>
          `${row.indexName || 'no-index'}-${row.driver?.lv1Id ?? ''}-${row.driver?.lv2Id ?? ''}-${row.driver?.lv3Id ?? ''}-${rowIndex}`
        }
        loading={loading}
        noRowMessage="표시할 데이터가 없습니다."
        rowHeight={tableRows.length === 0 ? '400px' : undefined}
      />
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
