import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

import KpiCard from '@/pages/mi/scenarioWorkbench/components/common/KpiCard'
import { KeyPrediction, KeyPredictionDirection } from '@/pages/mi/scenarioWorkbench/components/scenario/types'

interface DirectionalValueProps {
  direction: Exclude<KeyPredictionDirection, 'none'>
  value: string
}

const DirectionalValue = ({ direction, value }: DirectionalValueProps) => {
  const toneColor = direction === 'up' ? 'increase.main' : 'decrease.main'
  const Icon = direction === 'up' ? ArrowUpwardIcon : ArrowDownwardIcon
  return (
    <Stack direction="row" alignItems="center" gap={direction === 'up' ? '2px' : '4px'}>
      <Icon sx={{ fontSize: '30px', color: toneColor }} />
      <Typography variant="titleBox" sx={{ color: toneColor, lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Stack>
  )
}

const renderContent = (prediction: KeyPrediction): string | ReactNode => {
  const direction = prediction.direction ?? 'none'
  if (direction === 'none') return prediction.value
  return <DirectionalValue direction={direction} value={prediction.value} />
}

interface ScenarioKeyPredictionsSectionProps {
  keyPredictions: KeyPrediction[]
}

const ScenarioKeyPredictionsSection = ({ keyPredictions }: ScenarioKeyPredictionsSectionProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    }}
  >
    {keyPredictions.map((prediction, index) => (
      <Box key={index} sx={{ opacity: prediction.hidden ? 0 : 1 }}>
        <KpiCard title={prediction.title} content={renderContent(prediction)} description={prediction.description ?? ''} />
      </Box>
    ))}
  </Box>
)

export default ScenarioKeyPredictionsSection
