import { Button, Stack } from '@mui/material'
import { useMemo } from 'react'

import type { FundamentalModelVolumeFilters } from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'
import type {
  FundamentalModelVolumesFilterOptions,
  FundamentalModelVolumesGranularity,
  FundamentalModelVolumesSegment,
} from '@/service/mi/fundamentalModel/case'

import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import FundamentalModelPeriodMenu from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelPeriodMenu'
import FundamentalModelVolumeFilterMenu from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelVolumeFilterMenu'

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
  const segmentFilterOptions = useMemo(
    () => filterOptions?.segments?.find((option) => option.segment === getScopeSegment(scope)),
    [filterOptions?.segments, scope],
  )
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
        <FundamentalModelVolumeFilterMenu
          key={`filter-${scope}`}
          typeOptions={segmentFilterOptions?.types ?? []}
          regionOptions={segmentFilterOptions?.regions ?? []}
          value={volumeFilters}
          initialSaveOn={initialSaveFilters}
          disabled={loading || !segmentFilterOptions}
          onApply={onApplyVolumeFilters}
        />
        {scope !== 'trade' &&
          (segmentFilterOptions?.periods ? (
            <FundamentalModelPeriodMenu
              key={`period-${scope}`}
              options={segmentFilterOptions.periods}
              granularities={granularityItems}
              granularity={granularity}
              periods={volumeFilters.periods}
              initialSaveOn={initialSaveFilters}
              onApply={(nextGranularity, periods, save) =>
                onApplyVolumeFilters(
                  {
                    ...volumeFilters,
                    granularity: nextGranularity,
                    periods: { ...volumeFilters.periods, [nextGranularity]: periods },
                  },
                  save,
                )
              }
            />
          ) : (
            <MISelectMenu
              variant="outlined"
              selectionIconPosition="left"
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
          ))}
      </Stack>
    </Stack>
  )
}

export default FundamentalModelSegmentToolbar
