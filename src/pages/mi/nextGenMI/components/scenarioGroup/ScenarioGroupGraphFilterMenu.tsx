import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import { Stack, Switch, Typography } from '@mui/material'
import { useState } from 'react'

import type { ScenarioGroupGraphFilter } from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioGroupGraphMapping'

import MIMenu from '@/components/common/menu/MIMenu'

interface ScenarioGroupGraphFilterMenuProps {
  filter: ScenarioGroupGraphFilter
  onChange: (filter: ScenarioGroupGraphFilter) => void
}

const FilterOptionRow = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    gap="8px"
    width="100%"
    onClick={onToggle}
    sx={{
      boxSizing: 'border-box',
      padding: '6px 12px',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease-in-out',
      '&:hover': { backgroundColor: 'gray.10' },
    }}
  >
    <Typography
      variant="body2M14"
      color="contentText.Normal"
      sx={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {label}
    </Typography>
    <Switch size="small" checked={checked} onChange={onToggle} sx={{ marginRight: 0, pointerEvents: 'none', flexShrink: 0 }} />
  </Stack>
)

/** Scenarios 헤더 3-dot 필터 메뉴 (미실행/폐기 토글 2개, 프론트 필터링) */
const ScenarioGroupGraphFilterMenu = ({ filter, onChange }: ScenarioGroupGraphFilterMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <MIMenu
      open={open}
      onOpenChange={setOpen}
      variant="outlined"
      placement="bottom-end"
      paperProps={{ sx: { width: '230px' } }}
      sx={{
        width: '26px',
        minWidth: '26px',
        height: '26px',
        padding: '0',
        borderRadius: '8px',
        '& .MuiStack-root': { justifyContent: 'center' },
      }}
      label={<MoreVertRoundedIcon sx={{ fontSize: '16px', color: 'contentText.Normal' }} />}
    >
      <Stack padding="8px" gap="4px">
        <FilterOptionRow
          label="수급모델 미실행 시나리오"
          checked={filter.showNonExecuted}
          onToggle={() => onChange({ ...filter, showNonExecuted: !filter.showNonExecuted })}
        />
        <FilterOptionRow
          label="폐기 시나리오"
          checked={filter.showDiscarded}
          onToggle={() => onChange({ ...filter, showDiscarded: !filter.showDiscarded })}
        />
      </Stack>
    </MIMenu>
  )
}

export default ScenarioGroupGraphFilterMenu
