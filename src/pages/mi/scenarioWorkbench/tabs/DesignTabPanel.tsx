import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'
import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import type { EventClassification } from '@/pages/mi/scenarioWorkbench/components/event/types'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import LoadingIcon from '@/components/common/icons/LoadingIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIFilterMenu, { type FilterValues } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MISpinner from '@/components/common/spinner/MISpinner'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import ClassificationTag from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import { buildWorkbenchDatePresets } from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchDateRange'
import { WORKBENCH_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED } from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'
import CreatedScenariosSection, { type CreatedScenarioRow } from '@/pages/mi/scenarioWorkbench/components/design/CreatedScenariosSection'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader, {
  SCENARIO_WORKBENCH_TABLE_HEADER_STICKY_TOP_PX,
} from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import ScenarioWorkbenchEventDetailPage from '@/pages/mi/scenarioWorkbench/EventDetailPage'
import { useScenarioWorkbenchHeaderCollapsed } from '@/pages/mi/scenarioWorkbench/ScenarioWorkbenchHeaderCollapseContext'
import { MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'
import { IPaginationResponse } from '@/types/api'

/** 이벤트 행에 대한 생성된 시나리오 더미 데이터 (API 연동 전 임시) */
const buildCreatedScenariosForEvent = (_row: DesignRow): CreatedScenarioRow[] => [
  {
    id: 1,
    name: '1~2주 내 협상 완료 상황 해소',
    date: '03-01 10:21',
    tags: ['외교협상', '단기해소'],
    jkm: MarketImpactLevel.HIGH,
    ttf: MarketImpactLevel.HIGH,
    hh: MarketImpactLevel.LOW,
    probability: 0.4,
  },
  {
    id: 2,
    name: '수주 내 호르무즈 정상화',
    date: '03-01 10:21',
    tags: ['호르무즈', '수급정상화'],
    jkm: MarketImpactLevel.HIGH,
    ttf: MarketImpactLevel.LOW,
    hh: MarketImpactLevel.LOW,
    probability: 0.8,
  },
  {
    id: 3,
    name: '호르무즈 봉쇄 3개월+ 유지',
    date: '03-01 10:21',
    tags: ['장기봉쇄', '공급충격'],
    isCurrent: true,
    type: 'BC',
    jkm: MarketImpactLevel.HIGH,
    ttf: MarketImpactLevel.HIGH,
    hh: MarketImpactLevel.HIGH,
    probability: 0.8,
  },
  {
    id: 4,
    name: '걸프 LNG 인프라 타격, 복구',
    date: '03-01 10:21',
    tags: ['인프라피해', '복구가능'],
    jkm: MarketImpactLevel.HIGH,
    ttf: MarketImpactLevel.HIGH,
    hh: MarketImpactLevel.LOW,
    probability: 0.6,
  },
  {
    id: 5,
    name: '걸프 LNG 인프라 타격, 미복구',
    date: '03-01 10:21',
    tags: ['인프라피해', '구조적부족'],
    jkm: MarketImpactLevel.HIGH,
    ttf: MarketImpactLevel.HIGH,
    hh: MarketImpactLevel.HIGH,
    probability: 0.4,
  },
]

// ── 타입 ──────────────────────────────────────────────────────────────────────
type ScenarioStatus = 'idle' | 'generating' | 'created'

interface DesignRow {
  id: number
  classification: EventClassification
  occurredAtLabel: string
  category: string
  eventName: string
  jkmImpact: MarketImpactLevel
  jkmDirection: MarketDirection
  ttfImpact: MarketImpactLevel
  ttfDirection: MarketDirection
  hhImpact: MarketImpactLevel
  hhDirection: MarketDirection
  scenarioStatus: ScenarioStatus
}

// ── 셀 컴포넌트 ───────────────────────────────────────────────────────────────

const DetailIconButton = ({ row }: { row: DesignRow }) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const eventIdString = String(row.id)
  /** 콘텐츠 lazy mount: 팝업이 열린 적이 있을 때만 EventDetailPage를 마운트 (API 호출 방지) */
  const [hasMounted, setHasMounted] = useState(false)
  /** mount 완료 후 1회 popup.open()을 자동 호출하기 위한 플래그 */
  const [pendingOpen, setPendingOpen] = useState(false)

  useEffect(() => {
    if (pendingOpen && hasMounted) {
      popupRef.current?.open()
      setPendingOpen(false)
    }
  }, [hasMounted, pendingOpen])

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (hasMounted) {
      popupRef.current?.open()
      return
    }
    setHasMounted(true)
    setPendingOpen(true)
  }

  return (
    <MIMorphingPopup
      ref={popupRef}
      display="inline-flex"
      popup={{
        title: '이벤트 상세',
        content: hasMounted ? (
          <Stack px="12px">
            <ScenarioWorkbenchEventDetailPage eventId={eventIdString} embedded />
          </Stack>
        ) : null,
        showSkeleton: false,
        useInternalScroll: true,
      }}
    >
      <Box width="36px" height="34px" borderRadius="10px" sx={{ display: 'inline-flex' }}>
        <MIBaseButton
          variant="outlined"
          enableHoverBackground
          aria-label="이벤트 상세"
          onClick={handleClick}
          sx={{
            minWidth: '0px',
            width: '36px',
            height: '34px',
            padding: '7px 8px',
            borderRadius: '10px',
            backgroundColor: 'commonColor.White',
          }}
        >
          <OpenInBrowserIcon sx={{ fontSize: 20, color: 'contentIcon.Black' }} />
        </MIBaseButton>
      </Box>
    </MIMorphingPopup>
  )
}

const SCENARIO_ACTION_BUTTON_SX = {
  minWidth: 0,
  height: 34,
  padding: '7px 8px',
  borderRadius: '10px',
  backgroundColor: 'commonColor.White',
  gap: '4px',
  '& .MuiButton-startIcon, & .MuiButton-endIcon': { margin: 0 },
} as const

interface ScenarioActionButtonProps {
  icon: ReactNode
  label: string
  textColor: string
  ariaLabel?: string
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
}

const ScenarioActionButton = ({ icon, label, textColor, ariaLabel, disabled = false, onClick }: ScenarioActionButtonProps) => (
  <MIBaseButton
    variant="outlined"
    enableHoverBackground={!disabled}
    disabled={disabled}
    aria-label={ariaLabel}
    onClick={(e) => {
      e.stopPropagation()
      onClick?.(e)
    }}
    sx={{
      ...SCENARIO_ACTION_BUTTON_SX,
      ...(disabled && {
        '&.Mui-disabled': {
          backgroundColor: 'commonColor.White',
          borderColor: 'contentBorder.Normal',
        },
      }),
    }}
  >
    <Stack direction="row" alignItems="center" gap="4px">
      {icon}
      <Typography variant="body2SB14" sx={{ color: textColor }}>
        {label}
      </Typography>
    </Stack>
  </MIBaseButton>
)

/** 시나리오 생성 전 — 클릭 시 시나리오 생성 (현재는 더미) */
const CreateScenarioButton = ({ onClick }: { onClick?: (e: MouseEvent) => void }) => (
  <ScenarioActionButton
    icon={<AutoAwesomeIcon sx={{ fontSize: 20, color: 'contentIcon.Black' }} />}
    label="생성"
    textColor="contentText.Normal"
    onClick={onClick}
  />
)

/** 시나리오 생성 중 — 진행 표시, 비활성화 */
const GeneratingScenarioButton = () => (
  <ScenarioActionButton
    icon={
      <MISpinner size={20} speed={0.55}>
        <LoadingIcon style={{ width: 20, height: 20 }} />
      </MISpinner>
    }
    label="생성중"
    textColor="contentText.Subtext"
    ariaLabel="시나리오 생성 중"
    disabled
  />
)

/** 시나리오 생성 완료 — 클릭 시 일반 팝업으로 생성된 시나리오 목록 노출 */
const CompletedScenarioPopupButton = ({ row }: { row: DesignRow }) => {
  const [open, setOpen] = useState(false)
  const scenarios = useMemo(() => buildCreatedScenariosForEvent(row), [row])

  const handleClose = () => setOpen(false)

  return (
    <>
      <ScenarioActionButton
        icon={<OpenInBrowserIcon sx={{ fontSize: 20, color: 'mari.Primary' }} />}
        label="완료"
        textColor="mari.Primary"
        ariaLabel="생성된 시나리오 보기"
        onClick={() => setOpen(true)}
      />
      <MIConfirm
        open={open}
        title="생성된 시나리오"
        handleClose={handleClose}
        hideFooter
        width={1024}
        titleSx={{ fontWeight: 600, fontSize: 20 }}
        paperSx={{ maxWidth: '1024px', maxHeight: 'min(800px, 90vh)' }}
        contentSx={{ padding: 0, '&:last-of-type': { paddingBottom: 0 } }}
      >
        <CreatedScenariosSection scenarios={scenarios} />
      </MIConfirm>
    </>
  )
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────

const DUMMY_EVENTS: DesignRow[] = [
  {
    id: 1,
    classification: '갱신',
    occurredAtLabel: '02-28 15:35',
    category: '지정학적 리스크',
    eventName: '미국/이스라엘 이란 공습 개시 (Operation Epic Fury)',
    jkmImpact: MarketImpactLevel.HIGH,
    jkmDirection: MarketDirection.BULLISH,
    ttfImpact: MarketImpactLevel.HIGH,
    ttfDirection: MarketDirection.BULLISH,
    hhImpact: MarketImpactLevel.HIGH,
    hhDirection: MarketDirection.BULLISH,
    scenarioStatus: 'created',
  },
  {
    id: 2,
    classification: '신규',
    occurredAtLabel: '02-28 09:00',
    category: '지정학적 리스크',
    eventName: '호르무즈 해협 군사적 긴장 고조',
    jkmImpact: MarketImpactLevel.HIGH,
    jkmDirection: MarketDirection.BULLISH,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.BULLISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'generating',
  },
  {
    id: 3,
    classification: '신규',
    occurredAtLabel: '02-27 14:30',
    category: '수급밸런스',
    eventName: '카타르 LNG 증산 발표',
    jkmImpact: MarketImpactLevel.MEDIUM,
    jkmDirection: MarketDirection.BEARISH,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.BEARISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.BEARISH,
    scenarioStatus: 'generating',
  },
  {
    id: 4,
    classification: '신규',
    occurredAtLabel: '02-27 09:15',
    category: '수급밸런스',
    eventName: '아시아 LNG 수요 급등',
    jkmImpact: MarketImpactLevel.HIGH,
    jkmDirection: MarketDirection.BULLISH,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.BULLISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
  {
    id: 5,
    classification: '갱신',
    occurredAtLabel: '02-26 16:45',
    category: '수급밸런스',
    eventName: '러시아 가스 공급 재개',
    jkmImpact: MarketImpactLevel.MEDIUM,
    jkmDirection: MarketDirection.BEARISH,
    ttfImpact: MarketImpactLevel.HIGH,
    ttfDirection: MarketDirection.BEARISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
  {
    id: 6,
    classification: '신규',
    occurredAtLabel: '02-26 11:00',
    category: '에너지 믹스 전환',
    eventName: '유럽 에너지 정책 변화',
    jkmImpact: MarketImpactLevel.LOW,
    jkmDirection: MarketDirection.NEGLIGIBLE,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.NEGLIGIBLE,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
  {
    id: 7,
    classification: '갱신',
    occurredAtLabel: '02-25 09:00',
    category: '수급밸런스',
    eventName: '사우디 감산 연장 발표',
    jkmImpact: MarketImpactLevel.HIGH,
    jkmDirection: MarketDirection.BULLISH,
    ttfImpact: MarketImpactLevel.HIGH,
    ttfDirection: MarketDirection.BULLISH,
    hhImpact: MarketImpactLevel.MEDIUM,
    hhDirection: MarketDirection.BULLISH,
    scenarioStatus: 'created',
  },
  {
    id: 8,
    classification: '신규',
    occurredAtLabel: '02-24 14:10',
    category: '수급밸런스',
    eventName: '중국 산업 활동 둔화',
    jkmImpact: MarketImpactLevel.MEDIUM,
    jkmDirection: MarketDirection.BEARISH,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.BEARISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
  {
    id: 9,
    classification: '신규',
    occurredAtLabel: '02-24 10:30',
    category: '수급밸런스',
    eventName: '미 연준 금리 동결 결정',
    jkmImpact: MarketImpactLevel.LOW,
    jkmDirection: MarketDirection.NEGLIGIBLE,
    ttfImpact: MarketImpactLevel.LOW,
    ttfDirection: MarketDirection.NEGLIGIBLE,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
  {
    id: 10,
    classification: '갱신',
    occurredAtLabel: '02-23 16:00',
    category: '인프라/설비',
    eventName: '걸프 LNG 인프라 점검 완료',
    jkmImpact: MarketImpactLevel.MEDIUM,
    jkmDirection: MarketDirection.BEARISH,
    ttfImpact: MarketImpactLevel.MEDIUM,
    ttfDirection: MarketDirection.BEARISH,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.BEARISH,
    scenarioStatus: 'idle',
  },
  {
    id: 11,
    classification: '신규',
    occurredAtLabel: '02-23 09:45',
    category: '기상/기후',
    eventName: '일본 동절기 난방 수요 증가',
    jkmImpact: MarketImpactLevel.LOW,
    jkmDirection: MarketDirection.BULLISH,
    ttfImpact: MarketImpactLevel.LOW,
    ttfDirection: MarketDirection.NEGLIGIBLE,
    hhImpact: MarketImpactLevel.LOW,
    hhDirection: MarketDirection.NEGLIGIBLE,
    scenarioStatus: 'idle',
  },
]

// ── 툴바 옵션 상수 ────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '신규', label: '신규' },
  { value: '갱신', label: '갱신' },
] as const

const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
] as const

const CATEGORY_OPTIONS = ['지정학적 리스크', '기상/기후', '인프라/설비', '수급밸런스', '물류/해운', '에너지 믹스 전환'] as const

const defaultDesignDateRange = (): DateRange => {
  const t = dayjs().startOf('day')
  return { startDate: t.subtract(6, 'month'), endDate: t }
}

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'
const STICKY_SHADOW_AFTER_STICKY_ENGAGE_OFFSET_PX = 2

const measureStickyFlowTopFromScrollContentTop = (scrollEl: HTMLElement, sentinelEl: HTMLElement): number => {
  const s = scrollEl.getBoundingClientRect()
  const e = sentinelEl.getBoundingClientRect()
  return scrollEl.scrollTop + (e.top - s.top)
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const DesignTabPanel = () => {
  const isWorkbenchHeaderCollapsed = useScenarioWorkbenchHeaderCollapsed()
  const stickyShadowSentinelRef = useRef<HTMLDivElement | null>(null)
  const panelLayoutRef = useRef<HTMLDivElement | null>(null)
  const stickyShadowShowMinScrollTopRef = useRef(0)
  const [stickyScrollShadowOpacity, setStickyScrollShadowOpacity] = useState(0)

  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultDesignDateRange())
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [hideCompleted, setHideCompleted] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })

  const filteredRows = useMemo(() => {
    let rows = DUMMY_EVENTS

    if (typeFilter === '신규') rows = rows.filter((r) => r.classification === '신규')
    else if (typeFilter === '갱신') rows = rows.filter((r) => r.classification === '갱신')

    if (categoryFilter.length > 0) rows = rows.filter((r) => categoryFilter.includes(r.category))

    if (hideCompleted) rows = rows.filter((r) => r.scenarioStatus !== 'created')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      rows = rows.filter((r) => r.eventName.toLowerCase().includes(q))
    }

    return rows
  }, [typeFilter, categoryFilter, hideCompleted, searchQuery])

  const pagedRows = useMemo(
    () => filteredRows.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size),
    [filteredRows, pagination.page, pagination.size],
  )

  const totalElements = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalElements / pagination.size))

  const paginationData: IPaginationResponse<DesignRow> = {
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

  // ── 핸들러 ──────────────────────────────────────────────────────────────────

  const handleTypeFilterChange = useCallback((v: string) => {
    setTypeFilter(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSort(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleCategoryFilterApply = useCallback((values: FilterValues) => {
    setCategoryFilter(values.category ?? [])
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleToggleHideCompleted = useCallback(() => {
    setHideCompleted((prev) => !prev)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSearch = useCallback((v: string) => {
    setSearchQuery(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchInput('')
    setSearchQuery('')
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handlePageSizeChange = useCallback((s: number) => {
    setPagination({ size: s, page: 1 })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  // ── 컬럼 정의 ───────────────────────────────────────────────────────────────

  const columns: GridColDef<DesignRow>[] = useMemo(
    () => [
      {
        field: 'classification',
        headerName: '구분',
        width: 70,
        align: 'center',
        headerAlign: 'left',
        sortable: false,
        renderCell: (params) => <ClassificationTag classification={params.row.classification} />,
      },
      {
        field: 'occurredAtLabel',
        headerName: '발생/갱신일시',
        width: 130,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'category',
        headerName: '카테고리',
        width: 160,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'eventName',
        headerName: '이벤트명',
        flex: 1,
        minWidth: 360,
        align: 'left',
        headerAlign: 'left',
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.jkmImpact} direction={params.row.jkmDirection} />,
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.ttfImpact} direction={params.row.ttfDirection} />,
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <ImpactDotsCell level={params.row.hhImpact} direction={params.row.hhDirection} />,
      },
      {
        field: 'detail',
        headerName: '상세',
        width: 60,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <DetailIconButton row={params.row} />,
      },
      {
        field: 'scenarioStatus',
        headerName: '시나리오',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          switch (params.row.scenarioStatus) {
            case 'created':
              return <CompletedScenarioPopupButton row={params.row} />
            case 'generating':
              return <GeneratingScenarioButton />
            case 'idle':
            default:
              return <CreateScenarioButton />
          }
        },
      },
    ],
    [],
  )

  const categoryFilterItems = useMemo(() => CATEGORY_OPTIONS.map((c) => ({ label: c, value: c })), [])

  const workbenchDatePresets = useMemo(() => buildWorkbenchDatePresets(), [])

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
          Design
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ px: 3 }}>
          <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap" sx={{ minWidth: 0, flex: 1 }}>
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
                    title: '',
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
              datePresets={workbenchDatePresets}
            />

            <MISelectMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              selected={sort}
              onSelected={(value: string) => handleSortChange(value)}
              items={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" paddingY={1} gap={0.5}>
              <Switch size="small" checked={hideCompleted} onChange={handleToggleHideCompleted} />
              <Typography variant="body2M14" color="contentText.Black">
                완료 항목 숨기기
              </Typography>
            </Stack>

            <MISearchInput
              storageKey="design-tab-event-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="이벤트명으로 검색"
              onSearch={handleSearch}
              onClear={handleSearchClear}
              width={246}
            />
          </Stack>
        </Stack>

        <ScenarioWorkbenchTableHeader<DesignRow> columns={columns} sx={{ mt: 2 }} />
      </Box>

      <ScenarioWorkbenchDataList<DesignRow>
        rowId="id"
        columns={columns}
        rows={pagedRows}
        rowHeight={42}
        noRowMessage="이벤트가 없습니다."
      />

      <MIPaginationSecondary
        data={paginationData}
        size={pagination.size}
        sizeList={[10, 20, 50, 100]}
        onSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
      />
    </Box>
  )
}

export default DesignTabPanel
