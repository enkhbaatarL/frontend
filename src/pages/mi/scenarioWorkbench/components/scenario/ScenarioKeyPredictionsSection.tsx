import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

import KpiCard from '../KpiCard'
import { KeyPrediction, KeyPredictionDirection } from './types'

interface DirectionalValueProps {
  direction: Exclude<KeyPredictionDirection, 'none'>
  value: string
}

const DirectionalValue = ({ direction, value }: DirectionalValueProps) => {
  const color = direction === 'up' ? '#498B47' : '#CC4D50'
  const Icon = direction === 'up' ? ArrowUpwardIcon : ArrowDownwardIcon
  return (
    <Stack direction="row" alignItems="center" gap={direction === 'up' ? '2px' : '4px'}>
      <Icon sx={{ fontSize: 30, color }} />
      <Typography sx={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.4 }}>{value}</Typography>
    </Stack>
  )
}

const renderContent = (prediction: KeyPrediction): string | ReactNode => {
  const direction = prediction.direction ?? 'none'
  if (direction === 'none') return prediction.value
  return <DirectionalValue direction={direction} value={prediction.value} />
}

interface ScenarioKeyPredictionsSectionProps {
  predictions: KeyPrediction[]
}

const ScenarioKeyPredictionsSection = ({ predictions }: ScenarioKeyPredictionsSectionProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
    }}
  >
    {predictions.map((prediction, index) => (
      <Box key={index} sx={{ opacity: prediction.hidden ? 0 : 1 }}>
        <KpiCard title={prediction.title} content={renderContent(prediction)} description={prediction.description ?? ''} />
      </Box>
    ))}
  </Box>
)

export default ScenarioKeyPredictionsSection
