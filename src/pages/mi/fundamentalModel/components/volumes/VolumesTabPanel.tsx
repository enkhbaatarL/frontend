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

const YEARLY_LABELS = ['2026', '2027', '2028', '2029', '2030'] as const

const parseVolumeLabelYear = (label: string): string | null => {
  const shortYearMatch = label.match(/^(\d{2})-\d{2}$/)
  if (shortYearMatch) return `20${shortYearMatch[1]}`
  const fullYearMatch = label.match(/^(\d{4})$/)
  if (fullYearMatch) return fullYearMatch[1]
  return null
}

const aggregateNumericValues = (values: string[]): string => {
  const numeric = values.map((v) => Number(v)).filter((v) => Number.isFinite(v))
  if (numeric.length === 0) return values[0] ?? ''
  const avg = numeric.reduce((sum, v) => sum + v, 0) / numeric.length
  return avg.toFixed(1)
}

const compressValuesByYear = (values: (string | null)[], sourceYears: string[], targetYears: readonly string[]): (string | null)[] => {
  let fallback: string | null = null
  return targetYears.map((year) => {
    const indices = sourceYears.map((sourceYear, idx) => (sourceYear === year ? idx : -1)).filter((idx) => idx >= 0)

    if (indices.length === 0) return fallback

    const yearValues = indices.map((idx) => values[idx]).filter((value): value is string => typeof value === 'string' && value.length > 0)

    if (yearValues.length === 0) return fallback

    const aggregated = aggregateNumericValues(yearValues)
    fallback = aggregated
    return aggregated
  })
}

const toYearlySummaryRows = (rows: FundamentalModelMetricRow[], sourceMonthLabels: string[]): FundamentalModelMetricRow[] => {
  const yearRow = rows.find((row) => row.id === 'year')
  const sourceYearsFromYearRow = yearRow?.values.map((v) => (typeof v === 'string' ? v : null)).filter((v): v is string => !!v) ?? []
  const sourceYears = sourceYearsFromYearRow.length === sourceMonthLabels.length ? sourceYearsFromYearRow : sourceMonthLabels

  return rows.map((row) => {
    if (row.id === 'year') return { ...row, values: [...YEARLY_LABELS] }
    if (row.id === 'unite') return { ...row, values: YEARLY_LABELS.map(() => 'NA') }
    if (row.id === 'mtpa') return { ...row, values: YEARLY_LABELS.map(() => `${YEARLY_LABELS[0]}-NA`) }

    return {
      ...row,
      values: compressValuesByYear(row.values, sourceYears, YEARLY_LABELS),
    }
  })
}

const toYearlyVolumesData = (data: FundamentalModelGlobalVolumesData): FundamentalModelGlobalVolumesData => {
  const sourceYears = data.monthLabels.map((label) => parseVolumeLabelYear(label)).map((year, idx) => year ?? data.monthLabels[idx])

  return {
    ...data,
    monthLabels: [...YEARLY_LABELS],
    sections: data.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        values: compressValuesByYear(row.values, sourceYears, YEARLY_LABELS),
      })),
    })),
  }
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

  const matrixMonthLabels = useMemo(() => (period === 'yearly' ? [...YEARLY_LABELS] : monthLabels), [monthLabels, period])

  const matrixRows = useMemo(
    () => (period === 'yearly' ? toYearlySummaryRows(summaryRows, monthLabels) : summaryRows),
    [monthLabels, period, summaryRows],
  )

  const periodGlobalVolumes = useMemo(
    () => (period === 'yearly' ? toYearlyVolumesData(filteredGlobalVolumes) : filteredGlobalVolumes),
    [filteredGlobalVolumes, period],
  )

  const periodLngVolumes = useMemo(
    () => (period === 'yearly' ? toYearlyVolumesData(filteredLngVolumes) : filteredLngVolumes),
    [filteredLngVolumes, period],
  )

  const sectionVolumesData: FundamentalModelGlobalVolumesData | null =
    scope === 'global' ? periodGlobalVolumes : scope === 'lng' ? periodLngVolumes : null

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
          <FundamentalModelVolumesMatrix monthLabels={matrixMonthLabels} rows={matrixRows} loading={detailLoading} compact />
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
