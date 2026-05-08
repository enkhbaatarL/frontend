import { Box, Stack } from '@mui/material'

import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'
import { MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'

export interface ImpactDotsCellProps {
  level: MarketImpactLevel | undefined
  size?: number
  direction?: MarketDirection
}

// MarketImpactLevel → 채워질 dot 개수: LOW=0, MEDIUM=1, HIGH=2, EXTREME=3
const LEVEL_TO_DOTS: Record<MarketImpactLevel, number> = {
  [MarketImpactLevel.LOW]: 0,
  [MarketImpactLevel.MEDIUM]: 1,
  [MarketImpactLevel.HIGH]: 2,
  [MarketImpactLevel.EXTREME]: 3,
}

const filledDotCount = (level: MarketImpactLevel | undefined): number => (level ? (LEVEL_TO_DOTS[level] ?? 0) : 0)

const filledColorForLevel = (filledCount: number, index: number): string | undefined => {
  const filled = index < filledCount
  if (!filled) return undefined
  if (filledCount === 1) return '#868E96'
  if (filledCount === 2) return '#444D7A'
  return '#364FC7'
}

const ImpactDot = ({ filled, emptyBorderMuted, size }: { filled: boolean; emptyBorderMuted: boolean; size: number }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      boxSizing: 'border-box',
      ...(filled
        ? { bgcolor: 'currentColor', border: 'none' }
        : {
          bgcolor: 'transparent',
          border: '1.5px solid',
          borderColor: emptyBorderMuted ? '#ADB5BD' : '#CED4DA',
        }),
    }}
  />
)

const ImpactDotsRow = ({ filledCount, size }: { filledCount: number; size: number }) => {
  const emptyBorderMuted = filledCount === 0
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" height={22}>
      {[0, 1, 2].map((i) => {
        const filled = i < filledCount
        const fillCol = filled ? filledColorForLevel(filledCount, i) : undefined
        return (
          <Box key={i} sx={{ color: fillCol ?? 'transparent', lineHeight: 0, display: 'flex' }}>
            <ImpactDot filled={filled} emptyBorderMuted={emptyBorderMuted} size={size} />
          </Box>
        )
      })}
    </Stack>
  )
}

const COMPACT_DOT_SIZE_WITH_DIRECTION = 8
const COMPACT_DIRECTION_ICON_SIZE = 12

/** 시장 영향 3-dot 표현 */
const ImpactDotsCell = ({ level, size = 10, direction }: ImpactDotsCellProps) => {
  const withDirection = direction !== undefined
  const dotSize = withDirection ? COMPACT_DOT_SIZE_WITH_DIRECTION : size
  const filledCount = filledDotCount(level)
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      sx={{
        width: withDirection ? 'fit-content' : '100%',
        maxWidth: '100%',
        alignSelf: 'center',
        height: 22,
        gap: withDirection ? '4px' : 0,
      }}
    >
      <ImpactDotsRow filledCount={filledCount} size={dotSize} />
      {withDirection && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width={COMPACT_DIRECTION_ICON_SIZE}
          height={COMPACT_DIRECTION_ICON_SIZE}
          flexShrink={0}
        >
          <PriceDirectionIcon direction={direction} size={COMPACT_DIRECTION_ICON_SIZE} />
        </Box>
      )}
    </Stack>
  )
}

export default ImpactDotsCell
