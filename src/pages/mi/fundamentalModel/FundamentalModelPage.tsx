import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  FundamentalModelDetail,
  FundamentalModelRunListItem,
  FundamentalModelRunStatus,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelTab from '@/pages/mi/fundamentalModel/components/common/FundamentalModelTab'
import FundamentalModelRunList from '@/pages/mi/fundamentalModel/components/FundamentalModelRunList'
import FundamentalModelRunPlaceholder from '@/pages/mi/fundamentalModel/components/FundamentalModelRunPlaceholder'
import FundamentalModelDetailHeader from '@/pages/mi/fundamentalModel/components/header/FundamentalModelDetailHeader'
import PriceTabPanel from '@/pages/mi/fundamentalModel/components/price/PriceTabPanel'
import VolumesTabPanel from '@/pages/mi/fundamentalModel/components/volumes/VolumesTabPanel'
import {
  fetchFundamentalModelDetail,
  fetchFundamentalModelRuns,
  FUNDAMENTAL_MODEL_MONTH_LABELS,
} from '@/pages/mi/fundamentalModel/fundamentalModelMockApi'
import { FUNDAMENTAL_MODEL_VIEW_TABS, type FundamentalModelViewTabKey } from '@/pages/mi/fundamentalModel/fundamentalModelRoutes'

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'

/** 모의 실행 시 진행시간 (ms) -- API 미존재로 3초 임시 진행 */
const MOCK_RUN_DURATION_MS = 3000

/** MI 수급 모델 — URL 고정 `/mi/fundamental-model`, 선택은 클라이언트 state */
const FundamentalModelPage = () => {
  const [selectedRunId, setSelectedRunId] = useState('')
  const [viewTab, setViewTab] = useState<FundamentalModelViewTabKey>('volumes')
  // run id 별 실행 상태 오버라이드 (실행/완료/실패 모의 흐름)
  const [runStatusOverride, setRunStatusOverride] = useState<Record<string, FundamentalModelRunStatus>>({})
  // run id 별 모의 실행 타이머 핸들 -- 언마운트/재실행 시 정리
  const runTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { showSnackbar } = useSnackbar()

  const { data: runs = [], isLoading: listLoading } = useQuery<FundamentalModelRunListItem[]>({
    queryKey: ['fundamentalModel', 'runs'],
    queryFn: fetchFundamentalModelRuns,
    refetchOnWindowFocus: false,
  })

  const runsReady = !listLoading && runs.length > 0

  const activeRunId = useMemo(() => {
    if (!selectedRunId) return ''
    if (!runsReady) return selectedRunId
    return runs.some((r) => r.id === selectedRunId) ? selectedRunId : ''
  }, [selectedRunId, runsReady, runs])

  useEffect(() => {
    if (!runsReady || !selectedRunId) return
    if (!runs.some((r) => r.id === selectedRunId)) {
      setSelectedRunId('')
    }
  }, [runsReady, runs, selectedRunId])

  useEffect(() => {
    setViewTab('volumes')
  }, [activeRunId])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (scrollEl) scrollEl.scrollTop = 0
  }, [activeRunId])

  // 언마운트 시 모든 모의 실행 타이머 정리
  useEffect(() => {
    const timers = runTimers.current
    return () => {
      Object.values(timers).forEach((handle) => clearTimeout(handle))
    }
  }, [])

  const selectedTabIndex = FUNDAMENTAL_MODEL_VIEW_TABS.findIndex((t) => t.key === viewTab)

  const handleTabChange = useCallback((index: number) => {
    const next = FUNDAMENTAL_MODEL_VIEW_TABS[index]
    if (next) setViewTab(next.key)
  }, [])

  const { data: detail, isLoading: detailLoading } = useQuery<FundamentalModelDetail | null>({
    queryKey: ['fundamentalModel', 'detail', activeRunId],
    queryFn: () => fetchFundamentalModelDetail(activeRunId),
    enabled: Boolean(activeRunId),
    refetchOnWindowFocus: false,
  })

  const monthLabels = detail?.monthLabels ?? FUNDAMENTAL_MODEL_MONTH_LABELS

  const tabBarItems = useMemo(
    () =>
      FUNDAMENTAL_MODEL_VIEW_TABS.map((tab) => ({
        label: tab.label,
        content: null,
      })),
    [],
  )

  const handleSelectRun = useCallback((id: string) => {
    setSelectedRunId(id)
  }, [])

  /** 모의 실행 시작 -- 5초 후 outcome 에 맞춰 done/error 로 전환 */
  const startMockRun = useCallback(
    (runId: string, outcome: 'success' | 'failure') => {
      if (!runId) return
      const existing = runTimers.current[runId]
      if (existing) clearTimeout(existing)

      setRunStatusOverride((prev) => ({ ...prev, [runId]: 'in_progress' }))

      runTimers.current[runId] = setTimeout(() => {
        delete runTimers.current[runId]
        if (outcome === 'success') {
          setRunStatusOverride((prev) => ({ ...prev, [runId]: 'done' }))
          showSnackbar('실행 완료되었습니다.', { variant: 'success' })
        } else {
          setRunStatusOverride((prev) => ({ ...prev, [runId]: 'error' }))
          showSnackbar('실행 실패했습니다.', { variant: 'error' })
        }
      }, MOCK_RUN_DURATION_MS)
    },
    [showSnackbar],
  )

  // 첫 실행은 실패 화면으로, 재실행은 성공 화면으로 (API 미존재 모의 흐름)
  const handleRun = useCallback(() => {
    startMockRun(activeRunId, 'failure')
  }, [activeRunId, startMockRun])

  const handleRetry = useCallback(() => {
    startMockRun(activeRunId, 'success')
  }, [activeRunId, startMockRun])

  // 헤더 칩과 본문 분기 모두에 사용할 수 있도록 오버라이드된 상세 객체를 구성
  const effectiveDetail = useMemo<FundamentalModelDetail | null>(() => {
    if (!detail) return null
    const override = runStatusOverride[detail.id]
    return override ? { ...detail, status: override } : detail
  }, [detail, runStatusOverride])

  // 좌측 리스트도 동일한 오버라이드 상태가 반영되도록 매핑
  const effectiveRuns = useMemo<FundamentalModelRunListItem[]>(() => {
    if (!runs.length) return runs
    return runs.map((run) => {
      const override = runStatusOverride[run.id]
      return override ? { ...run, status: override } : run
    })
  }, [runs, runStatusOverride])

  const effectiveStatus = effectiveDetail?.status

  /** 본문 자리표시자 모드 (대기/실행중/실패) -- done 일 때만 일반 데이터 패널 노출 */
  const placeholderMode = useMemo(() => {
    if (effectiveStatus === 'pending') return 'pending' as const
    if (effectiveStatus === 'in_progress') return 'running' as const
    if (effectiveStatus === 'error') return 'error' as const
    return null
  }, [effectiveStatus])

  const rightBody = !runsReady ? (
    <Box sx={{ flex: 1, minHeight: 900 }} />
  ) : !activeRunId ? (
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
  ) : (
    <Stack sx={{ flex: 1, minWidth: 0, gap: '16px', userSelect: 'text' }}>
      <FundamentalModelDetailHeader detail={effectiveDetail} loading={detailLoading} />

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
        {placeholderMode ? (
          <FundamentalModelRunPlaceholder mode={placeholderMode} onRun={handleRun} onRetry={handleRetry} />
        ) : viewTab === 'volumes' ? (
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
              monthLabels={monthLabels}
              summaryRows={detail?.summaryRows ?? []}
              detailRows={detail?.detailRows ?? []}
              globalVolumes={detail?.globalVolumes ?? { monthLabels: [], sections: [] }}
              lngVolumes={detail?.lngVolumes ?? { monthLabels: [], sections: [] }}
              tradeVolumes={
                detail?.tradeVolumes ?? {
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
        ) : (
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
            <PriceTabPanel
              annualPriceRows={detail?.annualPriceRows ?? []}
              monthlyPriceRows={detail?.monthlyPriceRows ?? []}
              detailLoading={detailLoading}
            />
          </Box>
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
        <FundamentalModelRunList runs={effectiveRuns} selectedId={activeRunId} onSelect={handleSelectRun} loading={listLoading} />
        {rightBody}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelPage
