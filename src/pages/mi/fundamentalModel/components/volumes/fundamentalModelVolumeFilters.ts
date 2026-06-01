import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type { FundamentalModelVolumesRegion, FundamentalModelVolumesType } from '@/service/mi/fundamentalModel/case'

/** Volumes Type 필터 옵션 - value: UI id / api: getVolumes types enum */
export const FM_VOLUME_TYPE_OPTIONS = [
  { value: 'demand', label: 'Demand', api: 'DEMAND' },
  { value: 'production', label: 'Production', api: 'PRODUCTION' },
  { value: 'lng-imports', label: 'LNG Imports', api: 'LNG_IMPORTS' },
  { value: 'lng-exports', label: 'LNG Exports', api: 'LNG_EXPORTS' },
  { value: 'pipeline-imports', label: 'Pipeline Imports', api: 'PIPELINE_IMPORTS' },
  { value: 'pipeline-exports', label: 'Pipeline Exports', api: 'PIPELINE_EXPORTS' },
] as const satisfies ReadonlyArray<{ value: string; label: string; api: FundamentalModelVolumesType }>

export type FundamentalModelVolumeTypeOption = (typeof FM_VOLUME_TYPE_OPTIONS)[number]

const FM_VOLUME_TYPE_OPTIONS_BY_SCOPE: Record<FundamentalModelScopeKey, readonly FundamentalModelVolumeTypeOption[]> = {
  global: FM_VOLUME_TYPE_OPTIONS,
  lng: FM_VOLUME_TYPE_OPTIONS.filter((option) => option.api === 'LNG_IMPORTS' || option.api === 'LNG_EXPORTS'),
  trade: FM_VOLUME_TYPE_OPTIONS.filter((option) => option.api !== 'DEMAND' && option.api !== 'PRODUCTION'),
}

export const getVolumeTypeOptionsForScope = (scope: FundamentalModelScopeKey): readonly FundamentalModelVolumeTypeOption[] =>
  FM_VOLUME_TYPE_OPTIONS_BY_SCOPE[scope]

export const getDefaultVolumeTypeIdsForScope = (scope: FundamentalModelScopeKey): string[] =>
  getVolumeTypeOptionsForScope(scope).map((option) => option.value)

/** Volumes Regions 필터 옵션 - value: UI id / api: getVolumes regions enum */
export const FM_VOLUME_REGION_OPTIONS = [
  { value: 'asia', label: 'Asia', api: 'ASIA' },
  { value: 'europe', label: 'Europe', api: 'EUROPE' },
  { value: 'north-america', label: 'North America', api: 'NORTH_AMERICA' },
  { value: 'middle-east', label: 'Middle East', api: 'MIDDLE_EAST' },
  { value: 'australia', label: 'Australia', api: 'AUSTRALIA' },
  { value: 'russia', label: 'Russia', api: 'RUSSIA' },
  { value: 'africa', label: 'Africa', api: 'AFRICA' },
  { value: 'south-america', label: 'South America', api: 'SOUTH_AMERICA' },
] as const satisfies ReadonlyArray<{ value: string; label: string; api: FundamentalModelVolumesRegion }>

/** UI Type id -> API types enum (대문자) 매핑 */
export const FM_VOLUME_TYPE_ID_TO_API: Record<string, FundamentalModelVolumesType> = Object.fromEntries(
  FM_VOLUME_TYPE_OPTIONS.map((option) => [option.value, option.api]),
)

/** UI Region id -> API regions enum (대문자) 매핑 */
export const FM_VOLUME_REGION_ID_TO_API: Record<string, FundamentalModelVolumesRegion> = Object.fromEntries(
  FM_VOLUME_REGION_OPTIONS.map((option) => [option.value, option.api]),
)

/** 선택된 Type id 배열 -> API types enum 배열(매핑 미존재 항목 제외) */
export const toApiVolumeTypes = (uiTypes: string[]): FundamentalModelVolumesType[] =>
  uiTypes.map((id) => FM_VOLUME_TYPE_ID_TO_API[id]).filter((value): value is FundamentalModelVolumesType => Boolean(value))

/** 선택된 Region id 배열 -> API regions enum 배열(매핑 미존재 항목 제외) */
export const toApiVolumeRegions = (uiRegions: string[]): FundamentalModelVolumesRegion[] =>
  uiRegions.map((id) => FM_VOLUME_REGION_ID_TO_API[id]).filter((value): value is FundamentalModelVolumesRegion => Boolean(value))

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

export const normalizeVolumeFiltersForScope = (
  filters: FundamentalModelVolumeFilters,
  scope: FundamentalModelScopeKey,
): FundamentalModelVolumeFilters => {
  const scopedTypeIds = getDefaultVolumeTypeIdsForScope(scope)
  const scopedTypeSet = new Set(scopedTypeIds)
  const types = filters.types.filter((id) => scopedTypeSet.has(id))

  return {
    types: types.length > 0 ? types : scopedTypeIds,
    regions: filters.regions,
  }
}

/** Filters 배지용 - 선택된 항목 수 */
export const countSelectedVolumeFilters = (filters: FundamentalModelVolumeFilters, scope: FundamentalModelScopeKey = 'global'): number => {
  const normalizedFilters = normalizeVolumeFiltersForScope(filters, scope)
  return normalizedFilters.types.length + normalizedFilters.regions.length
}

/** 전체 선택(default) 여부 - 배지 숨김 */
export const isAllVolumeFiltersSelected = (filters: FundamentalModelVolumeFilters, scope: FundamentalModelScopeKey = 'global'): boolean => {
  const scopedDefaultTypeIds = getDefaultVolumeTypeIdsForScope(scope)
  const normalizedFilters = normalizeVolumeFiltersForScope(filters, scope)

  return (
    normalizedFilters.types.length === scopedDefaultTypeIds.length &&
    filters.regions.length === FM_VOLUME_DEFAULT_REGION_IDS.length &&
    scopedDefaultTypeIds.every((id) => normalizedFilters.types.includes(id)) &&
    FM_VOLUME_DEFAULT_REGION_IDS.every((id) => filters.regions.includes(id))
  )
}

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
