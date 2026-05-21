import { Button, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MIFilterMenu, { type FilterValues } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import {
  countSelectedVolumeFilters,
  FM_VOLUME_REGION_OPTIONS,
  FM_VOLUME_TYPE_OPTIONS,
  isAllVolumeFiltersSelected,
  type FundamentalModelVolumeFilters,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'

export interface FundamentalModelSegmentToolbarProps {
  loading?: boolean
  scope: FundamentalModelScopeKey
  onScopeChange: (scope: FundamentalModelScopeKey) => void
  volumeFilters: FundamentalModelVolumeFilters
  onApplyVolumeFilters: (filters: FundamentalModelVolumeFilters, save?: boolean) => void
  initialSaveFilters?: boolean
  period: string
  onPeriodChange: (period: string) => void
}

const SCOPE_VALUES: FundamentalModelScopeKey[] = ['global', 'lng', 'trade']

const typeFilters = FM_VOLUME_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))
const regionFilters = FM_VOLUME_REGION_OPTIONS.map((o) => ({ label: o.label, value: o.value }))

/** Volume 탭 상단 Global/LNG/Trade, Filters, 주기 툴바 */
const FundamentalModelSegmentToolbar = ({
  loading = false,
  scope,
  onScopeChange,
  volumeFilters,
  onApplyVolumeFilters,
  initialSaveFilters = false,
  period,
  onPeriodChange,
}: FundamentalModelSegmentToolbarProps) => {
  const selectedFilterCount = useMemo(() => countSelectedVolumeFilters(volumeFilters), [volumeFilters])
  const showFilterBadge = !isAllVolumeFiltersSelected(volumeFilters)

  const periodItems: SelectMenuItem<string>[] = useMemo(
    () => [
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ],
    [],
  )

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
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ minHeight: 36, flexWrap: 'wrap' }}>
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
                px: '13px',
                py: '6px',
                fontSize: 16,
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
                width: 131,
              },
            ],
            [
              {
                key: 'regions',
                title: 'Regions',
                filters: regionFilters,
                width: 200,
              },
            ],
          ]}
          initialValues={{
            types: volumeFilters.types,
            regions: volumeFilters.regions,
          }}
          onApply={handleApplyFilters}
          showSaveOption
          initialSaveOn={initialSaveFilters}
          placement="bottom-end"
          menuPositionOffset={{ right: 0 }}
          enableHoverBackground
          sx={{ minWidth: 105, height: 40 }}
        />
        <MISelectMenu
          variant="outlined"
          selected={period}
          onSelected={(v: string) => onPeriodChange(v)}
          items={periodItems}
          enableHoverBackground
          sx={{
            height: 40,
            borderRadius: '10px',
            color: 'gray.70',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        />
      </Stack>
    </Stack>
  )
}

export default FundamentalModelSegmentToolbar
