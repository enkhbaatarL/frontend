import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'
import { Box, Stack, Switch, Typography, type SxProps, type Theme } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import LoadingIcon from '@/components/common/icons/LoadingIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MIFilterMenu, { type FilterValues } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPaginationSecondary from '@/components/common/pagination/MIPaginationSecondary'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import MISpinner from '@/components/common/spinner/MISpinner'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import ClassificationTag, { ScenarioWorkbenchRecommendedBadge } from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import ImpactDotsCell from '@/pages/mi/scenarioWorkbench/components/common/ImpactDotsCell'
import {
  findIndexImpact,
  formatWorkbenchDateTime,
  formatWorkbenchDateTimeYmdHm,
  WORKBENCH_LIST_SORT_OPTIONS,
  WORKBENCH_STATUS_FILTER_OPTIONS,
} from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import { classificationPropsFromDesignEventRow } from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchClassificationChip'
import {
  buildWorkbenchDatePresets,
  defaultWorkbenchDateRange,
} from '@/pages/mi/scenarioWorkbench/components/common/scenarioWorkbenchDateRange'
import ScenarioWorkbenchEventDetailTableBodyText from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchEventDetailTableBodyText'
import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'
import CreatedScenariosSection from '@/pages/mi/scenarioWorkbench/components/design/CreatedScenariosSection'
import ScenarioWorkbenchDataList from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchDataList'
import ScenarioWorkbenchTableHeader from '@/pages/mi/scenarioWorkbench/components/table/ScenarioWorkbenchTableHeader'
import ScenarioWorkbenchEventDetailPage from '@/pages/mi/scenarioWorkbench/EventDetailPage'
import { WorkbenchStickySlot } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchStickyLayout'
import { EVENT_CATEGORY_LV1_KO, EventCategoryLv1, ListSort, ScenarioWorkbenchStatus } from '@/service/mi/scenarioWorkbench/common'
import scenarioWorkbenchDesignService, {
  type IDesignEventItem,
  type IDesignEventListRes,
  type IGetDesignEventsParams,
  type ScenarioGenStatus,
} from '@/service/mi/scenarioWorkbench/design'

const normalizeRequestId = (value: unknown): number | undefined => {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

const scenarioGenCompletionToastKey = (status: { requestId?: number | null; eventId: number }) => {
  const rid = normalizeRequestId(status.requestId)
  if (rid !== undefined) {
    return `r:${rid}`
  }
  return `e:${status.eventId}`
}

const formatDesignEventTime = (item: IDesignEventItem) =>
  formatWorkbenchDateTime(item.status === ScenarioWorkbenchStatus.UPDATED ? item.updatedAt : item.createdAt)

// ── 셀 컴포넌트 ───────────────────────────────────────────────────────────────

const DetailIconButton = ({ row }: { row: IDesignEventItem }) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const eventIdString = String(row.eventId)
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
        useInternalScroll: true,
      }}
    >
      <MIBaseButton
        variant="outlined"
        enableHoverBackground
        aria-label="이벤트 상세"
        onClick={handleClick}
        sx={{
          minWidth: '0px',
          height: '34px',
          padding: '6px',
          borderRadius: '10px',
          backgroundColor: 'commonColor.White',
        }}
      >
        <OpenInBrowserIcon sx={{ fontSize: 20, color: 'contentIcon.Black' }} />
      </MIBaseButton>
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
  sx?: SxProps<Theme>
}

const ScenarioActionButton = ({ icon, label, textColor, ariaLabel, disabled = false, onClick, sx }: ScenarioActionButtonProps) => {
  const extraSx = sx && typeof sx === 'object' && !Array.isArray(sx) ? (sx as Record<string, unknown>) : {}
  const disabledSxFromExtra =
    extraSx['&.Mui-disabled'] && typeof extraSx['&.Mui-disabled'] === 'object' ? (extraSx['&.Mui-disabled'] as Record<string, unknown>) : {}
  const { '&.Mui-disabled': _disabledSlot, ...restSx } = extraSx

  return (
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
            ...disabledSxFromExtra,
          },
        }),
        ...restSx,
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
}

/** 시나리오 생성 전 — 클릭 시 시나리오 생성 요청 */
const CreateScenarioButton = ({ onClick }: { onClick?: (e: MouseEvent) => void }) => (
  <ScenarioActionButton
    icon={<AutoAwesomeIcon sx={{ fontSize: 20, color: 'contentIcon.Black' }} />}
    label="생성"
    textColor="contentText.Normal"
    onClick={onClick}
  />
)

/** 시나리오 생성 중 — 진행 표시, 비활성화 + 생성 시작 시각 툴팁 */
const GeneratingScenarioButton = ({ startedAt }: { startedAt?: string | null }) => {
  /// 시연 후 문구 제거 필요
  const tooltipTitle = `(시연 데이터) 생성 시작 시간: ${formatWorkbenchDateTimeYmdHm(startedAt ?? undefined)}`
  return (
    <WorkbenchFollowCursorTooltip title={tooltipTitle}>
      <span style={{ display: 'inline-flex', cursor: 'default' }}>
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
          sx={{ '&.Mui-disabled': { cursor: 'default' } }}
        />
      </span>
    </WorkbenchFollowCursorTooltip>
  )
}

interface GeneratedScenariosPopupContentProps {
  requestId?: number
  shouldFetch: boolean
}

const GeneratedScenariosPopupContent = ({ requestId, shouldFetch }: GeneratedScenariosPopupContentProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['scenarioWorkbenchDesignGeneratedScenarios', requestId],
    queryFn: () => scenarioWorkbenchDesignService.getGeneratedScenarios(requestId ?? 0),
    enabled: shouldFetch && requestId !== undefined,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  if (requestId === undefined) {
    return (
      <Box sx={{ px: '24px', pb: '70px' }}>
        <Typography variant="body2M14" color="contentText.Subtext">
          생성 요청 ID가 없어 시나리오를 조회할 수 없습니다.
        </Typography>
      </Box>
    )
  }

  if (!shouldFetch || isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" gap={1.5} sx={{ px: '24px', pb: '70px', minHeight: 180 }}>
        <MISpinner size={24} speed={0.55}>
          <LoadingIcon style={{ width: 24, height: 24 }} />
        </MISpinner>
        <Typography variant="body2M14" color="contentText.Subtext">
          생성된 시나리오를 불러오는 중입니다.
        </Typography>
      </Stack>
    )
  }

  if (isError) {
    return (
      <Box sx={{ px: '24px', pb: '70px' }}>
        <Typography variant="body2M14" color="contentText.Subtext">
          생성된 시나리오를 불러오지 못했습니다.
        </Typography>
      </Box>
    )
  }

  return <CreatedScenariosSection scenarios={data ?? []} />
}

/** 시나리오 생성 완료 — 클릭 시 MIMorphingPopup(내부 스크롤)으로 생성된 시나리오 목록 노출 */
const CompletedScenarioPopupButton = ({ row }: { row: IDesignEventItem }) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const [hasOpened, setHasOpened] = useState(false)

  return (
    <MIMorphingPopup
      ref={popupRef}
      display="inline-flex"
      popup={{
        title: '생성된 시나리오',
        content: <GeneratedScenariosPopupContent requestId={normalizeRequestId(row.requestId)} shouldFetch={hasOpened} />,
        useInternalScroll: true,
        hideHeaderLine: true,
        minWidth: 1024,
        maxWidth: 1024,
        onOpen: () => setHasOpened(true),
      }}
    >
      <Box borderRadius="10px" sx={{ display: 'inline-flex' }}>
        <ScenarioActionButton
          icon={<OpenInBrowserIcon sx={{ fontSize: 20, color: 'mari.Primary' }} />}
          label="완료"
          textColor="mari.Primary"
          ariaLabel="생성된 시나리오 보기"
          onClick={() => popupRef.current?.open()}
        />
      </Box>
    </MIMorphingPopup>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const DesignTabPanel = () => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const scenarioGenCompletedToastKeysRef = useRef<Set<string>>(new Set())

  const [typeFilter, setTypeFilter] = useState<ScenarioWorkbenchStatus>(ScenarioWorkbenchStatus.ALL)
  const [sort, setSort] = useState<ListSort>(ListSort.LATEST)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(() => defaultWorkbenchDateRange())
  const [categoryFilter, setCategoryFilter] = useState<EventCategoryLv1[]>([])
  const [hideNonRecommended, setHideNonRecommended] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ size: 20, page: 1 })
  const [pendingGenerateEventIds, setPendingGenerateEventIds] = useState<Set<number>>(() => new Set())
  /** 생성 직후 응답 전·응답에 시각이 없을 때 툴팁 보조 */
  const [designGenStartedAtFallback, setDesignGenStartedAtFallback] = useState<Partial<Record<number, string>>>({})

  const listRequest = useMemo((): IGetDesignEventsParams => {
    const resolvedRange = appliedDateRange.startDate && appliedDateRange.endDate ? appliedDateRange : defaultWorkbenchDateRange()
    const trimmedKeyword = searchQuery.trim()

    return {
      page: pagination.page,
      size: pagination.size,
      sort,
      startDate: resolvedRange.startDate!.startOf('day').format('YYYY-MM-DD'),
      endDate: resolvedRange.endDate!.endOf('day').format('YYYY-MM-DD'),
      keyword: trimmedKeyword || undefined,
      eventStatus: typeFilter === ScenarioWorkbenchStatus.ALL ? undefined : typeFilter,
      eventCategoryLv1: categoryFilter.length > 0 ? categoryFilter : undefined,
      hideNonRecommended,
    }
  }, [appliedDateRange, categoryFilter, hideNonRecommended, pagination.page, pagination.size, searchQuery, sort, typeFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['scenarioWorkbenchDesignEvents', listRequest],
    queryFn: () => scenarioWorkbenchDesignService.getEvents(listRequest),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const updateDesignEventCache = useCallback(
    (
      eventId: number,
      patch: Partial<Pick<IDesignEventItem, 'scenarioGenStatus' | 'scenarioGenStatusLabel' | 'requestId' | 'scenarioGenStartedAt'>>,
    ) => {
      queryClient.setQueriesData<IDesignEventListRes>({ queryKey: ['scenarioWorkbenchDesignEvents'] }, (old) => {
        if (!old?.events?.detail) return old

        return {
          ...old,
          events: {
            ...old.events,
            detail: old.events.detail.map((item) => (Number(item.eventId) === eventId ? { ...item, ...patch } : item)),
          },
        }
      })
    },
    [queryClient],
  )

  const { mutate: generateScenarios } = useMutation({
    mutationFn: (eventId: number) => scenarioWorkbenchDesignService.generateScenarios([eventId]),
    onMutate: (eventId) => {
      const startedAt = new Date().toISOString()
      setDesignGenStartedAtFallback((prev) => ({ ...prev, [eventId]: startedAt }))
      setPendingGenerateEventIds((prev) => {
        const next = new Set(prev)
        next.add(eventId)
        return next
      })
      updateDesignEventCache(eventId, {
        scenarioGenStatus: 'processing',
        scenarioGenStartedAt: startedAt,
      })
    },
    onSuccess: (accepted, eventId) => {
      if (accepted.scenarioGenStartedAt) {
        setDesignGenStartedAtFallback((prev) => ({ ...prev, [eventId]: accepted.scenarioGenStartedAt! }))
      }
      updateDesignEventCache(eventId, {
        scenarioGenStatus: accepted.status,
        scenarioGenStatusLabel: accepted.statusLabel,
        requestId: normalizeRequestId(accepted.requestId),
        ...(accepted.scenarioGenStartedAt ? { scenarioGenStartedAt: accepted.scenarioGenStartedAt } : {}),
      })
      void queryClient.invalidateQueries({ queryKey: ['scenarioWorkbenchDesignEvents'] })
    },
    onError: (_error, eventId) => {
      setDesignGenStartedAtFallback((prev) => {
        const next = { ...prev }
        delete next[eventId]
        return next
      })
      updateDesignEventCache(eventId, {
        scenarioGenStatus: 'ready',
        scenarioGenStatusLabel: undefined,
        requestId: undefined,
        scenarioGenStartedAt: undefined,
      })
    },
    onSettled: (_data, _error, eventId) => {
      setPendingGenerateEventIds((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    },
  })

  const tableRows = useMemo(() => data?.events?.detail ?? [], [data?.events?.detail])

  const isDesignRowScenarioGenerating = useCallback(
    (row: IDesignEventItem) =>
      (pendingGenerateEventIds.has(row.eventId) && row.scenarioGenStatus === 'ready') || row.scenarioGenStatus === 'processing',
    [pendingGenerateEventIds],
  )

  useEffect(() => {
    setDesignGenStartedAtFallback((prev) => {
      const next = { ...prev }
      let changed = false
      for (const id of Object.keys(next)) {
        const eventId = Number(id)
        const row = tableRows.find((r) => r.eventId === eventId)
        if (row && !isDesignRowScenarioGenerating(row)) {
          delete next[eventId]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [tableRows, isDesignRowScenarioGenerating])

  useEffect(() => {
    if (!data?.events) return
    const totalPages = data.events.totalPages
    if (totalPages > 0 && pagination.page > totalPages) {
      setPagination((p) => ({ ...p, page: totalPages }))
    }
  }, [data?.events, pagination.page])

  const processingRequestIds = useMemo(
    () =>
      Array.from(
        new Set(
          (data?.events?.detail ?? [])
            .map((row) => (row.scenarioGenStatus === 'processing' ? normalizeRequestId(row.requestId) : undefined))
            .filter((requestId): requestId is number => requestId !== undefined),
        ),
      ).sort((a, b) => a - b),
    [data?.events?.detail],
  )

  const processingRequestIdsKey = processingRequestIds.join(',')

  const { data: generateStatuses } = useQuery({
    queryKey: ['scenarioWorkbenchDesignGenerateStatuses', processingRequestIdsKey],
    queryFn: () => scenarioWorkbenchDesignService.getGenerateStatuses(processingRequestIds),
    enabled: processingRequestIds.length > 0,
    refetchInterval: processingRequestIds.length > 0 ? 3000 : false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!generateStatuses?.length) return

    const newlyCompletedForToast: string[] = []
    for (const status of generateStatuses) {
      if (status.status !== 'completed') continue
      const key = scenarioGenCompletionToastKey(status)
      if (scenarioGenCompletedToastKeysRef.current.has(key)) continue
      scenarioGenCompletedToastKeysRef.current.add(key)
      newlyCompletedForToast.push(key)
    }
    if (newlyCompletedForToast.length > 0) {
      showSnackbar(
        newlyCompletedForToast.length === 1
          ? '시나리오 생성이 완료되었습니다.'
          : `${newlyCompletedForToast.length}건의 시나리오 생성이 완료되었습니다.`,
        { variant: 'success' },
      )
    }

    const statusByEventId = new Map(generateStatuses.map((status) => [Number(status.eventId), status]))

    queryClient.setQueriesData<IDesignEventListRes>({ queryKey: ['scenarioWorkbenchDesignEvents'] }, (old) => {
      if (!old?.events?.detail) return old

      return {
        ...old,
        events: {
          ...old.events,
          detail: old.events.detail.map((item) => {
            const nextStatus = statusByEventId.get(Number(item.eventId))
            if (!nextStatus) return item

            return {
              ...item,
              scenarioGenStatus: nextStatus.status,
              scenarioGenStatusLabel: nextStatus.statusLabel ?? item.scenarioGenStatusLabel,
              requestId: normalizeRequestId(nextStatus.requestId) ?? normalizeRequestId(item.requestId),
            }
          }),
        },
      }
    })

    if (generateStatuses.some((status) => status.status === 'completed')) {
      void queryClient.invalidateQueries({ queryKey: ['scenarioWorkbenchDesignEvents'] })
      generateStatuses.forEach((status) => {
        const completedRequestId = normalizeRequestId(status.requestId)
        if (status.status === 'completed' && completedRequestId !== undefined) {
          void queryClient.invalidateQueries({ queryKey: ['scenarioWorkbenchDesignGeneratedScenarios', completedRequestId] })
        }
      })
    }
  }, [generateStatuses, queryClient, showSnackbar])

  // ── 핸들러 ──────────────────────────────────────────────────────────────────

  const handleTypeFilterChange = useCallback((v: string) => {
    if (v === ScenarioWorkbenchStatus.ALL || v === ScenarioWorkbenchStatus.NEW || v === ScenarioWorkbenchStatus.UPDATED) {
      setTypeFilter(v)
      setPagination((p) => ({ ...p, page: 1 }))
    }
  }, [])

  const handleSortChange = useCallback((value: string) => {
    if (value === ListSort.LATEST || value === ListSort.OLDEST) {
      setSort(value)
      setPagination((p) => ({ ...p, page: 1 }))
    }
  }, [])

  const handleDateRangeApply = useCallback((dates: DateRange) => {
    setAppliedDateRange({ startDate: dates.startDate, endDate: dates.endDate })
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleCategoryFilterApply = useCallback((values: FilterValues) => {
    setCategoryFilter((values.category ?? []) as EventCategoryLv1[])
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const handleToggleHideNonRecommended = useCallback(() => {
    setHideNonRecommended((prev) => !prev)
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

  const handleScenarioCreate = useCallback(
    (rowId: number) => {
      generateScenarios(rowId)
    },
    [generateScenarios],
  )

  // ── 컬럼 정의 ───────────────────────────────────────────────────────────────

  const columns: GridColDef<IDesignEventItem>[] = useMemo(
    () => [
      {
        field: 'status',
        headerName: '구분',
        width: 70,
        align: 'center',
        headerAlign: 'left',
        sortable: false,
        renderCell: (params) => <ClassificationTag {...classificationPropsFromDesignEventRow(params.row)} />,
      },
      {
        field: 'createdAt',
        headerName: '발생/갱신일시',
        width: 130,
        align: 'left',
        headerAlign: 'left',
        renderCell: (params) => formatDesignEventTime(params.row),
      },
      {
        field: 'eventCategoryLv1Label',
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
        renderCell: (params) => {
          const row = params.row
          const reason = row.recommendationReason?.trim()
          const badgeWrapSx = { flex: '0 0 auto' as const, display: 'inline-flex' as const, lineHeight: 0 }

          const badge =
            row.scenarioRecommended === true ? (
              reason ? (
                <WorkbenchFollowCursorTooltip title={reason}>
                  <Box component="span" sx={badgeWrapSx}>
                    <ScenarioWorkbenchRecommendedBadge />
                  </Box>
                </WorkbenchFollowCursorTooltip>
              ) : (
                <Box sx={badgeWrapSx}>
                  <ScenarioWorkbenchRecommendedBadge />
                </Box>
              )
            ) : null

          return (
            <Stack direction="row" alignItems="center" gap="6px" sx={{ minWidth: 0, width: '100%' }}>
              {badge}
              <ScenarioWorkbenchEventDetailTableBodyText
                value={row.eventName}
                variant="body1M16"
                tooltipWhenTruncated
                sx={{ minWidth: 0, flex: '1 1 auto' }}
              />
            </Stack>
          )
        },
      },
      {
        field: 'jkm',
        headerName: 'JKM',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'JKM')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
        },
      },
      {
        field: 'ttf',
        headerName: 'TTF',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'TTF')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
        },
      },
      {
        field: 'hh',
        headerName: 'HH',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const impact = findIndexImpact(params.row.indexImpacts, 'HH')
          return <ImpactDotsCell level={impact?.marketImpactLevel} direction={impact?.direction} />
        },
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
        field: 'scenarioGenStatus',
        headerName: '시나리오',
        width: 110,
        align: 'center',
        headerAlign: 'center',
        sortable: false,
        renderCell: (params) => {
          const scenarioGenStatus =
            pendingGenerateEventIds.has(params.row.eventId) && params.row.scenarioGenStatus === 'ready'
              ? ('processing' as ScenarioGenStatus)
              : params.row.scenarioGenStatus

          switch (scenarioGenStatus) {
            case 'completed':
              return <CompletedScenarioPopupButton row={params.row} />
            case 'processing':
              return (
                <GeneratingScenarioButton startedAt={params.row.scenarioGenStartedAt ?? designGenStartedAtFallback[params.row.eventId]} />
              )
            case 'ready':
            default:
              return <CreateScenarioButton onClick={() => handleScenarioCreate(params.row.eventId)} />
          }
        },
      },
    ],
    [designGenStartedAtFallback, handleScenarioCreate, pendingGenerateEventIds],
  )

  const categoryFilterItems = useMemo(
    () => Object.values(EventCategoryLv1).map((value) => ({ label: EVENT_CATEGORY_LV1_KO[value], value })),
    [],
  )

  const workbenchDatePresets = useMemo(() => buildWorkbenchDatePresets(), [])
  const emptyMessage = isError ? '목록을 불러오지 못했습니다.' : '이벤트가 없습니다.'

  return (
    <Box width="100%">
      <WorkbenchStickySlot tabKey="design">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography fontSize={26} fontWeight={700} lineHeight={1.4} py="18px" px={3} color="contentText.Black">
            Design
          </Typography>

          <Stack px="16px" py="8px" gap="2px">
            <Typography variant="body2M14" color="contentText.Normal">
              • 이벤트의 생성 버튼을 실행하면 발생 가능한 시나리오 3~5개가 생성됩니다.
            </Typography>
            <Typography variant="body2M14" color="contentText.Normal">
              • 시나리오 생성에는 약 5-10분이 소요됩니다.
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} sx={{ px: 3 }}>
          <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap" sx={{ minWidth: 0, flex: 1 }}>
            <MISlidingSegmented
              options={WORKBENCH_STATUS_FILTER_OPTIONS}
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
              closeOnScroll
            />

            <MIDateRangePickerMenu
              dateRange={appliedDateRange}
              onApply={handleDateRangeApply}
              showPreset
              datePresets={workbenchDatePresets}
              closeOnScroll
            />

            <MISelectMenu
              variant="outlined"
              buttonHoverBgColor="gray.20"
              selected={sort}
              onSelected={(value: string) => handleSortChange(value)}
              items={WORKBENCH_LIST_SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
              closeOnScroll
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={3} sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" paddingY={1} gap={0.5}>
              <Switch size="small" checked={hideNonRecommended} onChange={handleToggleHideNonRecommended} />
              <Typography variant="body2M14" color="contentText.Black">
                추천 항목만 보기
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

        <ScenarioWorkbenchTableHeader<IDesignEventItem> columns={columns} sx={{ mt: 2 }} />
      </WorkbenchStickySlot>

      <ScenarioWorkbenchDataList<IDesignEventItem>
        rowId="eventId"
        columns={columns}
        rows={tableRows}
        loading={isLoading}
        skeletonRowCount={pagination.size}
        rowHeight={42}
        noRowMessage={emptyMessage}
      />

      <MIPaginationSecondary
        data={data?.events}
        size={pagination.size}
        sizeList={[10, 20, 50, 100]}
        onSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
      />
    </Box>
  )
}

export default DesignTabPanel
