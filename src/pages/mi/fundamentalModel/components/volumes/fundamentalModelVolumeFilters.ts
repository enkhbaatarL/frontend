import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type {
  FundamentalModelTradeFlowsType,
  FundamentalModelVolumesRegion,
  FundamentalModelVolumesType,
} from '@/service/mi/fundamentalModel/case'

export const FM_VOLUME_TYPE_OPTIONS = [
  { value: 'DEMAND', label: 'Demand' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'LNG_IMPORTS', label: 'LNG Imports' },
  { value: 'LNG_EXPORTS', label: 'LNG Exports' },
  { value: 'PIPELINE_IMPORTS', label: 'Pipeline Imports' },
  { value: 'PIPELINE_EXPORTS', label: 'Pipeline Exports' },
] as const satisfies ReadonlyArray<{ value: FundamentalModelVolumesType; label: string }>

export const FM_VOLUME_TRADE_TO_COUNTRY_TYPE_ID = 'TO_COUNTRY'
export const FM_VOLUME_TRADE_FROM_COUNTRY_TYPE_ID = 'FROM_COUNTRY'

export const FM_VOLUME_TRADE_TYPE_OPTIONS = [
  { value: FM_VOLUME_TRADE_TO_COUNTRY_TYPE_ID, label: 'To country' },
  { value: FM_VOLUME_TRADE_FROM_COUNTRY_TYPE_ID, label: 'From country' },
] as const satisfies ReadonlyArray<{ value: FundamentalModelTradeFlowsType; label: string }>

export type FundamentalModelVolumeTypeOption = (typeof FM_VOLUME_TYPE_OPTIONS)[number] | (typeof FM_VOLUME_TRADE_TYPE_OPTIONS)[number]

const FM_VOLUME_TYPE_OPTIONS_BY_SCOPE: Record<FundamentalModelScopeKey, readonly FundamentalModelVolumeTypeOption[]> = {
  global: FM_VOLUME_TYPE_OPTIONS,
  lng: FM_VOLUME_TYPE_OPTIONS.filter((option) => option.value === 'LNG_IMPORTS' || option.value === 'LNG_EXPORTS'),
  trade: FM_VOLUME_TRADE_TYPE_OPTIONS,
}

export const getVolumeTypeOptionsForScope = (scope: FundamentalModelScopeKey): readonly FundamentalModelVolumeTypeOption[] =>
  FM_VOLUME_TYPE_OPTIONS_BY_SCOPE[scope]

export const getDefaultVolumeTypeIdsForScope = (scope: FundamentalModelScopeKey): string[] =>
  getVolumeTypeOptionsForScope(scope).map((option) => option.value)

export const FM_VOLUME_REGION_OPTIONS = [
  { value: 'ASIA', label: 'Asia' },
  { value: 'EUROPE', label: 'Europe' },
  { value: 'NORTH_AMERICA', label: 'North America' },
  { value: 'MIDDLE_EAST', label: 'Middle East' },
  { value: 'AUSTRALIA', label: 'Australia' },
  { value: 'RUSSIA', label: 'Russia' },
  { value: 'AFRICA', label: 'Africa' },
  { value: 'SOUTH_AMERICA', label: 'South America' },
] as const satisfies ReadonlyArray<{ value: FundamentalModelVolumesRegion; label: string }>

export const toApiVolumeTypes = (uiTypes: string[]): FundamentalModelVolumesType[] =>
  uiTypes.filter((value): value is FundamentalModelVolumesType => FM_VOLUME_TYPE_OPTIONS.some((option) => option.value === value))

export const toApiVolumeRegions = (uiRegions: string[]): FundamentalModelVolumesRegion[] =>
  uiRegions.filter((value): value is FundamentalModelVolumesRegion => FM_VOLUME_REGION_OPTIONS.some((option) => option.value === value))

export const toApiTradeFlowTypes = (uiTypes: string[]): FundamentalModelTradeFlowsType[] =>
  uiTypes.filter((value): value is FundamentalModelTradeFlowsType => FM_VOLUME_TRADE_TYPE_OPTIONS.some((option) => option.value === value))

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
  const regionSet = new Set<string>(FM_VOLUME_DEFAULT_REGION_IDS)
  const regions = filters.regions.filter((id) => regionSet.has(id))

  return {
    types: types.length > 0 || filters.types.length === 0 ? types : scopedTypeIds,
    regions: regions.length > 0 || filters.regions.length === 0 ? regions : [...FM_VOLUME_DEFAULT_REGION_IDS],
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
    normalizedFilters.regions.length === FM_VOLUME_DEFAULT_REGION_IDS.length &&
    scopedDefaultTypeIds.every((id) => normalizedFilters.types.includes(id)) &&
    FM_VOLUME_DEFAULT_REGION_IDS.every((id) => normalizedFilters.regions.includes(id))
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
