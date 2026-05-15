import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { FundamentalModelDetail, FundamentalModelRunListItem } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import FundamentalModelTab from '@/pages/mi/fundamentalModel/components/common/FundamentalModelTab'
import FundamentalModelDetailHeader from '@/pages/mi/fundamentalModel/components/FundamentalModelDetailHeader'
import FundamentalModelRunList from '@/pages/mi/fundamentalModel/components/FundamentalModelRunList'
import PriceTabPanel from '@/pages/mi/fundamentalModel/components/price/PriceTabPanel'
import VolumesTabPanel from '@/pages/mi/fundamentalModel/components/volume/VolumesTabPanel'
import {
  fetchFundamentalModelDetail,
  fetchFundamentalModelRuns,
  FUNDAMENTAL_MODEL_MONTH_LABELS,
} from '@/pages/mi/fundamentalModel/fundamentalModelMockApi'
import {
  FUNDAMENTAL_MODEL_DEFAULT_RUN_ID,
  FUNDAMENTAL_MODEL_VIEW_TABS,
  getFundamentalModelRunPath,
  type FundamentalModelViewTabKey,
} from '@/pages/mi/fundamentalModel/fundamentalModelRoutes'

const MAIN_SCROLL_WRAPPER_ID = 'main-scroll-wrapper'

/** MI 수급 모델 — URL은 `/mi/fundamental-model/:runId`, Volumes/Price 탭은 클라이언트 state(실행 변경 시 Volumes로 리셋, Price 패널은 탭 선택 시에만 마운트) */
const FundamentalModelPage = () => {
  const { runId: runIdParam = '' } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const [viewTab, setViewTab] = useState<FundamentalModelViewTabKey>('volumes')

  const { data: runs = [], isLoading: listLoading } = useQuery<FundamentalModelRunListItem[]>({
    queryKey: ['fundamentalModel', 'runs'],
    queryFn: fetchFundamentalModelRuns,
    refetchOnWindowFocus: false,
  })

  const runsReady = !listLoading && runs.length > 0
  const isValidRunId = runsReady && Boolean(runIdParam) && runs.some((r) => r.id === runIdParam)
  const activeRunId = isValidRunId ? runIdParam : ''

  useEffect(() => {
    if (!runsReady) return
    if (!runIdParam) {
      const fallback = runs.find((r) => r.id === FUNDAMENTAL_MODEL_DEFAULT_RUN_ID)?.id ?? runs[0].id
      navigate(getFundamentalModelRunPath(fallback), { replace: true })
      return
    }
    if (!runs.some((r) => r.id === runIdParam)) {
      navigate(getFundamentalModelRunPath(FUNDAMENTAL_MODEL_DEFAULT_RUN_ID), { replace: true })
    }
  }, [runsReady, runIdParam, runs, navigate])

  useEffect(() => {
    setViewTab('volumes')
  }, [activeRunId])

  useEffect(() => {
    const scrollEl = document.getElementById(MAIN_SCROLL_WRAPPER_ID)
    if (scrollEl) scrollEl.scrollTop = 0
  }, [activeRunId])

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

  const handleSelectRun = useCallback(
    (id: string) => {
      navigate(getFundamentalModelRunPath(id))
    },
    [navigate],
  )

  const rightBody =
    !runsReady || !activeRunId ? (
      <Box sx={{ flex: 1, minHeight: 400 }} />
    ) : !detail && !detailLoading ? (
      <Box
        sx={{
          flex: 1,
          minHeight: 400,
          border: '1px dashed',
          borderColor: 'gray.30',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'commonColor.White',
        }}
      >
        <Typography variant="body2R14" color="gray.60">
          좌측에서 시뮬레이션 실행을 선택해 주세요.
        </Typography>
      </Box>
    ) : (
      <Stack sx={{ flex: 1, minWidth: 0, gap: '16px', userSelect: 'text' }}>
        <FundamentalModelDetailHeader detail={detail ?? null} loading={detailLoading} />

        <Box sx={{ mt: '-4px' }}>
          <FundamentalModelTab tabItems={tabBarItems} tabBarOnly value={selectedTabIndex} onChange={handleTabChange} />
        </Box>

        <Box position="relative" sx={{ flex: 1, minWidth: 0 }}>
          {viewTab === 'volumes' ? (
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
              <PriceTabPanel />
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
        <FundamentalModelRunList runs={runs} selectedId={activeRunId || runIdParam} onSelect={handleSelectRun} loading={listLoading} />
        {rightBody}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelPage
