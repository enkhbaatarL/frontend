import { KeyboardArrowDownRounded } from '@mui/icons-material'
import { Button, Stack } from '@mui/material'
import { useMemo, useState } from 'react'

import type { FundamentalModelScopeKey } from '@/pages/mi/fundamentalModel/fundamentalModelTypes'

import MISelectMenu, { type SelectMenuItem } from '@/components/common/menu/MISelectMenu'

export interface FundamentalModelSegmentToolbarProps {
  loading?: boolean
  scope: FundamentalModelScopeKey
  onScopeChange: (scope: FundamentalModelScopeKey) => void
}

const SCOPE_VALUES: FundamentalModelScopeKey[] = ['global', 'lng', 'trade']

/** Volume 탭 상단 Global/LNG/Trade 및 Filters - 주기 툴바 */
const FundamentalModelSegmentToolbar = ({ loading = false, scope, onScopeChange }: FundamentalModelSegmentToolbarProps) => {
  const [period, setPeriod] = useState('monthly')

  const periodItems: SelectMenuItem<string>[] = useMemo(
    () => [
      { value: 'monthly', label: '월간' },
      { value: 'quarterly', label: '분기' },
    ],
    [],
  )

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
                color: 'gray.90',
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
        <Button
          variant="outlined"
          endIcon={<KeyboardArrowDownRounded sx={{ color: 'gray.60' }} />}
          sx={{
            height: 40,
            borderRadius: '10px',
            borderColor: 'content.borderEnabled',
            color: 'gray.70',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            px: '12px',
          }}
        >
          필터
        </Button>
        <MISelectMenu
          variant="outlined"
          selected={period}
          onSelected={(v: string) => setPeriod(v)}
          items={periodItems}
          sx={{
            height: 40,
            borderRadius: '10px',
            borderColor: 'content.borderEnabled',
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
