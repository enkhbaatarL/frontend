import { KeyboardArrowDownRounded } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { memo, useMemo, useState } from 'react'

import type { FundamentalModelTradeFilterOption } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MIMenuSelector from '@/components/common/input/MIMenuSelector'

export interface FundamentalModelTradeSummaryToolbarProps {
  productOptions: FundamentalModelTradeFilterOption[]
  yearOptions: FundamentalModelTradeFilterOption[]
  selectedProductId: string
  selectedYearId: string
  unitLabel: string
  loading?: boolean
  onProductChange?: (productId: string) => void
  onYearChange?: (yearId: string) => void
}

interface TradeSummaryDropdownProps {
  label: string
  options: FundamentalModelTradeFilterOption[]
  selectedId: string
  loading?: boolean
  minWidthMenu?: number
  onChange?: (id: string) => void
}

const TradeSummaryDropdown = ({ label, options, selectedId, loading, minWidthMenu = 120, onChange }: TradeSummaryDropdownProps) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuOptions = useMemo(() => options.map((option) => ({ value: option.id, label: option.label })), [options])

  const selectedValue = useMemo(
    () => ({ value: selectedId, label: options.find((o) => o.id === selectedId)?.label ?? label }),
    [label, options, selectedId],
  )

  return (
    <MIMenuSelector
      value={selectedValue}
      options={menuOptions}
      minWidthMenu={minWidthMenu}
      onOpen={setMenuOpen}
      onChange={(item) => onChange?.(String(item.value))}
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
          {loading ? '—' : selectedValue.label}
        </Typography>
        <KeyboardArrowDownRounded
          sx={{
            fontSize: 20,
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
    productOptions,
    yearOptions,
    selectedProductId,
    selectedYearId,
    unitLabel,
    loading = false,
    onProductChange,
    onYearChange,
  }: FundamentalModelTradeSummaryToolbarProps) => (
    <Stack direction="row" alignItems="center" gap="8px" sx={{ minHeight: 28 }}>
      <Stack direction="row" alignItems="center" gap="8px">
        <TradeSummaryDropdown
          label="LNG"
          options={productOptions}
          selectedId={selectedProductId}
          loading={loading}
          onChange={onProductChange}
        />
        <TradeSummaryDropdown
          label="2026"
          options={yearOptions}
          selectedId={selectedYearId}
          loading={loading}
          minWidthMenu={120}
          onChange={onYearChange}
        />
      </Stack>
      <Box sx={{ width: '1px', height: 12, bgcolor: 'gray.40', flexShrink: 0 }} />
      <Stack direction="row" alignItems="center" gap="4px">
        <Typography variant="body2M14" color="gray.60">
          Unit:
        </Typography>
        <Typography variant="body2M14" color="gray.70">
          {loading ? '—' : unitLabel}
        </Typography>
      </Stack>
    </Stack>
  ),
)

FundamentalModelTradeSummaryToolbar.displayName = 'FundamentalModelTradeSummaryToolbar'

export default FundamentalModelTradeSummaryToolbar
