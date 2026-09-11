import type {
  FundamentalModelFilterOption,
  FundamentalModelRegionFilterOption,
  FundamentalModelVolumesGranularity,
  FundamentalModelVolumesSegmentFilterOptions,
} from '@/service/mi/fundamentalModel/case'

export const FM_VOLUME_FILTERS_STORAGE_KEY = 'fundamentalModelVolumeFilters'

export interface FundamentalModelVolumeFilters {
  types: string[]
  regions: string[]
  countryKeys?: string[]
  granularity?: FundamentalModelVolumesGranularity
  periods?: Partial<Record<FundamentalModelVolumesGranularity, string[]>>
}

/** 현재 API 옵션에 존재하는 선택만 유지하며, 탭 간 공통 항목이 없으면 전체 선택합니다. */
export const normalizeVolumeFiltersForScope = (
  filters: FundamentalModelVolumeFilters | null,
  options?: FundamentalModelVolumesSegmentFilterOptions,
): FundamentalModelVolumeFilters => {
  const normalize = (selected: string[] | undefined, available: FundamentalModelFilterOption[]): string[] => {
    const values = available.map((option) => option.value)
    if (!selected) return values
    const valid = values.filter((value) => selected.includes(value))
    return valid.length > 0 || selected.length === 0 ? valid : values
  }

  const regions = normalize(filters?.regions, options?.regions ?? [])
  const availableCountries = options?.regions.filter((region) => regions.includes(region.value)).flatMap((region) => region.countries) ?? []

  return {
    ...filters,
    types: normalize(filters?.types, options?.types ?? []),
    regions,
    countryKeys:
      filters?.countryKeys === undefined
        ? undefined
        : availableCountries.filter((country) => filters.countryKeys?.includes(country.value)).map((country) => country.value),
  }
}

export const getVolumeRegionCheckedIds = (
  filters: FundamentalModelVolumeFilters,
  regions: FundamentalModelRegionFilterOption[],
): string[] =>
  regions
    .filter((region) => filters.regions.includes(region.value))
    .flatMap((region) => {
      if (region.countries.length === 0) return [region.value]
      return region.countries
        .filter((country) => filters.countryKeys === undefined || filters.countryKeys.includes(country.value))
        .map((country) => country.value)
    })

export const applyVolumeRegionCheckedIds = (
  filters: FundamentalModelVolumeFilters,
  regions: FundamentalModelRegionFilterOption[],
  checkedIds: string[],
): FundamentalModelVolumeFilters => {
  const selectedRegions = regions.filter((region) =>
    region.countries.length === 0
      ? checkedIds.includes(region.value)
      : region.countries.some((country) => checkedIds.includes(country.value)),
  )
  const countries = selectedRegions.flatMap((region) => region.countries)
  const countryKeys = countries.filter((country) => checkedIds.includes(country.value)).map((country) => country.value)
  return {
    ...filters,
    regions: selectedRegions.map((region) => region.value),
    countryKeys: countries.length === countryKeys.length ? undefined : countryKeys,
  }
}

export const countSelectedFilterOptions = (options: readonly FundamentalModelFilterOption[], selected?: readonly string[]): number =>
  selected === undefined ? options.length : options.filter((option) => selected.includes(option.value)).length

export const readSavedVolumeFilters = (): FundamentalModelVolumeFilters | null => {
  try {
    const raw = localStorage.getItem(FM_VOLUME_FILTERS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FundamentalModelVolumeFilters
    if (!Array.isArray(parsed.types) || !Array.isArray(parsed.regions)) return null
    if (
      parsed.countryKeys !== undefined &&
      (!Array.isArray(parsed.countryKeys) || !parsed.countryKeys.every((key) => typeof key === 'string'))
    )
      return null
    if (parsed.granularity !== undefined && parsed.granularity !== 'YEARLY' && parsed.granularity !== 'MONTHLY') return null
    if (parsed.periods !== undefined) {
      if (!parsed.periods || typeof parsed.periods !== 'object') return null
      for (const granularity of ['YEARLY', 'MONTHLY'] as const) {
        const periods = parsed.periods[granularity]
        const format = granularity === 'YEARLY' ? /^\d{4}$/ : /^\d{4}-(0[1-9]|1[0-2])$/
        if (
          periods !== undefined &&
          (!Array.isArray(periods) || !periods.every((period) => typeof period === 'string' && format.test(period)))
        ) {
          return null
        }
      }
    }
    return parsed
  } catch {
    return null
  }
}
