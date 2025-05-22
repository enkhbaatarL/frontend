import { Box, Typography } from '@mui/material'

import { formatPrice } from '@/utils/number'

const ChartToolTipItem = (props: { label: string; value: number; color: string }) => {
  const { label, value, color } = props

  return (
    <Box sx={{ minWidth: '152px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body3M12" color="gray.60">
        {label}
      </Typography>
      <Typography variant="chartToolTipNumber" color={color}>
        {formatPrice(value)}
      </Typography>
    </Box>
  )
}

export default function MIChartTooltip({
  visible,
  top,
  left,
  content,
}: Readonly<{
  visible?: boolean
  top?: number
  left?: number
  content: Record<string, { label?: string; value?: number; color?: string; date: string }>
}>) {
  if (!visible) return null

  const specialKeys = ['mainData', 'MA5', 'MA20', 'MA60', 'MA120', 'Upper BB', 'Lower BB']

  const comparisonItems: Array<{ label?: string; value?: number; color?: string; date: string }> = []

  Object.entries(content).forEach(([key, value]) => {
    if (!specialKeys.includes(key) && value?.label) {
      comparisonItems.push(value)
    }
  })

  const { mainData, MA5, MA20, MA60, MA120 } = content

  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        left,
        pointerEvents: 'none',
        padding: '14px',
        zIndex: 10,
        borderRadius: '4px',
        border: '1px solid #DEE2E6',
        backgroundColor: '#ffffff',
        boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10);',
      }}
    >
      {mainData?.date && (
        <Box mb={'10px'}>
          <Typography variant="chartToolTipTitle" color="gray.90">
            {mainData.date}
          </Typography>
        </Box>
      )}
      {mainData?.value && <ChartToolTipItem label={mainData.label as string} value={mainData.value} color="common.black" />}
      {MA5?.value && <ChartToolTipItem label="MA5" value={MA5.value} color={MA5.color as string} />}
      {MA20?.value && <ChartToolTipItem label="MA20" value={MA20.value} color={MA20.color as string} />}
      {MA60?.value && <ChartToolTipItem label="MA60" value={MA60.value} color={MA60.color as string} />}
      {MA120?.value && <ChartToolTipItem label="MA120" value={MA120.value} color={MA120.color as string} />}

      {comparisonItems.map((item, idx) => {
        if (!item?.value) return null
        return <ChartToolTipItem key={idx} label={item.label as string} value={item.value} color={item.color as string} />
      })}
    </Box>
  )
}
