import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EventClassificationTag from '../components/event/EventClassificationTag'
import EventIndexImpactDirectionCell from '../components/event/EventIndexImpactDirectionCell'
import EventsClassificationFilter from '../components/event/EventsClassificationFilter'
import { buildWorkbenchEventDatePresets, mapWorkbenchDateRangeToApiParams } from '../components/event/scenarioWorkbenchEventsDateRange'

import type {
  EventMarketDirection,
  EventMarketImpactLevel,
  EventsClassificationFilterValue,
  ScenarioWorkbenchEventRow,
} from '../components/event/types'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import scenarioWorkbenchEventService, {
  SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO,
  type IGetScenarioWorkbenchEventsParams,
  type IScenarioWorkbenchEventListItem,
  type IScenarioWorkbenchImpactIndexSummary,
  type ScenarioWorkbenchEventCategoryLv1,
  type ScenarioWorkbenchEventStatus,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

type SortOrder = 'latest' | 'oldest'
/** 카테고리 MISelectMenu 값: 전체 또는 Lv1 단일 */
type CategoryFilterValue = 'all' | ScenarioWorkbenchEventCategoryLv1

const IMPACT_LEVEL_TO_UI: Record<ScenarioWorkbenchImpactLevel, EventMarketImpactLevel> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
}

const PRICE_TO_UI: Record<ScenarioWorkbenchPriceDirection, EventMarketDirection> = {
  UP: '상승',
  DOWN: '하락',
  FLAT: '보합',
  NONE: '보합',
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

/** 단일 지수 요약을 UI 레벨·방향으로 변환 */
const mapImpactToUi = (
  row: IScenarioWorkbenchImpactIndexSummary | undefined,
): { level: EventMarketImpactLevel; direction: EventMarketDirection } => {
  if (!row) return { level: 0, direction: '보합' }
  return {
    level: IMPACT_LEVEL_TO_UI[row.impactLevel] ?? 0,
    direction: PRICE_TO_UI[row.priceDirection] ?? '보합',
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

  return {
    id: item.eventId,
    classification: eventStatusToClassification(item.eventStatus),
    occurredAtLabel,
    category: SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[item.eventCategoryLv1] ?? item.eventCategoryLv1,
    eventName: item.title,
    jkmImpact: jkm.level,
    jkmDirection: jkm.direction,
    ttfImpact: ttf.level,
    ttfDirection: ttf.direction,
    hhImpact: hh.level,
    hhDirection: hh.direction,
    isActive: item.eventStatus !== 'CLOSED',
  }
}

/** 기본 조회 구간: 1개월(오늘 기준) */
const defaultEventsDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(1, 'month'), endDate: t }
}

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const [classificationFilter, setClassificationFilter] = useState<EventsClassificationFilterValue>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultEventsDateRange())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>('all')
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })

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
    if (classificationFilter === '신규') {
      eventStatus = ['NEW']
    } else if (classificationFilter === '갱신') {
      eventStatus = ['UPDATED']
    }

    const eventCategoryLv1: ScenarioWorkbenchEventCategoryLv1[] | undefined = categoryFilter === 'all' ? undefined : [categoryFilter]

    const trimmedKeyword = committedKeyword.trim()

    const dateSlice =
      appliedDateRange.startDate && appliedDateRange.endDate
        ? mapWorkbenchDateRangeToApiParams(appliedDateRange.startDate, appliedDateRange.endDate)
        : { period: 'ONE_MONTH' as const }

    return {
      page: pagination.page,
      size: pagination.size,
      sort: sortOrder === 'latest' ? 'LATEST' : 'OLDEST',
      period: dateSlice.period,
      ...(dateSlice.period === 'CUSTOM' ? { startDate: dateSlice.startDate, endDate: dateSlice.endDate } : {}),
      keyword: trimmedKeyword || undefined,
      eventStatus,
      eventCategoryLv1,
    }
  }, [appliedDateRange, categoryFilter, classificationFilter, committedKeyword, pagination.page, pagination.size, sortOrder])

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
    if (!data?.events || data.events.totalElements === 0) return undefined
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
        renderCell: (params) => (
          <MITableCell>
            <EventClassificationTag classification={params.row.classification} />
          </MITableCell>
        ),
      },
      {
        field: 'occurredAtLabel',
        headerName: '발생/갱신일시',
        width: 130,
        align: 'center',
        renderCell: (params) => <MITableCell value={params.value} color="contentText.Subtext" />,
      },
      {
        field: 'category',
        headerName: '카테고리',
        width: 160,
        align: 'left',
        renderCell: (params) => <MITableCell value={params.value} />,
      },
      {
        field: 'eventName',
        headerName: '이벤트명',
        flex: 1,
        minWidth: 240,
        align: 'left',
        renderCell: (params) => <MITableCell value={params.value} tooltipContent={params.value} />,
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <EventIndexImpactDirectionCell level={params.row.jkmImpact} direction={params.row.jkmDirection} />
          </MITableCell>
        ),
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <EventIndexImpactDirectionCell level={params.row.ttfImpact} direction={params.row.ttfDirection} />
          </MITableCell>
        ),
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => (
          <MITableCell>
            <EventIndexImpactDirectionCell level={params.row.hhImpact} direction={params.row.hhDirection} />
          </MITableCell>
        ),
      },
    ],
    [],
  )

  const sortItems = useMemo(
    () => [
      { label: '최신순', value: 'latest' as const },
      { label: '오래된순', value: 'oldest' as const },
    ],
    [],
  )

  /** 카테고리 단일 선택 메뉴 항목(전체 + Lv1) */
  const categoryMenuItems = useMemo(
    () => [
      { label: '전체', value: 'all' as const },
      ...(Object.keys(SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO) as ScenarioWorkbenchEventCategoryLv1[]).map((key) => ({
        label: SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[key],
        value: key,
      })),
    ],
    [],
  )

  /** 워크벤치 Events용 MIDateRangePickerMenu 한글 프리셋 (공용 컴포넌트는 datePresets만 받음) */
  const workbenchEventDatePresets = useMemo(() => buildWorkbenchEventDatePresets(), [])

  /** Figma 2994:58459에 가깝게 — 공용 MIMenu는 placement/sx/paperProps로만 조정 가능 */
  const eventsDateRangeMenuLayoutProps = useMemo(
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

  const resetPage = () => setPagination((p) => ({ ...p, page: 1 }))

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({
      startDate: dates.startDate,
      endDate: dates.endDate,
    })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  return (
    <Stack gap={2} sx={{ px: 3, py: 2 }}>
      <Typography fontSize={26} fontWeight={700} lineHeight={1.4} pt={20} color="contentText.Black">
        Events
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <EventsClassificationFilter
            value={classificationFilter}
            onChange={(v) => {
              setClassificationFilter(v)
              resetPage()
            }}
          />
          <MISelectMenu
            variant="outlined"
            sx={{ minWidth: 120 }}
            textLabel="카테고리"
            items={categoryMenuItems}
            selected={categoryFilter}
            onSelected={(v: CategoryFilterValue) => {
              setCategoryFilter(v)
              resetPage()
            }}
          />
          <MIDateRangePickerMenu
            dateRange={appliedDateRange}
            onApply={handleDateRangeApply}
            showPreset
            datePresets={workbenchEventDatePresets}
            {...eventsDateRangeMenuLayoutProps}
          />
          <MISelectMenu
            variant="outlined"
            sx={{ minWidth: 112 }}
            items={sortItems}
            selected={sortOrder}
            onSelected={(v: SortOrder) => {
              setSortOrder(v)
              resetPage()
            }}
          />
          <Box sx={{ flex: 1, minWidth: 8 }} />
        </Stack>
        <Stack direction="row" gap="12px" sx={{ flexShrink: 0 }}>
          <MISearchInput
            storageKey="scenario-workbench-events"
            value={keyword}
            placeholder="이벤트명으로 검색"
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onClear={handleSearchClear}
            width={246}
          />
        </Stack>
      </Stack>
      <Box
        sx={{
          width: '100%',
          height: 640,
          '& .MuiDataGrid-root': { height: '100%' },
        }}
      >
        <MITable<ScenarioWorkbenchEventRow>
          rowId="id"
          columns={columns}
          rows={tableRows}
          loading={isLoading}
          noRowMessage={isError ? '목록을 불러오지 못했습니다.' : undefined}
          disableHover={false}
          onRowClick={(params) => {
            navigate(`/mi/scenario-workbench/events/${params.row.id}`, {
              state: { eventName: params.row.eventName },
            })
          }}
        />
      </Box>
      {paginationData && (
        <MIPagination<ScenarioWorkbenchEventRow>
          data={paginationData}
          size={pagination.size}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onSizeChange={(size) => setPagination({ size, page: 1 })}
        />
      )}
    </Stack>
  )
}

export default EventsTabPanel
