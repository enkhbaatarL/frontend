import type { FundamentalModelGlobalVolumeRow, FundamentalModelGlobalVolumesData } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

/** Volumes Type 필터 옵션 */
export const FM_VOLUME_TYPE_OPTIONS = [
  { value: 'demand', label: 'Demand' },
  { value: 'production', label: 'Production' },
  { value: 'lng-imports', label: 'LNG Imports' },
  { value: 'lng-exports', label: 'LNG Exports' },
  { value: 'pipeline-imports', label: 'Pipeline Imports' },
  { value: 'pipeline-exports', label: 'Pipeline Exports' },
] as const

/** Volumes Regions 필터 옵션 */
export const FM_VOLUME_REGION_OPTIONS = [
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
  { value: 'north-america', label: 'North America' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'australia', label: 'Australia' },
  { value: 'russia', label: 'Russia' },
  { value: 'africa', label: 'Africa' },
  { value: 'south-america', label: 'South America' },
] as const

export const FM_VOLUME_FILTERS_STORAGE_KEY = 'fundamentalModelVolumeFilters'

export const FM_VOLUME_DEFAULT_TYPE_IDS = FM_VOLUME_TYPE_OPTIONS.map((o) => o.value)
export const FM_VOLUME_DEFAULT_REGION_IDS = FM_VOLUME_REGION_OPTIONS.map((o) => o.value)

export interface FundamentalModelVolumeFilters {
  types: string[]
  regions: string[]
}

/** default - Type/Regions 전체 선택 */
export const createDefaultVolumeFilters = (): FundamentalModelVolumeFilters => ({
  types: [...FM_VOLUME_DEFAULT_TYPE_IDS],
  regions: [...FM_VOLUME_DEFAULT_REGION_IDS],
})

/** Filters 배지용 - 선택된 항목 수 */
export const countSelectedVolumeFilters = (filters: FundamentalModelVolumeFilters): number => filters.types.length + filters.regions.length

/** 전체 선택(default) 여부 - 배지 숨김 */
export const isAllVolumeFiltersSelected = (filters: FundamentalModelVolumeFilters): boolean =>
  filters.types.length === FM_VOLUME_DEFAULT_TYPE_IDS.length &&
  filters.regions.length === FM_VOLUME_DEFAULT_REGION_IDS.length &&
  FM_VOLUME_DEFAULT_TYPE_IDS.every((id) => filters.types.includes(id)) &&
  FM_VOLUME_DEFAULT_REGION_IDS.every((id) => filters.regions.includes(id))

/** 지역 필터 - 표 행 라벨 매칭(목 데이터 기준) */
const REGION_ROW_LABELS: Record<string, string[]> = {
  asia: ['Asia', 'China', 'Japan', 'India'],
  europe: ['Europe', 'Germany', 'Italy', 'United Kingdom', 'Other Middle East'],
  'north-america': ['North America', 'America N'],
  'middle-east': ['Middle East'],
  australia: ['Australia'],
  russia: ['Russia'],
  africa: ['Africa'],
  'south-america': ['South America', 'America S'],
}

const rowMatchesRegion = (row: FundamentalModelGlobalVolumeRow, selectedRegionIds: string[]): boolean => {
  if (row.kind === 'total') return true
  return selectedRegionIds.some((regionId) => {
    const labels = REGION_ROW_LABELS[regionId]
    return labels?.includes(row.label)
  })
}

/** Global/LNG 본문 표에 Type·Regions 필터 적용(선택된 항목만 표시) */
export const applyVolumeFilters = (
  data: FundamentalModelGlobalVolumesData,
  filters: FundamentalModelVolumeFilters,
): FundamentalModelGlobalVolumesData => ({
  ...data,
  sections: data.sections
    .filter((section) => filters.types.includes(section.id))
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => rowMatchesRegion(row, filters.regions)),
    })),
})

export const readSavedVolumeFilters = (): FundamentalModelVolumeFilters | null => {
  try {
    const raw = localStorage.getItem(FM_VOLUME_FILTERS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FundamentalModelVolumeFilters
    if (!Array.isArray(parsed.types) || !Array.isArray(parsed.regions)) return null
    return parsed
  } catch {
    return null
  }
}
