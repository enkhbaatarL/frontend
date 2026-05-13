import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'

const PURPLE_SCALE = ['purple1', 'purple2', 'purple3', 'purple4', 'purple5'] as const
const BAR_COUNT = 5

/** 채워진 막대 수(1~5) → 발생가능성 단계 라벨 (낮은 단계=막대 적음) */
const FILLED_BARS_TO_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '매우낮음',
  2: '낮음',
  3: '중간',
  4: '높음',
  5: '매우높음',
}

const tooltipTitleTypographySx = {
  m: 0,
  fontSize: 12,
  lineHeight: 1.4,
  color: 'common.white',
} as const

// probability(0~1)를 채워질 막대 개수(1~5)로 매핑 — 구간 기준 올림: [0~0.2] → 1, [0.2~0.4] → 2, [0.4~0.6] → 3, [0.6~0.8] → 4, [0.8~1] → 5
const probabilityToFilledBars = (probability: number): 1 | 2 | 3 | 4 | 5 => {
  if (!Number.isFinite(probability)) return 1
  const n = Math.min(BAR_COUNT, Math.max(1, Math.ceil(probability * BAR_COUNT)))
  return n as 1 | 2 | 3 | 4 | 5
}

const ProbabilityGaugeTooltipContent = ({ filledBars }: { filledBars: 1 | 2 | 3 | 4 | 5 }) => (
  <Typography component="p" sx={tooltipTitleTypographySx}>
    발생가능성: {FILLED_BARS_TO_LABEL[filledBars]}
  </Typography>
)

const ProbabilityGaugeCell = ({ probability }: { probability: number }) => {
  const theme = useTheme()
  const filledBars = probabilityToFilledBars(probability)
  const color = theme.palette.chart[PURPLE_SCALE[Math.max(filledBars - 1, 0)]]
  return (
    <WorkbenchFollowCursorTooltip title={<ProbabilityGaugeTooltipContent filledBars={filledBars} />}>
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
    </WorkbenchFollowCursorTooltip>
  )
}

export default ProbabilityGaugeCell
