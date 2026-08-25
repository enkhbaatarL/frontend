import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'

import type { ScenarioDesignScenarioType } from '@/service/mi/nextGenMI/scenarioDesign'

import MIFollowCursorTooltip from '@/components/common/table/MIFollowCursorTooltip'

type ScenarioDesignTypeBadgeKind = ScenarioDesignScenarioType | 'BC'

const SCENARIO_DESIGN_TYPE_BADGE_STYLE: Record<
  ScenarioDesignTypeBadgeKind,
  { label: string; color: string; borderColor: string; bgcolor: string; icon: ReactNode }
> = {
  BR: {
    label: 'BR',
    color: '#498B47',
    borderColor: '#498B47',
    bgcolor: 'commonColor.White',
    icon: <TrendingUpRoundedIcon sx={{ fontSize: '14px', color: 'inherit' }} />,
  },
  BL: {
    label: 'BL',
    color: '#CC4D50',
    borderColor: '#CC4D50',
    bgcolor: 'commonColor.White',
    icon: <TrendingDownRoundedIcon sx={{ fontSize: '14px', color: 'inherit' }} />,
  },
  MX: {
    label: 'MX',
    color: '#868E96',
    borderColor: '#868E96',
    bgcolor: 'commonColor.White',
    icon: <SwapVertRoundedIcon sx={{ fontSize: '14px', color: 'inherit' }} />,
  },
  BC: {
    label: 'BC',
    color: 'contentText.White',
    borderColor: 'mari.Primary',
    bgcolor: 'mari.Primary',
    icon: null,
  },
}

export const ScenarioDesignTypeBadge = ({ type, reason }: { type: ScenarioDesignTypeBadgeKind; reason?: string | null }) => {
  if (!type) return null

  const style = SCENARIO_DESIGN_TYPE_BADGE_STYLE[type]
  if (!style) return null

  const badge = (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap="2px"
      height="20px"
      padding="2px 6px"
      border="1px solid"
      borderColor={style.borderColor}
      borderRadius="8px"
      bgcolor={style.bgcolor}
      color={style.color}
      boxSizing="border-box"
      flexShrink={0}
      sx={{ verticalAlign: 'middle' }}
    >
      {style.icon}
      <Typography component="span" color="inherit" fontSize="12px" fontWeight={600} lineHeight={1.4} noWrap>
        {style.label}
      </Typography>
    </Stack>
  )

  const tooltipTitle = reason?.trim()
  if (!tooltipTitle) return badge

  return <MIFollowCursorTooltip title={tooltipTitle}>{badge}</MIFollowCursorTooltip>
}

export default ScenarioDesignTypeBadge
