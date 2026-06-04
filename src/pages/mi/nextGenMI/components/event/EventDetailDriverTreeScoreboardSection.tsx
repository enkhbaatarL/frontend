import MarginRoundedIcon from '@mui/icons-material/MarginRounded'
import { Divider, Stack } from '@mui/material'
import { Fragment, useMemo, type ReactNode } from 'react'

import type { DriverTreeScoreboard, EventDriverTreeIndex, EventImpactIndexTerm } from '@/service/mi/nextGenMI/event'

import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'

const getIndexName = (row: EventDriverTreeIndex) => String(row.indexName ?? '').trim()

const getDrivers = (row: EventDriverTreeIndex) => row.drivers ?? []

const DriverListCell = ({ children }: { children: ReactNode[] }) => {
  if (children.length === 0) return '-'

  return (
    <Stack minWidth={0}>
      {children.map((child, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider flexItem />}
          <Stack minHeight="48px" justifyContent="center" minWidth={0}>
            {child}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  )
}

const renderDriverTextList = (drivers: DriverTreeScoreboard[], getValue: (driver: DriverTreeScoreboard) => string | null | undefined) => (
  <DriverListCell>{drivers.map((driver) => getValue(driver) || '-')}</DriverListCell>
)

const renderDriverImpactList = (
  indexName: string,
  drivers: DriverTreeScoreboard[],
  getValue: (driver: DriverTreeScoreboard) => EventImpactIndexTerm | null | undefined,
  term: 'short' | 'long',
) => (
  <DriverListCell>
    {drivers.map((driver, index) => {
      const impact = getValue(driver)
      return (
        <Stack key={`${driver.lv1Id ?? ''}-${driver.lv2Id ?? ''}-${driver.lv3Id ?? ''}-${index}`} direction="row" justifyContent="center">
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
    })}
  </DriverListCell>
)

interface EventDetailDriverTreeScoreboardSectionProps {
  driverTreeScoreboard?: EventDriverTreeIndex[]
  loading?: boolean
}

const EventDetailDriverTreeScoreboardSection = ({
  driverTreeScoreboard = [],
  loading = false,
}: EventDetailDriverTreeScoreboardSectionProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<EventDriverTreeIndex>[]>(
    () => [
      {
        field: 'indexName',
        headerName: '대상',
        width: '100px',
        renderCell: ({ row }) => getIndexName(row) || '-',
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
        renderCell: ({ row }) => renderDriverTextList(getDrivers(row), (driver) => driver.lv1Label),
      },
      {
        field: 'lv2Label',
        headerName: 'Driver Lv2',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => renderDriverTextList(getDrivers(row), (driver) => driver.lv2Label),
      },
      {
        field: 'lv3Label',
        headerName: 'Driver Lv3',
        width: '200px',
        maxWidth: '420px',
        renderCell: ({ row }) => renderDriverTextList(getDrivers(row), (driver) => driver.lv3Label),
      },
      {
        field: 'shortTerm',
        headerName: '단기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => renderDriverImpactList(getIndexName(row), getDrivers(row), (driver) => driver.shortTerm, 'short'),
      },
      {
        field: 'midLongTerm',
        headerName: '중장기 영향',
        width: '140px',
        align: 'center',
        renderCell: ({ row }) => renderDriverImpactList(getIndexName(row), getDrivers(row), (driver) => driver.midLongTerm, 'long'),
      },
      {
        field: 'reason',
        headerName: '근거',
        width: 'max-content',
        maxWidth: 'none',
        renderCell: ({ row }) => renderDriverTextList(getDrivers(row), (driver) => driver.reason),
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [],
  )

  return (
    <Stack width="100%" gap="12px" py="20px">
      <EventDetailSectionHeader
        icon={<MarginRoundedIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
        title="Index Driver별 영향도 분석"
        tooltipTitle=""
      />
      <NextGenMIStickyTable
        columns={columns}
        rows={driverTreeScoreboard}
        getRowKey={(row, rowIndex) => `${getIndexName(row) || 'no-index'}-${rowIndex}`}
        fixedColumnIndexes={[0]}
        maxHeight="min(520px, calc(100vh - 320px))"
        loading={loading}
        noRowMessage="표시할 데이터가 없습니다."
        rowHeight={!loading && driverTreeScoreboard.length === 0 ? '400px' : 'auto'}
      />
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
