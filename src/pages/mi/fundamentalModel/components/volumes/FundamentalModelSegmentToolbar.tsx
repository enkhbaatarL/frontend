import { Button, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type {
  FundamentalModelFilterOption,
  FundamentalModelVolumesFilterOptions,
  FundamentalModelVolumesGranularity,
  FundamentalModelVolumesSegment,
} from '@/service/mi/fundamentalModel/case'

import MIFilterMenu, { type FilterValues } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import {
  countSelectedVolumeFilters,
  FM_VOLUME_REGION_OPTIONS,
  getVolumeTypeOptionsForScope,
  isAllVolumeFiltersSelected,
  normalizeVolumeFiltersForScope,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'

export interface FundamentalModelSegmentToolbarProps {
  loading?: boolean
  scope: FundamentalModelScopeKey
  onScopeChange: (scope: FundamentalModelScopeKey) => void
  volumeFilters: FundamentalModelVolumeFilters
  onApplyVolumeFilters: (filters: FundamentalModelVolumeFilters, save?: boolean) => void
  initialSaveFilters?: boolean
  granularity: FundamentalModelVolumesGranularity
  onGranularityChange: (granularity: FundamentalModelVolumesGranularity) => void
  filterOptions?: FundamentalModelVolumesFilterOptions | null
}

const SCOPE_VALUES: FundamentalModelScopeKey[] = ['global', 'lng', 'trade']

const getScopeSegment = (scope: FundamentalModelScopeKey): FundamentalModelVolumesSegment =>
  scope === 'global' ? 'GLOBAL' : scope === 'lng' ? 'LNG' : 'TRADE'

const toFilterMenuItems = (options: readonly FundamentalModelFilterOption[]) =>
  options.map((option) => ({ label: option.label, value: option.value }))

/** Volume 탭 상단 Global/LNG/Trade, Filters, 주기 툴바 */
const FundamentalModelSegmentToolbar = ({
  loading = false,
  scope,
  onScopeChange,
  volumeFilters,
  onApplyVolumeFilters,
  initialSaveFilters = false,
  granularity,
  onGranularityChange,
  filterOptions,
}: FundamentalModelSegmentToolbarProps) => {
  const scopedVolumeFilters = useMemo(() => normalizeVolumeFiltersForScope(volumeFilters, scope), [scope, volumeFilters])
  const segmentFilterOptions = useMemo(
    () => filterOptions?.segments?.find((option) => option.segment === getScopeSegment(scope)),
    [filterOptions?.segments, scope],
  )
  const typeFilters = useMemo(
    () => toFilterMenuItems(segmentFilterOptions?.types?.length ? segmentFilterOptions.types : getVolumeTypeOptionsForScope(scope)),
    [scope, segmentFilterOptions?.types],
  )
  const regionFilters = useMemo(
    () => toFilterMenuItems(segmentFilterOptions?.regions?.length ? segmentFilterOptions.regions : FM_VOLUME_REGION_OPTIONS),
    [segmentFilterOptions?.regions],
  )
  const selectedFilterCount = useMemo(() => countSelectedVolumeFilters(scopedVolumeFilters, scope), [scope, scopedVolumeFilters])
  const showFilterBadge = !isAllVolumeFiltersSelected(scopedVolumeFilters, scope)

  const granularityItems: SelectMenuItem<FundamentalModelVolumesGranularity>[] = useMemo(() => {
    if (!segmentFilterOptions?.granularities?.length) {
      return [
        { value: 'MONTHLY', label: 'Monthly' },
        { value: 'YEARLY', label: 'Yearly' },
      ]
    }

    return segmentFilterOptions.granularities.map((option) => ({
      value: option.value as FundamentalModelVolumesGranularity,
      label: option.label,
    }))
  }, [segmentFilterOptions?.granularities])

  const handleApplyFilters = (filterValues: FilterValues, save?: boolean) => {
    onApplyVolumeFilters(
      {
        types: filterValues.types ?? [],
        regions: filterValues.regions ?? [],
      },
      save,
    )
  }

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px" sx={{ minHeight: '36px', flexWrap: 'wrap' }}>
      <Stack direction="row" alignItems="center" gap="8px" sx={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {SCOPE_VALUES.map((key) => {
          const selected = scope === key
          const scopeLabel = key === 'global' ? 'Global' : key === 'lng' ? 'LNG' : 'Trade'
          return (
            <Button
              key={key}
              onClick={() => onScopeChange(key)}
              variant="outlined"
              disableElevation
              sx={{
                textTransform: 'none',
                borderRadius: '100px',
                padding: '6px 13px',
                fontSize: '16px',
                fontWeight: selected ? 600 : 500,
                borderColor: selected ? 'content.borderActivePrimary' : 'gray.20',
                color: selected ? 'content.textBlack' : 'content.textNormal',
                bgcolor: 'commonColor.White',
                minWidth: 0,
              }}
            >
              {scopeLabel}
            </Button>
          )
        })}
      </Stack>

      <Stack direction="row" alignItems="center" gap="8px" sx={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <MIFilterMenu
          label={
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography variant="body2SB14">Filters</Typography>
              {showFilterBadge && (
                <Stack
                  justifyContent="center"
                  alignItems="center"
                  minWidth="20px"
                  height="20px"
                  borderRadius="100px"
                  bgcolor="commonColor.Primary"
                >
                  <Typography px="5px" variant="body2SB14" color="commonColor.White" textAlign="center">
                    {selectedFilterCount}
                  </Typography>
                </Stack>
              )}
            </Stack>
          }
          filterGroups={[
            [
              {
                key: 'types',
                title: 'Type',
                filters: typeFilters,
                width: '131px',
              },
            ],
            [
              {
                key: 'regions',
                title: 'Regions',
                filters: regionFilters,
                width: '200px',
              },
            ],
          ]}
          initialValues={{
            types: scopedVolumeFilters.types,
            regions: scopedVolumeFilters.regions,
          }}
          onApply={handleApplyFilters}
          showSaveOption
          initialSaveOn={initialSaveFilters}
          placement="bottom-end"
          menuPositionOffset={{ right: 0 }}
          enableHoverBackground
          sx={{ minWidth: '105px', height: '40px' }}
        />
        {scope !== 'trade' && (
          <MISelectMenu
            variant="outlined"
            selected={granularity}
            onSelected={(v: FundamentalModelVolumesGranularity) => onGranularityChange(v)}
            items={granularityItems}
            enableHoverBackground
            sx={{
              height: '40px',
              borderRadius: '10px',
              color: 'gray.70',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          />
        )}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelSegmentToolbar
