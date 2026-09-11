import { Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

import type { FundamentalModelVolumeFilters } from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import type { FundamentalModelFilterOption, FundamentalModelRegionFilterOption } from '@/service/mi/fundamentalModel/case'

import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIButton from '@/components/common/button/MIButton'
import ArrowDown from '@/components/common/icons/ArrowDown'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'
import MITree, { type MITreeItem } from '@/components/common/tree/MITree'
import useEllipsisDetection from '@/hooks/useEllipsisDetection'
import FundamentalModelFilterLabel from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelFilterLabel'
import {
  applyVolumeRegionCheckedIds,
  countSelectedFilterOptions,
  getVolumeRegionCheckedIds,
} from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'

interface FundamentalModelVolumeFilterMenuProps {
  typeOptions: FundamentalModelFilterOption[]
  regionOptions: FundamentalModelRegionFilterOption[]
  value: FundamentalModelVolumeFilters
  initialSaveOn: boolean
  disabled?: boolean
  onApply: (filters: FundamentalModelVolumeFilters, save?: boolean) => void
}

const FilterTreeItemLabel = ({ label }: { label: string }) => {
  const { ref, isEllipsis } = useEllipsisDetection(label)
  const content = (
    <Typography ref={ref} component="span" variant="body2M14" display="block" width="100%" minWidth={0} noWrap>
      {label}
    </Typography>
  )
  return isEllipsis ? <MIFollowCursorTooltip title={label}>{content}</MIFollowCursorTooltip> : content
}

const toTreeItems = (options: FundamentalModelFilterOption[]): MITreeItem[] =>
  options.map((option) => ({ id: option.value, label: <FilterTreeItemLabel label={option.label} />, ariaLabel: option.label }))

const FundamentalModelVolumeFilterMenu = ({
  typeOptions,
  regionOptions,
  value,
  initialSaveOn,
  disabled,
  onApply,
}: FundamentalModelVolumeFilterMenuProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [save, setSave] = useState(initialSaveOn)
  const typeItems = useMemo(() => toTreeItems(typeOptions), [typeOptions])
  const regionItems = useMemo(
    () =>
      regionOptions.map((region) => ({
        id: region.value,
        label: <FilterTreeItemLabel label={region.label} />,
        ariaLabel: region.label,
        children: toTreeItems(region.countries),
      })),
    [regionOptions],
  )
  const checkedRegionIds = useMemo(() => getVolumeRegionCheckedIds(draft, regionOptions), [draft, regionOptions])

  return (
    <MIMenu
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setDraft(value)
          setSave(initialSaveOn)
        }
        setOpen(nextOpen)
      }}
      disabled={disabled}
      variant="outlined"
      placement="bottom-end"
      enableHoverBackground
      suffix={open ? <KeyboardArrowUpIcon /> : <ArrowDown />}
      label={
        <FundamentalModelFilterLabel
          selectedCount={countSelectedFilterOptions(typeOptions, value.types) + getVolumeRegionCheckedIds(value, regionOptions).length}
          optionCount={typeOptions.length + regionOptions.reduce((count, region) => count + (region.countries.length || 1), 0)}
        >
          Filters
        </FundamentalModelFilterLabel>
      }
    >
      <Stack width="415px">
        <Stack direction="row" height="297px" padding="12px" gap="12px" boxSizing="border-box">
          <Stack flex={1} minWidth={0} minHeight={0} gap="8px">
            <Typography variant="body3M12" color="contentText.Subtext">
              Type
            </Typography>
            <ScrollWrapper height="100%" maxHeight="100%" thumbWidth={6} showScrollbarOnHover>
              <MITree
                items={typeItems}
                checkedItemIds={draft.types}
                onCheckedItemIdsChange={(types) => setDraft((previous) => ({ ...previous, types }))}
                gap="12px"
              />
            </ScrollWrapper>
          </Stack>
          <Divider orientation="vertical" flexItem />
          <Stack flex={1} minWidth={0} minHeight={0} gap="8px">
            <Typography variant="body3M12" color="contentText.Subtext">
              Regions
            </Typography>
            <ScrollWrapper height="100%" maxHeight="100%" scrollbarGap={10} reserveScrollbarGap thumbWidth={6} showScrollbarOnHover>
              <MITree
                items={regionItems}
                checkedItemIds={checkedRegionIds}
                onCheckedItemIdsChange={(checkedIds) =>
                  setDraft((previous) => applyVolumeRegionCheckedIds(previous, regionOptions, checkedIds))
                }
                gap="8px"
              />
            </ScrollWrapper>
          </Stack>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" justifyContent="space-between" padding="12px">
          <FormControlLabel label="Save" control={<Switch size="small" checked={save} onChange={(_, checked) => setSave(checked)} />} />
          <Stack direction="row" gap="10px">
            <MIButton
              type="ghost"
              onClick={() => setDraft((previous) => ({ ...previous, types: [], regions: [], countryKeys: undefined }))}
            >
              Clear
            </MIButton>
            <MIButton
              onClick={() => {
                onApply({ ...value, types: draft.types, regions: draft.regions, countryKeys: draft.countryKeys }, save)
                setOpen(false)
              }}
            >
              Apply
            </MIButton>
          </Stack>
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default FundamentalModelVolumeFilterMenu
