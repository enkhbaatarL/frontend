import { Box, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelPageSkeleton from '@/pages/mi/fundamentalModel/components/common/FundamentalModelPageSkeleton'
import FundamentalModelTab from '@/pages/mi/fundamentalModel/components/common/FundamentalModelTab'
import FundamentalModelRunList from '@/pages/mi/fundamentalModel/components/FundamentalModelRunList'
import FundamentalModelRunPlaceholder from '@/pages/mi/fundamentalModel/components/FundamentalModelRunPlaceholder'
import FundamentalModelDetailHeader from '@/pages/mi/fundamentalModel/components/header/FundamentalModelDetailHeader'
import PriceTabPanel from '@/pages/mi/fundamentalModel/components/price/PriceTabPanel'
import VolumesTabPanel from '@/pages/mi/fundamentalModel/components/volumes/VolumesTabPanel'
import { fetchFundamentalModelDetail } from '@/pages/mi/fundamentalModel/fundamentalModelMockApi'
import { FUNDAMENTAL_MODEL_VIEW_TABS, type FundamentalModelViewTabKey } from '@/pages/mi/fundamentalModel/fundamentalModelRoutes'
import {
  runStatusToPlaceholderMode,
  useFundamentalModelRunExecution,
} from '@/pages/mi/fundamentalModel/hooks/useFundamentalModelRunExecution'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'

// #TODO: Trade API 연동되면 지우기
/** COMPLETED 케이스 Trade 표 mock 보강용 고정 id (result API 대체) */
const TAB_PANEL_MOCK_RUN_ID = '2'

/** MI 수급 모델 — URL 고정 `/mi/fundamental-model`, 선택은 클라이언트 state */
const FundamentalModelPage = () => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [viewTab, setViewTab] = useState<FundamentalModelViewTabKey>('volumes')

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

  const handleTabChange = useCallback((index: number) => {
    const next = FUNDAMENTAL_MODEL_VIEW_TABS[index]
    if (next) setViewTab(next.key)
  }, [])

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

  const handleRunSettled = useCallback(() => {
    void refetchCaseDetail()
  }, [refetchCaseDetail])

  const { handleRun, handleRetry, isRunPending } = useFundamentalModelRunExecution(activeCaseId, caseDetail?.status, {
    onRunSettled: handleRunSettled,
  })

  const { data: tabPanelMock } = useQuery({
    queryKey: ['fundamentalModel', 'tabPanelMock', TAB_PANEL_MOCK_RUN_ID],
    queryFn: () => fetchFundamentalModelDetail(TAB_PANEL_MOCK_RUN_ID),
    enabled: caseDetail?.status === 'COMPLETED',
    refetchOnWindowFocus: false,
  })

  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: ['fundamentalModel', 'price', activeCaseId],
    queryFn: () => fundamentalModelCaseService.getPrice(parsedCaseId),
    enabled: caseDetail?.status === 'COMPLETED' && Number.isFinite(parsedCaseId) && parsedCaseId > 0,
    refetchOnWindowFocus: false,
  })

  const tabBarItems = useMemo(
    () =>
      FUNDAMENTAL_MODEL_VIEW_TABS.map((tab) => ({
        label: tab.label,
        content: null,
      })),
    [],
  )

  const handleSelectCase = useCallback((id: string) => {
    setSelectedCaseId(id)
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
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'cases'] })
      void queryClient.removeQueries({ queryKey: ['fundamentalModel', 'caseDetail', activeCaseId] })
      return true
    } catch {
      return false
    }
  }, [activeCaseId, parsedCaseId, queryClient])

  const isCaseDetailResolving = Boolean(activeCaseId) && detailLoading && !caseDetail
  const isCompletedCase = caseDetail?.status === 'COMPLETED'
  const placeholderMode = useMemo(() => (caseDetail ? runStatusToPlaceholderMode(caseDetail.status) : null), [caseDetail])

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
    <Stack sx={{ flex: 1, minWidth: 0, gap: '16px', userSelect: 'text' }}>
      <FundamentalModelDetailHeader
        detail={caseDetail ?? null}
        loading={detailLoading}
        onEdit={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      <Box sx={{ mt: '-4px' }}>
        <FundamentalModelTab tabItems={tabBarItems} tabBarOnly value={selectedTabIndex} onChange={handleTabChange} />
      </Box>

      <Box
        position="relative"
        sx={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isCaseDetailResolving ? (
          <FundamentalModelPageSkeleton />
        ) : placeholderMode ? (
          <FundamentalModelRunPlaceholder mode={placeholderMode} onRun={handleRun} onRetry={handleRetry} runActionDisabled={isRunPending} />
        ) : isCompletedCase && viewTab === 'volumes' ? (
          <Box
            role="tabpanel"
            id="fundamental-model-tabpanel-0"
            aria-labelledby="fundamental-model-tab-0"
            sx={{
              position: 'relative',
              animation: 'fundamentalModelPageFadeIn 0.15s ease-out',
              '@keyframes fundamentalModelPageFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <VolumesTabPanel
              caseId={isCompletedCase && Number.isFinite(parsedCaseId) && parsedCaseId > 0 ? parsedCaseId : null}
              tradeVolumes={
                tabPanelMock?.tradeVolumes ?? {
                  productOptions: [],
                  yearOptions: [],
                  selectedProductId: '',
                  selectedYearId: '',
                  unitLabel: 'mtpa',
                  fromColumns: [],
                  toRows: [],
                }
              }
              detailLoading={detailLoading}
            />
          </Box>
        ) : isCompletedCase ? (
          <Box
            role="tabpanel"
            id="fundamental-model-tabpanel-1"
            aria-labelledby="fundamental-model-tab-1"
            sx={{
              position: 'relative',
              animation: 'fundamentalModelPageFadeIn 0.15s ease-out',
              '@keyframes fundamentalModelPageFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <PriceTabPanel price={priceData ?? null} loading={detailLoading || priceLoading} />
          </Box>
        ) : (
          <FundamentalModelRunPlaceholder mode="pending" onRun={handleRun} onRetry={handleRetry} runActionDisabled={isRunPending} />
        )}
      </Box>
    </Stack>
  )

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" px={{ xs: 2, md: 3 }} pb="40px" gap={2} sx={{ userSelect: 'none' }}>
      <Typography variant="titleLarge" color="gray.90" sx={{ fontSize: { xs: '28px', md: '38px' } }}>
        MI Fundamental Model
      </Typography>

      <Stack direction={{ xs: 'column', lg: 'row' }} alignItems="stretch" gap="30px" sx={{ userSelect: 'text' }}>
        <FundamentalModelRunList selectedId={activeCaseId} onSelect={handleSelectCase} />
        {rightBody}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelPage
