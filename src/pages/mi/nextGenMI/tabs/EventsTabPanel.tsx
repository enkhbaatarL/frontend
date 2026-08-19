import { Box, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MIDataTableBody from '@/components/common/table/MIDataTableBody'
import MIDataTableCellText from '@/components/common/table/MIDataTableCellText'
import MIDataTableHeader from '@/components/common/table/MIDataTableHeader'
import { buildNextGenMIDatePresets, defaultNextGenMIDateRange } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import { findIndexImpact, formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import EventCategoryFilterMenu from '@/pages/mi/nextGenMI/components/event/EventCategoryFilterMenu'
import {
  EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE,
  findEventDesignAvailability,
  getEventDesignOccupiedMessage,
  hasCreatingEventDesignAvailability,
  isEventDesignOccupiedByOther,
  isOwnEventDesignAvailability,
  mergeEventListItemDesignAvailability,
  normalizeEventDesignStep,
  normalizeEventScenarioDesignStatus,
  resolveMultiEventSelectionDesignState,
} from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'
import EventRecommendedStarCell from '@/pages/mi/nextGenMI/components/event/EventRecommendedStarCell'
import EventScenarioGenerateButton from '@/pages/mi/nextGenMI/components/event/EventScenarioGenerateButton'
import EventSelectionActionBar, { type EventSelectionItem } from '@/pages/mi/nextGenMI/components/event/EventSelectionActionBar'
import EventSortSelectMenu from '@/pages/mi/nextGenMI/components/event/EventSortSelectMenu'
import EventsTableEmptyOverlay from '@/pages/mi/nextGenMI/components/event/EventsTableEmptyOverlay'
import EventStatusBadge from '@/pages/mi/nextGenMI/components/event/EventStatusBadge'
import { getNextGenMIEventDesignPath, getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import nextGenMIEventService, {
  type EventConnectedScenarioGroup,
  type EventDesignAvailability,
  type EventListItem,
  type EventSort,
  type EventStatus,
  type GetEventsParams,
} from '@/service/mi/nextGenMI/event'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'

/** 카테고리 필터 값: Lv1 다중 선택 */
type CategoryFilterValue = number[]

const EVENT_SELECTION_MAX_COUNT = 5

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

const isEventSelectableForScenarioDesign = (row: EventListItem) => row.scenarioDesignStatus !== 'unavailable'

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const { onShow } = useDialog()
  const currentUserNo = useAuthStore((state) => state.user?.userNo)

  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTER_OPTIONS)[number]['value']>('all')
  const [sort, setSort] = useState<EventSort>('latest')
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultNextGenMIDateRange())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>([])
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })
  const [hideNonRecommended, setHideNonRecommended] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<EventSelectionItem[]>([])

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

  const rawTableRows = useMemo(() => data?.events?.detail ?? [], [data?.events?.detail])
  const designAvailabilityEventIds = useMemo(() => rawTableRows.map((row) => row.eventId), [rawTableRows])

  const { data: designAvailabilityData } = useQuery({
    queryKey: ['nextGenMIEventDesignAvailability', 'events', designAvailabilityEventIds],
    queryFn: () => nextGenMIEventService.getEventDesignAvailability({ eventIds: designAvailabilityEventIds }),
    enabled: designAvailabilityEventIds.length > 0,
    refetchInterval: (query) => {
      if (query.state.data !== undefined) {
        return hasCreatingEventDesignAvailability(query.state.data) ? 5000 : false
      }
      return rawTableRows.some((row) => row.scenarioDesignStatus === 'creating') ? 5000 : false
    },
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const designAvailabilityByEventId = useMemo(
    () =>
      new Map<number, EventDesignAvailability>(
        (designAvailabilityData ?? []).flatMap((item) => (item.eventId === undefined ? [] : [[item.eventId, item]])),
      ),
    [designAvailabilityData],
  )
  const tableRows = useMemo(
    () => rawTableRows.map((row) => mergeEventListItemDesignAvailability(row, designAvailabilityByEventId.get(row.eventId))),
    [designAvailabilityByEventId, rawTableRows],
  )

  const selectedEventIdSet = useMemo(() => new Set(selectedEvents.map((item) => item.eventId)), [selectedEvents])

  const isSelectionLimitReached = selectedEvents.length >= EVENT_SELECTION_MAX_COUNT

  const handleToggleEventSelection = useCallback((row: EventListItem, checked: boolean) => {
    if (!isEventSelectableForScenarioDesign(row)) return

    setSelectedEvents((prev) => {
      if (!checked) return prev.filter((item) => item.eventId !== row.eventId)
      if (prev.some((item) => item.eventId === row.eventId)) return prev
      if (prev.length >= EVENT_SELECTION_MAX_COUNT) return prev
      return [...prev, { eventId: row.eventId, eventName: row.eventName }]
    })
  }, [])

  const handleRemoveSelectedEvent = useCallback((eventId: number) => {
    setSelectedEvents((prev) => prev.filter((item) => item.eventId !== eventId))
  }, [])

  const selectedRowsForDesign = useMemo(() => {
    const rowById = new Map(tableRows.map((row) => [row.eventId, row]))
    return selectedEvents.map((item) => rowById.get(item.eventId)).filter((row): row is EventListItem => row !== undefined)
  }, [selectedEvents, tableRows])

  const selectionDesignState = useMemo(() => {
    if (selectedEvents.length < 2) return null

    // 현재 페이지/가용 데이터에 선택 행이 모두 없으면 신규 생성 CTA로 폴백
    if (selectedRowsForDesign.length !== selectedEvents.length) {
      const primary = selectedEvents[0]
      return {
        mode: 'designable' as const,
        locked: false,
        primaryEventId: primary.eventId,
        primaryEventName: primary.eventName,
      }
    }

    return resolveMultiEventSelectionDesignState(selectedRowsForDesign, currentUserNo)
  }, [currentUserNo, selectedEvents, selectedRowsForDesign])

  const handleSelectedEventsDesignClick = useCallback(() => {
    if (!selectionDesignState) return

    // Case 2. 동일 조합을 다른 사용자가 진행 중 - 진입 불가 안내
    if (selectionDesignState.mode === 'creating' && selectionDesignState.locked) {
      onShow({
        title: '시나리오 설계를 시작할 수 없습니다',
        width: 450,
        children: getEventDesignOccupiedMessage(selectionDesignState.occupantUserName),
      })
      return
    }

    // Case 3. 동일 조합의 시나리오 그룹이 완료된 경우 - 상세로 이동 (신규 생성 없음)
    if (
      selectionDesignState.mode === 'created' &&
      selectionDesignState.scenarioGroupId !== undefined &&
      selectionDesignState.scenarioGroupId !== null
    ) {
      navigate(getNextGenMIScenarioGroupDetailPath(selectionDesignState.scenarioGroupId), {
        state: { eventName: selectionDesignState.primaryEventName },
      })
      return
    }

    // Case 1. 신규 생성 / Case 3. 내가 진행 중 - 현재 단계 설계 화면으로 이동
    navigate(getNextGenMIEventDesignPath(selectionDesignState.primaryEventId), {
      state: {
        eventName: selectionDesignState.primaryEventName,
        eventIds: selectedEvents.map((item) => item.eventId),
        scenarioGroupId: selectionDesignState.scenarioGroupId ?? undefined,
        designStep: selectionDesignState.designStep ?? null,
      },
    })
  }, [navigate, onShow, selectedEvents, selectionDesignState])

  const handleEventNameClick = useCallback(
    (row: EventListItem) =>
      navigate(`/mi/next-gen-mi/events/${row.eventId}`, {
        state: { eventName: row.eventName },
      }),
    [navigate],
  )

  const handleScenarioClick = useCallback(
    async (row: EventListItem) => {
      if (row.scenarioDesignStatus === 'unavailable') return

      let currentRow = row
      if (row.scenarioDesignStatus === 'creating') {
        const availability =
          designAvailabilityByEventId.get(row.eventId) ??
          findEventDesignAvailability(
            await nextGenMIEventService.getEventDesignAvailability({ eventIds: [row.eventId] }).catch(() => undefined),
            row.eventId,
          )
        currentRow = mergeEventListItemDesignAvailability(row, availability)
      }

      if (currentRow.scenarioDesignStatus === 'unavailable') return

      if (currentRow.scenarioDesignStatus === 'creating' && !isOwnEventDesignAvailability(currentRow, currentUserNo)) {
        onShow({
          title: '시나리오 설계를 시작할 수 없습니다',
          width: 450,
          children: getEventDesignOccupiedMessage(currentRow.occupantUserName),
        })
        return
      }

      if (
        currentRow.scenarioDesignStatus === 'created' &&
        currentRow.scenarioGroupId !== undefined &&
        currentRow.scenarioGroupId !== null
      ) {
        navigate(getNextGenMIScenarioGroupDetailPath(currentRow.scenarioGroupId), {
          state: { eventName: currentRow.eventName },
        })
        return
      }

      navigate(getNextGenMIEventDesignPath(currentRow.eventId), {
        state: {
          eventName: currentRow.eventName,
          scenarioGroupId: currentRow.scenarioGroupId ?? undefined,
          designStep: normalizeEventDesignStep(currentRow.designStep) ?? null,
        },
      })
    },
    [currentUserNo, designAvailabilityByEventId, navigate, onShow],
  )

  const handleConnectedGroupContinue = useCallback(
    (row: EventListItem, group: EventConnectedScenarioGroup) => {
      const groupStatus = normalizeEventScenarioDesignStatus(group.scenarioDesignStatus)
      const isGroupOccupiedByOther = isEventDesignOccupiedByOther(
        {
          scenarioDesignStatus: groupStatus ?? row.scenarioDesignStatus,
          occupied: group.occupied ?? row.occupied,
          occupantUserId: group.occupantUserId ?? row.occupantUserId,
          occupantUserName: group.occupantUserName ?? row.occupantUserName,
        },
        currentUserNo,
      )

      if (isGroupOccupiedByOther) {
        onShow({
          title: '시나리오 설계를 시작할 수 없습니다',
          width: 450,
          children: getEventDesignOccupiedMessage(group.occupantUserName ?? row.occupantUserName),
        })
        return
      }

      // 완료된 그룹만 상세로 이동. 1/2단계는 시나리오 설계 화면으로 이동
      if (groupStatus === 'created') {
        navigate(getNextGenMIScenarioGroupDetailPath(group.scenarioGroupId), {
          state: { eventName: row.eventName },
        })
        return
      }

      navigate(getNextGenMIEventDesignPath(row.eventId), {
        state: {
          eventName: row.eventName,
          scenarioGroupId: group.scenarioGroupId,
          designStep: normalizeEventDesignStep(group.designStep) ?? null,
        },
      })
    },
    [currentUserNo, navigate, onShow],
  )

  const columns: GridColDef<EventListItem>[] = useMemo(
    () => [
      {
        field: '__selection',
        headerName: '',
        width: 36,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const selectable = isEventSelectableForScenarioDesign(params.row)
          const isSelected = selectedEventIdSet.has(params.row.eventId)
          const selectionLimitDisabled = selectable && isSelectionLimitReached && !isSelected
          const checkbox = (
            <AdminCheckbox
              size="small"
              checked={isSelected}
              disabled={!selectable || selectionLimitDisabled}
              onChange={(_, checked) => handleToggleEventSelection(params.row, checked)}
              onClick={(e) => e.stopPropagation()}
              slotProps={{ input: { 'aria-label': `${params.row.eventName} 선택` } }}
              sx={{ margin: 0, padding: 0 }}
            />
          )

          return selectionLimitDisabled ? (
            <NextGenMIFollowCursorTooltip title="최대 5개 까지 선택 가능합니다">
              <Box component="span" display="inline-flex" sx={{ cursor: 'not-allowed' }}>
                {checkbox}
              </Box>
            </NextGenMIFollowCursorTooltip>
          ) : (
            checkbox
          )
        },
      },
      {
        field: '__statusBadge',
        headerName: '구분',
        width: 40,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => <EventStatusBadge status={params.row.status} />,
      },
      {
        field: 'latestRecordFirstCreated',
        headerName: '일시',
        width: 110,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params) => <Typography variant="body2M14">{formatNextGenMIDateTime(params.row.latestRecordFirstCreated)}</Typography>,
      },
      {
        field: 'eventTypeLv1Label',
        headerName: '카테고리',
        width: 140,
        align: 'left',
        renderCell: (params) => (
          <MIDataTableCellText
            value={params.row.eventTypeLv1Label ?? ''}
            variant="body2M14"
            color="contentText.Black"
            tooltipWhenTruncated
            sx={{ width: '100%', minWidth: 0 }}
          />
        ),
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
        width: 120,
        align: 'center',
        sortable: false,
        renderCell: (params) => {
          const scenarioDesignUnavailable = params.row.scenarioDesignStatus === 'unavailable'
          const connectedGroups = params.row.connectedScenarioGroups ?? []
          const hasConnectedGroups = connectedGroups.length > 0

          return (
            <EventScenarioGenerateButton
              recommended={params.row.isScenarioSuggested}
              scenarioAvailable={params.row.scenarioDesignStatus === 'created'}
              designing={params.row.scenarioDesignStatus === 'creating'}
              designingLocked={isEventDesignOccupiedByOther(params.row, currentUserNo)}
              designStep={params.row.designStep}
              designStepLabel={params.row.designStepLabel}
              scenarioGroupId={params.row.scenarioGroupId}
              connectedScenarioGroups={connectedGroups}
              eventId={params.row.eventId}
              eventName={params.row.eventName}
              scenarioDesignStatus={params.row.scenarioDesignStatus}
              occupied={params.row.occupied}
              occupantUserId={params.row.occupantUserId}
              occupantUserName={params.row.occupantUserName}
              currentUserNo={currentUserNo}
              disabled={
                scenarioDesignUnavailable ||
                (!hasConnectedGroups &&
                  params.row.scenarioDesignStatus === 'created' &&
                  (params.row.scenarioGroupId === undefined || params.row.scenarioGroupId === null))
              }
              disabledTooltipTitle={scenarioDesignUnavailable ? EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE : undefined}
              onClick={() => handleScenarioClick(params.row)}
              onConnectedGroupContinue={(group) => handleConnectedGroupContinue(params.row, group)}
              designingAlwaysExpanded
            />
          )
        },
      },
    ],
    [
      currentUserNo,
      handleConnectedGroupContinue,
      handleEventNameClick,
      handleScenarioClick,
      handleToggleEventSelection,
      isSelectionLimitReached,
      selectedEventIdSet,
    ],
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
    if (field === '__selection') return { px: '6px' }
    if (field === '__statusBadge') return { px: '8px' }
    if (field === 'createdAt') return { px: '6px' }
    if (field === 'scenario') return { px: '6px', overflow: 'visible' }
    if (field === 'jkm' || field === 'ttf' || field === 'hh') return { px: '24px' }
    return {}
  }, [])

  const showEventsTableCellSkeleton = useCallback(
    (col: GridColDef<EventListItem>) =>
      col.field === '__selection' || col.field === '__statusBadge' || String(col.headerName ?? '').trim() !== '',
    [],
  )

  const getEventsTableHeaderCellSx = useCallback((col: GridColDef<EventListItem>) => {
    if (col.field === '__selection') {
      return { px: '6px' }
    }
    if (col.field === '__statusBadge') {
      return { px: '4px' }
    }
    if (col.field === 'scenario') {
      return { px: '6px' }
    }
    if (col.field === 'jkm' || col.field === 'ttf' || col.field === 'hh') {
      return { px: '24px' }
    }
    return undefined
  }, [])

  const getEventsTableRowClassName = useCallback(
    ({ row }: { row: EventListItem }) => (selectedEventIdSet.has(row.eventId) ? 'event-row--selected' : ''),
    [selectedEventIdSet],
  )

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

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all')
    setSort('latest')
    setAppliedDateRange(defaultNextGenMIDateRange())
    setCategoryFilter([])
    setKeyword('')
    setCommittedKeyword('')
    setHideNonRecommended(false)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const emptyOverlay = useMemo(() => {
    if (isError) {
      return <EventsTableEmptyOverlay message="목록을 불러오지 못했습니다." />
    }
    return (
      <EventsTableEmptyOverlay
        message="조건에 맞는 항목이 없습니다"
        description="신규는 생성 후, 갱신은 수정 후 72시간 동안 표시됩니다"
        onResetFilters={handleResetFilters}
      />
    )
  }, [handleResetFilters, isError])

  return (
    <Box width="100%">
      <NextGenMIStickySlot tabKey="events">
        <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" color="contentText.Black">
          Event List
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="12px">
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
            <Stack direction="row" alignItems="center" height="36px" padding="0" gap="4px">
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

        <MIDataTableHeader<EventListItem> columns={columns} getHeaderCellSx={getEventsTableHeaderCellSx} sx={{ mt: 2 }} />
      </NextGenMIStickySlot>

      <MIDataTableBody<EventListItem>
        rowId="eventId"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        showCellSkeleton={showEventsTableCellSkeleton}
        disableHoverState
        rowHeight={48}
        noRowsOverlay={emptyOverlay}
        getCellSx={getEventsTableCellSx}
        getRowClassName={getEventsTableRowClassName}
        sx={{
          '& > .MuiBox-root': {
            minHeight: '400px',
            borderRadius: 0,
            borderBottom: '1px solid',
            borderColor: 'gray.30',
          },
          '& .event-row--selected': {
            // 선택 행 배경: rgba(65, 76, 147, 0.05)
            backgroundColor: 'rgba(65, 76, 147, 0.05) !important',
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

      <EventSelectionActionBar
        selectedEvents={selectedEvents}
        maxCount={EVENT_SELECTION_MAX_COUNT}
        designMode={selectionDesignState?.mode}
        designLocked={selectionDesignState?.locked}
        designStep={selectionDesignState?.designStep}
        onRemove={handleRemoveSelectedEvent}
        onDesignClick={handleSelectedEventsDesignClick}
      />
    </Box>
  )
}

export default EventsTabPanel
