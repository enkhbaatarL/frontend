import { Box, FormControlLabel, Stack, Switch } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EventClassificationTag from '../components/event/EventClassificationTag'
import EventMarketDirectionCell from '../components/event/EventMarketDirectionCell'
import EventMarketImpactCell from '../components/event/EventMarketImpactCell'
import { SCENARIO_WORKBENCH_EVENT_MOCK_ROWS } from '../components/event/eventMockData'
import EventsClassificationFilter from '../components/event/EventsClassificationFilter'

import type { EventsClassificationFilterValue, ScenarioWorkbenchEventRow } from '../components/event/types'

import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import { IPaginationResponse } from '@/types/api'

type SortOrder = 'latest' | 'oldest'
type PeriodKey = '1m' | '3m' | '6m' | 'all'
type CategoryFilterKey = 'all' | '지정학적 리스크' | '수급밸런스'

const parseOccurredAtLabel = (label: string) => {
  const [datePart] = label.split(' ')
  if (!datePart) return null
  const [mm, dd] = datePart.split('-')
  if (!mm || !dd) return null
  const y = dayjs().year()
  return dayjs(`${y}-${mm}-${dd}`)
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

  const filteredRows = useMemo(() => {
    let rows: ScenarioWorkbenchEventRow[] =
      classificationFilter === 'all'
        ? SCENARIO_WORKBENCH_EVENT_MOCK_ROWS
        : SCENARIO_WORKBENCH_EVENT_MOCK_ROWS.filter((row) => row.classification === classificationFilter)

    if (activeOnly) {
      rows = rows.filter((row) => row.isActive)
    }

    if (categoryFilter !== 'all') {
      rows = rows.filter((row) => row.category === categoryFilter)
    }

    if (period !== 'all') {
      const months = period === '1m' ? 1 : period === '3m' ? 3 : 6
      const cutoff = dayjs().subtract(months, 'month').startOf('day')
      rows = rows.filter((row) => {
        const d = parseOccurredAtLabel(row.occurredAtLabel)
        return d !== null && (d.isAfter(cutoff) || d.isSame(cutoff, 'day'))
      })
    }

    const q = committedKeyword.trim().toLowerCase()
    if (q) {
      rows = rows.filter((row) => row.eventName.toLowerCase().includes(q))
    }

    const sorted = [...rows].sort((a, b) => {
      const da = parseOccurredAtLabel(a.occurredAtLabel)?.valueOf() ?? 0
      const db = parseOccurredAtLabel(b.occurredAtLabel)?.valueOf() ?? 0
      return sortOrder === 'latest' ? db - da : da - db
    })

    return sorted
  }, [activeOnly, categoryFilter, classificationFilter, committedKeyword, period, sortOrder])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRows.length / pagination.size)), [filteredRows.length, pagination.size])

  // 필터링 결과가 줄어들어 현재 페이지 번호가 전체 페이지 수보다 커지는 경우를 대비한 안전 장치
  // 예: 5페이지를 보다가 검색어로 인해 전체가 1페이지로 줄어들면 safePage는 1이 됨
  const safePage = Math.min(pagination.page, totalPages)

  useEffect(() => {
    // 현재 페이지가 유효 범위를 벗어났다면(safePage와 다르다면) 유효한 마지막 페이지로 보정
    if (pagination.page !== safePage) {
      setPagination((p) => ({ ...p, page: safePage }))
    }
  }, [pagination.page, safePage])

  const paginatedRows = useMemo(() => {
    // 실제 렌더링 시에도 safePage를 기준으로 slice 하여 데이터 부재 오류 방지
    const page = Math.min(pagination.page, totalPages)
    const start = (page - 1) * pagination.size
    return filteredRows.slice(start, start + pagination.size)
  }, [filteredRows, pagination.page, pagination.size, totalPages])

  const paginationData: IPaginationResponse<ScenarioWorkbenchEventRow> | undefined = useMemo(() => {
    if (filteredRows.length === 0) return undefined
    const page = safePage
    return {
      detail: paginatedRows,
      currentPage: page,
      totalPages,
      totalElements: filteredRows.length,
      numberOfElements: paginatedRows.length,
      size: pagination.size,
      isFirst: page === 1,
      isLast: page === totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    }
  }, [filteredRows.length, paginatedRows, pagination.size, safePage, totalPages])

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
          rows={paginatedRows}
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
