import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'

import type { ScenarioRole } from '@/service/mi/nextGenMI/scenarioGroup'

type ScenarioRoleBadgeKind = 'BR' | 'BL' | 'MX'

const ROLE_TO_BADGE_KIND: Record<ScenarioRole, ScenarioRoleBadgeKind> = {
  ceiling: 'BL',
  floor: 'BR',
  mixed: 'MX',
}

const LABEL_TO_BADGE_KIND: Record<string, ScenarioRoleBadgeKind> = {
  br: 'BR',
  bl: 'BL',
  mx: 'MX',
  ceiling: 'BL',
  floor: 'BR',
  mixed: 'MX',
  상단: 'BL',
  하단: 'BR',
  혼합: 'MX',
}

const SCENARIO_ROLE_BADGE_STYLE: Record<ScenarioRoleBadgeKind, { label: string; color: string; borderColor: string; icon: ReactNode }> = {
  BR: {
    label: 'BR',
    color: '#CC4D50',
    borderColor: '#CC4D50',
    icon: <TrendingDownRoundedIcon sx={{ width: '14px', height: '14px', fontSize: '14px', color: 'inherit' }} />,
  },
  BL: {
    label: 'BL',
    color: '#498B47',
    borderColor: '#498B47',
    icon: <TrendingUpRoundedIcon sx={{ width: '14px', height: '14px', fontSize: '14px', color: 'inherit' }} />,
  },
  MX: {
    label: 'MX',
    color: '#868E96',
    borderColor: '#868E96',
    icon: <SwapVertRoundedIcon sx={{ width: '14px', height: '14px', fontSize: '14px', color: 'inherit' }} />,
  },
}

const resolveBadgeKind = ({
  role,
  type,
  label,
}: {
  role?: ScenarioRole | string | null
  type?: string | null
  label?: string | null
}): ScenarioRoleBadgeKind | null => {
  const candidates = [type, role, label]
  for (const candidate of candidates) {
    const normalized = candidate?.trim()
    if (!normalized) continue

    const upper = normalized.toUpperCase()
    if (upper === 'BR' || upper === 'BL' || upper === 'MX') return upper

    const lower = normalized.toLowerCase()
    if (lower === 'ceiling' || lower === 'floor' || lower === 'mixed') return ROLE_TO_BADGE_KIND[lower]
    if (LABEL_TO_BADGE_KIND[normalized] || LABEL_TO_BADGE_KIND[lower]) {
      return LABEL_TO_BADGE_KIND[normalized] ?? LABEL_TO_BADGE_KIND[lower]
    }
  }

  return null
}

export const ScenarioRoleBadge = ({
  role,
  type,
  label,
}: {
  role?: ScenarioRole | string | null
  type?: string | null
  label?: string | null
}) => {
  const kind = resolveBadgeKind({ role, type, label })
  if (!kind) return null

  const style = SCENARIO_ROLE_BADGE_STYLE[kind]

  return (
    <Stack
      component="span"
      display="inline-flex"
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap="2px"
      height="20px"
      padding="0 6px"
      lineHeight={0}
      borderRadius="8px"
      bgcolor="commonColor.White"
      color={style.color}
      boxSizing="border-box"
      flexShrink={0}
      sx={{
        position: 'relative',
        verticalAlign: 'middle',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          border: `1px solid ${style.borderColor}`,
          borderRadius: 'inherit',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        },
      }}
    >
      {style.icon}
      <Typography component="span" color="inherit" fontSize="12px" fontWeight={600} lineHeight={1.4} noWrap>
        {style.label}
      </Typography>
    </Stack>
  )
}

export default ScenarioRoleBadge
