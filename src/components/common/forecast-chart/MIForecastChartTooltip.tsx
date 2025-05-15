import { Box, Typography } from '@mui/material'
import { useMemo, useRef } from 'react'

import { DATA_CATEGORIES } from './constants'
import DataIcon from './icons/DataIcon'
import ForecastErrorIcon from './icons/ForecastErrorIcon'
import ForecastIcon from './icons/ForecastIcon'

import theme from '@/theming'
import { formatPrice } from '@/utils/number'

const ChartToolTipItem = (props: { label: string; value: number; category: string; color: string; minWidth: number }) => {
  const { label, value, category, color, minWidth } = props

  const icon = useMemo(() => {
    switch (category) {
      case DATA_CATEGORIES.FORECAST:
        return <ForecastIcon />
      case DATA_CATEGORIES.FORECAST_ERROR:
        return <ForecastErrorIcon />
      default:
        return <DataIcon />
    }
  }, [category])

  return (
    <Box sx={{ minWidth: `${minWidth}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography component={'div'} variant="body2M14" color="gray.70" px="4px" py="5px" display={'flex'} alignItems={'center'}>
        <Box mr="6px" color={color ?? 'inherit'}>
          {icon}
        </Box>

        {label}
      </Typography>
      {category === DATA_CATEGORIES.FORECAST_ERROR ? (
        <Typography variant="body2M14" color={value > 0 ? '#3C8A36' : '#A9141A'}>
          {value > 0 ? '+' : ''}
          {formatPrice(value)}
        </Typography>
      ) : (
        <Typography variant="body2M14" color="gray.70">
          {formatPrice(value)}
        </Typography>
      )}
    </Box>
  )
}

export interface MIForecastChartTooltipProps {
  minWidth: number
  visible?: boolean
  top?: number
  left?: number
  label?: string
  content: { label?: string; value?: number; category?: string; color?: string }[]
  borderBottom: number
  borderRight: number
}

export default function MIForecastChartTooltip({
  visible,
  top = 0,
  left = 0,
  label,
  content,
  minWidth,
  borderBottom,
  borderRight,
}: MIForecastChartTooltipProps) {
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

  const futuresContent = content.filter((item) => item.category === DATA_CATEGORIES.FUTURE)
  const actualContent = content.filter((item) => item.category !== DATA_CATEGORIES.FUTURE)

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
      <Typography variant="subtext3" color="gray.90" mb="8px">
        {label}
      </Typography>
      {actualContent.map((item) => (
        <ChartToolTipItem
          minWidth={minWidth}
          key={item.label}
          label={item.label ?? ''}
          value={item.value ?? 0}
          category={item.category ?? ''}
          color={item.color ?? ''}
        />
      ))}
      {futuresContent.length > 0 && <Box sx={{ background: theme.palette.gray[30], width: '100%', height: '1px' }} my="2px" />}

      {futuresContent.map((item) => (
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
