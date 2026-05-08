import { Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const PURPLE_SCALE = ['purple1', 'purple2', 'purple3', 'purple4', 'purple5'] as const
const BAR_COUNT = 5

// probability(0~1)를 채워질 막대 개수(1~5)로 매핑 — 구간 기준 올림: [0~0.2] → 1, [0.2~0.4] → 2, [0.4~0.6] → 3, [0.6~0.8] → 4, [0.8~1] → 5
const probabilityToFilledBars = (probability: number): number => {
  if (!Number.isFinite(probability)) return 1
  return Math.min(BAR_COUNT, Math.max(1, Math.ceil(probability * BAR_COUNT)))
}

const ProbabilityGaugeCell = ({ probability }: { probability: number }) => {
  const theme = useTheme()
  const filledBars = probabilityToFilledBars(probability)
  const color = theme.palette.chart[PURPLE_SCALE[Math.max(filledBars - 1, 0)]]
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" height={22}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < filledBars
        return (
          <Box
            key={i}
            sx={{
              width: 4,
              height: 14,
              borderRadius: '100px',
              bgcolor: filled ? color : theme.palette.commonColor.White,
              boxShadow: filled ? 'none' : `inset 0 0 0 1px ${color}`,
            }}
          />
        )
      })}
    </Stack>
  )
}

export default ProbabilityGaugeCell
