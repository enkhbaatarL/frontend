import { Box, Stack } from '@mui/material'

export interface ImpactDotsCellProps {
  level: number
  size?: number
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

/** 시장 영향 3-dot 표현 (Figma MI/ Events/ Table/ Row/Market Impact) */
const ImpactDotsCell = ({ level, size = 10 }: ImpactDotsCellProps) => (
  <Stack direction="row" alignItems="center" justifyContent="center" width="100%" height={22}>
    <ImpactDotsRow level={level} size={size} />
  </Stack>
)

export default ImpactDotsCell
