import { Stack, Switch, Typography } from '@mui/material'
import { useMemo } from 'react'

import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu, { type DateRange } from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'
import { buildNextGenMIDatePresets } from '@/pages/mi/nextGenMI/components/common/nextGenMIDateRange'
import { NEXT_GEN_MI_LIST_SORT_OPTIONS } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import { ListSort } from '@/service/mi/nextGenMI/common'

export type ScenarioGroupMode = 'group' | 'individual'

const MODE_OPTIONS = [
  { value: 'group', label: '그룹' },
  { value: 'individual', label: '개별' },
] as const satisfies ReadonlyArray<{ value: ScenarioGroupMode; label: string }>

interface ScenarioGroupToolbarProps {
  mode: ScenarioGroupMode
  onModeChange: (mode: ScenarioGroupMode) => void
  appliedDateRange: DateRange
  onDateRangeApply: (dates: DateRange) => void
  sort: ListSort
  onSortChange: (sort: ListSort) => void
  expandAll: boolean
  onExpandAllChange: (expandAll: boolean) => void
  keyword: string
  onKeywordChange: (value: string) => void
  onSearch: (value: string) => void
  onSearchClear: () => void
}

const ScenarioGroupToolbar = ({
  mode,
  onModeChange,
  appliedDateRange,
  onDateRangeApply,
  sort,
  onSortChange,
  expandAll,
  onExpandAllChange,
  keyword,
  onKeywordChange,
  onSearch,
  onSearchClear,
}: ScenarioGroupToolbarProps) => {
  const nextGenMIDatePresets = useMemo(() => buildNextGenMIDatePresets(), [])
  const isGroupMode = mode === 'group'

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} paddingX="24px">
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap="12px" minWidth={0} flex={1}>
        <MISlidingSegmented
          options={MODE_OPTIONS}
          value={mode}
          onChange={(value) => onModeChange(value as ScenarioGroupMode)}
          sx={{
            height: '36px',
            '& > button': {
              height: '28px',
              padding: '4px 8px',
              boxSizing: 'border-box',
            },
            '& .MuiTypography-root': { whiteSpace: 'nowrap' },
          }}
        />

        <MIDateRangePickerMenu
          dateRange={appliedDateRange}
          onApply={onDateRangeApply}
          showPreset
          datePresets={nextGenMIDatePresets}
          closeOnScroll
          sx={{
            height: '36px',
            minHeight: '36px',
            padding: '8px 12px',
            borderRadius: '8px',
          }}
        />

        <MISelectMenu
          variant="outlined"
          buttonHoverBgColor="gray.20"
          selected={sort}
          onSelected={(value: string) => onSortChange(value as ListSort)}
          items={NEXT_GEN_MI_LIST_SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
          closeOnScroll
          sx={{
            height: '36px',
            minHeight: '36px',
            borderRadius: '10px',
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" gap="12px" flexShrink={0}>
        {isGroupMode && (
          <Stack direction="row" alignItems="center" height="36px" gap={0.5}>
            <Switch size="small" checked={expandAll} onChange={(_, checked) => onExpandAllChange(checked)} />
            <Typography variant="body2M14" color={expandAll ? 'contentText.Black' : 'contentText.Normal'}>
              전체 펼쳐보기
            </Typography>
          </Stack>
        )}
        <MISearchInput
          storageKey="next-gen-mi-scenario-groups"
          value={keyword}
          onChange={onKeywordChange}
          placeholder={isGroupMode ? '시나리오 그룹명으로 검색' : '시나리오명으로 검색'}
          onSearch={onSearch}
          onClear={onSearchClear}
          width="246px"
          height="36px"
        />
      </Stack>
    </Stack>
  )
}

export default ScenarioGroupToolbar
