import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import { Box, Skeleton, Stack, Typography, useMediaQuery } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { IScenarioPriceForecast } from '@/service/mi/nextGenMI/scenario'

import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { NextGenMIBaseCaseChip, NextGenMINoiseSignalBadge } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/nextGenMI/components/common/ImpactDotsCell'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import { buildNextGenMIDatePresets, defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import { NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED } from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIEventDetailTableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMIEventDetailTableBodyText'
import { buildDistinctSeriesColors } from '@/pages/mi/nextGenMI/components/common/nextGenMISeriesColors'
import ProbabilityGaugeCell from '@/pages/mi/nextGenMI/components/common/ProbabilityGaugeCell'
import {
  findIndexImpact,
  formatNextGenMIDateTime,
  NEXT_GEN_MI_LIST_SORT_OPTIONS,
} from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioSummaryChart, { scenarioForecastVisibilityKey } from '@/pages/mi/nextGenMI/components/common/ScenarioSummaryChart'
import EventDetailSectionHeader from '@/pages/mi/nextGenMI/components/event/EventDetailSectionHeader'
import { OverviewEventFirstAccordionList } from '@/pages/mi/nextGenMI/components/overview/OverviewEventFirstAccordion'
import { OverviewScenarioFirstAccordionList } from '@/pages/mi/nextGenMI/components/overview/OverviewScenarioFirstAccordion'
import { EventCategoryLv1, EVENT_CATEGORY_LV1_KO, ListSort, MarketDirection } from '@/service/mi/nextGenMI/common'
import nextGenMIOverviewService, {
  type IOverviewEventItem,
  type IOverviewPriceForecastRes,
  type IOverviewScenarioItem,
  type OverviewPriceIndexName,
} from '@/service/mi/nextGenMI/overview'

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'
const OVERVIEW_STICKY_INSET_TOP_PX = 138

const VIEW_MODE_OPTIONS = [
  { value: 'event' as const, label: 'Event First' },
  { value: 'scenario' as const, label: 'Scenario First' },
]

const SORT_OPTIONS_MENU = NEXT_GEN_MI_LIST_SORT_OPTIONS.map(({ value, label }) => ({ value, label }))

const INDEX_SEGMENT_OPTIONS: { value: OverviewPriceIndexName; label: OverviewPriceIndexName }[] = [
  { value: 'JKM', label: 'JKM' },
  { value: 'TTF', label: 'TTF' },
  { value: 'HH', label: 'HH' },
]

const OVERVIEW_CANVAS_LEFT_COLUMN_WIDTH_PX = 700
const OVERVIEW_CANVAS_RIGHT_COLUMN_WIDTH_PX = 642
const OVERVIEW_CANVAS_ROW_GAP_PX = 38
const OVERVIEW_CANVAS_BODY_VERTICAL_PADDING_PX = 12
const OVERVIEW_SECTION_HEADER_HEIGHT_PX = 36
const OVERVIEW_SECTION_HEADER_TO_BODY_GAP_PX = 8
const OVERVIEW_FILTER_TABLE_GAP_PX = 8
const OVERVIEW_DATA_LIST_EDGE_PADDING_X_PX = 8
const OVERVIEW_SCENARIO_LEGEND_COLUMN_WIDTH_PX = 22
const OVERVIEW_ROW_SPACER_COLUMN_WIDTH_PX = 36
const OVERVIEW_ROW_SPACER_FIELD = '__overviewRowSpacer'
const OVERVIEW_SCENARIO_LEGEND_FIELD = '__overviewScenarioLegend'
const OVERVIEW_SCENARIO_PROBABILITY_BAR_WIDTH_PX = 4

const OVERVIEW_SCENARIO_LEGEND_COLORS = [
  '#1B73B7',
  '#078D72',
  '#DE9632',
  '#C3407A',
  '#9E2628',
  '#2D99A7',
  '#7E5AC4',
  '#B59702',
  '#3E8B44',
  '#6B6A65',
] as const

const OVERVIEW_STICKY_TOP_AIR_GAP_PX = 14

const OVERVIEW_STICKY_DISABLE_MAX_VIEWPORT_HEIGHT_PX = 620

const OVERVIEW_CHART_STICKY_SECTION_OFFSET_PX =
  OVERVIEW_STICKY_TOP_AIR_GAP_PX + OVERVIEW_SECTION_HEADER_HEIGHT_PX + OVERVIEW_SECTION_HEADER_TO_BODY_GAP_PX

const EMPTY_CHART_MESSAGE_EVENT_MODE = '이벤트를 선택하면 시나리오별 가격 흐름이 표시됩니다'
const EMPTY_CHART_MESSAGE_SCENARIO_MODE = '시나리오별 표시할 가격 흐름 데이터가 존재하지 않습니다'

const OVERVIEW_EVENT_SCENARIO_FORECAST_COLORS = [
  '#185FA5',
  '#0F8A72',
  '#E09A3A',
  '#C4407A',
  '#A32D2D',
  '#2D99A7',
  '#7E5AC4',
  '#B59702',
  '#3E8B44',
  '#6B6A65',
] as const

const sortForecastSeriesByScenarioOrder = <T extends { scenarioId?: number }>(series: T[], orderedScenarioIds: number[]): T[] => {
  const rank = new Map(orderedScenarioIds.map((id, i) => [id, i]))
  const fallback = orderedScenarioIds.length
  return [...series].sort((a, b) => {
    const ra = typeof a.scenarioId === 'number' ? rank.get(a.scenarioId) : undefined
    const rb = typeof b.scenarioId === 'number' ? rank.get(b.scenarioId) : undefined
    const fa = ra ?? fallback
    const fb = rb ?? fallback
    if (fa !== fb) return fa - fb
    return (a.scenarioId ?? 0) - (b.scenarioId ?? 0)
  })
}

const OVERVIEW_STICKY_BAND_SHADOW_TRANSITION = 'box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1)'

type OverviewViewMode = (typeof VIEW_MODE_OPTIONS)[number]['value']

interface OverviewTabPanelProps {
  enableExpandedRowSticky?: boolean
}

const mapForecastToScenarioPriceForecast = (data?: IOverviewPriceForecastRes): IScenarioPriceForecast => {
  if (!data) return { currency: '', unit: '', dates: [], series: [] }
  return {
    currency: data.currency,
    unit: data.unit,
    dates: data.dates ?? [],
    series: (data.series ?? []).map((line) => ({
      scenarioId: line.scenarioId,
      indexName: line.baseCase ? `${line.scenarioName} · BC` : line.scenarioName,
      values: line.values ?? [],
    })),
  }
}

const EMPTY_OVERVIEW_PRICE_FORECAST: IScenarioPriceForecast = { currency: '', unit: '', dates: [], series: [] }

const buildChartUnitLabel = (fc: IScenarioPriceForecast): string => {
  if (fc.currency && fc.unit) return `Unit: ${fc.currency}/${fc.unit}`
  if (fc.currency) return `Unit: ${fc.currency}`
  if (fc.unit) return `Unit: ${fc.unit}`
  return ''
}

const formatScenarioTags = (tags: string[] | undefined): string => {
  if (!tags?.length) return ''
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ')
}

const OverviewScenarioLegendCell = ({ color }: { color: string }) => (
  <Box width="100%" display="flex" alignItems="center" justifyContent="center">
    <Box width={18} height={4} borderRadius="100px" bgcolor={color} />
  </Box>
)

const OverviewTabPanel = ({ enableExpandedRowSticky = false }: OverviewTabPanelProps) => {
  const navigate = useNavigate()
  const overviewStickyInsetTopPx = OVERVIEW_STICKY_INSET_TOP_PX

  const disableOverviewStickyBand = useMediaQuery(`(max-height: ${OVERVIEW_STICKY_DISABLE_MAX_VIEWPORT_HEIGHT_PX}px)`)
  const isOverviewDesktopLayout = useMediaQuery('(min-width: 900px)')

  const [viewMode, setViewMode] = useState<OverviewViewMode>('event')
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)

  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
  const [pagination, setPagination] = useState({ page: 1, size: 10 })
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)
  const [overviewIndexName, setOverviewIndexName] = useState<OverviewPriceIndexName>('JKM')
  const [overviewStickyBandShowsShadow, setOverviewStickyBandShowsShadow] = useState(false)
  const [overviewExpandedRowStickyTopPx, setOverviewExpandedRowStickyTopPx] = useState<number | undefined>(undefined)
  const [overviewForecastScenarioHoverId, setOverviewForecastScenarioHoverId] = useState<number | null>(null)
  const [overviewScenarioListHoverId, setOverviewScenarioListHoverId] = useState<number | null>(null)

  const nextGenMIDatePresets = useMemo(() => buildNextGenMIDatePresets(), [])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  const listRequestCommon = useMemo(() => {
    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultNextGenMIDateRange()
    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: resolvedRange.startDate!.startOf('day').format('YYYY-MM-DD'),
      endDate: resolvedRange.endDate!.endOf('day').format('YYYY-MM-DD'),
    }
  }, [appliedDateRange, pagination.page, pagination.size, sort])

  const eventsQueryEnabled = viewMode === 'event'
  const scenariosQueryEnabled = viewMode === 'scenario'

  const {
    data: overviewEvents,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useQuery({
    queryKey: ['nextGenMIOverviewEvents', viewMode, listRequestCommon],
    queryFn: () => nextGenMIOverviewService.getEvents(listRequestCommon),
    enabled: eventsQueryEnabled,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const {
    data: overviewScenarios,
    isLoading: scenariosLoading,
    isError: scenariosError,
  } = useQuery({
    queryKey: ['nextGenMIOverviewScenarios', viewMode, listRequestCommon],
    queryFn: () => nextGenMIOverviewService.getScenarios(listRequestCommon),
    enabled: scenariosQueryEnabled,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    const tpEvents = overviewEvents?.events?.totalPages
    const tpScenarios = overviewScenarios?.scenarios?.totalPages
    const tp = viewMode === 'event' ? tpEvents : tpScenarios
    if (tp !== undefined && tp > 0 && pagination.page > tp) {
      setPagination((p) => ({ ...p, page: tp }))
    }
  }, [overviewEvents?.events?.totalPages, overviewScenarios?.scenarios?.totalPages, pagination.page, viewMode])

  useEffect(() => {
    setOverviewForecastScenarioHoverId(null)
  }, [selectedEventId])

  useEffect(() => {
    setOverviewScenarioListHoverId(null)
  }, [selectedScenarioId])

  useEffect(() => {
    setOverviewForecastScenarioHoverId(null)
    setOverviewScenarioListHoverId(null)
  }, [viewMode])

  const overviewLeftColumnRef = useRef<HTMLDivElement>(null)
  const overviewLeftStickyHeaderRef = useRef<HTMLDivElement>(null)
  const overviewStickyStartMarkerRef = useRef<HTMLDivElement>(null)
  const overviewRightStickyColumnRef = useRef<HTMLDivElement>(null)
  const overviewRightStickyContentRef = useRef<HTMLDivElement>(null)
  const pendingViewModeStickySnapRef = useRef(false)

  const getOverviewStickyStartScrollTop = useCallback(() => {
    if (disableOverviewStickyBand) return null

    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const markerEl = overviewStickyStartMarkerRef.current
    if (!scrollEl || !markerEl) return null

    const scrollRect = scrollEl.getBoundingClientRect()
    const markerRect = markerEl.getBoundingClientRect()
    const stickyStartTop = scrollEl.scrollTop + markerRect.top - scrollRect.top - overviewStickyInsetTopPx
    const maxTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)

    return Math.min(Math.max(0, stickyStartTop), maxTop)
  }, [disableOverviewStickyBand, overviewStickyInsetTopPx])

  const isOverviewStickyActive = useCallback(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const stickyStartTop = getOverviewStickyStartScrollTop()
    if (!scrollEl || stickyStartTop === null) return false

    return scrollEl.scrollTop > stickyStartTop + 1
  }, [getOverviewStickyStartScrollTop])

  const syncOverviewStickyBandShadow = useCallback(() => {
    if (disableOverviewStickyBand) {
      setOverviewStickyBandShowsShadow(false)
      return
    }
    setOverviewStickyBandShowsShadow(isOverviewStickyActive())
  }, [disableOverviewStickyBand, isOverviewStickyActive])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (!scrollEl) return undefined

    syncOverviewStickyBandShadow()
    scrollEl.addEventListener('scroll', syncOverviewStickyBandShadow, { passive: true })
    globalThis.addEventListener('resize', syncOverviewStickyBandShadow)
    return () => {
      scrollEl.removeEventListener('scroll', syncOverviewStickyBandShadow)
      globalThis.removeEventListener('resize', syncOverviewStickyBandShadow)
    }
  }, [syncOverviewStickyBandShadow])

  const snapOverviewScrollToStickyStart = useCallback(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const stickyStartTop = getOverviewStickyStartScrollTop()
    if (!scrollEl || stickyStartTop === null) return

    scrollEl.scrollTo({ top: stickyStartTop, behavior: 'auto' })
  }, [getOverviewStickyStartScrollTop])

  useLayoutEffect(() => {
    const columnEl = overviewLeftColumnRef.current
    const stickyEl = overviewLeftStickyHeaderRef.current
    if (!columnEl || !stickyEl) return undefined

    if (disableOverviewStickyBand || !isOverviewDesktopLayout) {
      columnEl.style.removeProperty('--overview-left-sticky-bound-height')
      columnEl.style.removeProperty('--overview-left-sticky-natural-height')
      setOverviewExpandedRowStickyTopPx(undefined)
      return undefined
    }

    const rightColumnEl = overviewRightStickyColumnRef.current
    const chartEl = overviewRightStickyContentRef.current
    if (!rightColumnEl || !chartEl) return undefined

    let rafId = 0

    const measure = () => {
      rafId = 0
      const stickyHeight = stickyEl.getBoundingClientRect().height
      const chartHeight = chartEl.getBoundingClientRect().height
      const rightColumnHeight = rightColumnEl.getBoundingClientRect().height
      const expandedRowStickyTopPx = enableExpandedRowSticky ? overviewStickyInsetTopPx + stickyHeight : undefined

      const delta = OVERVIEW_CHART_STICKY_SECTION_OFFSET_PX + chartHeight - stickyHeight
      const boundHeight = Math.max(stickyHeight, rightColumnHeight - delta)

      columnEl.style.setProperty('--overview-left-sticky-bound-height', `${boundHeight.toFixed(3)}px`)
      columnEl.style.setProperty('--overview-left-sticky-natural-height', `${stickyHeight.toFixed(3)}px`)
      setOverviewExpandedRowStickyTopPx((current) => {
        if (expandedRowStickyTopPx === undefined) return current === undefined ? current : undefined
        if (current !== undefined && Math.abs(current - expandedRowStickyTopPx) < 0.5) return current
        return expandedRowStickyTopPx
      })
    }

    const scheduleMeasure = () => {
      if (rafId !== 0) return
      rafId = globalThis.requestAnimationFrame(measure)
    }

    measure()
    const ro = new ResizeObserver(scheduleMeasure)
    ro.observe(stickyEl)
    ro.observe(chartEl)
    ro.observe(rightColumnEl)
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      columnEl.style.removeProperty('--overview-left-sticky-bound-height')
      columnEl.style.removeProperty('--overview-left-sticky-natural-height')
      ro.disconnect()
      globalThis.removeEventListener('resize', scheduleMeasure)
    }
  }, [disableOverviewStickyBand, enableExpandedRowSticky, isOverviewDesktopLayout, overviewStickyInsetTopPx])

  const eventRows = useMemo(() => overviewEvents?.events?.detail ?? [], [overviewEvents?.events?.detail])
  const scenarioRows = useMemo(() => overviewScenarios?.scenarios?.detail ?? [], [overviewScenarios?.scenarios?.detail])

  const scenarioLegendColorById = useMemo(() => {
    const colors = buildDistinctSeriesColors(OVERVIEW_SCENARIO_LEGEND_COLORS, scenarioRows.length)
    return new Map(scenarioRows.map((row, idx) => [row.scenarioId, colors[idx]!]))
  }, [scenarioRows])

  const chartQueryEnabled = viewMode === 'event' ? selectedEventId !== null : scenarioRows.length > 0

  const scenarioIdsForForecast = useMemo(() => scenarioRows.map((r) => r.scenarioId), [scenarioRows])

  const {
    data: priceForecastRes,
    isLoading: forecastLoading,
    isFetching,
    isPlaceholderData,
  } = useQuery({
    queryKey: [
      'nextGenMIOverviewPriceForecast',
      viewMode,
      overviewIndexName,
      viewMode === 'event' ? selectedEventId : null,
      viewMode === 'scenario' ? scenarioIdsForForecast.join(',') : null,
      listRequestCommon.startDate,
      listRequestCommon.endDate,
    ],
    queryFn: () =>
      nextGenMIOverviewService.getPriceForecast({
        indexName: overviewIndexName,
        ...(viewMode === 'event' && selectedEventId !== null ? { eventId: selectedEventId } : {}),
        ...(viewMode === 'scenario' && scenarioIdsForForecast.length > 0 ? { scenarioIds: scenarioIdsForForecast } : {}),
      }),
    enabled: chartQueryEnabled,
    refetchOnWindowFocus: false,
    gcTime: 0,
    placeholderData: keepPreviousData,
  })

  const rawScenarioPriceForecast = useMemo(() => mapForecastToScenarioPriceForecast(priceForecastRes), [priceForecastRes])

  const selectedEventScenarioOrderIds = useMemo(() => {
    if (selectedEventId === null) return []
    const ev = eventRows.find((e) => e.eventId === selectedEventId)
    return (ev?.scenarios ?? []).map((s) => s.scenarioId)
  }, [eventRows, selectedEventId])

  const scenarioPriceForecast = useMemo(() => {
    if (!chartQueryEnabled) return EMPTY_OVERVIEW_PRICE_FORECAST
    if (rawScenarioPriceForecast.series.length === 0) return rawScenarioPriceForecast
    if (viewMode === 'event' && selectedEventScenarioOrderIds.length > 0) {
      return {
        ...rawScenarioPriceForecast,
        series: sortForecastSeriesByScenarioOrder(rawScenarioPriceForecast.series, selectedEventScenarioOrderIds),
      }
    }
    if (viewMode === 'scenario' && scenarioIdsForForecast.length > 0) {
      return {
        ...rawScenarioPriceForecast,
        series: sortForecastSeriesByScenarioOrder(rawScenarioPriceForecast.series, scenarioIdsForForecast),
      }
    }
    return rawScenarioPriceForecast
  }, [chartQueryEnabled, rawScenarioPriceForecast, scenarioIdsForForecast, selectedEventScenarioOrderIds, viewMode])

  const eventForecastColorByScenarioId = useMemo(() => {
    const m = new Map<number, string>()
    if (selectedEventId === null) return m
    const ev = eventRows.find((e) => e.eventId === selectedEventId)
    const scenarios = ev?.scenarios ?? []
    const colors = buildDistinctSeriesColors(OVERVIEW_EVENT_SCENARIO_FORECAST_COLORS, scenarios.length)
    scenarios.forEach((s, idx) => {
      m.set(s.scenarioId, colors[idx]!)
    })
    return m
  }, [eventRows, selectedEventId])

  const overviewChartColorMap = useMemo(() => {
    const fallbackColors = buildDistinctSeriesColors(OVERVIEW_SCENARIO_LEGEND_COLORS, scenarioPriceForecast.series.length)
    const m = new Map<string, string>()
    scenarioPriceForecast.series.forEach((s, idx) => {
      let color: string | undefined
      if (typeof s.scenarioId === 'number') {
        color = viewMode === 'event' ? eventForecastColorByScenarioId.get(s.scenarioId) : scenarioLegendColorById.get(s.scenarioId)
      }
      if (!color) {
        color = fallbackColors[idx] ?? OVERVIEW_SCENARIO_LEGEND_COLORS[0]
      }
      m.set(s.indexName, color)
    })
    return m
  }, [eventForecastColorByScenarioId, scenarioLegendColorById, scenarioPriceForecast.series, viewMode])

  const chartLinkedHighlightVisibilityKey = useMemo(() => {
    if (viewMode === 'event') {
      return overviewForecastScenarioHoverId === null ? null : scenarioForecastVisibilityKey(overviewForecastScenarioHoverId)
    }
    const sid = overviewScenarioListHoverId ?? selectedScenarioId
    return sid === null ? null : scenarioForecastVisibilityKey(sid)
  }, [overviewForecastScenarioHoverId, overviewScenarioListHoverId, selectedScenarioId, viewMode])

  const hasOverviewChartData = scenarioPriceForecast.series.length > 0 && scenarioPriceForecast.series.some((s) => s.values.length > 0)

  const chartUnitOuter = buildChartUnitLabel(scenarioPriceForecast)

  const emptyChartCopy = viewMode === 'event' ? EMPTY_CHART_MESSAGE_EVENT_MODE : EMPTY_CHART_MESSAGE_SCENARIO_MODE

  const showChartSkeleton = chartQueryEnabled && ((forecastLoading && !priceForecastRes) || (isFetching && isPlaceholderData))

  const resetPage = useCallback(() => {
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleViewModeChange = useCallback(
    (v: string) => {
      if (v === 'event' || v === 'scenario') {
        if (v === viewMode) return

        pendingViewModeStickySnapRef.current = isOverviewStickyActive()
        setViewMode(v)
        setSelectedEventId(null)
        setSelectedScenarioId(null)
        resetPage()
      }
    },
    [isOverviewStickyActive, resetPage, viewMode],
  )

  useLayoutEffect(() => {
    if (!pendingViewModeStickySnapRef.current) return

    pendingViewModeStickySnapRef.current = false
    snapOverviewScrollToStickyStart()
  }, [snapOverviewScrollToStickyStart, viewMode])

  const handleDateRangeApply = useCallback(
    (dates: DateRange) => {
      setAppliedDateRange({
        startDate: dates.startDate,
        endDate: dates.endDate,
      })
      resetPage()
    },
    [resetPage],
  )

  const handleSortChange = useCallback(
    (next: ListSort) => {
      setSort(next)
      resetPage()
    },
    [resetPage],
  )

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination({ page: 1, size })
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }))
  }, [])

  const handleEventRowClick = useCallback((row: IOverviewEventItem) => {
    setSelectedScenarioId(null)
    setSelectedEventId(row.eventId)
  }, [])

  const handleEventAccordionCollapse = useCallback(() => {
    setSelectedEventId(null)
  }, [])

  const handleScenarioRowClick = useCallback((row: IOverviewScenarioItem) => {
    setSelectedEventId(null)
    setSelectedScenarioId(row.scenarioId)
  }, [])

  const handleScenarioAccordionCollapse = useCallback(() => {
    setSelectedScenarioId(null)
  }, [])

  const handleOverviewEventSummaryDetailShortcut = useCallback(
    (row: IOverviewEventItem) => {
      navigate(`/mi/next-gen-mi/events/${row.eventId}`)
    },
    [navigate],
  )

  const handleOverviewScenarioSummaryDetailShortcut = useCallback(
    (row: IOverviewScenarioItem) => {
      navigate(`/mi/next-gen-mi/scenarios/${row.scenarioId}`)
    },
    [navigate],
  )

  const categoryLabel = useCallback((code: EventCategoryLv1 | undefined, labelFromApi?: string) => {
    const trimmed = labelFromApi?.trim()
    if (trimmed) return trimmed
    if (code === undefined || code === null) return '-'
    return EVENT_CATEGORY_LV1_KO[code as EventCategoryLv1] ?? String(code)
  }, [])

  const eventColumns: GridColDef<IOverviewEventItem>[] = useMemo(
    () => [
      {
        field: 'eventName',
        headerName: '이벤트',
        flex: 1,
        minWidth: 220,
        sortable: false,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params: GridRenderCellParams<IOverviewEventItem>) => {
          const row = params.row
          const timeLabel = formatNextGenMIDateTime(row.updatedAt ?? row.createdAt)
          const cat = categoryLabel(row.eventCategoryLv1, row.eventCategoryLv1Label)
          const noise = nextGenMIIsEventNoiseSignal(row.signalType)
          return (
            <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%">
              <Stack direction="row" alignItems="center" gap="8px" minWidth={0} width="100%" height="22px">
                <NextGenMIEventDetailTableBodyText
                  value={row.eventName}
                  tooltipWhenTruncated
                  sx={{
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    minWidth: 0,
                    flex: '0 1 auto',
                    width: 'auto',
                    color: 'contentText.Normal',
                  }}
                />
                {noise && (
                  <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0 }}>
                    <NextGenMINoiseSignalBadge label={row.signalTypeLabel ?? '소음'} />
                  </Box>
                )}
              </Stack>
              <Typography
                fontSize={12}
                fontWeight={500}
                lineHeight={1.4}
                color="contentText.Subtext"
                noWrap
                sx={{ minWidth: 0, width: '100%' }}
              >
                {timeLabel} | {cat}
              </Typography>
            </Stack>
          )
        },
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
        },
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
        },
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'HH')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction as MarketDirection | undefined} size={7} />
        },
      },
      {
        field: OVERVIEW_ROW_SPACER_FIELD,
        headerName: '',
        width: OVERVIEW_ROW_SPACER_COLUMN_WIDTH_PX,
        sortable: false,
        renderCell: () => null,
      },
    ],
    [categoryLabel],
  )

  const scenarioColumns: GridColDef<IOverviewScenarioItem>[] = useMemo(
    () => [
      {
        field: OVERVIEW_SCENARIO_LEGEND_FIELD,
        headerName: '',
        width: OVERVIEW_SCENARIO_LEGEND_COLUMN_WIDTH_PX,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => (
          <OverviewScenarioLegendCell color={scenarioLegendColorById.get(params.row.scenarioId) ?? OVERVIEW_SCENARIO_LEGEND_COLORS[0]} />
        ),
      },
      {
        field: 'scenarioName',
        headerName: '시나리오',
        flex: 1,
        minWidth: 200,
        sortable: false,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params: GridRenderCellParams<IOverviewScenarioItem>) => {
          const row = params.row
          const timeLabel = formatNextGenMIDateTime(row.updatedAt ?? row.createdAt)
          const tagLabel = formatScenarioTags(row.tags)

          return (
            <Stack alignItems="flex-start" gap="4px" minWidth={0} width="100%">
              <Stack direction="row" alignItems="center" gap="8px" minWidth={0} width="100%" height="22px">
                <NextGenMIEventDetailTableBodyText
                  value={row.scenarioName}
                  tooltipWhenTruncated
                  sx={{
                    fontSize: 16,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    minWidth: 0,
                    flex: '0 1 auto',
                    width: 'auto',
                    color: 'contentText.Normal',
                  }}
                />
                {row.baseCase && (
                  <Box sx={{ flex: '0 0 auto', display: 'inline-flex', lineHeight: 0 }}>
                    <NextGenMIBaseCaseChip />
                  </Box>
                )}
              </Stack>
              <Typography
                fontSize={12}
                fontWeight={500}
                lineHeight={1.4}
                color="contentText.Subtext"
                noWrap
                sx={{ minWidth: 0, width: '100%' }}
              >
                {[timeLabel, tagLabel].filter(Boolean).join(' | ') || '-'}
              </Typography>
            </Stack>
          )
        },
      },
      {
        field: 'jkmImpact',
        headerName: 'JKM',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: 'ttfImpact',
        headerName: 'TTF',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: 'hhImpact',
        headerName: 'HH',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'HH')
          return <ImpactDotsCell level={impact?.marketImpactLevel} size={7} />
        },
      },
      {
        field: 'probabilityLabel',
        headerName: '가능성',
        width: 64,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => (
          <ProbabilityGaugeCell probability={params.row.probability} barWidth={OVERVIEW_SCENARIO_PROBABILITY_BAR_WIDTH_PX} />
        ),
      },
      {
        field: OVERVIEW_ROW_SPACER_FIELD,
        headerName: '',
        width: OVERVIEW_ROW_SPACER_COLUMN_WIDTH_PX,
        sortable: false,
        renderCell: () => null,
      },
    ],
    [scenarioLegendColorById],
  )

  const listLoading = eventsQueryEnabled ? eventsLoading : scenariosLoading
  const listError = eventsQueryEnabled ? eventsError : scenariosError

  useLayoutEffect(() => {
    syncOverviewStickyBandShadow()
  }, [syncOverviewStickyBandShadow, viewMode, isOverviewDesktopLayout, eventRows.length, scenarioRows.length, listLoading])

  const emptyListMessage = listError ? '목록을 불러오지 못했습니다.' : viewMode === 'event' ? '이벤트가 없습니다.' : '시나리오가 없습니다.'

  const overviewCanvasGridSx = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        md: `minmax(0, ${OVERVIEW_CANVAS_LEFT_COLUMN_WIDTH_PX}fr) minmax(0, ${OVERVIEW_CANVAS_RIGHT_COLUMN_WIDTH_PX}fr)`,
      },
      alignItems: 'start',
      columnGap: `${OVERVIEW_CANVAS_ROW_GAP_PX}px`,
      rowGap: `${OVERVIEW_CANVAS_ROW_GAP_PX}px`,
      width: '100%',
      minWidth: 0,
    }),
    [],
  )

  const overviewCanvasColumnSx = useMemo(
    () => ({
      width: '100%',
      minWidth: 0,
    }),
    [],
  )

  const overviewSegmentedSx = useMemo(
    () => ({
      p: '4px',
      gap: '4px',
      border: 'none',
      borderRadius: '6px',
      bgcolor: 'gray.20',
      '& > .MuiBox-root': {
        top: 4,
        bottom: 4,
        border: '0.5px solid',
        borderColor: 'contentBorder.Normal',
        borderRadius: '6px',
        boxShadow: 'none',
      },
      '& button': {
        height: 28,
        minHeight: 28,
        px: '6px',
        py: '4px',
        borderRadius: '6px',
      },
      '& .MuiTypography-root': { whiteSpace: 'nowrap' },
    }),
    [],
  )

  const overviewTableHeaderSx = useMemo(
    () => ({
      bgcolor: 'commonColor.White',
      px: `${OVERVIEW_DATA_LIST_EDGE_PADDING_X_PX}px`,
      boxSizing: 'border-box',
    }),
    [],
  )

  const overviewDataListRowSx = useMemo(
    () => ({
      px: `${OVERVIEW_DATA_LIST_EDGE_PADDING_X_PX}px`,
      py: '4px',
      boxSizing: 'border-box',
    }),
    [],
  )

  const getOverviewEventCellSx = useCallback((params: { field: string }) => {
    if (params.field === OVERVIEW_ROW_SPACER_FIELD) {
      return { px: 0, py: 0 }
    }
    if (params.field === 'jkmImpact' || params.field === 'ttfImpact' || params.field === 'hhImpact') {
      return { px: '8px', py: '6px' }
    }
    return { py: '2px' }
  }, [])

  const getOverviewScenarioCellSx = useCallback((params: { field: string }) => {
    if (params.field === OVERVIEW_SCENARIO_LEGEND_FIELD) {
      return { px: 0, py: 0 }
    }
    if (params.field === 'scenarioName') {
      return { py: '2px' }
    }
    if (
      params.field === 'jkmImpact' ||
      params.field === 'ttfImpact' ||
      params.field === 'hhImpact' ||
      params.field === 'probabilityLabel'
    ) {
      return { px: '8px', py: '6px' }
    }
    if (params.field === OVERVIEW_ROW_SPACER_FIELD) {
      return { px: 0, py: 0 }
    }
    return {}
  }, [])

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
        height: 36,
        minHeight: 36,
        '& .MuiButton-root': { minHeight: 36, borderRadius: '10px' },
      },
    }),
    [],
  )

  const overviewHeaderDateLabel = useMemo(() => {
    const d = appliedDateRange.endDate ?? appliedDateRange.startDate
    return d?.isValid() ? d.format('MMMM D, YYYY') : '-'
  }, [appliedDateRange.endDate, appliedDateRange.startDate])

  return (
    <Box width="100%">
      <Stack sx={{ pb: 3 }}>
        <Box sx={{ pt: `${OVERVIEW_STICKY_TOP_AIR_GAP_PX}px` }}>
          <Stack sx={{ py: '18px' }}>
            <Typography fontSize={20} fontWeight={600} lineHeight={1.4} color="contentText.Black">
              {overviewHeaderDateLabel}
            </Typography>
          </Stack>
        </Box>

        <Box sx={overviewCanvasGridSx}>
          <Stack ref={overviewLeftColumnRef} sx={[overviewCanvasColumnSx, { position: 'relative' }]}>
            <Box ref={overviewStickyStartMarkerRef} aria-hidden sx={{ height: 0, overflow: 'hidden' }} />
            <Box
              sx={
                disableOverviewStickyBand || !isOverviewDesktopLayout
                  ? undefined
                  : {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 'var(--overview-left-sticky-bound-height, 100%)',
                    pointerEvents: 'none',
                    zIndex: 160,
                  }
              }
            >
              <Box
                ref={overviewLeftStickyHeaderRef}
                sx={{
                  position: disableOverviewStickyBand ? 'static' : 'sticky',
                  top: disableOverviewStickyBand ? undefined : overviewStickyInsetTopPx,
                  zIndex: disableOverviewStickyBand ? undefined : 160,
                  bgcolor: 'commonColor.White',
                  pt: `${OVERVIEW_STICKY_TOP_AIR_GAP_PX}px`,
                  boxSizing: 'border-box',
                  pointerEvents: disableOverviewStickyBand || !isOverviewDesktopLayout ? undefined : 'auto',
                  boxShadow:
                    disableOverviewStickyBand || !overviewStickyBandShowsShadow ? 'none' : NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED,
                  clipPath: disableOverviewStickyBand ? undefined : 'inset(0 0 -20px 0)',
                  transition: OVERVIEW_STICKY_BAND_SHADOW_TRANSITION,
                }}
              >
                <Stack sx={{ pb: `${OVERVIEW_SECTION_HEADER_TO_BODY_GAP_PX}px` }}>
                  <EventDetailSectionHeader
                    icon={<GraphicEqRoundedIcon sx={{ fontSize: 26, color: 'contentText.Black' }} />}
                    title="Scenario Canvas"
                    tooltipTitle=""
                  />
                </Stack>

                <Stack gap={`${OVERVIEW_FILTER_TABLE_GAP_PX}px`} sx={{ pt: `${OVERVIEW_CANVAS_BODY_VERTICAL_PADDING_PX}px` }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="8px">
                    <MISlidingSegmented
                      options={VIEW_MODE_OPTIONS}
                      value={viewMode}
                      onChange={handleViewModeChange}
                      sx={overviewSegmentedSx}
                    />

                    <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="flex-end" gap="8px" sx={{ minWidth: 0 }}>
                      <MIDateRangePickerMenu
                        dateRange={appliedDateRange}
                        onApply={handleDateRangeApply}
                        showPreset
                        datePresets={nextGenMIDatePresets}
                        closeOnScroll
                        {...dateRangeMenuLayoutProps}
                      />

                      <MISelectMenu<ListSort>
                        variant="outlined"
                        buttonHoverBgColor="gray.20"
                        selected={sort}
                        onSelected={handleSortChange}
                        items={SORT_OPTIONS_MENU}
                        closeOnScroll
                        sx={{ height: 36, minHeight: 36, borderRadius: '10px' }}
                      />
                    </Stack>
                  </Stack>

                  {viewMode === 'event' && <MIDataTableHeader<IOverviewEventItem> columns={eventColumns} sx={overviewTableHeaderSx} />}
                  {viewMode === 'scenario' && (
                    <MIDataTableHeader<IOverviewScenarioItem> columns={scenarioColumns} sx={overviewTableHeaderSx} />
                  )}
                </Stack>
              </Box>
            </Box>

            {!(disableOverviewStickyBand || !isOverviewDesktopLayout) && (
              <Box aria-hidden sx={{ height: 'var(--overview-left-sticky-natural-height, 0px)', flexShrink: 0 }} />
            )}

            <Box sx={{ width: '100%', minWidth: 0 }}>
              {viewMode === 'event' && (
                <OverviewEventFirstAccordionList
                  columns={eventColumns}
                  rows={eventRows}
                  loading={listLoading}
                  skeletonRowCount={pagination.size}
                  noRowMessage={emptyListMessage}
                  selectedEventId={selectedEventId}
                  actionColumnField={OVERVIEW_ROW_SPACER_FIELD}
                  rowSx={overviewDataListRowSx}
                  getCellSx={getOverviewEventCellSx}
                  enableExpandedRowSticky={enableExpandedRowSticky}
                  expandedRowStickyTopPx={overviewExpandedRowStickyTopPx}
                  categoryLabelTyped={categoryLabel}
                  onRowClick={handleEventRowClick}
                  onAccordionCollapse={handleEventAccordionCollapse}
                  onSummaryDetailShortcutClick={handleOverviewEventSummaryDetailShortcut}
                  onForecastScenarioHoverChange={setOverviewForecastScenarioHoverId}
                />
              )}
              {viewMode === 'scenario' && (
                <OverviewScenarioFirstAccordionList
                  columns={scenarioColumns}
                  rows={scenarioRows}
                  loading={listLoading}
                  skeletonRowCount={pagination.size}
                  noRowMessage={emptyListMessage}
                  selectedScenarioId={selectedScenarioId}
                  actionColumnField={OVERVIEW_ROW_SPACER_FIELD}
                  rowSx={overviewDataListRowSx}
                  getCellSx={getOverviewScenarioCellSx}
                  enableExpandedRowSticky={enableExpandedRowSticky}
                  expandedRowStickyTopPx={overviewExpandedRowStickyTopPx}
                  categoryLabelTyped={categoryLabel}
                  onRowClick={handleScenarioRowClick}
                  onAccordionCollapse={handleScenarioAccordionCollapse}
                  onSummaryDetailShortcutClick={handleOverviewScenarioSummaryDetailShortcut}
                  onScenarioSummaryHoverChange={setOverviewScenarioListHoverId}
                />
              )}
              {viewMode === 'event' && (
                <MIPaginationSecondary<IOverviewEventItem>
                  data={overviewEvents?.events}
                  size={pagination.size}
                  sizeList={[10, 20, 50]}
                  onSizeChange={handlePageSizeChange}
                  onPageChange={handlePageChange}
                  paddingTop="8px"
                  // hideSizeSelector
                />
              )}
              {viewMode === 'scenario' && (
                <MIPaginationSecondary<IOverviewScenarioItem>
                  data={overviewScenarios?.scenarios}
                  size={pagination.size}
                  sizeList={[10, 20, 50]}
                  onSizeChange={handlePageSizeChange}
                  onPageChange={handlePageChange}
                  paddingTop="8px"
                  // hideSizeSelector
                />
              )}
            </Box>
          </Stack>

          <Stack
            ref={overviewRightStickyColumnRef}
            sx={[
              overviewCanvasColumnSx,
              {
                alignSelf: { md: 'stretch' },
                pt: { xs: 0, md: `${OVERVIEW_CHART_STICKY_SECTION_OFFSET_PX}px` },
                boxSizing: 'border-box',
              },
            ]}
          >
            <Box
              ref={overviewRightStickyContentRef}
              sx={{
                position: disableOverviewStickyBand ? 'static' : 'sticky',
                top: disableOverviewStickyBand ? undefined : overviewStickyInsetTopPx + OVERVIEW_CHART_STICKY_SECTION_OFFSET_PX,
                zIndex: disableOverviewStickyBand ? undefined : 120,
                bgcolor: 'commonColor.White',
                py: `${OVERVIEW_CANVAS_BODY_VERTICAL_PADDING_PX}px`,
                minHeight: 0,
                boxSizing: 'border-box',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" minWidth={0} gap={1} mb="8px">
                <Typography
                  variant="body2SB14"
                  color="contentText.Normal"
                  sx={{ fontVariantNumeric: 'lining-nums tabular-nums', minHeight: showChartSkeleton ? 0 : undefined }}
                >
                  {showChartSkeleton ? '\u00A0' : hasOverviewChartData ? chartUnitOuter : '\u00A0'}
                </Typography>
                <MISlidingSegmented
                  options={INDEX_SEGMENT_OPTIONS}
                  value={overviewIndexName}
                  onChange={(v) => setOverviewIndexName(v as OverviewPriceIndexName)}
                  sx={[overviewSegmentedSx, { flexShrink: 0 }]}
                />
              </Stack>

              {showChartSkeleton ? (
                <Skeleton variant="rounded" width="100%" height={480} sx={{ borderRadius: '10px' }} />
              ) : (
                <ScenarioSummaryChart
                  priceForecast={scenarioPriceForecast}
                  suppressChartHeader
                  emptyMessage={emptyChartCopy}
                  chartColorMap={overviewChartColorMap}
                  linkedHighlightVisibilityKey={chartLinkedHighlightVisibilityKey}
                />
              )}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

export default OverviewTabPanel
