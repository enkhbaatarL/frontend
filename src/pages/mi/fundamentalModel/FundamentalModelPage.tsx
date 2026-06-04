import { Box, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelPageSkeleton from '@/pages/mi/fundamentalModel/components/common/FundamentalModelPageSkeleton'
import FundamentalModelTab from '@/pages/mi/fundamentalModel/components/common/FundamentalModelTab'
import FundamentalModelRunList, {
  FUNDAMENTAL_MODEL_RUN_LIST_PANEL_HEIGHT_CSS,
  FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelRunList'
import FundamentalModelRunPlaceholder from '@/pages/mi/fundamentalModel/components/FundamentalModelRunPlaceholder'
import FundamentalModelDetailHeader from '@/pages/mi/fundamentalModel/components/header/FundamentalModelDetailHeader'
import PriceTabPanel from '@/pages/mi/fundamentalModel/components/price/PriceTabPanel'
import VolumesTabPanel from '@/pages/mi/fundamentalModel/components/volumes/VolumesTabPanel'
import { FUNDAMENTAL_MODEL_VIEW_TABS, type FundamentalModelViewTabKey } from '@/pages/mi/fundamentalModel/fundamentalModelRoutes'
import {
  runStatusToPlaceholderMode,
  useFundamentalModelRunExecution,
} from '@/pages/mi/fundamentalModel/hooks/useFundamentalModelRunExecution'
import fundamentalModelCaseService, { type FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'
const RIGHT_STICKY_TOP_PX = 80
const RIGHT_STICKY_GAP_PX = 16
const RIGHT_STICKY_TOOLBAR_BOTTOM_PADDING_PX = 6
const RIGHT_STICKY_TOP_COVER_PX = 16
const RIGHT_STICKY_Z_INDEX = 8
const RIGHT_BODY_CONTENT_GAP_PX = 16
const TAB_STICKY_FALLBACK_HEIGHT_PX = 64
const STICKY_GUARANTEE_PX = 1
const RIGHT_BODY_MIN_HEIGHT_FALLBACK_CSS = `calc(${FUNDAMENTAL_MODEL_RUN_LIST_PANEL_HEIGHT_CSS} + ${STICKY_GUARANTEE_PX}px)`

const getTabPanelAttachOffset = (tabKey: FundamentalModelViewTabKey, completed: boolean) =>
  RIGHT_BODY_CONTENT_GAP_PX - (completed && tabKey === 'volumes' ? RIGHT_STICKY_TOOLBAR_BOTTOM_PADDING_PX : 0)

const getMountedTabPanelSx = (isActive: boolean) => ({
  position: isActive ? 'relative' : 'absolute',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  minWidth: 0,
  visibility: isActive ? 'visible' : 'hidden',
  opacity: isActive ? 1 : 0,
  pointerEvents: isActive ? 'auto' : 'none',
  zIndex: isActive ? 1 : 0,
})

const isTabPinnedToScrollTop = (scrollEl: HTMLElement, tabEl: HTMLElement) => {
  const scrollRect = scrollEl.getBoundingClientRect()
  const tabRect = tabEl.getBoundingClientRect()
  return tabRect.top <= scrollRect.top + RIGHT_STICKY_TOP_PX + 0.5
}

/** MI 수급 모델 — URL 고정 `/mi/fundamental-model`, 선택은 클라이언트 state */
const FundamentalModelPage = () => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [selectedCaseListStatus, setSelectedCaseListStatus] = useState<FundamentalModelCaseStatus | null>(null)
  const [viewTab, setViewTab] = useState<FundamentalModelViewTabKey>('volumes')
  const leftStickyBoundaryRef = useRef<HTMLDivElement>(null)
  const tabStickyBoundaryRef = useRef<HTMLDivElement>(null)
  const tabStickyRef = useRef<HTMLDivElement>(null)
  const tabPanelRef = useRef<HTMLDivElement>(null)
  const pendingTabPanelResetRef = useRef<FundamentalModelViewTabKey | null>(null)
  const pendingTabPanelScrollTopRef = useRef<number | null>(null)
  const pendingTabInteractionScrollStateRef = useRef<{ scrollTop: number; pinned: boolean } | null>(null)
  const [tabStickyHeight, setTabStickyHeight] = useState(TAB_STICKY_FALLBACK_HEIGHT_PX)
  const [tabStickyBoundHeight, setTabStickyBoundHeight] = useState(TAB_STICKY_FALLBACK_HEIGHT_PX)
  const [rightBodyMinHeightPx, setRightBodyMinHeightPx] = useState<number | null>(null)
  const [volumeToolbarSlotEl, setVolumeToolbarSlotEl] = useState<HTMLDivElement | null>(null)

  const activeCaseId = selectedCaseId
  const parsedCaseId = Number(activeCaseId)

  useEffect(() => {
    setViewTab('volumes')
  }, [activeCaseId])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (scrollEl) scrollEl.scrollTop = 0
  }, [activeCaseId])

  const selectedTabIndex = FUNDAMENTAL_MODEL_VIEW_TABS.findIndex((t) => t.key === viewTab)

  const {
    data: caseDetail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchCaseDetail,
  } = useQuery({
    queryKey: ['fundamentalModel', 'caseDetail', activeCaseId],
    queryFn: () => fundamentalModelCaseService.getCaseDetail(parsedCaseId),
    enabled: Number.isFinite(parsedCaseId) && parsedCaseId > 0,
    refetchOnWindowFocus: false,
  })
  const effectiveCaseStatus = caseDetail?.status ?? selectedCaseListStatus

  const handleRunSettled = useCallback(() => {
    void refetchCaseDetail()
  }, [refetchCaseDetail])

  const { handleRun, handleRetry, isRunPending } = useFundamentalModelRunExecution(activeCaseId, effectiveCaseStatus ?? undefined, {
    onRunSettled: handleRunSettled,
  })

  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: ['fundamentalModel', 'price', activeCaseId],
    queryFn: () => fundamentalModelCaseService.getPrice(parsedCaseId),
    enabled: (caseDetail?.status ?? selectedCaseListStatus) === 'COMPLETED' && Number.isFinite(parsedCaseId) && parsedCaseId > 0,
    refetchOnWindowFocus: false,
  })

  const captureTabInteractionScrollState = useCallback(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const tabEl = tabStickyRef.current
    pendingTabInteractionScrollStateRef.current =
      scrollEl && tabEl ? { scrollTop: scrollEl.scrollTop, pinned: isTabPinnedToScrollTop(scrollEl, tabEl) } : null
  }, [])

  const handleTabChange = useCallback(
    (index: number) => {
      const next = FUNDAMENTAL_MODEL_VIEW_TABS[index]
      const capturedScrollState = pendingTabInteractionScrollStateRef.current
      pendingTabInteractionScrollStateRef.current = null
      if (!next || next.key === viewTab) return

      const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
      const tabEl = tabStickyRef.current
      const shouldResetPanel = capturedScrollState?.pinned ?? Boolean(scrollEl && tabEl && isTabPinnedToScrollTop(scrollEl, tabEl))
      pendingTabPanelResetRef.current = shouldResetPanel ? next.key : null
      pendingTabPanelScrollTopRef.current = !shouldResetPanel ? (capturedScrollState?.scrollTop ?? scrollEl?.scrollTop ?? null) : null
      setViewTab(next.key)
    },
    [viewTab],
  )

  useLayoutEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    const leftBoundaryEl = leftStickyBoundaryRef.current
    const leftStickyEl = leftBoundaryEl?.querySelector<HTMLElement>('[data-testid="fundamental-run-list"]') ?? null
    const tabBoundaryEl = tabStickyBoundaryRef.current
    const tabEl = tabStickyRef.current
    if (!scrollEl || !leftBoundaryEl || !leftStickyEl || !tabBoundaryEl || !tabEl) {
      setRightBodyMinHeightPx(null)
      return undefined
    }

    let rafId = 0

    const measure = () => {
      rafId = 0
      const scrollRect = scrollEl.getBoundingClientRect()
      const leftBoundaryRect = leftBoundaryEl.getBoundingClientRect()
      const leftStickyRect = leftStickyEl.getBoundingClientRect()
      const tabBoundaryRect = tabBoundaryEl.getBoundingClientRect()
      const tabRect = tabEl.getBoundingClientRect()
      const tabHeight = tabRect.height
      if (tabHeight <= 0) return

      const leftBoundaryScrollTop = scrollEl.scrollTop + leftBoundaryRect.top - scrollRect.top
      const tabBoundaryScrollTop = scrollEl.scrollTop + tabBoundaryRect.top - scrollRect.top
      const tabStickyStartScrollTop = scrollEl.scrollTop + tabRect.top - scrollRect.top - RIGHT_STICKY_TOP_PX
      const requiredStickyBuffer = Math.max(
        STICKY_GUARANTEE_PX,
        tabStickyStartScrollTop - leftBoundaryScrollTop + FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX + STICKY_GUARANTEE_PX,
      )
      const requiredRightBodyMinHeight = Math.ceil(leftStickyRect.height + requiredStickyBuffer)
      const leftBoundaryHeightForRelease = Math.max(leftBoundaryRect.height, requiredRightBodyMinHeight)
      const releaseScrollTop =
        leftBoundaryScrollTop + leftBoundaryHeightForRelease - FUNDAMENTAL_MODEL_RUN_LIST_STICKY_TOP_PX - leftStickyRect.height
      const tabBoundHeight = Math.max(tabHeight, releaseScrollTop - tabBoundaryScrollTop + RIGHT_STICKY_TOP_PX + tabHeight)

      setTabStickyHeight((current) => (Math.abs(current - tabHeight) < 0.5 ? current : tabHeight))
      setTabStickyBoundHeight((current) => (Math.abs(current - tabBoundHeight) < 0.5 ? current : tabBoundHeight))
      setRightBodyMinHeightPx((current) =>
        current !== null && Math.abs(current - requiredRightBodyMinHeight) < 0.5 ? current : requiredRightBodyMinHeight,
      )
    }

    const scheduleMeasure = () => {
      if (rafId !== 0) return
      rafId = globalThis.requestAnimationFrame(measure)
    }

    measure()

    const resizeObserver = new ResizeObserver(scheduleMeasure)
    resizeObserver.observe(leftBoundaryEl)
    resizeObserver.observe(leftStickyEl)
    resizeObserver.observe(tabBoundaryEl)
    resizeObserver.observe(tabEl)
    globalThis.addEventListener('resize', scheduleMeasure)

    return () => {
      if (rafId !== 0) globalThis.cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      globalThis.removeEventListener('resize', scheduleMeasure)
    }
  }, [activeCaseId, caseDetail?.status, detailError, detailLoading, viewTab])

  useLayoutEffect(() => {
    const shouldResetPanel = pendingTabPanelResetRef.current === viewTab
    const restoreScrollTop = pendingTabPanelScrollTopRef.current
    if (!shouldResetPanel && restoreScrollTop === null) return undefined

    let secondRafId = 0
    const adjustScroll = () => {
      const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
      if (!scrollEl) return

      if (pendingTabPanelResetRef.current !== viewTab) {
        if (pendingTabPanelScrollTopRef.current !== null) {
          const targetScrollTop = pendingTabPanelScrollTopRef.current
          const maxScrollTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
          scrollEl.scrollTop = Math.min(targetScrollTop, maxScrollTop)
          const restored = Math.abs(scrollEl.scrollTop - targetScrollTop) <= 0.5
          const waitingForPriceContent = viewTab === 'price' && priceLoading
          if (restored || !waitingForPriceContent) {
            pendingTabPanelScrollTopRef.current = null
          }
        }
        return
      }

      const tabEl = tabStickyRef.current
      const panelEl = tabPanelRef.current
      if (!tabEl || !panelEl) return

      const tabRect = tabEl.getBoundingClientRect()
      if (!isTabPinnedToScrollTop(scrollEl, tabEl)) {
        pendingTabPanelResetRef.current = null
        pendingTabPanelScrollTopRef.current = null
        return
      }

      const panelRect = panelEl.getBoundingClientRect()
      const targetPanelTop = tabRect.bottom + getTabPanelAttachOffset(viewTab, caseDetail?.status === 'COMPLETED')
      const delta = panelRect.top - targetPanelTop

      if (Math.abs(delta) > 0.5) {
        scrollEl.scrollTop = Math.max(0, scrollEl.scrollTop + delta)
      }
      pendingTabPanelResetRef.current = null
      pendingTabPanelScrollTopRef.current = null
    }

    const rafId = globalThis.requestAnimationFrame(() => {
      secondRafId = globalThis.requestAnimationFrame(adjustScroll)
    })

    return () => {
      globalThis.cancelAnimationFrame(rafId)
      if (secondRafId !== 0) globalThis.cancelAnimationFrame(secondRafId)
    }
  }, [caseDetail?.status, priceLoading, tabStickyHeight, tabStickyBoundHeight, viewTab, volumeToolbarSlotEl])

  const tabBarItems = useMemo(
    () =>
      FUNDAMENTAL_MODEL_VIEW_TABS.map((tab) => ({
        label: tab.label,
        content: null,
      })),
    [],
  )

  const handleSelectCase = useCallback((id: string, status?: FundamentalModelCaseStatus) => {
    setSelectedCaseId(id)
    setSelectedCaseListStatus(status ?? null)
  }, [])

  const invalidateCaseQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
    if (activeCaseId) {
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'caseDetail', activeCaseId] })
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'price', activeCaseId] })
    }
  }, [activeCaseId, queryClient])

  const handleUpdateCase = useCallback(
    async (payload: { title: string; description: string }) => {
      if (!Number.isFinite(parsedCaseId) || parsedCaseId <= 0) return false

      try {
        await fundamentalModelCaseService.updateCase(parsedCaseId, {
          title: payload.title,
          description: payload.description,
        })
        invalidateCaseQueries()
        showSnackbar('수정 완료되었습니다.', { variant: 'success' })
        return true
      } catch {
        showSnackbar('수정 실패되었습니다.', { variant: 'error' })
        return false
      }
    },
    [invalidateCaseQueries, parsedCaseId, showSnackbar],
  )

  const handleDeleteCase = useCallback(async () => {
    if (!Number.isFinite(parsedCaseId) || parsedCaseId <= 0) return false

    try {
      await fundamentalModelCaseService.deleteCase(parsedCaseId)
      setSelectedCaseId('')
      setSelectedCaseListStatus(null)
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
      void queryClient.removeQueries({ queryKey: ['fundamentalModel', 'caseDetail', activeCaseId] })
      return true
    } catch {
      return false
    }
  }, [activeCaseId, parsedCaseId, queryClient])

  const isCaseDetailResolving = Boolean(activeCaseId) && detailLoading && !caseDetail
  const isCompletedCase = effectiveCaseStatus === 'COMPLETED'
  const placeholderMode = useMemo(
    () => (effectiveCaseStatus ? runStatusToPlaceholderMode(effectiveCaseStatus) : null),
    [effectiveCaseStatus],
  )
  const showVolumeToolbarSlot = isCompletedCase && viewTab === 'volumes'
  const isVolumesTabActive = viewTab === 'volumes'
  const isPriceTabActive = viewTab === 'price'
  const rightBodyMinHeight = rightBodyMinHeightPx === null ? RIGHT_BODY_MIN_HEIGHT_FALLBACK_CSS : `${rightBodyMinHeightPx}px`

  const rightBody = !activeCaseId ? (
    <Box
      sx={{
        flex: 1,
        minHeight: 900,
        bgcolor: 'gray.5',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" gap="10px">
        <ErrorOutlineIcon />
        <Typography variant="body3SB12" color="gray.60" textAlign="center">
          시뮬레이션 케이스를 선택해주세요.
        </Typography>
      </Stack>
    </Box>
  ) : detailError ? (
    <Box
      sx={{
        flex: 1,
        minHeight: 900,
        bgcolor: 'gray.5',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" gap="10px">
        <ErrorOutlineIcon />
        <Typography variant="body3SB12" color="gray.60" textAlign="center">
          케이스 상세를 불러오지 못했습니다.
        </Typography>
      </Stack>
    </Box>
  ) : (
    <Stack sx={{ flex: 1, minWidth: 0, gap: `${RIGHT_BODY_CONTENT_GAP_PX}px`, userSelect: 'text' }}>
      <FundamentalModelDetailHeader
        detail={caseDetail ?? null}
        loading={detailLoading}
        onEdit={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      <Box sx={{ position: 'relative', minWidth: 0 }}>
        <Box
          ref={tabStickyBoundaryRef}
          sx={{
            position: 'absolute',
            top: '-4px',
            left: 0,
            right: 0,
            height: `${tabStickyBoundHeight}px`,
            pointerEvents: 'none',
            zIndex: RIGHT_STICKY_Z_INDEX,
          }}
        >
          <Box
            ref={tabStickyRef}
            sx={{
              position: 'sticky',
              top: RIGHT_STICKY_TOP_PX,
              bgcolor: 'commonColor.White',
              pointerEvents: 'auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                top: `-${RIGHT_STICKY_TOP_COVER_PX}px`,
                height: `${RIGHT_STICKY_TOP_COVER_PX}px`,
                bgcolor: 'commonColor.White',
              },
            }}
          >
            <FundamentalModelTab
              tabItems={tabBarItems}
              tabBarOnly
              value={selectedTabIndex}
              onChange={handleTabChange}
              onKeyDownCapture={captureTabInteractionScrollState}
              onMouseDownCapture={captureTabInteractionScrollState}
            />
            {isCompletedCase && (
              <Box
                ref={setVolumeToolbarSlotEl}
                aria-hidden={!showVolumeToolbarSlot}
                sx={{
                  height: showVolumeToolbarSlot ? 'auto' : 0,
                  overflow: 'hidden',
                  visibility: showVolumeToolbarSlot ? 'visible' : 'hidden',
                  pointerEvents: showVolumeToolbarSlot ? 'auto' : 'none',
                  pt: showVolumeToolbarSlot ? `${RIGHT_STICKY_GAP_PX}px` : 0,
                  pb: showVolumeToolbarSlot ? `${RIGHT_STICKY_TOOLBAR_BOTTOM_PADDING_PX}px` : 0,
                }}
              />
            )}
          </Box>
        </Box>
        <Box aria-hidden sx={{ height: `${tabStickyHeight - 4}px`, flexShrink: 0 }} />
      </Box>

      <Box
        position="relative"
        sx={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          mt: showVolumeToolbarSlot ? `-${RIGHT_STICKY_TOOLBAR_BOTTOM_PADDING_PX}px` : 0,
        }}
      >
        {isCaseDetailResolving && !isCompletedCase ? (
          <FundamentalModelPageSkeleton />
        ) : placeholderMode ? (
          <FundamentalModelRunPlaceholder mode={placeholderMode} onRun={handleRun} onRetry={handleRetry} runActionDisabled={isRunPending} />
        ) : isCompletedCase ? (
          <>
            <Box
              ref={isVolumesTabActive ? tabPanelRef : undefined}
              role="tabpanel"
              id="fundamental-model-tabpanel-0"
              aria-labelledby="fundamental-model-tab-0"
              aria-hidden={!isVolumesTabActive}
              sx={getMountedTabPanelSx(isVolumesTabActive)}
            >
              <VolumesTabPanel
                caseId={Number.isFinite(parsedCaseId) && parsedCaseId > 0 ? parsedCaseId : null}
                toolbarSlotEl={volumeToolbarSlotEl}
                detailLoading={detailLoading}
              />
            </Box>

            <Box
              ref={isPriceTabActive ? tabPanelRef : undefined}
              role="tabpanel"
              id="fundamental-model-tabpanel-1"
              aria-labelledby="fundamental-model-tab-1"
              aria-hidden={!isPriceTabActive}
              sx={getMountedTabPanelSx(isPriceTabActive)}
            >
              <PriceTabPanel price={priceData ?? null} loading={detailLoading || priceLoading} />
            </Box>
          </>
        ) : (
          <FundamentalModelRunPlaceholder mode="pending" onRun={handleRun} onRetry={handleRetry} runActionDisabled={isRunPending} />
        )}
      </Box>
    </Stack>
  )

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" pb="16px" sx={{ userSelect: 'none' }}>
      <Box height="96px" py="12px" boxSizing="border-box" flexShrink={0}>
        <Typography variant="titleLarge" color="gray.90" fontSize="38px">
          MI Fundamental Model
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '350px minmax(0, 1fr)',
          alignItems: 'stretch',
          columnGap: '30px',
          width: '100%',
          boxSizing: 'border-box',
          userSelect: 'text',
        }}
      >
        <Box ref={leftStickyBoundaryRef} sx={{ minWidth: 0 }}>
          <FundamentalModelRunList selectedId={activeCaseId} onSelect={handleSelectCase} />
        </Box>
        <Box sx={{ minWidth: 0, minHeight: rightBodyMinHeight, display: 'flex' }}>{rightBody}</Box>
      </Box>
    </Stack>
  )
}

export default FundamentalModelPage
