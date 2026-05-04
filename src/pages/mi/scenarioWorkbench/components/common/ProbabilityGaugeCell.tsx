import { Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const PURPLE_SCALE = ['purple1', 'purple2', 'purple3', 'purple4', 'purple5'] as const

const ProbabilityGaugeCell = ({ level }: { level: number }) => {
  const theme = useTheme()
  const color = theme.palette.chart[PURPLE_SCALE[Math.max(level - 1, 0)]]
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" height={22}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < level
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
