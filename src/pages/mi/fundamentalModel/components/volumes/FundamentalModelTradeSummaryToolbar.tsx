import { KeyboardArrowDownRounded } from '@mui/icons-material'
import { Divider, Stack, Typography } from '@mui/material'
import { memo, useMemo, useState } from 'react'

import type { FundamentalModelTradeSelector, FundamentalModelTradeUnit } from '@/service/mi/fundamentalModel/case'

import MIMenuSelector from '@/components/common/input/MIMenuSelector'

export interface FundamentalModelTradeSummaryToolbarProps {
  selectorOptions: Array<{ value: FundamentalModelTradeSelector; label: string }>
  yearOptions: Array<{ value: number; label: string }>
  selector: FundamentalModelTradeSelector
  year: number
  unit: FundamentalModelTradeUnit
  loading?: boolean
  onSelectorChange?: (selector: FundamentalModelTradeSelector) => void
  onYearChange?: (year: number) => void
}

interface TradeSummaryDropdownProps<T extends string | number> {
  label: string
  options: Array<{ value: T; label: string }>
  selected: T
  loading?: boolean
  minWidthMenu?: string
  onChange?: (value: T) => void
}

const TradeSummaryDropdown = <T extends string | number>({
  label,
  options,
  selected,
  loading,
  minWidthMenu = '120px',
  onChange,
}: TradeSummaryDropdownProps<T>) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuOptions = useMemo(() => options.map((option) => ({ value: option.value, label: option.label })), [options])

  const selectedValue = useMemo(
    () => ({ value: selected, label: options.find((option) => option.value === selected)?.label ?? label }),
    [label, options, selected],
  )

  return (
    <MIMenuSelector
      value={selectedValue}
      options={menuOptions}
      minWidthMenu={minWidthMenu}
      onOpen={setMenuOpen}
      onChange={(item) => onChange?.(item.value as T)}
      sx={{
        '& .MuiPaper-root': {
          borderRadius: '4px',
          boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.10)',
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap="8px"
        sx={{
          cursor: loading ? 'default' : 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography variant="body2SB14" color="gray.90">
          {loading ? '-' : selectedValue.label}
        </Typography>
        <KeyboardArrowDownRounded
          sx={{
            fontSize: '20px',
            color: 'gray.70',
            transition: 'transform 150ms ease',
            transform: menuOpen ? 'rotate(180deg)' : 'none',
          }}
        />
      </Stack>
    </MIMenuSelector>
  )
}

/** Trade 탭 상단 요약(가스 유형 / 연도 드롭다운 + Unit) */
const FundamentalModelTradeSummaryToolbar = memo(
  ({
    selectorOptions,
    yearOptions,
    selector,
    year,
    unit,
    loading = false,
    onSelectorChange,
    onYearChange,
  }: FundamentalModelTradeSummaryToolbarProps) => (
    <Stack direction="row" alignItems="center" gap="8px" sx={{ minHeight: '28px' }}>
      <Stack direction="row" alignItems="center" gap="8px">
        <TradeSummaryDropdown label="LNG" options={selectorOptions} selected={selector} loading={loading} onChange={onSelectorChange} />
        <TradeSummaryDropdown label="2026" options={yearOptions} selected={year} loading={loading} onChange={onYearChange} />
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ height: '12px', alignSelf: 'center', borderColor: 'gray.40' }} />
      <Stack direction="row" alignItems="center" gap="4px">
        <Typography variant="body2M14" color="gray.60">
          Unit:
        </Typography>
        <Typography variant="body2M14" color="gray.70">
          {loading ? '-' : unit}
        </Typography>
      </Stack>
    </Stack>
  ),
)

FundamentalModelTradeSummaryToolbar.displayName = 'FundamentalModelTradeSummaryToolbar'

export default FundamentalModelTradeSummaryToolbar
