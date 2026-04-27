import { Box, Divider, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import EventClassificationTag from '../components/event/EventClassificationTag'
import EventIndexImpactDirectionCell from '../components/event/EventIndexImpactDirectionCell'
import EventsClassificationFilter from '../components/event/EventsClassificationFilter'

import type {
  EventMarketDirection,
  EventMarketImpactLevel,
  EventsClassificationFilterValue,
  ScenarioWorkbenchEventRow,
} from '../components/event/types'

import MISearchInput from '@/components/common/input/MISearchInput'
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
  type ScenarioWorkbenchEventPeriod,
  type ScenarioWorkbenchEventStatus,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

type SortOrder = 'latest' | 'oldest'
type PeriodKey = '1m' | '3m' | '6m' | 'all'
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

/** 기간 키에 따른 피그마식 날짜 범위 문구 */
const getPeriodDateRangeLabel = (period: PeriodKey): string => {
  const end = dayjs()
  if (period === 'all') return '전체 기간'
  const months = period === '1m' ? 1 : period === '3m' ? 3 : 6
  const start = end.subtract(months, 'month')
  return `${start.format('YYYY-MM-DD')} — ${end.format('YYYY-MM-DD')}`
}

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const [classificationFilter, setClassificationFilter] = useState<EventsClassificationFilterValue>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [period, setPeriod] = useState<PeriodKey>('1m')
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
    const periodMap: Record<PeriodKey, ScenarioWorkbenchEventPeriod> = {
      '1m': 'ONE_MONTH',
      '3m': 'THREE_MONTHS',
      '6m': 'SIX_MONTHS',
      all: 'ALL',
    }

    let eventStatus: ScenarioWorkbenchEventStatus[] | undefined
    if (classificationFilter === '신규') {
      eventStatus = ['NEW']
    } else if (classificationFilter === '갱신') {
      eventStatus = ['UPDATED']
    }

    const eventCategoryLv1: ScenarioWorkbenchEventCategoryLv1[] | undefined = categoryFilter === 'all' ? undefined : [categoryFilter]

    const trimmedKeyword = committedKeyword.trim()

    return {
      page: pagination.page,
      size: pagination.size,
      sort: sortOrder === 'latest' ? 'LATEST' : 'OLDEST',
      period: periodMap[period],
      keyword: trimmedKeyword || undefined,
      eventStatus,
      eventCategoryLv1,
    }
  }, [classificationFilter, committedKeyword, categoryFilter, pagination.page, pagination.size, period, sortOrder])

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

  const periodItems = useMemo(
    () => [
      { label: '1개월', value: '1m' as const },
      { label: '3개월', value: '3m' as const },
      { label: '6개월', value: '6m' as const },
      { label: '전체', value: 'all' as const },
    ],
    [],
  )

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

  const periodDateLabel = useMemo(() => getPeriodDateRangeLabel(period), [period])

  const resetPage = () => setPagination((p) => ({ ...p, page: 1 }))

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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              border: '1px solid',
              borderColor: 'contentBorder.Normal',
              borderRadius: '10px',
              bgcolor: 'common.white',
              pl: 1,
              pr: 0.5,
              py: 0.5,
              minHeight: 40,
            }}
          >
            <MISelectMenu
              variant="text"
              sx={{
                minWidth: 72,
                px: 0.5,
                '& .MuiButton-root': { py: 0.5, minHeight: 32 },
              }}
              hideChevron={false}
              items={periodItems}
              selected={period}
              onSelected={(v: PeriodKey) => {
                setPeriod(v)
                resetPage()
              }}
            />
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'contentBorder.Normal', my: 0.5 }} />
            <Typography variant="body2M14" color="contentText.Black" sx={{ pr: 1, whiteSpace: 'nowrap' }}>
              {periodDateLabel}
            </Typography>
          </Box>
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
