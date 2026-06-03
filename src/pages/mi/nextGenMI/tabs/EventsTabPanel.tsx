import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { buildNextGenMIDatePresets, defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import { findIndexImpact, formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventCategoryFilterMenu from '@/pages/mi/nextGenMI/components/event/EventCategoryFilterMenu'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'
import EventRecommendedStarCell from '@/pages/mi/nextGenMI/components/event/EventRecommendedStarCell'
import EventScenarioGenerateButton from '@/pages/mi/nextGenMI/components/event/EventScenarioGenerateButton'
import EventSortSelectMenu from '@/pages/mi/nextGenMI/components/event/EventSortSelectMenu'
import EventsTableEmptyOverlay from '@/pages/mi/nextGenMI/components/event/EventsTableEmptyOverlay'
import EventStatusBadge from '@/pages/mi/nextGenMI/components/event/EventStatusBadge'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import nextGenMIEventService, {
  type EventListItemRes,
  type EventSort,
  type EventStatus,
  type GetEventsParams,
} from '@/service/mi/nextGenMI/event'

/** 카테고리 필터 값: Lv1 다중 선택 */
type CategoryFilterValue = number[]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'updated', label: '갱신' },
] as const satisfies ReadonlyArray<{ value: EventStatus; label: string }>

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
] as const satisfies ReadonlyArray<{ value: EventSort; label: string }>

const resolveEventListDateRange = (dateRange: DateRange): Required<DateRange> => {
  if (dateRange.startDate !== undefined && dateRange.endDate !== undefined) {
    return { startDate: dateRange.startDate, endDate: dateRange.endDate }
  }

  const fallbackRange = defaultNextGenMIDateRange()
  if (fallbackRange.startDate !== undefined && fallbackRange.endDate !== undefined) {
    return { startDate: fallbackRange.startDate, endDate: fallbackRange.endDate }
  }

  const today = dayjs().startOf('day')
  return { startDate: today.subtract(1, 'month'), endDate: today }
}

const EventsTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTER_OPTIONS)[number]['value']>('all')
  const [sort, setSort] = useState<EventSort>('latest')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>([])
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })
  const [hideNonRecommended, setHideNonRecommended] = useState(false)

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setKeyword(value)
  }, [])

  const handleSearch = useCallback((searchTerm: string) => {
    setCommittedKeyword(searchTerm)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSearchClear = useCallback(() => {
    setKeyword('')
    setCommittedKeyword('')
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const listRequest = useMemo((): GetEventsParams => {
    const trimmedKeyword = committedKeyword.trim()
    const { startDate, endDate } = resolveEventListDateRange(appliedDateRange)

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: startDate.startOf('day').format('YYYY-MM-DD'),
      endDate: endDate.endOf('day').format('YYYY-MM-DD'),
      keyword: trimmedKeyword || undefined,
      eventStatus: typeFilter,
      eventTypeL1Id: categoryFilter.length > 0 ? categoryFilter : undefined,
      suggestedOnly: hideNonRecommended || undefined,
    }
  }, [appliedDateRange, categoryFilter, committedKeyword, hideNonRecommended, pagination.page, pagination.size, sort, typeFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nextGenMIEvents', listRequest],
    queryFn: () => nextGenMIEventService.getEvents(listRequest),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!data?.events) return
    const tp = data.events.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [data?.events, pagination.page])

  const tableRows = data?.events?.detail ?? []

  const handleEventNameClick = useCallback(
    (row: EventListItemRes) =>
      navigate(`/mi/next-gen-mi/events/${row.eventId}`, {
        state: { eventName: row.eventName },
      }),
    [navigate],
  )

  const columns: GridColDef<EventListItemRes>[] = useMemo(
    () => [
      {
        field: '__statusBadge',
        headerName: '',
        width: 40,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <EventStatusBadge status={params.row.status} statusLabel={params.row.statusLabel} />,
      },
      {
        field: 'createdAt',
        headerName: '일시',
        width: 100,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params) => <Typography variant="body2M14">{formatNextGenMIDateTime(params.row.createdAt)}</Typography>,
      },
      {
        field: 'eventTypeLv1Label',
        headerName: '카테고리',
        width: 140,
        align: 'left',
        renderCell: (params) => <Typography variant="body2M14">{params.row.eventTypeLv1Label}</Typography>,
      },
      {
        field: '__recommended',
        headerName: '',
        width: 36,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => (
          <EventRecommendedStarCell recommended={params.row.isScenarioSuggested} reason={params.row.scenarioSuggestReason ?? undefined} />
        ),
      },
      {
        field: 'eventName',
        headerName: '이벤트명',
        flex: 1,
        minWidth: 360,
        align: 'left',
        renderCell: (params) => <NextGenMIHoverLinkCell value={params.row.eventName} onClick={() => handleEventNameClick(params.row)} />,
      },
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return (
            <EventIndexSignalCell
              indexLabel="JKM"
              level={impact?.marketImpactLevel}
              levelLabel={impact?.marketImpactLevelLabel}
              direction={impact?.direction}
              directionLabel={impact?.directionLabel}
              term={impact?.impactTerm}
              termLabel={impact?.impactTermLabel}
            />
          )
        },
      },
      {
        field: 'ttf',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
          return (
            <EventIndexSignalCell
              indexLabel="TTF"
              level={impact?.marketImpactLevel}
              levelLabel={impact?.marketImpactLevelLabel}
              direction={impact?.direction}
              directionLabel={impact?.directionLabel}
              term={impact?.impactTerm}
              termLabel={impact?.impactTermLabel}
            />
          )
        },
      },
      {
        field: 'hh',
        headerName: 'HH',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'HH')
          return (
            <EventIndexSignalCell
              indexLabel="HH"
              level={impact?.marketImpactLevel}
              levelLabel={impact?.marketImpactLevelLabel}
              direction={impact?.direction}
              directionLabel={impact?.directionLabel}
              term={impact?.impactTerm}
              termLabel={impact?.impactTermLabel}
            />
          )
        },
      },
      {
        field: 'scenario',
        headerName: '시나리오',
        width: 100,
        align: 'center',
        sortable: false,
        renderCell: (params) => <EventScenarioGenerateButton recommended={params.row.isScenarioSuggested} />,
      },
    ],
    [handleEventNameClick],
  )

  const nextGenMIDatePresets = useMemo(() => buildNextGenMIDatePresets(), [])

  const dateRangeMenuLayoutProps = useMemo(
    () => ({
      placement: 'bottom-start' as const,
      paperProps: {
        elevation: 0,
        sx: {
          borderRadius: '10px',
          boxShadow: '0px 0px 2px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          overflow: 'hidden',
          mt: 0.5,
        },
      },
      sx: {
        height: '36px',
        padding: '8px 12px',
        borderRadius: '8px',
        minHeight: '36px',
        '& .MuiButton-root': { minHeight: '36px', borderRadius: '8px' },
      },
    }),
    [],
  )

  const resetPage = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const getEventsTableCellSx = useCallback(({ field }: { field: string }) => {
    if (field === '__statusBadge') return { px: '8px' }
    if (field === 'createdAt') return { px: '6px' }
    if (field === 'scenario') return { px: '16px', overflow: 'visible' }
    if (field === 'jkm' || field === 'ttf' || field === 'hh') return { px: '24px' }
    return {}
  }, [])

  const showEventsTableCellSkeleton = useCallback(
    (col: GridColDef<EventListItemRes>) => col.field === '__statusBadge' || String(col.headerName ?? '').trim() !== '',
    [],
  )

  const getEventsTableHeaderCellSx = useCallback((col: GridColDef<EventListItemRes>) => {
    if (col.field === 'scenario') {
      return { px: '16px' }
    }
    if (col.field === 'jkm' || col.field === 'ttf' || col.field === 'hh') {
      return { px: '24px' }
    }
    return undefined
  }, [])

  const handleCategoryFilterApply = useCallback(
    (next: number[]) => {
      setCategoryFilter(next)
      resetPage()
    },
    [resetPage],
  )

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({
      startDate: dates.startDate,
      endDate: dates.endDate,
    })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleTypeFilterChange = useCallback((v: string) => {
    if (v === 'all' || v === 'new' || v === 'updated') {
      setTypeFilter(v)
      setPagination((p) => ({ ...p, page: 1 }))
    }
  }, [])

  const handleSortChange = useCallback((value: EventSort) => {
    setSort(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handlePageSizeChange = useCallback((s: number) => {
    setPagination({ size: s, page: 1 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const emptyOverlay = useMemo(() => {
    if (isError) {
      return <EventsTableEmptyOverlay message="목록을 불러오지 못했습니다." />
    }
    return <EventsTableEmptyOverlay message="조건에 맞는 항목이 없습니다" />
  }, [isError])

  return (
    <Box width="100%">
      <NextGenMIStickySlot tabKey="events">
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" color="contentText.Black">
          Event List
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{
                height: '36px',
                '& > button': {
                  height: '28px',
                  padding: '4px 8px',
                  boxSizing: 'border-box',
                },
                '& .MuiTypography-root': { whiteSpace: 'nowrap' },
              }}
            />

            <EventCategoryFilterMenu selected={categoryFilter} onApply={handleCategoryFilterApply} closeOnScroll />

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={nextGenMIDatePresets}
              closeOnScroll
              {...dateRangeMenuLayoutProps}
            />

            <EventSortSelectMenu<EventSort> selected={sort} onSelected={handleSortChange} items={SORT_OPTIONS} closeOnScroll />
          </Stack>

          <Stack direction="row" alignItems="center" gap="12px" sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" height="36px" paddingY={0} gap={0.5}>
              <Switch size="small" checked={hideNonRecommended} onChange={(_, checked) => setHideNonRecommended(checked)} />
              <Typography variant="body2M14" color={hideNonRecommended ? 'contentText.Black' : 'contentText.Normal'}>
                추천 항목만 보기
              </Typography>
            </Stack>
            <MISearchInput
              storageKey="next-gen-mi-events"
              value={keyword}
              onChange={handleSearchChange}
              placeholder="이벤트명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width="246px"
              height="36px"
            />
          </Stack>
        </Stack>

        <MIDataTableHeader<EventListItemRes> columns={columns} getHeaderCellSx={getEventsTableHeaderCellSx} sx={{ mt: 2 }} />
      </NextGenMIStickySlot>

      <MIDataTableBody<EventListItemRes>
        rowId="eventId"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        showCellSkeleton={showEventsTableCellSkeleton}
        rowHeight={48}
        noRowsOverlay={emptyOverlay}
        getCellSx={getEventsTableCellSx}
        sx={{
          '& > .MuiBox-root': {
            minHeight: 400,
          },
        }}
      />

      <MIPaginationSecondary
        data={data?.events}
        size={pagination.size}
        sizeList={[20, 50, 100]}
        onSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
      />
    </Box>
  )
}

export default EventsTabPanel
