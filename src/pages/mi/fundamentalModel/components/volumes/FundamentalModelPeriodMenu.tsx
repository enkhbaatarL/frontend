import { CheckRounded } from '@mui/icons-material'
import { Divider, FormControlLabel, IconButton, Stack, Switch, Typography } from '@mui/material'
import { useState } from 'react'

import type { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import type { FundamentalModelVolumeFilters } from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'
import type {
  FundamentalModelFilterOption,
  FundamentalModelPeriodFilterOptions,
  FundamentalModelVolumesGranularity,
} from '@/service/mi/fundamentalModel/case'

import checkboxIndeterminateIcon from '@/assets/icons/checkbox-indeterminate.svg'
import ScrollWrapper from '@/components/admin/ScrollWrapper'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIButton from '@/components/common/button/MIButton'
import ArrowDown from '@/components/common/icons/ArrowDown'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MICheckBox from '@/components/common/input/MICheckBox'
import MIMenu from '@/components/common/menu/MIMenu'
import FundamentalModelFilterLabel from '@/pages/mi/fundamentalModel/components/volumes/FundamentalModelFilterLabel'
import { countSelectedFilterOptions } from '@/pages/mi/fundamentalModel/components/volumes/fundamentalModelVolumeFilters'

interface FundamentalModelPeriodMenuProps {
  options: FundamentalModelPeriodFilterOptions
  granularities: SelectMenuItem<FundamentalModelVolumesGranularity>[]
  granularity: FundamentalModelVolumesGranularity
  periods: FundamentalModelVolumeFilters['periods']
  initialSaveOn: boolean
  onApply: (granularity: FundamentalModelVolumesGranularity, periods: string[] | undefined, save: boolean) => void
}

const FundamentalModelPeriodMenu = ({
  options,
  granularities,
  granularity,
  periods,
  initialSaveOn,
  onApply,
}: FundamentalModelPeriodMenuProps) => {
  const [open, setOpen] = useState(false)
  const [draftGranularity, setDraftGranularity] = useState(granularity)
  const [draftPeriods, setDraftPeriods] = useState<Record<FundamentalModelVolumesGranularity, string[]>>({ YEARLY: [], MONTHLY: [] })
  const [save, setSave] = useState(initialSaveOn)
  const [expandedYears, setExpandedYears] = useState<string[]>([])
  const currentOptions = draftGranularity === 'YEARLY' ? options.yearly : options.monthly
  const selected = draftPeriods[draftGranularity]
  const allSelected = currentOptions.length > 0 && currentOptions.every((option) => selected.includes(option.value))
  const appliedOptions = granularity === 'YEARLY' ? options.yearly : options.monthly

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftGranularity(granularity)
      setDraftPeriods({
        YEARLY: options.yearly.filter((option) => !periods?.YEARLY || periods.YEARLY.includes(option.value)).map((option) => option.value),
        MONTHLY: options.monthly
          .filter((option) => !periods?.MONTHLY || periods.MONTHLY.includes(option.value))
          .map((option) => option.value),
      })
      setSave(initialSaveOn)
      setExpandedYears([])
    }
    setOpen(nextOpen)
  }

  const togglePeriods = (values: string[]) => {
    const remove = values.every((value) => selected.includes(value))
    setDraftPeriods((previous) => ({
      ...previous,
      [draftGranularity]: currentOptions
        .filter((option) => (values.includes(option.value) ? !remove : selected.includes(option.value)))
        .map((option) => option.value),
    }))
  }

  const renderPeriod = (option: FundamentalModelFilterOption) => (
    <MIButton
      key={option.value}
      size="h32"
      type={selected.includes(option.value) ? 'filled' : 'ghost'}
      active={!selected.includes(option.value)}
      borderRadius="6px"
      width="100%"
      onClick={() => togglePeriods([option.value])}
    >
      {option.label}
    </MIButton>
  )

  return (
    <MIMenu
      label={
        <FundamentalModelFilterLabel
          selectedCount={countSelectedFilterOptions(appliedOptions, periods?.[granularity])}
          optionCount={appliedOptions.length}
        >
          {granularities.find((option) => option.value === granularity)?.label ?? granularity}
        </FundamentalModelFilterLabel>
      }
      suffix={open ? <KeyboardArrowUpIcon /> : <ArrowDown />}
      variant="outlined"
      placement="bottom-end"
      enableHoverBackground
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Stack width="382px">
        <Stack direction="row" height="300px" padding="12px" gap="12px" boxSizing="border-box">
          <Stack width="130px" flexShrink={0} gap="8px">
            {granularities.map((option) => (
              <MIBaseButton
                key={option.value}
                labelTextAlign="left"
                suffix={draftGranularity === option.value ? <CheckRounded sx={{ fontSize: '20px' }} /> : undefined}
                sx={{ height: '32px', padding: '6px 12px' }}
                onClick={() => {
                  if (option.value === 'YEARLY' || option.value === 'MONTHLY') setDraftGranularity(option.value)
                }}
              >
                {option.label}
              </MIBaseButton>
            ))}
          </Stack>
          <Divider orientation="vertical" flexItem />
          <ScrollWrapper height="100%" maxHeight="100%" thumbWidth={6} showScrollbarOnHover sx={{ flex: 1, minWidth: 0 }}>
            <Stack gap="12px">
              <FormControlLabel
                label="Select All"
                control={
                  <MICheckBox
                    checked={allSelected}
                    indeterminate={!allSelected && selected.length > 0}
                    indeterminateIcon={<img src={checkboxIndeterminateIcon} alt="" width="24" height="24" />}
                    disabled={currentOptions.length === 0}
                    onChange={() => togglePeriods(currentOptions.map((option) => option.value))}
                  />
                }
              />
              {currentOptions.length === 0 ? (
                <Typography variant="body2M14" color="contentText.Subtext">
                  조회 가능한 기간이 없습니다.
                </Typography>
              ) : draftGranularity === 'YEARLY' ? (
                <Stack display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="8px">
                  {options.yearly.map(renderPeriod)}
                </Stack>
              ) : (
                options.yearly.map((year) => {
                  const months = options.monthly.filter((month) => month.value.startsWith(`${year.value}-`))
                  if (months.length === 0) return null
                  const selectedCount = months.filter((month) => selected.includes(month.value)).length
                  const expanded = expandedYears.includes(year.value)

                  return (
                    <Stack key={year.value} gap="12px">
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <FormControlLabel
                          label={year.label}
                          control={
                            <MICheckBox
                              checked={selectedCount === months.length}
                              indeterminate={selectedCount > 0 && selectedCount < months.length}
                              indeterminateIcon={<img src={checkboxIndeterminateIcon} alt="" width="24" height="24" />}
                              onChange={() => togglePeriods(months.map((month) => month.value))}
                            />
                          }
                        />
                        <IconButton
                          aria-label={`${year.label} ${expanded ? '접기' : '펼치기'}`}
                          aria-expanded={expanded}
                          disableRipple
                          sx={{ padding: 0, width: '20px', height: '20px', color: 'contentIcon.Enabled' }}
                          onClick={() =>
                            setExpandedYears((previous) =>
                              expanded ? previous.filter((value) => value !== year.value) : [...previous, year.value],
                            )
                          }
                        >
                          {expanded ? <KeyboardArrowUpIcon /> : <ArrowDown />}
                        </IconButton>
                      </Stack>
                      {expanded && (
                        <Stack display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="8px">
                          {months.map(renderPeriod)}
                        </Stack>
                      )}
                    </Stack>
                  )
                })
              )}
            </Stack>
          </ScrollWrapper>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" justifyContent="space-between" padding="12px">
          <FormControlLabel label="Save" control={<Switch size="small" checked={save} onChange={(_, checked) => setSave(checked)} />} />
          <Stack direction="row" gap="10px">
            <MIButton type="ghost" size="h34" onClick={() => setDraftPeriods((previous) => ({ ...previous, [draftGranularity]: [] }))}>
              Clear
            </MIButton>
            <MIButton
              size="h34"
              onClick={() => {
                onApply(draftGranularity, allSelected ? undefined : selected, save)
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

export default FundamentalModelPeriodMenu
