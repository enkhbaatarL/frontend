import { Box, Typography } from '@mui/material'
import { useMemo, useRef } from 'react'

import MIButton from '@/components/common/button/MIButton'
import { DATA_CATEGORIES } from '@/components/common/forecast-chart/constants'
import DataIcon from '@/components/common/forecast-chart/icons/DataIcon'
import ForecastErrorIcon from '@/components/common/forecast-chart/icons/ForecastErrorIcon'
import ForecastIcon from '@/components/common/forecast-chart/icons/ForecastIcon'
import CloseIcon from '@/components/common/icons/CloseIcon'
import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import theme from '@/theming'
import { formatValue } from '@/utils/number'

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
        <Box mr="6px" color={color ?? 'inherit'} display={'flex'} alignItems={'center'}>
          {icon}
        </Box>

        {label}
      </Typography>
      {category === DATA_CATEGORIES.FORECAST_ERROR ? (
        <Typography variant="body2M14" color={value > 0 ? '#3C8A36' : '#A9141A'}>
          {value > 0 ? '+' : ''}
          {formatValue(value)}
        </Typography>
      ) : (
        <Typography variant="body2M14" color="gray.70">
          {formatValue(value)}
        </Typography>
      )}
    </Box>
  )
}

export interface MIForecastChartTooltipProps {
  minWidth: number
  visible?: boolean
  viewDetail?: boolean
  isSimple?: boolean
  top?: number
  left?: number
  label?: string
  content: { label?: string; value?: number; category?: string; color?: string }[]
  borderBottom?: number
  borderRight?: number
  onClose?: () => void
}

const MIForecastChartTooltip = ({
  visible,
  viewDetail = false,
  isSimple = false,
  top = 0,
  left = 0,
  label,
  content,
  minWidth,
  borderBottom,
  borderRight,
  onClose,
}: Readonly<MIForecastChartTooltipProps>) => {
  const tooltipContainerRef = useRef<HTMLElement>(null)

  const position = useMemo(() => {
    let newTop: number = top
    let newLeft: number = left

    if (tooltipContainerRef.current === null) return { top: newTop, left: newLeft }

    const { clientWidth = 0, clientHeight = 0 } = tooltipContainerRef.current

    if (borderRight && left + clientWidth > borderRight) {
      newLeft = borderRight - clientWidth
    }

    if (borderBottom && top + clientHeight > borderBottom) {
      newTop = borderBottom - clientHeight
    }

    return {
      top: newTop,
      left: newLeft,
    }
  }, [top, left, borderRight, borderBottom])

  if (!visible) return null

  const futuresContent = content.filter((item) => item.category === DATA_CATEGORIES.FUTURE)
  const dataContent = content.filter((item) => item.category !== DATA_CATEGORIES.FUTURE)

  return (
    <Box
      ref={tooltipContainerRef}
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        pointerEvents: viewDetail ? 'auto' : 'none',
        padding: '8px 16px',
        zIndex: 10,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: viewDetail ? theme.palette.gray[60] : theme.palette.gray[30],
        backgroundColor: viewDetail ? theme.palette.gray[5] : 'rgba(255, 255, 255, 0.90)',
        boxShadow: '0px 1px 8px 0px rgba(0, 0, 0, 0.10);',
        willChange: 'background-color, border-color',
        transition: 'background-color 0.4s ease-in-out, border-color 0.4s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '4px', ml: '4px', height: '32px' }}>
        <Typography variant="subtext3" color="gray.90">
          {label}
        </Typography>
        {viewDetail && (
          <MIButton type="ghost" contentType="icon" size="h32" onClick={onClose}>
            <CloseIcon />
          </MIButton>
        )}
      </Box>

      {dataContent.map((item) => (
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

      {!viewDetail && !isSimple && (
        <Box display={'flex'} alignItems={'center'} padding={'6px 4px'} gap={'4px'} mt={'8px'}>
          <InfoOutlineIcon width="18" height="18" color="#868E96" display={'block'} />
          <Typography variant="subtext2" color="gray.70">
            예측 데이터 포인트 클릭 시 상세 정보 조회
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default MIForecastChartTooltip
