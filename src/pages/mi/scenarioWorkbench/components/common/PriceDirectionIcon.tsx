import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { marketDirectionToLabel } from '@/pages/mi/scenarioWorkbench/components/common/scenarioDisplay'
import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'
import { MarketDirection } from '@/service/mi/scenarioWorkbench/common'

export interface PriceDirectionIconProps {
  direction?: MarketDirection
  size?: number
}

const TRIANGLE_PATH =
  'M6.73512 0.153916C6.91599 0.25727 7.06589 0.407168 7.16924 0.588038L12.1589 9.31988C12.4785 9.87932 12.2842 10.592 11.7247 10.9117C11.5485 11.0124 11.3489 11.0654 11.1459 11.0654H1.16667C0.522334 11.0654 0 10.543 0 9.89871C0 9.69568 0.0529845 9.49616 0.153716 9.31988L5.14334 0.588038C5.46302 0.0286005 6.17568 -0.165762 6.73512 0.153916Z'

const PriceDirectionIcon = ({ direction, size = 14 }: PriceDirectionIconProps) => {
  const theme = useTheme()

  if (!direction) {
    return <Box sx={{ width: size, height: size }} aria-hidden />
  }

  if (direction === MarketDirection.NEGLIGIBLE) {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
        <rect x="2" y="6.5" width="10" height="1.5" rx="0.75" fill={theme.palette.gray[50]} />
      </svg>
    )
  }

  const isUp = direction === MarketDirection.BULLISH
  const color = isUp ? theme.palette.increase.main : theme.palette.decrease.main
  return (
    <svg width={size} height={size} viewBox="0 0 13 12" fill="none" aria-hidden style={isUp ? undefined : { transform: 'rotate(180deg)' }}>
      <path fillRule="evenodd" clipRule="evenodd" d={TRIANGLE_PATH} fill={color} />
    </svg>
  )
}

const priceDirectionTooltipTitleSx = {
  m: 0,
  fontSize: 12,
  lineHeight: 1.4,
  color: 'common.white',
}

/** 가격 방향 아이콘 + 시장영향 셀과 동일한 커서 추적 툴팁 */
export const PriceDirectionIconWithTooltip = ({ direction, size = 14 }: PriceDirectionIconProps) => {
  const label = direction !== undefined ? marketDirectionToLabel(direction) : '-'
  return (
    <WorkbenchFollowCursorTooltip
      title={
        <Typography component="p" sx={priceDirectionTooltipTitleSx}>
          가격 방향: {label}
        </Typography>
      }
    >
      <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', height: '100%', minHeight: size }}>
        <PriceDirectionIcon direction={direction} size={size} />
      </Stack>
    </WorkbenchFollowCursorTooltip>
  )
}

export default PriceDirectionIcon
