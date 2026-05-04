import { Box, Stack } from '@mui/material'

import type { PriceDirection } from '@/pages/mi/scenarioWorkbench/components/scenario/types'

import PriceDirectionIcon from '@/pages/mi/scenarioWorkbench/components/common/PriceDirectionIcon'

export interface ImpactDotsCellProps {
  level: number
  size?: number
  direction?: PriceDirection
}

const filledDotCount = (level: number): number => {
  if (level <= 0) return 0
  if (level === 1) return 1
  if (level === 2) return 2
  return 3
}

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

const ImpactDotsRow = ({ level, size }: { level: number; size: number }) => {
  const n = filledDotCount(level)
  const emptyBorderMuted = n === 0
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" height={22}>
      {[0, 1, 2].map((i) => {
        const filled = i < n
        const fillCol = filled ? filledColorForLevel(n, i) : undefined
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
      <ImpactDotsRow level={level} size={dotSize} />
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
