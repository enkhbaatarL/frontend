import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type {
  FundamentalModelTradeSelector,
  FundamentalModelVolumesGranularity,
  FundamentalModelVolumesSegment,
} from '@/service/mi/fundamentalModel/case'

import FundamentalModelSectionVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSectionVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelTradeVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeVolumesTable'
import {
  createDefaultVolumeFilters,
  FM_VOLUME_FILTERS_STORAGE_KEY,
  isAllVolumeFiltersSelected,
  normalizeVolumeFiltersForScope,
  readSavedVolumeFilters,
  toApiTradeFlowTypes,
  toApiVolumeRegions,
  toApiVolumeTypes,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

/** Volumes 탭에 필요한 표 데이터 */
export interface VolumesTabPanelProps {
  /** getVolumes 호출 대상 case (양수일 때만 호출) */
  caseId: number | null
  /** 페이지 탭 sticky band 내부에 Volumes 콘텐츠를 주입할 slot */
  stickySlotEl?: HTMLElement | null
  /** 케이스 상세 로딩 상태(헤더/탭 전환과 동기화) */
  detailLoading: boolean
}

const SCOPE_TO_SEGMENT: Record<FundamentalModelScopeKey, FundamentalModelVolumesSegment> = {
  global: 'GLOBAL',
  lng: 'LNG',
  trade: 'TRADE',
}

/** Volumes 탭 본문(툴바 + 매트릭스 - 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = memo(({ caseId, stickySlotEl, detailLoading }: VolumesTabPanelProps) => {
  const [scope, setScope] = useState<FundamentalModelScopeKey>('global')
  const [granularity, setGranularity] = useState<FundamentalModelVolumesGranularity>('YEARLY')
  const [tradeSelector, setTradeSelector] = useState<FundamentalModelTradeSelector>('LNG')
  const [tradeYear, setTradeYear] = useState(2026)
  const savedFilters = readSavedVolumeFilters()
  const [volumeFilters, setVolumeFilters] = useState<FundamentalModelVolumeFilters>(() => savedFilters ?? createDefaultVolumeFilters())
  const [saveFiltersOn, setSaveFiltersOn] = useState(Boolean(savedFilters))

  const handleApplyVolumeFilters = (filters: FundamentalModelVolumeFilters, save?: boolean) => {
    setVolumeFilters(filters)
    if (save) {
      localStorage.setItem(FM_VOLUME_FILTERS_STORAGE_KEY, JSON.stringify(filters))
      setSaveFiltersOn(true)
      return
    }
    localStorage.removeItem(FM_VOLUME_FILTERS_STORAGE_KEY)
    setSaveFiltersOn(false)
  }

  const segment = SCOPE_TO_SEGMENT[scope]
  const isSectionScope = scope === 'global' || scope === 'lng'
  const scopedVolumeFilters = useMemo(() => normalizeVolumeFiltersForScope(volumeFilters, scope), [scope, volumeFilters])

  // 전체 선택일 때는 types/regions 미전달(swagger - 미전달 시 전체)
  const allFiltersSelected = isAllVolumeFiltersSelected(scopedVolumeFilters, scope)
  const apiTypes = useMemo(
    () => (allFiltersSelected ? undefined : toApiVolumeTypes(scopedVolumeFilters.types)),
    [allFiltersSelected, scopedVolumeFilters.types],
  )
  const apiRegions = useMemo(
    () => (allFiltersSelected ? undefined : toApiVolumeRegions(scopedVolumeFilters.regions)),
    [allFiltersSelected, scopedVolumeFilters.regions],
  )
  const apiTradeTypes = useMemo(
    () => (allFiltersSelected ? undefined : toApiTradeFlowTypes(scopedVolumeFilters.types)),
    [allFiltersSelected, scopedVolumeFilters.types],
  )
  const sectionTableKey = useMemo(
    () => [caseId ?? 'empty', segment, granularity, apiTypes?.join(',') ?? 'ALL', apiRegions?.join(',') ?? 'ALL'].join('|'),
    [apiRegions, apiTypes, caseId, granularity, segment],
  )
  const tradeTableKey = useMemo(
    () => [caseId ?? 'empty', tradeSelector, tradeYear, apiTradeTypes?.join(',') ?? 'ALL', apiRegions?.join(',') ?? 'ALL'].join('|'),
    [apiRegions, apiTradeTypes, caseId, tradeSelector, tradeYear],
  )

  const isValidCaseId = typeof caseId === 'number' && Number.isFinite(caseId) && caseId > 0
  const enableSectionQuery = isSectionScope && isValidCaseId
  const enableTradeQuery = scope === 'trade' && isValidCaseId

  const { data: filterOptions } = useQuery({
    queryKey: ['fundamentalModel', 'volumes', 'filterOptions'],
    queryFn: fundamentalModelCaseService.getVolumesFilterOptions,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const {
    data: volumesRes,
    isLoading: volumesLoading,
    isFetching: volumesFetching,
  } = useQuery({
    queryKey: ['fundamentalModel', 'volumes', caseId, segment, granularity, apiTypes, apiRegions],
    queryFn: () =>
      fundamentalModelCaseService.getVolumes(caseId as number, {
        segment,
        types: apiTypes,
        regions: apiRegions,
        granularity,
      }),
    enabled: enableSectionQuery,
    refetchOnWindowFocus: false,
  })

  const {
    data: tradeFlows,
    isLoading: tradeFlowsLoading,
    isFetching: tradeFlowsFetching,
  } = useQuery({
    queryKey: ['fundamentalModel', 'tradeFlows', caseId, tradeSelector, tradeYear, apiTradeTypes, apiRegions],
    queryFn: () =>
      fundamentalModelCaseService.getTradeFlows(caseId as number, {
        selector: tradeSelector,
        year: tradeYear,
        unit: 'MTPA',
        types: apiTradeTypes,
        regions: apiRegions,
      }),
    enabled: enableTradeQuery,
    refetchOnWindowFocus: false,
  })

  const sectionLoading = detailLoading || volumesLoading || volumesFetching
  const tradeLoading = detailLoading || tradeFlowsLoading || tradeFlowsFetching
  const volumeColumns = volumesRes?.columns ?? []
  const sectionRows = volumesRes?.rows ?? []
  const toolbar = (
    <FundamentalModelSegmentToolbar
      loading={detailLoading}
      scope={scope}
      onScopeChange={setScope}
      volumeFilters={scopedVolumeFilters}
      onApplyVolumeFilters={handleApplyVolumeFilters}
      initialSaveFilters={saveFiltersOn}
      granularity={granularity}
      onGranularityChange={setGranularity}
      filterOptions={filterOptions ?? null}
    />
  )
  const content = (
    <Stack sx={{ gap: '16px' }}>
      {toolbar}
      {scope === 'trade' ? (
        <FundamentalModelTradeVolumesTable
          key={tradeTableKey}
          tradeFlows={tradeFlows ?? null}
          selector={tradeSelector}
          year={tradeYear}
          unit={tradeFlows?.unit ?? 'MTPA'}
          loading={tradeLoading}
          onSelectorChange={setTradeSelector}
          onYearChange={setTradeYear}
        />
      ) : (
        <Stack gap="10px">
          <Stack direction="row" alignItems="center" gap="4px" sx={{ minHeight: '28px' }}>
            <Typography variant="body2M14" color="gray.60">
              Unit:
            </Typography>
            <Typography variant="body2M14" color="gray.70">
              {sectionLoading ? '-' : (volumesRes?.unit ?? '-')}
            </Typography>
          </Stack>
          <FundamentalModelSectionVolumesTable key={sectionTableKey} columns={volumeColumns} rows={sectionRows} loading={sectionLoading} />
        </Stack>
      )}
    </Stack>
  )
  const stickyPortalContent = (
    <Box
      sx={{
        animation: 'fundamentalModelPageFadeIn 0.15s ease-out',
        '@keyframes fundamentalModelPageFadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {content}
    </Box>
  )
  const stickyPortal = stickySlotEl ? createPortal(stickyPortalContent, stickySlotEl) : null

  return (
    <>
      {stickyPortal}
      {!stickySlotEl && content}
    </>
  )
})

VolumesTabPanel.displayName = 'VolumesTabPanel'

export default VolumesTabPanel
