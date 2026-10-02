import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Box, Divider, Stack, Switch, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
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
  getEventDesignOccupiedMessage,
  isScenarioDesignStatusOccupiedByOther,
  normalizeEventDesignStep,
  normalizeScenarioDesignStatusCode,
  resolveSelectionDesignStateFromStatus,
} from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import EventIndexSignalCell from '@/pages/mi/nextGenMI/components/event/EventIndexSignalCell'
import EventRecommendedStarCell from '@/pages/mi/nextGenMI/components/event/EventRecommendedStarCell'
import EventScenarioGenerateButton from '@/pages/mi/nextGenMI/components/event/EventScenarioGenerateButton'
import EventSelectionActionBar, { type EventSelectionItem } from '@/pages/mi/nextGenMI/components/event/EventSelectionActionBar'
import EventSortSelectMenu from '@/pages/mi/nextGenMI/components/event/EventSortSelectMenu'
import EventsTableEmptyOverlay from '@/pages/mi/nextGenMI/components/event/EventsTableEmptyOverlay'
import EventStatusBadge from '@/pages/mi/nextGenMI/components/event/EventStatusBadge'
import KeywordAlertSettingDialog from '@/pages/mi/nextGenMI/components/event/KeywordAlertSettingDialog'
import UserRegisteredEventBadge from '@/pages/mi/nextGenMI/components/event/UserRegisteredEventBadge'
import { useNextGenMIListState } from '@/pages/mi/nextGenMI/NextGenMIListStateContext'
import { getNextGenMIScenarioDesignPath, getNextGenMIScenarioGroupDetailPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { NextGenMIStickySlot } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import { applyUserRegisteredEventListDummy } from '@/pages/mi/nextGenMI/utils/userRegisteredEventDummy'
import nextGenMIEventService, {
  type EventLinkedScenarioGroup,
  type EventListItem,
  type EventSort,
  type EventStatus,
  type GetEventsParams,
} from '@/service/mi/nextGenMI/event'
import nextGenMIScenarioDesignService from '@/service/mi/nextGenMI/scenarioDesign'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'
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

type EventSourceFilter = 'all' | 'platform' | 'user'

const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'platform', label: '플랫폼 등록 이벤트' },
  { value: 'user', label: '사용자 등록 이벤트' },
] as const satisfies ReadonlyArray<{ value: EventSourceFilter; label: string }>

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

const EventsTabPanel = () => {
  const navigate = useNavigate()
  const [isKeywordAlertOpen, setIsKeywordAlertOpen] = useState(false)
  const { onHide, onShow } = useDialog()

  const [typeFilter, setTypeFilter] = useNextGenMIListState<(typeof TYPE_FILTER_OPTIONS)[number]['value']>('events.typeFilter', 'all')
  const [sort, setSort] = useNextGenMIListState<EventSort>('events.sort', 'latest')
  const [appliedDateRange, setAppliedDateRange] = useNextGenMIListState<DateRange>('events.appliedDateRange', defaultNextGenMIDateRange)
  const [categoryFilter, setCategoryFilter] = useNextGenMIListState<CategoryFilterValue>('events.categoryFilter', [])
  const [keyword, setKeyword] = useNextGenMIListState('events.keyword', '')
  const [committedKeyword, setCommittedKeyword] = useNextGenMIListState('events.committedKeyword', '')
  const [pagination, setPagination] = useNextGenMIListState('events.pagination', { size: 20, page: 1 })
  const [hideNonRecommended, setHideNonRecommended] = useNextGenMIListState('events.hideNonRecommended', false)
  const [sourceFilter, setSourceFilter] = useNextGenMIListState<EventSourceFilter>('events.sourceFilter', 'all')
  const [mineOnly, setMineOnly] = useNextGenMIListState('events.mineOnly', false)
  const sourceFilterBeforeMineOnlyRef = useRef<EventSourceFilter | null>(null)
  const [selectedEvents, setSelectedEvents] = useNextGenMIListState<EventSelectionItem[]>('events.selectedEvents', [])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  const handleSearchChange = useCallback(
    (value: string) => {
      setKeyword(value)
    },
    [setKeyword],
  )

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setCommittedKeyword(searchTerm)
      setPagination((p) => ({ ...p, page: 1 }))
    },
    [setCommittedKeyword, setPagination],
  )

  const handleSearchClear = useCallback(() => {
    setKeyword('')
    setCommittedKeyword('')
    setPagination((p) => ({ ...p, page: 1 }))
  }, [setCommittedKeyword, setKeyword, setPagination])

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
  }, [data?.events, pagination.page, setPagination])

  const rawTableRows = useMemo(
    () => applyUserRegisteredEventListDummy(data?.events?.detail ?? [], pagination.page),
    [data?.events?.detail, pagination.page],
  )
  const tableRows = useMemo(
    () =>
      rawTableRows.filter((row) => {
        if (mineOnly && row.registeredByMe !== true) return false
        if (sourceFilter === 'user') return row.userRegistered === true
        if (sourceFilter === 'platform') return row.userRegistered !== true
        return true
      }),
    [mineOnly, rawTableRows, sourceFilter],
  )

  const selectedEventIds = useMemo(() => selectedEvents.map((item) => item.eventId), [selectedEvents])

  const { data: selectionDesignStatus, isLoading: selectionDesignStatusLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignStatus', selectedEventIds],
    queryFn: () => nextGenMIScenarioDesignService.getScenarioDesignStatus({ miEventIds: selectedEventIds }),
    enabled: selectedEventIds.length > 0,
    refetchInterval: (query) => (normalizeScenarioDesignStatusCode(query.state.data?.designStatus) === 'creating' ? 5000 : false),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const selectedEventIdSet = useMemo(() => new Set(selectedEvents.map((item) => item.eventId)), [selectedEvents])

  const isSelectionLimitReached = selectedEvents.length >= EVENT_SELECTION_MAX_COUNT

  const handleToggleEventSelection = useCallback(
    (row: EventListItem, checked: boolean) => {
      setSelectedEvents((prev) => {
        if (!checked) return prev.filter((item) => item.eventId !== row.eventId)
        if (prev.some((item) => item.eventId === row.eventId)) return prev
        if (prev.length >= EVENT_SELECTION_MAX_COUNT) return prev
        return [...prev, { eventId: row.eventId, eventName: row.eventName }]
      })
    },
    [setSelectedEvents],
  )

  const handleRemoveSelectedEvent = useCallback(
    (eventId: number) => {
      setSelectedEvents((prev) => prev.filter((item) => item.eventId !== eventId))
    },
    [setSelectedEvents],
  )

  const selectionDesignState = useMemo(
    () => resolveSelectionDesignStateFromStatus(selectionDesignStatus, selectedEvents),
    [selectedEvents, selectionDesignStatus],
  )

  const handleSelectedEventsDesignClick = useCallback(async () => {
    if (selectedEvents.length === 0) return

    const currentStatus =
      selectionDesignStatus ??
      (await nextGenMIScenarioDesignService
        .getScenarioDesignStatus({ miEventIds: selectedEvents.map((item) => item.eventId) })
        .catch(() => undefined))
    const currentState = resolveSelectionDesignStateFromStatus(currentStatus, selectedEvents)
    if (!currentState) return

    // Case 2. 동일 조합을 다른 사용자가 진행 중 - 읽기 전용으로 확인
    if (currentState.mode === 'creating' && currentState.locked) {
      onShow({
        title: '시나리오 설계 확인',
        width: 450,
        children: getEventDesignOccupiedMessage(currentState.occupantUserName),
        actions: [
          {
            label: '닫기',
            variant: 'outlined',
            color: 'gray',
            onClick: onHide,
          },
          {
            label: '확인',
            onClick: () => {
              onHide()
              navigate(
                getNextGenMIScenarioDesignPath({
                  eventIds: selectedEvents.map((item) => item.eventId),
                  scenarioGroupId: currentState.scenarioGroupId,
                }),
                {
                  state: {
                    eventName: currentState.primaryEventName,
                    eventIds: selectedEvents.map((item) => item.eventId),
                    scenarioGroupId: currentState.scenarioGroupId ?? undefined,
                    designStep: currentState.designStep ?? null,
                    readOnly: true,
                    occupantUserName: currentState.occupantUserName,
                  },
                },
              )
            },
          },
        ],
      })
      return
    }

    // Case 3. 동일 조합의 시나리오 그룹이 완료된 경우 - 상세로 이동 (신규 생성 없음)
    if (currentState.mode === 'created' && currentState.scenarioGroupId !== undefined && currentState.scenarioGroupId !== null) {
      navigate(getNextGenMIScenarioGroupDetailPath(currentState.scenarioGroupId), {
        state: { eventName: currentState.primaryEventName },
      })
      return
    }

    // Case 1. 신규 생성 / Case 3. 내가 진행 중 - 현재 단계 설계 화면으로 이동
    navigate(
      getNextGenMIScenarioDesignPath({
        eventIds: selectedEvents.map((item) => item.eventId),
        scenarioGroupId: currentState.scenarioGroupId,
      }),
      {
        state: {
          eventName: currentState.primaryEventName,
          eventIds: selectedEvents.map((item) => item.eventId),
          scenarioGroupId: currentState.scenarioGroupId ?? undefined,
          designStep: currentState.designStep ?? null,
        },
      },
    )
  }, [navigate, onHide, onShow, selectedEvents, selectionDesignStatus])

  const handleEventNameClick = useCallback(
    (row: EventListItem) =>
      navigate(`/mi/next-gen-mi/events/${row.eventId}`, {
        state: { eventName: row.eventName },
      }),
    [navigate],
  )

  const handleScenarioClick = useCallback(
    async (row: EventListItem) => {
      const currentStatus = await nextGenMIScenarioDesignService
        .getScenarioDesignStatus({ miEventIds: [row.eventId] })
        .catch(() => undefined)
      const designStatus = normalizeScenarioDesignStatusCode(currentStatus?.designStatus)

      if (designStatus === 'unavailable') {
        onShow({
          title: '시나리오 설계를 시작할 수 없습니다',
          width: 450,
          children: EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE,
        })
        return
      }

      if (isScenarioDesignStatusOccupiedByOther(currentStatus)) {
        onShow({
          title: '시나리오 설계를 시작할 수 없습니다',
          width: 450,
          children: getEventDesignOccupiedMessage(currentStatus?.occupantUserName),
        })
        return
      }

      if (designStatus === 'created' && currentStatus?.scenarioGroupId !== undefined && currentStatus.scenarioGroupId !== null) {
        navigate(getNextGenMIScenarioGroupDetailPath(currentStatus.scenarioGroupId), {
          state: { eventName: row.eventName },
        })
        return
      }

      navigate(getNextGenMIScenarioDesignPath({ eventIds: [row.eventId], scenarioGroupId: currentStatus?.scenarioGroupId }), {
        state: {
          eventName: row.eventName,
          eventIds: [row.eventId],
          scenarioGroupId: currentStatus?.scenarioGroupId ?? undefined,
          designStep: normalizeEventDesignStep(currentStatus?.designStep) ?? null,
        },
      })
    },
    [navigate, onShow],
  )

  const handleConnectedGroupContinue = useCallback(
    async (row: EventListItem, group: EventLinkedScenarioGroup) => {
      const groupStatus = (group.status ?? group.stage ?? '').toLowerCase()

      // 완료된 그룹만 상세로 이동. 1/2단계는 시나리오 설계 화면으로 이동
      if (groupStatus === 'created' || groupStatus === 'realized') {
        navigate(getNextGenMIScenarioGroupDetailPath(group.scenarioGroupId), {
          state: { eventName: row.eventName },
        })
        return
      }

      if (group.mine === false) {
        const groupDetail = await nextGenMIScenarioGroupService.getScenarioGroupDetail(group.scenarioGroupId).catch(() => undefined)
        const miEventIds = groupDetail?.eventBundles?.map((event) => event.eventId)
        const designStatus = await nextGenMIScenarioDesignService
          .getScenarioDesignStatus({ miEventIds: miEventIds?.length ? miEventIds : [row.eventId] })
          .catch(() => undefined)
        const occupantUserName = designStatus?.scenarioGroupId === group.scenarioGroupId ? designStatus.occupantUserName?.trim() : undefined
        onShow({
          title: '시나리오 설계 확인',
          width: 450,
          children: getEventDesignOccupiedMessage(occupantUserName),
          actions: [
            {
              label: '닫기',
              variant: 'outlined',
              color: 'gray',
              onClick: onHide,
            },
            {
              label: '확인',
              onClick: () => {
                onHide()
                navigate(getNextGenMIScenarioDesignPath({ eventIds: [row.eventId], scenarioGroupId: group.scenarioGroupId }), {
                  state: {
                    eventName: row.eventName,
                    eventIds: [row.eventId],
                    scenarioGroupId: group.scenarioGroupId,
                    designStep: normalizeEventDesignStep(group.designStep) ?? null,
                    readOnly: true,
                    occupantUserName,
                  },
                })
              },
            },
          ],
        })
        return
      }

      navigate(getNextGenMIScenarioDesignPath({ eventIds: [row.eventId], scenarioGroupId: group.scenarioGroupId }), {
        state: {
          eventName: row.eventName,
          eventIds: [row.eventId],
          scenarioGroupId: group.scenarioGroupId,
          designStep: normalizeEventDesignStep(group.designStep) ?? null,
        },
      })
    },
    [navigate, onHide, onShow],
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
          const isSelected = selectedEventIdSet.has(params.row.eventId)
          const selectionLimitDisabled = isSelectionLimitReached && !isSelected
          const checkbox = (
            <AdminCheckbox
              size="small"
              checked={isSelected}
              disabled={selectionLimitDisabled}
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
        renderCell: (params) => (
          <Stack direction="row" alignItems="center" gap="6px" minWidth={0} maxWidth="100%" width="100%">
            <Box
              minWidth={0}
              overflow="hidden"
              sx={{
                flex: '0 1 auto',
                display: 'flex',
                maxWidth: '100%',
                '& > button': { minWidth: 0, maxWidth: '100%', width: '100%' },
                '& .MuiTypography-root': {
                  minWidth: 0,
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <NextGenMIHoverLinkCell value={params.row.eventName} onClick={() => handleEventNameClick(params.row)} />
            </Box>
            {params.row.userRegistered ? <UserRegisteredEventBadge /> : null}
          </Stack>
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
        renderCell: (params) => (
          <EventScenarioGenerateButton
            recommended={params.row.isScenarioSuggested}
            scenarioGroupCount={params.row.scenarioGroupCount ?? 0}
            eventId={params.row.eventId}
            onClick={() => handleScenarioClick(params.row)}
            onConnectedGroupContinue={(group) => handleConnectedGroupContinue(params.row, group)}
          />
        ),
      },
    ],
    [
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
  }, [setPagination])

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
    [resetPage, setCategoryFilter],
  )

  const handleDateRangeApply = useCallback(
    (dates: DateRange) => {
      setAppliedDateRange({
        startDate: dates.startDate,
        endDate: dates.endDate,
      })
      setPagination((p) => ({ ...p, page: 1 }))
    },
    [setAppliedDateRange, setPagination],
  )

  const handleTypeFilterChange = useCallback(
    (v: string) => {
      if (v === 'all' || v === 'new' || v === 'updated') {
        setTypeFilter(v)
        setPagination((p) => ({ ...p, page: 1 }))
      }
    },
    [setPagination, setTypeFilter],
  )

  const handleSourceFilterChange = useCallback(
    (value: EventSourceFilter) => {
      setSourceFilter(value)
      setPagination((p) => ({ ...p, page: 1 }))
    },
    [setPagination, setSourceFilter],
  )

  const handleMineOnlyChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        sourceFilterBeforeMineOnlyRef.current = sourceFilter
        setSourceFilter('user')
      } else if (sourceFilterBeforeMineOnlyRef.current) {
        setSourceFilter(sourceFilterBeforeMineOnlyRef.current)
        sourceFilterBeforeMineOnlyRef.current = null
      }
      setMineOnly(checked)
      setPagination((p) => ({ ...p, page: 1 }))
    },
    [setMineOnly, setPagination, setSourceFilter, sourceFilter],
  )

  const handleSortChange = useCallback(
    (value: EventSort) => {
      setSort(value)
      setPagination((p) => ({ ...p, page: 1 }))
    },
    [setPagination, setSort],
  )

  const handlePageSizeChange = useCallback(
    (s: number) => {
      setPagination({ size: s, page: 1 })
    },
    [setPagination],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((p) => ({ ...p, page }))
    },
    [setPagination],
  )

  const handleResetFilters = useCallback(() => {
    setTypeFilter('all')
    setSort('latest')
    setAppliedDateRange(defaultNextGenMIDateRange())
    setCategoryFilter([])
    setKeyword('')
    setCommittedKeyword('')
    setHideNonRecommended(false)
    setSourceFilter('all')
    setMineOnly(false)
    sourceFilterBeforeMineOnlyRef.current = null
    setPagination((p) => ({ ...p, page: 1 }))
  }, [
    setAppliedDateRange,
    setCategoryFilter,
    setCommittedKeyword,
    setHideNonRecommended,
    setKeyword,
    setMineOnly,
    setPagination,
    setSort,
    setSourceFilter,
    setTypeFilter,
  ])

  const emptyOverlay = useMemo(() => {
    if (isError) {
      return <EventsTableEmptyOverlay message="목록을 불러오지 못했습니다." />
    }
    return <EventsTableEmptyOverlay message="조건에 맞는 항목이 없습니다" onResetFilters={handleResetFilters} />
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

            <MISelectMenu<EventSourceFilter>
              variant="outlined"
              selectionIconPosition="left"
              disabled={mineOnly}
              selected={mineOnly ? 'user' : sourceFilter}
              onSelected={handleSourceFilterChange}
              items={SOURCE_FILTER_OPTIONS.map(({ value, label }) => ({ value, label }))}
              textLabel={
                <Typography variant="body2SB14" color={mineOnly ? 'contentText.Disabled' : 'contentText.Black'} noWrap>
                  {sourceFilter === 'all' && !mineOnly
                    ? '출처'
                    : SOURCE_FILTER_OPTIONS.find((item) => item.value === (mineOnly ? 'user' : sourceFilter))?.label}
                </Typography>
              }
              enableHoverBackground
              closeOnScroll
              paperProps={{ sx: { minWidth: '196px' } }}
              sx={{
                height: '36px',
                borderRadius: '8px',
              }}
            />

            <EventSortSelectMenu<EventSort> selected={sort} onSelected={handleSortChange} items={SORT_OPTIONS} closeOnScroll />

            <Divider orientation="vertical" flexItem sx={{ height: '34px', alignSelf: 'center', borderColor: 'contentBorder.Normal' }} />
            <MIBaseButton
              variant="outlined"
              aria-label="키워드 알림 설정"
              open={isKeywordAlertOpen}
              enableHoverBackground
              onClick={() => setIsKeywordAlertOpen(true)}
              sx={{
                width: '36px',
                minWidth: '36px',
                height: '36px',
                padding: '7px',
                borderRadius: '8px',
                flexShrink: 0,
                color: 'contentIcon.Enabled',
              }}
            >
              <NotificationsNoneOutlinedIcon sx={{ fontSize: '20px' }} />
            </MIBaseButton>
          </Stack>

          <Stack direction="row" alignItems="center" gap="12px" sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" height="36px" padding="0" gap="8px">
              <Switch size="small" checked={mineOnly} onChange={(_, checked) => handleMineOnlyChange(checked)} />
              <Typography variant="body2M14" color={mineOnly ? 'contentText.Black' : 'contentText.Normal'} noWrap>
                내가 만든 이벤트
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" height="36px" padding="0" gap="8px">
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

      <KeywordAlertSettingDialog open={isKeywordAlertOpen} onClose={() => setIsKeywordAlertOpen(false)} />

      <EventSelectionActionBar
        selectedEvents={selectedEvents}
        maxCount={EVENT_SELECTION_MAX_COUNT}
        designMode={selectionDesignState?.mode}
        designLocked={selectionDesignState?.locked}
        designStep={selectionDesignState?.designStep}
        designStatusLoading={selectionDesignStatusLoading}
        onRemove={handleRemoveSelectedEvent}
        onDesignClick={handleSelectedEventsDesignClick}
      />
    </Box>
  )
}

export default EventsTabPanel
