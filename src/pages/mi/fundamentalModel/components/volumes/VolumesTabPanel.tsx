import { Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type { FundamentalModelScopeKey, FundamentalModelTradeVolumesData } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type { FundamentalModelVolumesGranularity, FundamentalModelVolumesSegment } from '@/service/mi/fundamentalModel/case'

import FundamentalModelSectionVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSectionVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelTradeVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeVolumesTable'
import {
  createDefaultVolumeFilters,
  FM_VOLUME_FILTERS_STORAGE_KEY,
  isAllVolumeFiltersSelected,
  readSavedVolumeFilters,
  toApiVolumeRegions,
  toApiVolumeTypes,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import FundamentalModelVolumesMatrix from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelVolumesMatrix'
import fundamentalModelCaseService from '@/service/mi/fundamentalModel/case'

/** Volumes 탭에 필요한 표 데이터 - Trade는 API 매트릭스 형태가 달라 mock 그대로 사용 */
export interface VolumesTabPanelProps {
  /** getVolumes 호출 대상 case (양수일 때만 호출) */
  caseId: number | null
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

/** Volumes 탭 본문(툴바 + 매트릭스 - 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = ({ caseId, tradeVolumes, detailLoading }: VolumesTabPanelProps) => {
  const [scope, setScope] = useState<FundamentalModelScopeKey>('global')
  const [period, setPeriod] = useState('monthly')
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

  // 전체 선택일 때는 types/regions 미전달(swagger - 미전달 시 전체)
  const allFiltersSelected = isAllVolumeFiltersSelected(volumeFilters)
  const apiTypes = useMemo(
    () => (allFiltersSelected ? undefined : toApiVolumeTypes(volumeFilters.types)),
    [allFiltersSelected, volumeFilters.types],
  )
  const apiRegions = useMemo(
    () => (allFiltersSelected ? undefined : toApiVolumeRegions(volumeFilters.regions)),
    [allFiltersSelected, volumeFilters.regions],
  )

  const isValidCaseId = typeof caseId === 'number' && Number.isFinite(caseId) && caseId > 0
  const enableSectionQuery = isSectionScope && isValidCaseId

  const {
    data: volumesRes,
    isFetching: volumesFetching,
    isLoading: volumesLoading,
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
  const matrixGranularity: FundamentalModelVolumesGranularity = volumesRes?.granularity ?? granularity
  const matrixColumns = volumesRes?.columns ?? []
  const sectionRows = volumesRes?.rows ?? []

  return (
    <Stack sx={{ gap: '16px' }}>
      <FundamentalModelSegmentToolbar
        loading={detailLoading}
        scope={scope}
        onScopeChange={setScope}
        volumeFilters={volumeFilters}
        onApplyVolumeFilters={handleApplyVolumeFilters}
        initialSaveFilters={saveFiltersOn}
        period={period}
        onPeriodChange={setPeriod}
      />

      {scope === 'trade' ? (
        <FundamentalModelTradeVolumesTable data={tradeVolumes} loading={detailLoading} />
      ) : (
        <Stack gap="10px">
          <FundamentalModelVolumesMatrix columns={matrixColumns} granularity={matrixGranularity} loading={sectionLoading} compact />
          <FundamentalModelSectionVolumesTable
            columns={matrixColumns}
            rows={sectionRows}
            loading={sectionLoading}
            skeletonRowCount={scope === 'global' ? SECTION_VOLUMES_SKELETON_ROW_COUNT.global : SECTION_VOLUMES_SKELETON_ROW_COUNT.lng}
          />
        </Stack>
      )}
    </Stack>
  )
}

export default VolumesTabPanel
