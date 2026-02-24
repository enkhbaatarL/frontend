import { Box, Typography } from '@mui/material'
import { useMemo, useRef } from 'react'

import DataIcon from './icons/DataIcon'

import { formatValue } from '@/utils/number'

const ChartToolTipItem = (props: { label: string; value: number; category: string; color: string; minWidth: number }) => {
  const { value, color, minWidth } = props

  return (
    <Box
      sx={{ width: `${minWidth}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '& svg': { display: 'block' } }}
    >
      <Typography component={'div'} variant="body3M12" color="gray.60" px="4px" py="5px" display={'flex'} alignItems={'center'}>
        <Box mr="6px" color={color ?? 'inherit'}>
          <DataIcon />
        </Box>
        value
      </Typography>
      <Typography variant="body2SB14" color="gray.90">
        {formatValue(value, '', 'en-US', 2)}
      </Typography>
    </Box>
  )
}

export interface MIRigCountChartTooltipProps {
  minWidth: number
  visible?: boolean
  top?: number
  left?: number
  label?: string
  content: { label?: string; value?: number; category?: string; color?: string }[]
  borderBottom: number
  borderRight: number
}

export default function MIRigCountChartTooltip({
  visible,
  top = 0,
  left = 0,
  label,
  content,
  minWidth,
  borderBottom,
  borderRight,
}: Readonly<MIRigCountChartTooltipProps>) {
  const tooltipContainerRef = useRef<HTMLElement>(null)
  const position = useMemo(() => {
    let newTop: number = top

    let newLeft: number = left

    if (tooltipContainerRef.current === null) return { top: newTop, left: newLeft }

    const { clientWidth = 0, clientHeight = 0 } = tooltipContainerRef.current

    if (left + clientWidth > borderRight) {
      newLeft = borderRight - clientWidth
    }

    if (top + clientHeight > borderBottom) {
      newTop = borderBottom - clientHeight
    }

    return {
      top: newTop,
      left: newLeft,
    }
  }, [top, left, tooltipContainerRef.current])

  if (!visible) return null

  return (
    <Box
      ref={tooltipContainerRef}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        pointerEvents: 'none',
        padding: '14px',
        zIndex: 10,
        borderRadius: '4px',
        border: '1px solid #DEE2E6',
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
        boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10);',
      }}
    >
      <Typography variant="body1" color="gray.90" mb="10px">
        {label}
      </Typography>

      {content.map((item) => (
        <ChartToolTipItem
          key={item.label}
          label={item.label ?? ''}
          value={item.value ?? 0}
          category={item.category ?? ''}
          color={item.color ?? ''}
          minWidth={minWidth}
        />
      ))}
    </Box>
  )
}
