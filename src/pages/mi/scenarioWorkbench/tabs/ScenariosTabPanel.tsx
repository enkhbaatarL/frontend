import { Box, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { CreateType } from '@/service/mi/scenarioWorkbench'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { ScenarioWorkbenchTypeBadge } from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import ProbabilityGaugeCell from '@/pages/mi/scenarioWorkbench/components/common/ProbabilityGaugeCell'
import { WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED } from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'
import { buildWorkbenchEventDatePresets } from '@/pages/mi/scenarioWorkbench/components/event/scenarioWorkbenchEventsDateRange'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader, {
  SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
} from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import { useScenarioWorkbenchHeaderCollapsed } from '@/pages/mi/scenarioWorkbench/ScenarioWorkbenchHeaderCollapseContext'
import { IPaginationResponse } from '@/types/api'

export interface ScenarioRow {
  id: number
  type: CreateType
  /** 'MM-DD HH:mm' 형식 (placeholder '00-00 00:00' 허용) */
  createdAt: string
  name: string
  jkmImpact: number
  ttfImpact: number
  hhImpact: number
  probability: number
  /** 활성 시나리오만 보기 토글용 */
  isActive: boolean
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────

const DUMMY_SCENARIOS: ScenarioRow[] = [
  {
    id: 1,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 5,
    isActive: true,
  },
  {
    id: 2,
    type: 'new',
    createdAt: '03-01 05:32',
    name: '걸프 LNG 인프라 타격, 미복구',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 1,
    probability: 4,
    isActive: true,
  },
  {
    id: 3,
    type: 'new',
    createdAt: '02-28 12:54',
    name: '호르무즈 봉쇄 3개월+ 유지',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 3,
    isActive: true,
  },
  {
    id: 4,
    type: 'updated',
    createdAt: '00-00 00:00',
    name: '시나리오명 4',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 0,
    probability: 2,
    isActive: true,
  },
  {
    id: 5,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명 5',
    jkmImpact: 2,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 1,
    isActive: false,
  },
  {
    id: 6,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 7,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 3,
    probability: 5,
    isActive: true,
  },
  {
    id: 8,
    type: 'new',
    createdAt: '02-25 09:10',
    name: '사우디 감산 발표',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 9,
    type: 'updated',
    createdAt: '01-15 09:22',
    name: '유럽 가스 수요 급감',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 1,
    probability: 3,
    isActive: true,
  },
  {
    id: 10,
    type: 'new',
    createdAt: '01-20 14:00',
    name: '중동 지정학적 안정화',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 0,
    probability: 2,
    isActive: true,
  },
  {
    id: 11,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 3,
    hhImpact: 3,
    probability: 5,
    isActive: true,
  },
  {
    id: 12,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 0,
    ttfImpact: 0,
    hhImpact: 0,
    probability: 1,
    isActive: false,
  },
  {
    id: 13,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 2,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 3,
    isActive: true,
  },
  {
    id: 14,
    type: 'updated',
    createdAt: '02-10 11:30',
    name: '러시아 가스 공급 재개',
    jkmImpact: 2,
    ttfImpact: 3,
    hhImpact: 1,
    probability: 3,
    isActive: true,
  },
  {
    id: 15,
    type: 'new',
    createdAt: '02-14 08:00',
    name: '카타르 LNG 증산 계획',
    jkmImpact: 2,
    ttfImpact: 2,
    hhImpact: 1,
    probability: 4,
    isActive: true,
  },
  {
    id: 16,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 5,
    isActive: true,
  },
  {
    id: 17,
    type: 'new',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 1,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 2,
    isActive: true,
  },
  {
    id: 18,
    type: 'updated',
    createdAt: '00-00 00:00',
    name: '시나리오명',
    jkmImpact: 0,
    ttfImpact: 0,
    hhImpact: 0,
    probability: 1,
    isActive: false,
  },
  {
    id: 19,
    type: 'new',
    createdAt: '03-05 16:45',
    name: '아시아 LNG 수요 급등',
    jkmImpact: 3,
    ttfImpact: 2,
    hhImpact: 2,
    probability: 4,
    isActive: true,
  },
  {
    id: 20,
    type: 'new',
    createdAt: '03-10 07:15',
    name: 'JKM 단기 급락 시나리오',
    jkmImpact: 2,
    ttfImpact: 1,
    hhImpact: 1,
    probability: 2,
    isActive: true,
  },
]

// ── 툴바 옵션 상수 ────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'new', label: '신규' },
  { value: 'updated', label: '갱신' },
] as const

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
] as const

/** 기본 조회 구간: 6개월 (디자인 캡처와 정렬) */
const defaultScenariosDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(6, 'month'), endDate: t }
}

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'
/** sticky 처리 후 스크롤 표시 offset */
const STICKY_SHADOW_AFTER_STICKY_ENGAGE_OFFSET_PX = 2

/** 스크롤 콘텐츠 상단 `scrollTop + (sentinel.top - scrollport.top)` */
const measureStickyFlowTopFromScrollContentTop = (scrollEl: HTMLElement, sentinelEl: HTMLElement): number => {
  const s = scrollEl.getBoundingClientRect()
  const e = sentinelEl.getBoundingClientRect()
  return scrollEl.scrollTop + (e.top - s.top)
}

const ScenariosTabPanel = () => {
  const navigate = useNavigate()
  const isWorkbenchHeaderCollapsed = useScenarioWorkbenchHeaderCollapsed()

  const stickyShadowSentinelRef = useRef<HTMLDivElement | null>(null)
  const panelLayoutRef = useRef<HTMLDivElement | null>(null)
  const stickyShadowShowMinScrollTopRef = useRef(0)

  const [stickyScrollShadowOpacity, setStickyScrollShadowOpacity] = useState(0)

  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultScenariosDateRange())
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

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const filteredRows = useMemo(() => {
    let rows = DUMMY_SCENARIOS

    if (typeFilter === 'new') {
      rows = rows.filter((r) => r.type === 'new')
    } else if (typeFilter === 'updated') {
      rows = rows.filter((r) => r.type === 'updated')
    }

    const trimmed = committedKeyword.trim().toLowerCase()
    if (trimmed) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(trimmed))
    }

    return rows
  }, [typeFilter, committedKeyword])

  const pagedRows = useMemo(
    () => filteredRows.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size),
    [filteredRows, pagination.page, pagination.size],
  )

  const totalElements = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pagination.size))

  const paginationData: IPaginationResponse<ScenarioRow> = {
    totalPages,
    totalElements,
    currentPage: pagination.page,
    numberOfElements: pagedRows.length,
    size: pagination.size,
    isFirst: pagination.page === 1,
    isLast: pagination.page === totalPages,
    hasPrevious: pagination.page > 1,
    hasNext: pagination.page < totalPages,
    detail: pagedRows,
  }

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const updateStickyShadowScrollThreshold = useCallback(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const sentinel = stickyShadowSentinelRef.current
    if (!scrollEl || !sentinel) return
    const flowTopD = measureStickyFlowTopFromScrollContentTop(scrollEl, sentinel)
    const minScroll = Math.max(0, flowTopD - SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX + STICKY_SHADOW_AFTER_STICKY_ENGAGE_OFFSET_PX)
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

  const handleSortChange = useCallback((value: string) => {
    setSort(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleRowClick = useCallback(
    (params: { row: ScenarioRow }) => navigate(`/mi/scenario-workbench/scenarios/${params.row.id}`),
    [navigate],
  )

  const handlePageSizeChange = useCallback((s: number) => {
    setPagination({ size: s, page: 1 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const columns: GridColDef<ScenarioRow>[] = useMemo(
    () => [
      {
        field: 'type',
        headerName: '생성타입',
        width: 88,
        align: 'center',
        renderCell: (params) => <ScenarioWorkbenchTypeBadge type={params.row.type} />,
      },
      {
        field: 'createdAt',
        headerName: '생성/갱신일시',
        width: 130,
        align: 'center',
      },
      {
        field: 'name',
        headerName: '시나리오명',
        flex: 1,
        minWidth: 360,
        align: 'left',
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.jkmImpact} />,
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.ttfImpact} />,
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        renderCell: (params) => <ImpactDotsCell level={params.row.hhImpact} />,
      },
      {
        field: 'probability',
        headerName: '가능성',
        width: 120,
        align: 'center',
        renderCell: (params) => <ProbabilityGaugeCell level={params.row.probability} />,
      },
    ],
    [],
  )

  const workbenchEventDatePresets = useMemo(() => buildWorkbenchEventDatePresets(), [])

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
        <Stack direction="column" gap="12px">
          <Stack py="6px">
            <Typography variant="heading2" fontSize={26} gap={1.5} sx={{ px: 3 }}>
              Scenarios
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" sx={{ minWidth: 0, flex: 1 }}>
              <MISlidingSegmented
                options={TYPE_FILTER_OPTIONS}
                value={typeFilter}
                onChange={handleTypeFilterChange}
                sx={{ '& .MuiTypography-root': { whiteSpace: 'nowrap' } }}
              />

              <MIDateRangePickerMenu
                dateRange={appliedDateRange}
                onApply={handleDateRangeApply}
                showPreset
                datePresets={workbenchEventDatePresets}
              />

              <MISelectMenu
                variant="outlined"
                buttonHoverBgColor="gray.20"
                selected={sort}
                onSelected={(value: string) => handleSortChange(value)}
                items={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
              />
            </Stack>

            <Stack direction="row" alignItems="center" sx={{ flexShrink: 0 }}>
              <MISearchInput
                storageKey="scenario-workbench-scenarios"
                value={keyword}
                onChange={handleSearchChange}
                placeholder="시나리오명으로 검색"
                onSearch={handleSearch}
                onClear={handleSearchClear}
                width={246}
              />
            </Stack>
          </Stack>
        </Stack>
        <ScenarioWorkbenchTableHeader<ScenarioRow> columns={columns} sx={{ mt: '8px', mb: '8px' }} />
      </Box>

      <ScenarioWorkbenchDataList<ScenarioRow>
        rowId="id"
        columns={columns}
        rows={paginationData.detail}
        skeletonRowCount={pagination.size}
        rowHeight={42}
        noRowMessage="시나리오를 생성해 주세요."
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

export default ScenariosTabPanel
