import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { FundamentalModelDetail, FundamentalModelRunListItem } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import FundamentalModelTab from '@/pages/mi/fundamentalModel/components/common/FundamentalModelTab'
import FundamentalModelRunList from '@/pages/mi/fundamentalModel/components/FundamentalModelRunList'
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

/** MI 수급 모델 — URL 고정 `/mi/fundamental-model`, 선택은 클라이언트 state */
const FundamentalModelPage = () => {
  const [selectedRunId, setSelectedRunId] = useState('')
  const [viewTab, setViewTab] = useState<FundamentalModelViewTabKey>('volumes')

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
        <FundamentalModelRunList runs={runs} selectedId={activeRunId} onSelect={handleSelectRun} loading={listLoading} />
        {rightBody}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelPage
