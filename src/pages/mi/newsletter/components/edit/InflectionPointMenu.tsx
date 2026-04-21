import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Stack, Switch, Typography, useTheme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import type { IRelatedNewsEventItem } from '@/service/mi/newsletter'

import HideChartIcon from '@/components/common/icons/HideChartIcon'
import MIMenu from '@/components/common/menu/MIMenu'
import MISlidingSegmented from '@/components/common/segmentedbtn/MISlidingSegmented'

const TREND_OPTIONS = [
  { value: 'UP' as const, label: '상승' },
  { value: 'NONE' as const, label: '중립' },
  { value: 'DOWN' as const, label: '하강' },
] as const

export type InflectionTrend = NonNullable<IRelatedNewsEventItem['trend']>

interface InflectionPointMenuProps {
  showInChart: boolean
  trend: InflectionTrend
  onShowInChartChange: (value: boolean) => void
  onTrendChange: (value: 'UP' | 'NONE' | 'DOWN') => void
  /** `fieldDefs.showInChart.editable === false` 등 */
  disabled?: boolean
}

const InflectionPointMenu = ({ showInChart, trend, onShowInChartChange, onTrendChange, disabled = false }: InflectionPointMenuProps) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const handleSwitchChange = (checked: boolean) => {
    onShowInChartChange(checked)
    if (checked && (trend === '' || trend === undefined)) onTrendChange('NONE')
  }

  const icon = useMemo(() => {
    if (!showInChart) {
      const iconColor = theme.palette.contentIcon.Enabled
      return (
        <Box component="span" display="inline-flex" color={iconColor}>
          <HideChartIcon fontSize="small" iconColor={iconColor} />
        </Box>
      )
    }

    switch (trend) {
      case 'UP':
        return <TrendingUpRoundedIcon fontSize="small" />
      case 'DOWN':
        return <TrendingDownRoundedIcon fontSize="small" />
      default: // NONE
        return <TrendingFlatRoundedIcon fontSize="small" />
    }
  }, [showInChart, trend, theme])

  return (
    <MIMenu
      variant="outlined"
      label={icon}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      paperProps={{
        style: { minWidth: 200, padding: '10px 6px' },
      }}
      style={{ padding: '8px 10px' }}
      enableHoverBackground
    >
      <Stack gap="0">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px="8px"
          py="8px"
          borderRadius="4px"
          sx={{ '&:hover': { bgcolor: 'transparent' } }}
        >
          <Stack direction="row" alignItems="center" gap="6px">
            <ShowChartRoundedIcon sx={{ fontSize: 20, color: 'contentText.Normal' }} />
            <Typography variant="body2SB14" color="contentText.Normal">
              차트 표기
            </Typography>
          </Stack>
          <Switch checked={showInChart} onChange={(_, checked) => handleSwitchChange(checked)} size="small" disabled={disabled} />
        </Stack>

        <Stack py="4px" width="100%">
          <MISlidingSegmented
            options={TREND_OPTIONS}
            value={trend === 'UP' || trend === 'NONE' || trend === 'DOWN' ? trend : 'NONE'}
            onChange={(v) => onTrendChange(v as 'UP' | 'NONE' | 'DOWN')}
            disabled={disabled || !showInChart}
            bgcolor={showInChart ? 'gray.20' : 'contentBG.Disabled'}
          />
        </Stack>
      </Stack>
    </MIMenu>
  )
}

export default InflectionPointMenu
