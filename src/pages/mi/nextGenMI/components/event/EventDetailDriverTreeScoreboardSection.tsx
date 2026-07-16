import MarginRoundedIcon from '@mui/icons-material/MarginRounded'
import { Stack, Typography } from '@mui/material'
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

type DriverReasonBadgeLabel = '단기' | '중장기'

type DriverReasonPart =
  | {
      type: 'badge'
      label: DriverReasonBadgeLabel
      text: string
    }
  | {
      type: 'text'
      text: string
    }

const parseDriverReasonParts = (reason: string): DriverReasonPart[] => {
  const parts: DriverReasonPart[] = []
  let currentBadgeLabel: DriverReasonBadgeLabel | null = null
  let lastIndex = 0

  for (const match of reason.matchAll(/,?\[(단기|중장기)\]/g)) {
    const matchIndex = match.index ?? 0
    const text = reason.slice(lastIndex, matchIndex).trim()

    if (currentBadgeLabel) {
      parts.push({ type: 'badge', label: currentBadgeLabel, text })
    } else if (text) {
      parts.push({ type: 'text', text })
    }

    currentBadgeLabel = match[1] as DriverReasonBadgeLabel
    lastIndex = matchIndex + match[0].length
  }

  const text = reason.slice(lastIndex).trim()
  if (currentBadgeLabel) {
    parts.push({ type: 'badge', label: currentBadgeLabel, text })
  } else if (text) {
    parts.push({ type: 'text', text })
  }

  return parts
}

const DriverReasonBadge = ({ label }: { label: DriverReasonBadgeLabel }) => (
  <Stack
    component="span"
    alignItems="center"
    justifyContent="center"
    flexShrink={0}
    width="48px"
    padding="4px 8px"
    borderRadius="10px"
    boxSizing="border-box"
    bgcolor="#ECEDF4"
  >
    <Typography component="span" fontSize="12px" fontWeight={600} lineHeight={1.4} color="contentText.Normal" noWrap>
      {label}
    </Typography>
  </Stack>
)

const renderDriverReason = (reason?: string | null) => {
  const text = reason?.trim()
  if (!text) return '-'

  const parts = parseDriverReasonParts(text)
  if (!parts.some((part) => part.type === 'badge')) return text

  return (
    <Stack gap="6px" alignItems="flex-start">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <Typography
              key={`text-${index}`}
              component="span"
              fontSize="14px"
              fontWeight={500}
              lineHeight={1.4}
              color="contentText.Black"
              noWrap
            >
              {part.text}
            </Typography>
          )
        }

        return (
          <Stack key={`${part.label}-${index}`} direction="row" alignItems="center" gap="10px" width="100%">
            <DriverReasonBadge label={part.label} />
            {part.text && (
              <Typography component="span" fontSize="14px" fontWeight={500} lineHeight={1.4} color="contentText.Black" noWrap>
                {part.text}
              </Typography>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
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
  compact?: boolean
  stickyTopPx?: number
  tableStickyTopPx?: number
}

const EventDetailDriverTreeScoreboardSection = ({
  driverTreeScoreboard = [],
  loading = false,
  compact = false,
  stickyTopPx,
  tableStickyTopPx,
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
        renderCell: ({ row }) => renderDriverReason(row.driver?.reason),
        cellSx: {
          overflow: 'visible',
          textOverflow: 'clip',
        },
      },
    ],
    [],
  )
  const hasRows = tableRows.length > 0
  const sectionHeaderStickyTopPx = hasRows ? stickyTopPx : undefined
  const shouldGroupPageStickyHeader = hasRows && !compact && stickyTopPx !== undefined && tableStickyTopPx !== undefined
  const renderSectionHeader = (headerStickyTopPx?: number) => (
    <EventDetailSectionHeader
      icon={<MarginRoundedIcon sx={{ fontSize: '30px', color: 'contentText.Normal' }} />}
      title="Index Driver별 영향도 분석"
      tooltipTitle=""
      stickyTopPx={headerStickyTopPx}
    />
  )

  if (loading) {
    return (
      <Stack width="100%" gap="12px" py={compact ? '0px' : '20px'}>
        {!compact && renderSectionHeader(sectionHeaderStickyTopPx)}
        <NextGenMIEventDetailBlockSkeleton height="400px" />
      </Stack>
    )
  }

  return (
    <Stack width="100%" gap={shouldGroupPageStickyHeader ? '0px' : '12px'} py={compact ? '0px' : '20px'}>
      {!compact && !shouldGroupPageStickyHeader && renderSectionHeader(sectionHeaderStickyTopPx)}
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
        pageStickyHeaderTop={hasRows ? (shouldGroupPageStickyHeader ? stickyTopPx : tableStickyTopPx) : undefined}
        pageStickyHeaderBefore={shouldGroupPageStickyHeader ? renderSectionHeader() : undefined}
        pageStickyHeaderGap="12px"
        pageStickyHeaderReleaseOnLastRow={shouldGroupPageStickyHeader}
        userFix
      />
    </Stack>
  )
}

export default EventDetailDriverTreeScoreboardSection
