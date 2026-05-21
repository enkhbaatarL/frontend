import { Stack } from '@mui/material'
import { useMemo, useState } from 'react'

import type {
  FundamentalModelGlobalVolumesData,
  FundamentalModelLngVolumesData,
  FundamentalModelMetricRow,
  FundamentalModelScopeKey,
  FundamentalModelTradeVolumesData,
} from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import FundamentalModelSectionVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSectionVolumesTable'
import FundamentalModelSegmentToolbar from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelSegmentToolbar'
import FundamentalModelTradeVolumesTable from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelTradeVolumesTable'
import {
  applyVolumeFilters,
  createDefaultVolumeFilters,
  FM_VOLUME_FILTERS_STORAGE_KEY,
  readSavedVolumeFilters,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import FundamentalModelVolumesMatrix from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelVolumesMatrix'

/** Volumes 탭에 필요한 표 데이터 */
export interface VolumesTabPanelProps {
  /** 월 컬럼 라벨(요약 표) */
  monthLabels: string[]
  /** 요약 행 */
  summaryRows: FundamentalModelMetricRow[]
  /** Trade 상세 행(레거시) */
  detailRows: FundamentalModelMetricRow[]
  /** Global 본문 표 */
  globalVolumes: FundamentalModelGlobalVolumesData
  /** LNG 본문 표 */
  lngVolumes: FundamentalModelLngVolumesData
  /** Trade 본문 표 */
  tradeVolumes: FundamentalModelTradeVolumesData
  /** 상세·표 로딩 */
  detailLoading: boolean
}

const SECTION_VOLUMES_SKELETON_ROW_COUNT: Record<'global' | 'lng', number> = {
  global: 45,
  lng: 18,
}

/** Volumes 탭 본문(툴바·매트릭스 — 레이아웃은 FundamentalModelPage) */
const VolumesTabPanel = ({ monthLabels, summaryRows, globalVolumes, lngVolumes, tradeVolumes, detailLoading }: VolumesTabPanelProps) => {
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

  const filteredGlobalVolumes = useMemo(() => applyVolumeFilters(globalVolumes, volumeFilters), [globalVolumes, volumeFilters])

  const filteredLngVolumes = useMemo(() => applyVolumeFilters(lngVolumes, volumeFilters), [lngVolumes, volumeFilters])

  const sectionVolumesData: FundamentalModelGlobalVolumesData | null =
    scope === 'global' ? filteredGlobalVolumes : scope === 'lng' ? filteredLngVolumes : null

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
      ) : sectionVolumesData ? (
        <Stack gap="10px">
          <FundamentalModelVolumesMatrix monthLabels={monthLabels} rows={summaryRows} loading={detailLoading} compact />
          <FundamentalModelSectionVolumesTable
            data={sectionVolumesData}
            loading={detailLoading}
            skeletonRowCount={scope === 'global' ? SECTION_VOLUMES_SKELETON_ROW_COUNT.global : SECTION_VOLUMES_SKELETON_ROW_COUNT.lng}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}

export default VolumesTabPanel
