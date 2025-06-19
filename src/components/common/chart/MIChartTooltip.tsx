import { Box, Divider, Typography } from '@mui/material'
import { Fragment, ReactNode, forwardRef } from 'react'

import { formatValue } from '@/utils/number'

const ChartToolTipItem = (props: { label: ReactNode; value?: number; color: string }) => {
  const { label, value, color } = props

  return (
    <Box sx={{ minWidth: '152px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
      <Typography variant="body3M12" color="gray.60" noWrap>
        {label}
      </Typography>
      <Typography variant="chartToolTipNumber" color={value === undefined ? undefined : color}>
        {value === undefined ? '-' : formatValue(value)}
      </Typography>
    </Box>
  )
}

interface MIChartTooltipProps {
  visible?: boolean
  top?: number
  left?: number
  content: Record<string, { label?: string; value?: number; color?: string; date: string; hasDivider?: boolean }>
}

const MIChartTooltip = forwardRef<HTMLDivElement, Readonly<MIChartTooltipProps>>(({ visible, top, left, content }, ref) => {
  if (!visible) return null

  const items: Array<{ label?: string; value?: number; color?: string; date: string; hasDivider?: boolean }> = []

  Object.entries(content).forEach(([, value]) => {
    items.push(value)
  })

  if (items.length === 0) return null

  return (
    <Box
      ref={ref}
      sx={{
        position: 'absolute',
        top,
        left,
        pointerEvents: 'none',
        padding: '14px',
        zIndex: 1000,
        borderRadius: '4px',
        border: '1px solid #DEE2E6',
        backgroundColor: '#ffffff',
        boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10);',
      }}
    >
      <Box mb={'10px'}>
        <Typography variant="chartToolTipTitle" color="gray.90">
          {items[0]?.date || '-'}
        </Typography>
      </Box>
      {items.map((item, idx) => (
        <Fragment key={idx}>
          {item.hasDivider && <Divider sx={{ my: '8px', borderColor: '#DEE2E6' }} />}
          <ChartToolTipItem label={item.label as string} value={item.value} color={item.color as string} />
        </Fragment>
      ))}
    </Box>
  )
})

MIChartTooltip.displayName = 'MIChartTooltip'

export default MIChartTooltip
