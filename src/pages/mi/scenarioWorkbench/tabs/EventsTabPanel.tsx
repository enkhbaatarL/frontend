import { Box, FormControlLabel, Stack, Switch } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import EventClassificationTag from '../components/event/EventClassificationTag'
import EventMarketDirectionCell from '../components/event/EventMarketDirectionCell'
import EventMarketImpactCell from '../components/event/EventMarketImpactCell'
import EventsClassificationFilter from '../components/event/EventsClassificationFilter'

import type {
  EventsClassificationFilterValue,
  EventClassification,
  EventMarketDirection,
  EventMarketImpactLevel,
  ScenarioWorkbenchEventRow,
} from '../components/event/types'

import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import scenarioWorkbenchEventService, {
  type IGetScenarioWorkbenchEventsParams,
  type IScenarioWorkbenchEventListItem,
  type ScenarioWorkbenchEventCategoryLv1,
  type ScenarioWorkbenchEventPeriod,
  type ScenarioWorkbenchEventStatus,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

type SortOrder = 'latest' | 'oldest'
type PeriodKey = '1m' | '3m' | '6m' | 'all'
type CategoryFilterKey = 'all' | '지정학적 리스크' | '수급밸런스'

const EVENT_CATEGORY_LV1_KO: Record<ScenarioWorkbenchEventCategoryLv1, string> = {
  GEOPOLITICAL_RISK: '지정학적 리스크',
  WEATHER_CLIMATE: '기상·기후',
  INFRASTRUCTURE_FACILITY: '인프라·설비',
  SUPPLY_DEMAND_BALANCE: '수급밸런스',
  LOGISTICS_SHIPPING: '물류·해운',
  ENERGY_MIX_TRANSITION: '에너지 믹스 전환',
  MACROECONOMY_POLICY: '거시경제·정책',
  MARKET_TRADING_STRUCTURE: '시장·거래 구조',
}

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

const eventStatusToClassification = (status: ScenarioWorkbenchEventStatus): EventClassification => {
  if (status === 'NEW') return '신규'
  if (status === 'UPDATED') return '갱신'
  return '종료'
}

const mapScenarioWorkbenchEventListItemToRow = (item: IScenarioWorkbenchEventListItem): ScenarioWorkbenchEventRow => {
  const impacts = item.indexImpacts ?? []
  // 퍼블리싱 변경됨: JKM, TTF, HH 모두 보여주기
  const jkm = impacts.find((x) => (x.indexName ?? '').toUpperCase() === 'JKM') ?? impacts[0]
  const marketImpact: EventMarketImpactLevel = jkm ? (IMPACT_LEVEL_TO_UI[jkm.impactLevel] ?? 0) : 0
  const marketDirection: EventMarketDirection = jkm ? (PRICE_TO_UI[jkm.priceDirection] ?? '보합') : '보합'

  const occurredAt = item.occurredAt ? dayjs(item.occurredAt) : null
  const updatedAt = item.updatedAt ? dayjs(item.updatedAt) : null
  const displayTime = occurredAt?.isValid() ? occurredAt : updatedAt
  const occurredAtLabel = displayTime?.isValid() ? displayTime.format('MM-DD HH:mm') : '-'

  return {
    id: item.eventId,
    classification: eventStatusToClassification(item.eventStatus),
    occurredAtLabel,
    category: EVENT_CATEGORY_LV1_KO[item.eventCategoryLv1] ?? item.eventCategoryLv1,
    eventName: item.title,
    marketImpact,
    marketDirection,
    isActive: item.eventStatus !== 'CLOSED',
  }
}

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const [classificationFilter, setClassificationFilter] = useState<EventsClassificationFilterValue>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest')
  const [period, setPeriod] = useState<PeriodKey>('1m')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterKey>('all')
  const [activeOnly, setActiveOnly] = useState(false)
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
    } else if (activeOnly) {
      eventStatus = ['NEW', 'UPDATED']
    }

    let eventCategoryLv1: ScenarioWorkbenchEventCategoryLv1[] | undefined
    if (categoryFilter === '지정학적 리스크') {
      eventCategoryLv1 = ['GEOPOLITICAL_RISK']
    } else if (categoryFilter === '수급밸런스') {
      eventCategoryLv1 = ['SUPPLY_DEMAND_BALANCE']
    }

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
  }, [activeOnly, categoryFilter, classificationFilter, committedKeyword, pagination.page, pagination.size, period, sortOrder])

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
        width: 100,
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
        field: 'marketImpact',
        headerName: '시장 영향도',
        width: 140,
        align: 'left',
        renderCell: (params) => (
          <MITableCell>
            <EventMarketImpactCell level={params.row.marketImpact} />
          </MITableCell>
        ),
      },
      {
        field: 'marketDirection',
        headerName: '시장 방향',
        width: 120,
        align: 'left',
        renderCell: (params) => (
          <MITableCell>
            <EventMarketDirectionCell direction={params.row.marketDirection} />
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
      { label: '지정학적 리스크', value: '지정학적 리스크' as const },
      { label: '수급밸런스', value: '수급밸런스' as const },
    ],
    [],
  )

  const resetPage = () => setPagination((p) => ({ ...p, page: 1 }))

  return (
    <Stack gap={2} sx={{ px: 3, py: 2 }}>
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
            sx={{ minWidth: 100 }}
            items={sortItems}
            selected={sortOrder}
            onSelected={(v: SortOrder) => {
              setSortOrder(v)
              resetPage()
            }}
          />
          <MISelectMenu
            variant="outlined"
            sx={{ minWidth: 100 }}
            items={periodItems}
            selected={period}
            onSelected={(v: PeriodKey) => {
              setPeriod(v)
              resetPage()
            }}
          />
          <MISelectMenu
            variant="outlined"
            sx={{ minWidth: 160 }}
            // label="필터"
            textLabel={categoryFilter === 'all' ? '전체' : categoryFilter}
            items={categoryMenuItems}
            selected={categoryFilter}
            onSelected={(v: CategoryFilterKey) => {
              setCategoryFilter(v)
              resetPage()
            }}
          />
          <Box sx={{ flex: 1 }} />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={activeOnly}
                onChange={(_, checked) => {
                  setActiveOnly(checked)
                  resetPage()
                }}
                sx={{ mt: '1px' }}
              />
            }
            label="활성 이벤트만 보기"
            sx={{ mr: 0, ml: 0.5, whiteSpace: 'nowrap' }}
          />
        </Stack>
        <Stack direction="row" gap="12px" sx={{ flexShrink: 0 }}>
          <MISearchInput
            storageKey="scenario-workbench-events"
            value={keyword}
            placeholder="이벤트명으로 검색"
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onClear={handleSearchClear}
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
