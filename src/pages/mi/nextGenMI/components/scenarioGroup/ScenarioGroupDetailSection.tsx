import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'

import type {
  IScenarioDimension,
  IScenarioGroupDetailRow,
  IScenarioSignpostDefinition,
  IScenarioSignpostMonitoring,
} from '@/service/mi/nextGenMI/scenarioGroup'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING,
  NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS,
  NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import NextGenMIStickyTable, { type NextGenMIStickyTableColumn } from '@/pages/mi/nextGenMI/components/common/NextGenMIStickyTable'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import { formatNextGenMIDateTime } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import { NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID } from '@/pages/mi/nextGenMI/nextGenMIScroll'
import { probabilityToLikelihoodLabel } from '@/pages/mi/nextGenMI/utils/probabilityFormatting'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

const SCENARIO_DETAIL_SIDEBAR_WIDTH = '360px'
const SCENARIO_DETAIL_STICKY_GAP_PX = 20
const SCENARIO_DETAIL_HEADING_BLOCK_HEIGHT_PX = 42
const SCENARIO_DETAIL_STICKY_TOP_FALLBACK_PX = NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX.collapsed + 80

const ScenarioSelectBadge = ({ label, disabled = false }: { label: string; disabled?: boolean }) => (
  <Box
    component="span"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    padding="2px 6px"
    borderRadius="8px"
    boxSizing="border-box"
    bgcolor={disabled ? 'contentBG.Disabled' : 'mari.Primary'}
    color={disabled ? 'contentText.Disabled' : 'commonColor.White'}
    flexShrink={0}
  >
    <Typography component="span" color="inherit" fontSize="12px" fontWeight={600} lineHeight={1.4} noWrap>
      {label}
    </Typography>
  </Box>
)

interface ScenarioSelectSidebarProps {
  scenarios: IScenarioGroupDetailRow[]
  selectedScenarioId?: number
  scenarioCount?: number
  stickyTopPx: number
  headingSlot?: ReactNode
  loading?: boolean
  onSelect: (scenarioId: number) => void
}

const ScenarioSelectSidebar = ({
  scenarios,
  selectedScenarioId,
  scenarioCount,
  stickyTopPx,
  headingSlot,
  loading = false,
  onSelect,
}: ScenarioSelectSidebarProps) => {
  const maxHeight = `calc(100vh - ${stickyTopPx + 24}px)`
  const listMaxHeight = headingSlot
    ? `max(160px, min(456px, calc(${maxHeight} - ${SCENARIO_DETAIL_HEADING_BLOCK_HEIGHT_PX + 65}px)))`
    : `max(160px, min(456px, calc(${maxHeight} - 65px)))`
  const scenarioItems: ReactNode[] = []

  if (loading) {
    Array.from({ length: 4 }).forEach((_, index) => {
      scenarioItems.push(<Skeleton key={`skeleton-${index}`} variant="rounded" height="42px" sx={{ borderRadius: '10px' }} />)
    })
  } else {
    scenarios.forEach((scenario) => {
      const isSelected = scenario.scenarioId === selectedScenarioId
      const isDiscarded = scenario.status === 'discarded'
      scenarioItems.push(
        <Stack
          key={scenario.scenarioId}
          role="button"
          tabIndex={isDiscarded ? -1 : 0}
          aria-disabled={isDiscarded || undefined}
          direction="row"
          alignItems="center"
          gap="6px"
          minHeight="42px"
          padding="10px 12px"
          borderRadius="10px"
          onClick={isDiscarded ? undefined : () => onSelect(scenario.scenarioId)}
          onKeyDown={(event) => {
            if (isDiscarded) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect(scenario.scenarioId)
            }
          }}
          sx={{
            boxSizing: 'border-box',
            cursor: isDiscarded ? 'default' : 'pointer',
            bgcolor: isSelected ? 'contentBG.Active' : 'transparent',
            border: '1px solid',
            borderColor: isSelected ? 'contentBorder.Active' : 'transparent',
            transition: 'background-color 120ms ease, border-color 120ms ease',
            '&:hover': { bgcolor: isSelected ? 'contentBG.Active' : isDiscarded ? 'transparent' : 'gray.10' },
          }}
        >
          {scenario.baseCase && <ScenarioSelectBadge label="BC" />}
          <Typography
            variant={isSelected ? 'body1SB16' : 'body1M16'}
            color={isDiscarded && !isSelected ? 'contentText.Disabled' : isSelected ? 'contentText.Black' : 'contentText.Normal'}
            flex={1}
            minWidth={0}
            noWrap
            title={scenario.scenarioName}
          >
            {scenario.scenarioName}
          </Typography>
          {isDiscarded && <ScenarioSelectBadge label={scenario.statusLabel || '폐기'} disabled />}
        </Stack>,
      )
    })
  }

  return (
    <Stack
      width={SCENARIO_DETAIL_SIDEBAR_WIDTH}
      flexShrink={0}
      alignSelf="flex-start"
      gap="12px"
      sx={{
        position: 'sticky',
        top: `${stickyTopPx}px`,
        maxHeight,
        zIndex: 6,
      }}
    >
      {headingSlot}
      <Stack
        width="100%"
        minWidth={0}
        gap="4px"
        padding="12px 20px"
        bgcolor="gray.5"
        borderRadius="10px"
        boxSizing="border-box"
        overflow="hidden"
      >
        {loading ? (
          <Skeleton variant="rounded" width="96px" height="17px" sx={{ margin: '10px 4px', borderRadius: '4px' }} />
        ) : (
          <Typography padding="10px 4px" fontSize="12px" fontWeight={500} lineHeight={1.4} color="contentText.Normal">
            {scenarioCount ?? scenarios.length}개 시나리오
          </Typography>
        )}
        <ScrollWrapper
          maxHeight={listMaxHeight}
          scrollbarGap={8}
          reserveScrollbarGap
          thumbWidth={4}
          thumbMaxHeight={252}
          overscrollBehavior="auto"
          showScrollEdgeShadow
          contentKey={loading ? 'loading' : scenarios.length}
          sx={{
            width: '100%',
            '& .scroll-wrapper-edge-shadow-top': { height: '40px' },
            '& .scroll-wrapper-edge-shadow-bottom': { height: '82px' },
            '& .scroll-wrapper-edge-shadow-top > div:first-of-type': {
              background: 'linear-gradient(to bottom, rgba(248, 249, 250, 1) 0%, rgba(248, 249, 250, 0) 80%)',
            },
            '& .scroll-wrapper-edge-shadow-bottom > div:first-of-type': {
              background: 'linear-gradient(to top, rgba(248, 249, 250, 1) 0%, rgba(248, 249, 250, 0) 80%)',
            },
            '& .scroll-wrapper-edge-shadow-top > div:last-of-type, & .scroll-wrapper-edge-shadow-bottom > div:last-of-type': {
              display: 'none',
            },
          }}
        >
          <Stack gap="4px">{scenarioItems}</Stack>
        </ScrollWrapper>
      </Stack>
    </Stack>
  )
}

const useScenarioDetailStickyTop = () => {
  const [stickyTopPx, setStickyTopPx] = useState(SCENARIO_DETAIL_STICKY_TOP_FALLBACK_PX)
  const observedHeaderRef = useRef<HTMLElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useLayoutEffect(() => {
    let rafId = 0

    let measure = () => {
      rafId = 0
    }

    const scheduleMeasure = () => {
      if (rafId !== 0) return
      rafId = globalThis.requestAnimationFrame(measure)
    }

    const syncObservedHeader = (nextHeader: HTMLElement | null) => {
      if (observedHeaderRef.current === nextHeader) return

      if (observedHeaderRef.current) {
        observedHeaderRef.current.removeEventListener('transitionend', scheduleMeasure)
      }
      resizeObserverRef.current?.disconnect()
      observedHeaderRef.current = nextHeader

      if (!nextHeader) return

      resizeObserverRef.current = new ResizeObserver(scheduleMeasure)
      resizeObserverRef.current.observe(nextHeader)
      nextHeader.addEventListener('transitionend', scheduleMeasure)
    }

    measure = () => {
      rafId = 0
      const stickyHeader = document.querySelector<HTMLElement>('.main-header [data-sticky-header]')
      syncObservedHeader(stickyHeader)

      const nextTop = stickyHeader
        ? Math.round(stickyHeader.getBoundingClientRect().bottom + SCENARIO_DETAIL_STICKY_GAP_PX)
        : SCENARIO_DETAIL_STICKY_TOP_FALLBACK_PX

      setStickyTopPx((current) => (Math.abs(current - nextTop) < 1 ? current : nextTop))
    }

    const scrollEl = document.getElementById(NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID)

    measure()
    rafId = globalThis.requestAnimationFrame(measure)
    scrollEl?.addEventListener('scroll', scheduleMeasure, { passive: true })
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      scrollEl?.removeEventListener('scroll', scheduleMeasure)
      globalThis.removeEventListener('resize', scheduleMeasure)
      observedHeaderRef.current?.removeEventListener('transitionend', scheduleMeasure)
      resizeObserverRef.current?.disconnect()
    }
  }, [])

  return stickyTopPx
}

const useScenarioDetailStickyPinned = (stickyRef: RefObject<HTMLElement | null>, stickyTopPx: number) => {
  const [pinned, setPinned] = useState(false)

  useLayoutEffect(() => {
    const scrollEl = document.getElementById(NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID)
    const stickyEl = stickyRef.current
    if (!scrollEl || !stickyEl) {
      setPinned(false)
      return undefined
    }

    let rafId = 0

    const measure = () => {
      rafId = 0
      const nextPinned = stickyEl.getBoundingClientRect().top <= stickyTopPx + 0.5
      setPinned((current) => (current === nextPinned ? current : nextPinned))
    }

    const scheduleMeasure = () => {
      if (rafId !== 0) return
      rafId = globalThis.requestAnimationFrame(measure)
    }

    measure()

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(stickyEl)
    scrollEl.addEventListener('scroll', scheduleMeasure, { passive: true })
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      scrollEl.removeEventListener('scroll', scheduleMeasure)
      globalThis.removeEventListener('resize', scheduleMeasure)
    }
  }, [stickyRef, stickyTopPx])

  return pinned
}

interface ScenarioAssumptionCardsProps {
  dimensions: IScenarioDimension[]
  loading?: boolean
}

const ScenarioAssumptionCards = ({ dimensions, loading = false }: ScenarioAssumptionCardsProps) => {
  if (loading) {
    return (
      <Stack direction="row" gap="16px">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={`skeleton-${index}`} variant="rounded" height={77} sx={{ flex: 1, minWidth: 0, borderRadius: '10px' }} />
        ))}
      </Stack>
    )
  }

  const rows: IScenarioDimension[][] = []
  for (let i = 0; i < dimensions.length; i += 3) {
    rows.push(dimensions.slice(i, i + 3))
  }

  return (
    <Stack gap="8px">
      {rows.map((row, rowIndex) => (
        <Stack key={`assumption-row-${rowIndex}`} direction="row" gap="8px">
          {row.map((dimension) => (
            <Stack
              key={dimension.key}
              flex={1}
              minWidth={0}
              height="77px"
              alignItems="center"
              justifyContent="center"
              padding="16px"
              bgcolor="gray.5"
              borderRadius="10px"
              boxSizing="border-box"
            >
              <Stack width="100%" padding="8px" gap="4px">
                <Typography color="contentText.Normal" fontSize="13px" fontWeight={600} lineHeight={1.6} noWrap title={dimension.label}>
                  {dimension.label}
                </Typography>
                <Typography color="contentText.Black" fontSize="15px" fontWeight={500} lineHeight={1.6}>
                  {dimension.valueLabel}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

const SIGNPOST_FIRST_HEADER_CELL_SX = {
  fontSize: '14px',
} as const

const RATIONALE_WRAP_CELL_SX = {
  whiteSpace: 'normal',
  wordBreak: 'break-word',
} as const

interface SignpostDefinitionTableProps {
  definitions: IScenarioSignpostDefinition[]
  loading?: boolean
}

const SignpostDefinitionTable = ({ definitions, loading = false }: SignpostDefinitionTableProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<IScenarioSignpostDefinition>[]>(
    () => [
      {
        field: 'label',
        headerName: 'Signpost Label',
        width: '400px',
        headerCellSx: SIGNPOST_FIRST_HEADER_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.label} color="contentText.Black" tooltipWhenTruncated />,
      },
      {
        field: 'directionLabel',
        headerName: '방향',
        width: '120px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <NextGenMITableBodyText value={row.directionLabel} color="contentText.Black" align="center" tooltipWhenTruncated />
        ),
      },
      {
        field: 'probabilityImpact',
        headerName: '영향도',
        width: '120px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => <NextGenMITableBodyText value={`${row.probabilityImpact}%`} color="contentText.Black" align="center" />,
      },
      {
        field: 'rationale',
        headerName: '핵심 근거',
        width: 'max-content',
        minWidth: '376px',
        cellSx: RATIONALE_WRAP_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.rationale} color="contentText.Black" sx={RATIONALE_WRAP_CELL_SX} />,
      },
    ],
    [],
  )

  return (
    <NextGenMIStickyTable<IScenarioSignpostDefinition>
      columns={columns}
      rows={definitions}
      getRowKey={(row, index) => `${row.label}-${index}`}
      headerFontSize="13px"
      rowHeight="40px"
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
      containerShell={false}
    />
  )
}

const formatProbabilityUpdate = (probability: number, delta: number) => {
  const sign = delta > 0 ? '+' : ''
  return `${probability}% (${sign}${delta}%)`
}

interface SignpostMonitoringTableProps {
  monitorings: IScenarioSignpostMonitoring[]
  loading?: boolean
}

const SignpostMonitoringTable = ({ monitorings, loading = false }: SignpostMonitoringTableProps) => {
  const columns = useMemo<NextGenMIStickyTableColumn<IScenarioSignpostMonitoring>[]>(
    () => [
      {
        field: 'updatedAt',
        headerName: '업데이트 일시',
        width: '110px',
        // headerCellSx: SIGNPOST_FIRST_HEADER_CELL_SX,
        align: 'center',
        renderCell: ({ row }) => (
          <NextGenMITableBodyText value={formatNextGenMIDateTime(row.updatedAt, 'YYYY-MM-DD')} color="contentText.Black" />
        ),
      },
      {
        field: 'eventSummary',
        headerName: 'Signpost 이벤트 요약',
        width: '400px',
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.eventSummary} color="contentText.Black" tooltipWhenTruncated />,
      },
      {
        field: 'probability',
        headerName: '시나리오 확률 업데이트',
        width: '160px',
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <NextGenMITableBodyText
            value={formatProbabilityUpdate(row.probability, row.probabilityDelta)}
            color="contentText.Black"
            align="center"
          />
        ),
      },
      {
        field: 'rationale',
        headerName: '상세 내역 (Signpost 매칭 근거)',
        width: 'max-content',
        minWidth: '356px',
        cellSx: RATIONALE_WRAP_CELL_SX,
        renderCell: ({ row }) => <NextGenMITableBodyText value={row.rationale} color="contentText.Black" sx={RATIONALE_WRAP_CELL_SX} />,
      },
    ],
    [],
  )

  return (
    <NextGenMIStickyTable<IScenarioSignpostMonitoring>
      columns={columns}
      rows={monitorings}
      getRowKey={(row, index) => `${row.updatedAt}-${index}`}
      headerFontSize="13px"
      rowHeight="40px"
      loading={loading}
      skeletonRowCount={4}
      noRowMessage="데이터를 수집 중입니다."
      containerShell={false}
    />
  )
}

interface ScenarioGroupDetailSectionProps {
  scenarioGroupId: string
  scenarios: IScenarioGroupDetailRow[]
  selectedScenarioId?: number
  scenarioCount?: number
  headingSlot?: ReactNode
  listLoading?: boolean
  onSelectScenario: (scenarioId: number) => void
}

const SubHeading = ({ label }: { label: string }) => (
  <Typography fontSize="18px" fontWeight={600} lineHeight={1.4} color="contentText.Black">
    {label}
  </Typography>
)

const ScenarioGroupDetailSection = ({
  scenarioGroupId,
  scenarios,
  selectedScenarioId,
  scenarioCount,
  headingSlot,
  listLoading = false,
  onSelectScenario,
}: ScenarioGroupDetailSectionProps) => {
  const stickyTopPx = useScenarioDetailStickyTop()
  const sectionRootRef = useRef<HTMLDivElement>(null)
  const rightHeaderRef = useRef<HTMLDivElement>(null)
  const pendingScrollScenarioIdRef = useRef<number | null>(null)
  const scrollCompletionCleanupRef = useRef<(() => void) | null>(null)
  const scrollSkeletonHoldTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const scrollSkeletonHoldGenerationRef = useRef(0)
  const [scrollSkeletonHoldScenarioId, setScrollSkeletonHoldScenarioId] = useState<number | null>(null)
  const rightHeaderPinned = useScenarioDetailStickyPinned(rightHeaderRef, stickyTopPx)
  const hasHeadingSlot = Boolean(headingSlot)
  const { data, isLoading } = useQuery({
    queryKey: ['nextGenMIScenarioGroupScenarioDetail', scenarioGroupId, selectedScenarioId],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioDetail(scenarioGroupId, selectedScenarioId ?? ''),
    enabled: Boolean(scenarioGroupId && selectedScenarioId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const queryDetailLoading = isLoading || (Boolean(selectedScenarioId) && !data)
  const detailLoading = queryDetailLoading || scrollSkeletonHoldScenarioId === selectedScenarioId

  const isDetailHeaderSticky = useCallback(() => {
    const rightHeader = rightHeaderRef.current
    return Boolean(rightHeader && rightHeader.getBoundingClientRect().top <= stickyTopPx + 0.5)
  }, [stickyTopPx])

  const resetDetailScrollTop = useCallback(() => {
    const scrollEl = document.getElementById(NEXT_GEN_MI_MAIN_SCROLL_WRAPPER_ID)
    const sectionRoot = sectionRootRef.current
    const rightHeader = rightHeaderRef.current
    if (!scrollEl || !sectionRoot || !rightHeader) return null
    if (!isDetailHeaderSticky()) return null

    const scrollRect = scrollEl.getBoundingClientRect()
    const sectionRect = sectionRoot.getBoundingClientRect()
    const headingOffset = hasHeadingSlot ? SCENARIO_DETAIL_HEADING_BLOCK_HEIGHT_PX : 0
    const scrollTarget = Math.max(0, scrollEl.scrollTop + sectionRect.top - scrollRect.top + headingOffset - stickyTopPx)

    scrollEl.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    })
    return { scrollEl, scrollTarget }
  }, [hasHeadingSlot, isDetailHeaderSticky, stickyTopPx])

  const scheduleScrollSkeletonRelease = useCallback((scrollEl: HTMLElement, scrollTarget: number, scenarioId: number) => {
    scrollCompletionCleanupRef.current?.()
    if (scrollSkeletonHoldTimerRef.current) {
      globalThis.clearTimeout(scrollSkeletonHoldTimerRef.current)
      scrollSkeletonHoldTimerRef.current = null
    }

    scrollSkeletonHoldGenerationRef.current += 1
    const generation = scrollSkeletonHoldGenerationRef.current
    let settled = false
    let rafId = 0
    let settleTimer: ReturnType<typeof globalThis.setTimeout> | null = null
    let fallbackTimer: ReturnType<typeof globalThis.setTimeout> | null = null
    let release = () => undefined

    const scheduleFallbackRelease = () => {
      if (settleTimer) globalThis.clearTimeout(settleTimer)
      settleTimer = globalThis.setTimeout(release, 160)
    }

    release = () => {
      if (settled) return
      settled = true
      scrollEl.removeEventListener('scrollend', release)
      scrollEl.removeEventListener('scroll', scheduleFallbackRelease)
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      if (settleTimer) globalThis.clearTimeout(settleTimer)
      if (fallbackTimer) globalThis.clearTimeout(fallbackTimer)
      scrollCompletionCleanupRef.current = null

      scrollSkeletonHoldTimerRef.current = globalThis.setTimeout(() => {
        if (scrollSkeletonHoldGenerationRef.current === generation) {
          setScrollSkeletonHoldScenarioId((current) => (current === scenarioId ? null : current))
        }
        scrollSkeletonHoldTimerRef.current = null
      }, 10)
    }

    const watchScrollTarget = () => {
      if (Math.abs(scrollEl.scrollTop - scrollTarget) < 1) {
        release()
        return
      }
      rafId = globalThis.requestAnimationFrame(watchScrollTarget)
    }

    scrollCompletionCleanupRef.current = () => {
      settled = true
      scrollEl.removeEventListener('scrollend', release)
      scrollEl.removeEventListener('scroll', scheduleFallbackRelease)
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      if (settleTimer) globalThis.clearTimeout(settleTimer)
      if (fallbackTimer) globalThis.clearTimeout(fallbackTimer)
    }

    if (Math.abs(scrollEl.scrollTop - scrollTarget) < 1) {
      release()
      return
    }

    scrollEl.addEventListener('scrollend', release, { passive: true })
    scrollEl.addEventListener('scroll', scheduleFallbackRelease, { passive: true })
    rafId = globalThis.requestAnimationFrame(watchScrollTarget)
    fallbackTimer = globalThis.setTimeout(release, 4000)
  }, [])

  const handleSelectScenario = useCallback(
    (scenarioId: number) => {
      if (scenarioId !== selectedScenarioId && isDetailHeaderSticky()) {
        pendingScrollScenarioIdRef.current = scenarioId
        scrollCompletionCleanupRef.current?.()
        if (scrollSkeletonHoldTimerRef.current) {
          globalThis.clearTimeout(scrollSkeletonHoldTimerRef.current)
          scrollSkeletonHoldTimerRef.current = null
        }
        setScrollSkeletonHoldScenarioId(scenarioId)
      } else {
        pendingScrollScenarioIdRef.current = null
      }
      onSelectScenario(scenarioId)
    },
    [isDetailHeaderSticky, onSelectScenario, selectedScenarioId],
  )

  useEffect(() => {
    if (pendingScrollScenarioIdRef.current !== selectedScenarioId) return
    if (scrollSkeletonHoldScenarioId !== selectedScenarioId) return

    pendingScrollScenarioIdRef.current = null
    const result = resetDetailScrollTop()
    if (result) {
      scheduleScrollSkeletonRelease(result.scrollEl, result.scrollTarget, selectedScenarioId)
      return
    }

    setScrollSkeletonHoldScenarioId((current) => (current === selectedScenarioId ? null : current))
  }, [resetDetailScrollTop, scheduleScrollSkeletonRelease, scrollSkeletonHoldScenarioId, selectedScenarioId])

  useEffect(
    () => () => {
      scrollCompletionCleanupRef.current?.()
      if (scrollSkeletonHoldTimerRef.current) globalThis.clearTimeout(scrollSkeletonHoldTimerRef.current)
    },
    [],
  )

  return (
    <Stack
      ref={sectionRootRef}
      sx={{
        display: 'grid',
        gridTemplateColumns: `${SCENARIO_DETAIL_SIDEBAR_WIDTH} minmax(0, 1fr)`,
        alignItems: 'stretch',
        columnGap: '24px',
      }}
    >
      <ScenarioSelectSidebar
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        scenarioCount={scenarioCount}
        stickyTopPx={stickyTopPx}
        headingSlot={headingSlot}
        loading={listLoading}
        onSelect={handleSelectScenario}
      />

      <Stack flex={1} minWidth={0} gap="12px" pt={hasHeadingSlot ? `${SCENARIO_DETAIL_HEADING_BLOCK_HEIGHT_PX}px` : 0}>
        <Stack
          ref={rightHeaderRef}
          gap="6px"
          width="100%"
          pb="24px"
          sx={{
            position: 'sticky',
            top: `${stickyTopPx}px`,
            zIndex: 7,
            bgcolor: 'commonColor.White',
            borderBottom: '1px solid',
            borderColor: 'contentBorder.Normal',
            boxShadow: rightHeaderPinned ? NEXT_GEN_MI_STICKY_BOTTOM_EDGE_SHADOW_SCROLLED : 'none',
            clipPath: `inset(-${SCENARIO_DETAIL_STICKY_GAP_PX}px 0 -20px 0)`,
            transition: `box-shadow ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_MS}ms ${NEXT_GEN_MI_EDGE_SHADOW_TRANSITION_EASING}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              top: `-${SCENARIO_DETAIL_STICKY_GAP_PX}px`,
              height: `${SCENARIO_DETAIL_STICKY_GAP_PX}px`,
              bgcolor: 'commonColor.White',
            },
          }}
        >
          {detailLoading ? (
            <>
              <Skeleton variant="rounded" width={120} height={20} sx={{ borderRadius: '6px' }} />
              <Skeleton variant="rounded" width="min(480px, 80%)" height={32} sx={{ borderRadius: '6px' }} />
            </>
          ) : (
            <>
              <Typography fontSize="14px" fontWeight={500} color="contentText.Normal">
                Scenario
              </Typography>
              <Typography fontSize="22px" fontWeight={700} lineHeight={1.4} color="contentText.Black">
                {data?.scenarioName ?? '-'}
              </Typography>
            </>
          )}
        </Stack>

        <Stack py="24px" gap="50px">
          <Stack direction="row" gap="24px" alignItems="stretch">
            <Stack flex={1} minWidth={0} gap="12px">
              <SubHeading label="시나리오 내러티브" />
              {detailLoading ? (
                <Skeleton variant="rounded" height={120} sx={{ borderRadius: '10px' }} />
              ) : (
                <Stack bgcolor="gray.5" borderRadius="10px" padding="16px">
                  <Typography variant="body1M16" color="contentText.Black" lineHeight={1.6} sx={{ whiteSpace: 'pre-line' }}>
                    {data?.narrative ?? '-'}
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Stack width="200px" flexShrink={0} gap="12px">
              <SubHeading label="시나리오 발생 확률" />
              {detailLoading ? (
                <Skeleton variant="rounded" sx={{ flex: 1, borderRadius: '10px' }} />
              ) : (
                <Stack flex={1} alignItems="flex-start" gap="4px" bgcolor="gray.5" borderRadius="10px" padding="20px 16px">
                  <ScenarioPossibilityGauge probability={data?.probability ?? 0} hideBackground hideTooltip />
                  <Typography fontSize="15px" fontWeight={500} lineHeight={1.6} color="contentText.Black">
                    {typeof data?.probability === 'number' ? probabilityToLikelihoodLabel(data.probability / 100) : '-'}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

          <Stack gap="12px">
            <SubHeading label="시나리오 주요 가정" />
            <ScenarioAssumptionCards dimensions={data?.dimensions ?? []} loading={detailLoading} />
          </Stack>

          <Stack gap="12px">
            <SubHeading label="Signpost 정의" />
            <SignpostDefinitionTable definitions={data?.signpostDefinitions ?? []} loading={detailLoading} />
          </Stack>

          <Stack gap="12px">
            <SubHeading label="Signpost 모니터링 현황" />
            <SignpostMonitoringTable monitorings={data?.signpostMonitorings ?? []} loading={detailLoading} />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioGroupDetailSection
