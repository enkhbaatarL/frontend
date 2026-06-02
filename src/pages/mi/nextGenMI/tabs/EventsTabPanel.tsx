import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { buildNextGenMIDatePresets, defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import { findIndexImpact, formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventCategoryFilterMenu from '@/pages/mi/nextGenMI/components/event/EventCategoryFilterMenu'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'
import EventRecommendedStarCell from '@/pages/mi/nextGenMI/components/event/EventRecommendedStarCell'
import EventScenarioGenerateButton from '@/pages/mi/nextGenMI/components/event/EventScenarioGenerateButton'
import EventSortSelectMenu from '@/pages/mi/nextGenMI/components/event/EventSortSelectMenu'
import EventsTableEmptyOverlay from '@/pages/mi/nextGenMI/components/event/EventsTableEmptyOverlay'
import EventStatusBadge from '@/pages/mi/nextGenMI/components/event/EventStatusBadge'
import { nextGenMIMockApi, type MockEventRow } from '@/pages/mi/nextGenMI/nextGenMIEventMockApi'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import { EventCategoryLv1, EVENT_CATEGORY_LV1_KO } from '@/service/mi/nextGenMI/common'
import nextGenMIEventService, {
  type IGetNextGenMIEventsParams,
  type INextGenMIEventListItem,
  type NextGenMIEventSort,
  type NextGenMIEventStatus,
} from '@/service/mi/nextGenMI/event'

/** 카테고리 필터 값: Lv1 다중 선택 */
type CategoryFilterValue = EventCategoryLv1[]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'updated', label: '갱신' },
] as const

const SORT_OPTIONS = [
  { value: 'LATEST', label: '최신순' },
  { value: 'OLDEST', label: '오래된순' },
] as const satisfies ReadonlyArray<{ value: NextGenMIEventSort; label: string }>

const formatEventListTime = (item: INextGenMIEventListItem) => {
  const occurredAtLabel = formatNextGenMIDateTime(item.occurredAt)
  return occurredAtLabel === '-' ? formatNextGenMIDateTime(item.updatedAt) : occurredAtLabel
}

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'

const EventsTabPanel = () => {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTER_OPTIONS)[number]['value']>('all')
  const [sort, setSort] = useState<NextGenMIEventSort>('LATEST')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>([])
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })
  const [hideNonRecommended, setHideNonRecommended] = useState(false)

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
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

  const listRequest = useMemo((): IGetNextGenMIEventsParams => {
    let eventStatus: NextGenMIEventStatus[] | undefined
    if (typeFilter === 'new') {
      eventStatus = ['new']
    } else if (typeFilter === 'updated') {
      eventStatus = ['updated']
    }

    const eventCategoryLv1: EventCategoryLv1[] | undefined = categoryFilter.length > 0 ? categoryFilter : undefined

    const trimmedKeyword = committedKeyword.trim()

    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultNextGenMIDateRange()

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: resolvedRange.startDate!.startOf('day').format('YYYY-MM-DD'),
      endDate: resolvedRange.endDate!.endOf('day').format('YYYY-MM-DD'),
      keyword: trimmedKeyword || undefined,
      eventStatus,
      eventCategoryLv1,
    }
  }, [appliedDateRange, categoryFilter, committedKeyword, pagination.page, pagination.size, sort, typeFilter])

  const useMock = true

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nextGenMIEvents', listRequest, hideNonRecommended, useMock],
    queryFn: async () => {
      if (useMock) {
        const mocked = nextGenMIMockApi.getEvents(listRequest)
        if (!hideNonRecommended) return mocked
        const mockDetail = mocked.events.detail as MockEventRow[]
        return {
          ...mocked,
          events: { ...mocked.events, detail: mockDetail.filter((r) => r.recommended === true) },
        }
      }
      return nextGenMIEventService.getEvents(listRequest)
    },
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

  const tableRows = (data?.events?.detail ?? []) as MockEventRow[]

  const columns: GridColDef<MockEventRow>[] = useMemo(
    () => [
      {
        field: '__statusBadge',
        headerName: '',
        width: 40,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <EventStatusBadge status={params.row.status} />,
      },
      {
        field: 'occurredAt',
        headerName: '일시',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => <Typography variant="body2M14">{formatEventListTime(params.row)}</Typography>,
      },
      {
        field: 'eventCategoryLv1',
        headerName: '카테고리',
        width: 140,
        align: 'left',
        renderCell: (params) => {
          const row = params.row
          const fromApiLabel = row.eventCategoryLv1Label?.trim()
          if (fromApiLabel) return fromApiLabel
          const code = row.eventCategoryLv1
          if (code === undefined || code === null) return '-'
          return EVENT_CATEGORY_LV1_KO[code as EventCategoryLv1] ?? String(code)
        },
      },
      {
        field: '__recommended',
        headerName: '',
        width: 36,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <EventRecommendedStarCell recommended={params.row.recommended} reason={params.row.recommendationReason} />,
      },
      {
        field: 'eventName',
        headerName: '이벤트명',
        flex: 1,
        minWidth: 360,
        align: 'left',
        renderCell: (params) => (
          <Typography variant="body1SB16" color="contentText.Black" noWrap>
            {params.row.eventName}
          </Typography>
        ),
      },
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return <EventIndexSignalCell level={impact?.marketImpactLevel} direction={impact?.direction} term={params.row.termByIndex?.JKM} />
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
          return <EventIndexSignalCell level={impact?.marketImpactLevel} direction={impact?.direction} term={params.row.termByIndex?.TTF} />
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
          return <EventIndexSignalCell level={impact?.marketImpactLevel} direction={impact?.direction} term={params.row.termByIndex?.HH} />
        },
      },
      {
        field: 'scenario',
        headerName: '시나리오',
        width: 100,
        align: 'center',
        sortable: false,
        // 시나리오 생성 액션은 API 미연동 단계, 퍼블리싱 버튼만 노출
        renderCell: (params) => (
          <EventScenarioGenerateButton
            recommended={params.row.recommended}
            scenarioAvailable={params.row.scenarioGenStatus === 'completed'}
          />
        ),
      },
    ],
    [],
  )

  /** 카테고리 다중 선택 필터 항목 */
  const categoryFilterItems = useMemo(
    () =>
      (Object.keys(EVENT_CATEGORY_LV1_KO) as EventCategoryLv1[]).map((key) => ({
        label: EVENT_CATEGORY_LV1_KO[key],
        value: key,
      })),
    [],
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
        py: 1,
        px: 1.5,
        borderRadius: '10px',
        minHeight: 40,
        '& .MuiButton-root': { minHeight: 40, borderRadius: '10px' },
      },
    }),
    [],
  )

  const resetPage = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const getEventsTableCellSx = useCallback(({ field }: { field: string }) => {
    if (field === 'occurredAt') return { px: '6px' }
    if (field === 'scenario') return { px: '16px', overflow: 'visible' }
    if (field === 'jkm' || field === 'ttf' || field === 'hh') return { px: '24px' }
    return {}
  }, [])

  const getEventsTableHeaderCellSx = useCallback((col: GridColDef<MockEventRow>) => {
    if (col.field === 'scenario') {
      return { px: '16px' }
    }
    if (col.field === 'jkm' || col.field === 'ttf' || col.field === 'hh') {
      return { px: '24px' }
    }
    return undefined
  }, [])

  const handleCategoryFilterApply = useCallback(
    (next: EventCategoryLv1[]) => {
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

  const handleSortChange = useCallback((value: NextGenMIEventSort) => {
    setSort(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: MockEventRow }) =>
      navigate(`/mi/next-gen-mi/events/${params.row.eventId}`, {
        state: { eventName: params.row.eventName },
      }),
    [navigate],
  )

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
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" px={3} color="contentText.Black">
          Event List
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />

            <EventCategoryFilterMenu
              filters={categoryFilterItems}
              selected={categoryFilter}
              onApply={handleCategoryFilterApply}
              closeOnScroll
            />

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={nextGenMIDatePresets}
              closeOnScroll
              {...dateRangeMenuLayoutProps}
            />

            <EventSortSelectMenu<NextGenMIEventSort> selected={sort} onSelected={handleSortChange} items={SORT_OPTIONS} closeOnScroll />
          </Stack>

          <Stack direction="row" alignItems="center" gap="12px" sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" paddingY={1} gap={0.5}>
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
              width={246}
            />
          </Stack>
        </Stack>

        <MIDataTableHeader<MockEventRow> columns={columns} getHeaderCellSx={getEventsTableHeaderCellSx} sx={{ mt: 2 }} />
      </NextGenMIStickySlot>

      <MIDataTableBody<MockEventRow>
        rowId="eventId"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        rowHeight={48}
        noRowsOverlay={emptyOverlay}
        onRowClick={handleRowClick}
        getCellSx={getEventsTableCellSx}
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
