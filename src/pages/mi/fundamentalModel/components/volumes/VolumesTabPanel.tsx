import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type {
  FundamentalModelTradeFlowsType,
  FundamentalModelTradeSelector,
  FundamentalModelVolumesRegion,
  FundamentalModelVolumesSegment,
  FundamentalModelVolumesType,
} from '@/service/mi/fundamentalModel/case'

import FundamentalModelSectionVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSectionVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelTradeVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeVolumesTable'
import {
  FM_VOLUME_FILTERS_STORAGE_KEY,
  normalizeVolumeFiltersForScope,
  readSavedVolumeFilters,
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
  const [tradeSelector, setTradeSelector] = useState<FundamentalModelTradeSelector>('LNG')
  const [tradeYear, setTradeYear] = useState(2026)
  const [savedFilters] = useState(readSavedVolumeFilters)
  const [volumeFilters, setVolumeFilters] = useState<FundamentalModelVolumeFilters | null>(savedFilters)
  const [saveFiltersOn, setSaveFiltersOn] = useState(Boolean(savedFilters))
  const granularity = volumeFilters?.granularity ?? 'YEARLY'

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
  const isValidCaseId = typeof caseId === 'number' && Number.isFinite(caseId) && caseId > 0

  const { data: filterOptions, isLoading: filterOptionsLoading } = useQuery({
    queryKey: [
      'fundamentalModel',
      'volumes',
      'filterOptions',
      caseId,
      scope === 'trade' ? tradeSelector : null,
      scope === 'trade' ? tradeYear : null,
    ],
    queryFn: () =>
      fundamentalModelCaseService.getVolumesFilterOptions({
        caseId: caseId as number,
        ...(scope === 'trade' ? { selector: tradeSelector, year: tradeYear } : {}),
      }),
    enabled: isValidCaseId && !detailLoading,
    refetchOnWindowFocus: false,
  })

  const segmentFilterOptions = filterOptions?.segments.find((option) => option.segment === segment)
  const scopedVolumeFilters = useMemo(
    () => normalizeVolumeFiltersForScope(volumeFilters, segmentFilterOptions),
    [segmentFilterOptions, volumeFilters],
  )
  const apiTypes = scopedVolumeFilters.types.length === segmentFilterOptions?.types.length ? undefined : scopedVolumeFilters.types
  const apiRegions = scopedVolumeFilters.regions.length === segmentFilterOptions?.regions.length ? undefined : scopedVolumeFilters.regions
  const apiCountryKeys = scopedVolumeFilters.countryKeys
  const noFiltersSelected =
    scopedVolumeFilters.types.length === 0 || scopedVolumeFilters.regions.length === 0 || apiCountryKeys?.length === 0
  const enableTradeQuery = scope === 'trade' && isValidCaseId && !detailLoading && !!segmentFilterOptions && !noFiltersSelected
  const tradeTableKey = [
    caseId ?? 'empty',
    tradeSelector,
    tradeYear,
    apiTypes?.join(',') ?? 'ALL',
    apiRegions?.join(',') ?? 'ALL',
    apiCountryKeys?.join(',') ?? 'ALL',
  ].join('|')

  const periodOptions = segmentFilterOptions?.periods
  const selectedPeriods = volumeFilters?.periods?.[granularity]
  const apiPeriods = useMemo(() => {
    if (!selectedPeriods || !periodOptions) return selectedPeriods
    const options = granularity === 'YEARLY' ? periodOptions.yearly : periodOptions.monthly
    return selectedPeriods.filter((period) => options.some((option) => option.value === period))
  }, [granularity, periodOptions, selectedPeriods])
  const noPeriodsSelected = apiPeriods?.length === 0
  const enableSectionQuery =
    isSectionScope && isValidCaseId && !detailLoading && !!segmentFilterOptions && !noPeriodsSelected && !noFiltersSelected
  const sectionTableKey = useMemo(
    () =>
      [
        caseId ?? 'empty',
        segment,
        granularity,
        apiTypes?.join(',') ?? 'ALL',
        apiRegions?.join(',') ?? 'ALL',
        apiCountryKeys?.join(',') ?? 'ALL',
        apiPeriods?.join(',') ?? 'ALL',
      ].join('|'),
    [apiCountryKeys, apiPeriods, apiRegions, apiTypes, caseId, granularity, segment],
  )

  const {
    data: volumesRes,
    isLoading: volumesLoading,
    isFetching: volumesFetching,
  } = useQuery({
    queryKey: ['fundamentalModel', 'volumes', caseId, segment, granularity, apiTypes, apiRegions, apiPeriods, apiCountryKeys],
    queryFn: () =>
      fundamentalModelCaseService.getVolumes(caseId as number, {
        segment,
        types: apiTypes as FundamentalModelVolumesType[] | undefined,
        regions: apiRegions as FundamentalModelVolumesRegion[] | undefined,
        granularity,
        periods: apiPeriods,
        countryKeys: apiCountryKeys,
      }),
    enabled: enableSectionQuery,
    refetchOnWindowFocus: false,
  })

  const {
    data: tradeFlows,
    isLoading: tradeFlowsLoading,
    isFetching: tradeFlowsFetching,
  } = useQuery({
    queryKey: ['fundamentalModel', 'tradeFlows', caseId, tradeSelector, tradeYear, apiTypes, apiRegions, apiCountryKeys],
    queryFn: () =>
      fundamentalModelCaseService.getTradeFlows(caseId as number, {
        selector: tradeSelector,
        year: tradeYear,
        countryKeys: apiCountryKeys,
        unit: 'MTPA',
        types: apiTypes as FundamentalModelTradeFlowsType[] | undefined,
        regions: apiRegions as FundamentalModelVolumesRegion[] | undefined,
      }),
    enabled: enableTradeQuery,
    refetchOnWindowFocus: false,
  })

  const sectionLoading = detailLoading || filterOptionsLoading || volumesLoading || volumesFetching
  const tradeLoading = detailLoading || filterOptionsLoading || tradeFlowsLoading || tradeFlowsFetching
  const volumeColumns = noPeriodsSelected || noFiltersSelected ? [] : (volumesRes?.columns ?? [])
  const sectionRows = noPeriodsSelected || noFiltersSelected ? [] : (volumesRes?.rows ?? [])
  const toolbar = (
    <FundamentalModelSegmentToolbar
      key={[caseId, scope, scope === 'trade' ? tradeSelector : '', scope === 'trade' ? tradeYear : ''].join('|')}
      loading={detailLoading || filterOptionsLoading}
      scope={scope}
      onScopeChange={setScope}
      volumeFilters={scopedVolumeFilters}
      onApplyVolumeFilters={handleApplyVolumeFilters}
      initialSaveFilters={saveFiltersOn}
      granularity={granularity}
      onGranularityChange={(nextGranularity) =>
        handleApplyVolumeFilters({ ...scopedVolumeFilters, granularity: nextGranularity }, saveFiltersOn)
      }
      filterOptions={filterOptions ?? null}
    />
  )
  const content = (
    <Stack sx={{ gap: '16px' }}>
      {toolbar}
      {scope === 'trade' ? (
        <FundamentalModelTradeVolumesTable
          key={tradeTableKey}
          tradeFlows={noFiltersSelected ? null : (tradeFlows ?? null)}
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
