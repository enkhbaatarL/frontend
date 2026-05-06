import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  EventMarketDirection,
  EventMarketImpactLevel,
  ScenarioWorkbenchEventRow,
} from '@/pages/mi/scenarioWorkbench/components/event/types'
import type { PriceDirection } from '@/pages/mi/scenarioWorkbench/components/scenario/types'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIDropdownMenu from '@/components/common/menu/MIDropdownMenu'
import MIFilterMenu, { FilterValues } from '@/components/common/menu/MIFilterMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import ClassificationTag from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import { WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED } from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'
import {
  buildWorkbenchEventDatePresets,
  mapWorkbenchDateRangeToApiParams,
} from '@/pages/mi/scenarioWorkbench/components/event/scenarioWorkbenchEventsDateRange'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader, {
  SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
} from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { useScenarioWorkbenchHeaderCollapsed } from '@/pages/mi/scenarioWorkbench/ScenarioWorkbenchHeaderCollapseContext'
import scenarioWorkbenchEventService, {
  SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO,
  type IGetScenarioWorkbenchEventsParams,
  type IScenarioWorkbenchEventListItem,
  type IScenarioWorkbenchImpactIndexSummary,
  type ScenarioWorkbenchEventCategoryLv1,
  type ScenarioWorkbenchEventStatus,
  type ScenarioWorkbenchDirection,
  type ScenarioWorkbenchImpactLevel,
} from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

type SortLabel = (typeof SORT_OPTIONS)[number]
/** 카테고리 필터 값: Lv1 다중 선택 */
type CategoryFilterValue = ScenarioWorkbenchEventCategoryLv1[]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'updated', label: '갱신' },
] as const

const SORT_OPTIONS = ['최신순', '오래된순'] as const

const IMPACT_LEVEL_TO_UI: Record<ScenarioWorkbenchImpactLevel, EventMarketImpactLevel> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
}

const PRICE_TO_UI: Record<ScenarioWorkbenchDirection, EventMarketDirection> = {
  UP: '상승',
  DOWN: '하락',
  FLAT: '보합',
  NONE: '보합',
}

const eventDirectionToPriceDirection = (d: EventMarketDirection): PriceDirection => {
  if (d === '상승') return 'up'
  if (d === '하락') return 'down'
  return 'flat'
}

/** API eventStatus → 구분 칩 문구 */
const eventStatusToClassification = (status: ScenarioWorkbenchEventStatus) => {
  if (status === 'NEW') return '신규' as const
  if (status === 'UPDATED') return '갱신' as const
  return '종료' as const
}

/** indexImpacts에서 지수명으로 항목 조회 (대소문자 무시) */
const findIndexImpact = (impacts: IScenarioWorkbenchImpactIndexSummary[], code: string) =>
  impacts.find((x) => (x.indexName ?? '').toUpperCase() === code)

// 250506 API 변경
const MAP_DIRECTION = {
  bullish: 'UP',
  bearish: 'DOWN',
  negligible: 'FLAT',
}

/** API 방향 값이 MAP_DIRECTION 키인지 판별 */
const isApiDirectionKey = (v: unknown): v is keyof typeof MAP_DIRECTION => typeof v === 'string' && v in MAP_DIRECTION

/** 단일 지수 요약을 UI 레벨·방향으로 변환 */
const mapImpactToUi = (
  row: IScenarioWorkbenchImpactIndexSummary | undefined,
): { level: EventMarketImpactLevel; direction: EventMarketDirection } => {
  if (!row) return { level: 0, direction: '보합' }

  const priceDirection = isApiDirectionKey(row.direction)
    ? MAP_DIRECTION[row.direction]
    : (row.direction as unknown as ScenarioWorkbenchDirection)
  return {
    level: IMPACT_LEVEL_TO_UI[row.impactLevel?.toUpperCase() as ScenarioWorkbenchImpactLevel] ?? 0,
    direction: PRICE_TO_UI[priceDirection] ?? '보합',
  }
}

/** API 목록 항목 → DataGrid 행 (JKM·TTF·HH 분리) */
const mapScenarioWorkbenchEventListItemToRow = (item: IScenarioWorkbenchEventListItem): ScenarioWorkbenchEventRow => {
  const impacts = item.indexImpacts ?? []
  const jkm = mapImpactToUi(findIndexImpact(impacts, 'JKM'))
  const ttf = mapImpactToUi(findIndexImpact(impacts, 'TTF'))
  const hh = mapImpactToUi(findIndexImpact(impacts, 'HH'))

  const occurredAt = item.occurredAt ? dayjs(item.occurredAt) : null
  const updatedAt = item.updatedAt ? dayjs(item.updatedAt) : null
  const displayTime = occurredAt?.isValid() ? occurredAt : updatedAt
  const occurredAtLabel = displayTime?.isValid() ? displayTime.format('MM-DD HH:mm') : '-'
  const eventCategoryLv1 = item.eventCategoryLv1.toUpperCase() as ScenarioWorkbenchEventCategoryLv1
  return {
    id: item.eventId,
    classification: eventStatusToClassification(item.status),
    occurredAtLabel,
    category: SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[eventCategoryLv1] ?? item.eventCategoryLv1,
    eventName: item.eventName,
    jkmImpact: jkm.level,
    jkmDirection: jkm.direction,
    ttfImpact: ttf.level,
    ttfDirection: ttf.direction,
    hhImpact: hh.level,
    hhDirection: hh.direction,
    isActive: item.status !== 'CLOSED',
  }
}

/** 기본 조회 구간: 1개월(오늘 기준) */
const defaultEventsDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(1, 'month'), endDate: t }
}

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'
const STICKY_SHADOW_AFTER_STICKY_ENGAGE_OFFSET_PX = 2

/** 스크롤 콘텐츠 상단 `scrollTop + (sentinel.top - scrollport.top)` */
const measureStickyFlowTopFromScrollContentTop = (scrollEl: HTMLElement, sentinelEl: HTMLElement): number => {
  const s = scrollEl.getBoundingClientRect()
  const e = sentinelEl.getBoundingClientRect()
  return scrollEl.scrollTop + (e.top - s.top)
}

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const isWorkbenchHeaderCollapsed = useScenarioWorkbenchHeaderCollapsed()

  const stickyShadowSentinelRef = useRef<HTMLDivElement | null>(null)
  const panelLayoutRef = useRef<HTMLDivElement | null>(null)
  const stickyShadowShowMinScrollTopRef = useRef(0)

  const [stickyScrollShadowOpacity, setStickyScrollShadowOpacity] = useState(0)

  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTER_OPTIONS)[number]['value']>('all')
  const [sort, setSort] = useState<SortLabel>('최신순')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultEventsDateRange())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>([])
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })

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

  const listRequest = useMemo((): IGetScenarioWorkbenchEventsParams => {
    let eventStatus: ScenarioWorkbenchEventStatus[] | undefined
    if (typeFilter === 'new') {
      eventStatus = ['NEW']
    } else if (typeFilter === 'updated') {
      eventStatus = ['UPDATED']
    }

    const eventCategoryLv1: ScenarioWorkbenchEventCategoryLv1[] | undefined = categoryFilter.length > 0 ? categoryFilter : undefined

    const trimmedKeyword = committedKeyword.trim()

    const dateSlice =
      appliedDateRange.startDate && appliedDateRange.endDate
        ? mapWorkbenchDateRangeToApiParams(appliedDateRange.startDate, appliedDateRange.endDate)
        : { period: 'ONE_MONTH' as const }

    return {
      page: pagination.page,
      size: pagination.size,
      sort: sort === '최신순' ? 'LATEST' : 'OLDEST',
      period: dateSlice.period,
      ...(dateSlice.period === 'CUSTOM' ? { startDate: dateSlice.startDate, endDate: dateSlice.endDate } : {}),
      keyword: trimmedKeyword || undefined,
      eventStatus,
      eventCategoryLv1,
    }
  }, [appliedDateRange, categoryFilter, committedKeyword, pagination.page, pagination.size, sort, typeFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['scenarioWorkbenchEvents', listRequest],
    queryFn: () => scenarioWorkbenchEventService.getEvents(listRequest),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const tableRows = useMemo(() => (data?.events?.detail ?? []).map(mapScenarioWorkbenchEventListItemToRow), [data?.events?.detail])

  useEffect(() => {
    if (!data?.events) return
    const tp = data.events.totalPages
    if (tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [data?.events, pagination.page])

  const paginationData: IPaginationResponse<ScenarioWorkbenchEventRow> | undefined = useMemo(() => {
    if (!data?.events) return undefined
    return {
      ...data.events,
      detail: tableRows,
    }
  }, [data?.events, tableRows])

  const columns: GridColDef<ScenarioWorkbenchEventRow>[] = useMemo(
    () => [
      {
        field: 'classification',
        headerName: '구분',
        width: 88,
        align: 'center',
        renderCell: (params) => <ClassificationTag classification={params.row.classification} />,
      },
      {
        field: 'occurredAtLabel',
        headerName: '발생/갱신일시',
        width: 130,
        align: 'center',
      },
      {
        field: 'category',
        headerName: '카테고리',
        width: 160,
        align: 'left',
      },
      {
        field: 'eventName',
        headerName: '이벤트명',
        flex: 1,
        minWidth: 240,
        align: 'left',
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <ImpactDotsCell level={params.row.jkmImpact} direction={eventDirectionToPriceDirection(params.row.jkmDirection)} />
        ),
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <ImpactDotsCell level={params.row.ttfImpact} direction={eventDirectionToPriceDirection(params.row.ttfDirection)} />
        ),
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <ImpactDotsCell level={params.row.hhImpact} direction={eventDirectionToPriceDirection(params.row.hhDirection)} />
        ),
      },
    ],
    [],
  )

  /** 카테고리 다중 선택 필터 항목 */
  const categoryFilterItems = useMemo(
    () =>
      (Object.keys(SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO) as ScenarioWorkbenchEventCategoryLv1[]).map((key) => ({
        label: SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[key],
        value: key,
      })),
    [],
  )

  const workbenchEventDatePresets = useMemo(() => buildWorkbenchEventDatePresets(), [])

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

  const handleCategoryFilterApply = useCallback(
    (filterValues: FilterValues) => {
      setCategoryFilter((filterValues.category ?? []) as ScenarioWorkbenchEventCategoryLv1[])
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

  const handleSortChange = useCallback((label: SortLabel) => {
    setSort(label)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const updateStickyShadowScrollThreshold = useCallback(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const sentinel = stickyShadowSentinelRef.current
    if (!scrollEl || !sentinel) return
    const flowTopD = measureStickyFlowTopFromScrollContentTop(scrollEl, sentinel)
    const stickyTop = SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX
    const minScroll = Math.max(0, flowTopD - stickyTop + STICKY_SHADOW_AFTER_STICKY_ENGAGE_OFFSET_PX)
    stickyShadowShowMinScrollTopRef.current = minScroll
    setStickyScrollShadowOpacity(scrollEl.scrollTop >= minScroll ? 1 : 0)
  }, [])

  useLayoutEffect(() => {
    updateStickyShadowScrollThreshold()
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const panel = panelLayoutRef.current
    if (!scrollEl || !panel) return undefined
    const ro = new ResizeObserver(() => {
      updateStickyShadowScrollThreshold()
    })
    ro.observe(panel)
    window.addEventListener('resize', updateStickyShadowScrollThreshold)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateStickyShadowScrollThreshold)
    }
  }, [updateStickyShadowScrollThreshold, isWorkbenchHeaderCollapsed])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (!scrollEl) return undefined
    const onScroll = () => {
      const y = scrollEl.scrollTop
      setStickyScrollShadowOpacity(y >= stickyShadowShowMinScrollTopRef.current ? 1 : 0)
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', onScroll)
  }, [])

  const handleRowClick = useCallback(
    (params: { row: ScenarioWorkbenchEventRow }) =>
      navigate(`/mi/scenario-workbench/events/${params.row.id}`, {
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

  const emptyMessage = isError ? '목록을 불러오지 못했습니다.' : '이벤트가 없습니다.'

  return (
    <Box ref={panelLayoutRef} width="100%">
      <Box ref={stickyShadowSentinelRef} aria-hidden sx={{ height: 0, width: '100%', overflow: 'hidden', pointerEvents: 'none' }} />
      <Box
        sx={{
          position: 'sticky',
          top: SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
          zIndex: 160,
          bgcolor: 'commonColor.White',
          pb: 0,
          overflow: 'visible',
          boxShadow: stickyScrollShadowOpacity ? WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
          transition: 'box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" px={3} color="contentText.Black">
          Events
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ px: 3 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={handleTypeFilterChange}
              sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
            />

            <MIFilterMenu
              filterGroups={[
                [
                  {
                    key: 'category',
                    title: '카테고리',
                    filters: categoryFilterItems,
                    width: 175,
                  },
                ],
              ]}
              initialValues={{ category: categoryFilter }}
              appliedFiltersCount={categoryFilter.length}
              onApply={handleCategoryFilterApply}
              showSaveOption={false}
              label="카테고리"
              sx={{ minWidth: 106 }}
            />

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={workbenchEventDatePresets}
              {...dateRangeMenuLayoutProps}
            />

            <MIDropdownMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="body2M14" color="contentText.Black">
                    {sort}
                  </Typography>
                  <KeyboardArrowDownIcon sx={{ fontSize: 20, color: 'contentText.Black' }} />
                </Stack>
              }
              items={SORT_OPTIONS.map((label) => ({ label, action: () => handleSortChange(label) }))}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} sx={{ flexShrink: 0 }}>
            <MISearchInput
              storageKey="scenario-workbench-events"
              value={keyword}
              onChange={handleSearchChange}
              placeholder="이벤트명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width={246}
            />
          </Stack>
        </Stack>

        <ScenarioWorkbenchTableHeader<ScenarioWorkbenchEventRow> columns={columns} sx={{ mt: 2 }} />
      </Box>

      <ScenarioWorkbenchDataList<ScenarioWorkbenchEventRow>
        rowId="id"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        rowHeight={42}
        noRowMessage={emptyMessage}
        onRowClick={handleRowClick}
      />

      <MIPaginationSecondary
        data={paginationData}
        size={pagination.size}
        sizeList={[20, 50, 100]}
        onSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
      />
    </Box>
  )
}

export default EventsTabPanel
