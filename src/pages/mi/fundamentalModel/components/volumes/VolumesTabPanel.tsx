import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { FundamentalModelScopeKey, FundamentalModelTradeVolumesData } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type { FundamentalModelVolumesGranularity, FundamentalModelVolumesSegment } from '@/service/mi/fundamentalModel/case'

import FundamentalModelSectionVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSectionVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelTradeVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeVolumesTable'
import {
  createDefaultVolumeFilters,
  FM_VOLUME_FILTERS_STORAGE_KEY,
  isAllVolumeFiltersSelected,
  normalizeVolumeFiltersForScope,
  readSavedVolumeFilters,
  toApiVolumeRegions,
  toApiVolumeTypes,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

/** Volumes 탭에 필요한 표 데이터 - Trade는 API 매트릭스 형태가 달라 mock 그대로 사용 */
export interface VolumesTabPanelProps {
  /** getVolumes 호출 대상 case (양수일 때만 호출) */
  caseId: number | null
  /** 페이지 탭 sticky band 내부에 toolbar를 주입할 slot */
  toolbarSlotEl?: HTMLElement | null
  /** Trade 본문 표 - 별도 mock(API 미정) */
  tradeVolumes: FundamentalModelTradeVolumesData
  /** 케이스 상세 로딩 상태(헤더/탭 전환과 동기화) */
  detailLoading: boolean
}

const SECTION_VOLUMES_SKELETON_ROW_COUNT: Record<'global' | 'lng', number> = {
  global: 45,
  lng: 18,
}

const SCOPE_TO_SEGMENT: Record<FundamentalModelScopeKey, FundamentalModelVolumesSegment> = {
  global: 'GLOBAL',
  lng: 'LNG',
  trade: 'TRADE',
}

const periodToGranularity = (period: string): FundamentalModelVolumesGranularity => (period === 'yearly' ? 'YEARLY' : 'MONTHLY')
const PLATFORM_VOLUME_UNIT_LABEL = 'mtpa'

/** Volumes 탭 본문(툴바 + 매트릭스 - 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = ({ caseId, toolbarSlotEl, tradeVolumes, detailLoading }: VolumesTabPanelProps) => {
  const [scope, setScope] = useState<FundamentalModelScopeKey>('global')
  const [period, setPeriod] = useState('yearly')
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

  const granularity = periodToGranularity(period)
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

  const isValidCaseId = typeof caseId === 'number' && Number.isFinite(caseId) && caseId > 0
  const enableSectionQuery = isSectionScope && isValidCaseId

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
    placeholderData: (previous) => previous,
  })

  const sectionLoading = detailLoading || volumesLoading || volumesFetching
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
      period={period}
      onPeriodChange={setPeriod}
    />
  )

  return (
    <>
      {toolbarSlotEl
        ? createPortal(
          <Box
            sx={{
              animation: 'fundamentalModelPageFadeIn 0.15s ease-out',
              '@keyframes fundamentalModelPageFadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            {toolbar}
          </Box>,
          toolbarSlotEl,
        )
        : null}

      <Stack sx={{ gap: '16px' }}>
        {!toolbarSlotEl && toolbar}
        {scope === 'trade' ? (
          <FundamentalModelTradeVolumesTable data={tradeVolumes} loading={detailLoading} />
        ) : (
          <Stack gap="10px">
            <Stack direction="row" alignItems="center" gap="4px" sx={{ minHeight: 28 }}>
              <Typography variant="body2M14" color="gray.60">
                Unit:
              </Typography>
              <Typography variant="body2M14" color="gray.70">
                {sectionLoading ? '-' : PLATFORM_VOLUME_UNIT_LABEL}
              </Typography>
            </Stack>
            <FundamentalModelSectionVolumesTable
              columns={volumeColumns}
              rows={sectionRows}
              loading={sectionLoading}
              skeletonRowCount={scope === 'global' ? SECTION_VOLUMES_SKELETON_ROW_COUNT.global : SECTION_VOLUMES_SKELETON_ROW_COUNT.lng}
            />
          </Stack>
        )}
      </Stack>
    </>
  )
}

export default VolumesTabPanel
