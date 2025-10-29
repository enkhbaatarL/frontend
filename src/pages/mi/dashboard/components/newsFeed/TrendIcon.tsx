import { Box } from '@mui/material'

import negativeHighIcon from '@/assets/icons/sentiment-negative-high.svg'
import negativeLowIcon from '@/assets/icons/sentiment-negative-low.svg'
import negativeMediumIcon from '@/assets/icons/sentiment-negative-medium.svg'
import neutralHighIcon from '@/assets/icons/sentiment-neutral-high.svg'
import neutralLowIcon from '@/assets/icons/sentiment-neutral-low.svg'
import neutralMediumIcon from '@/assets/icons/sentiment-neutral-medium.svg'
import positiveHighIcon from '@/assets/icons/sentiment-positive-high.svg'
import positiveLowIcon from '@/assets/icons/sentiment-positive-low.svg'
import positiveMediumIcon from '@/assets/icons/sentiment-positive-medium.svg'
import { DirectionType } from '@/service/mi/dashboard'

interface Props {
  sentiment: DirectionType
  impact: string // 'HIGH' | 'MEDIUM' | 'LOW'
}

const getTrendIconSrc = (trend: string, impact: string) => {
  if (trend === DirectionType.Upward) {
    if (impact === 'HIGH') return positiveHighIcon
    if (impact === 'MEDIUM') return positiveMediumIcon
    return positiveLowIcon
  }
  if (trend === DirectionType.Downward) {
    if (impact === 'HIGH') return negativeHighIcon
    if (impact === 'MEDIUM') return negativeMediumIcon
    return negativeLowIcon
  }
  if (trend === DirectionType.Neutral) {
    if (impact === 'HIGH') return neutralHighIcon
    if (impact === 'MEDIUM') return neutralMediumIcon
    return neutralLowIcon
  }

  return null
}

const TrendIcon = ({ sentiment, impact }: Props) => {
  const icon = getTrendIconSrc(sentiment, impact)

  return icon && <Box component="img" src={icon} alt={sentiment} />
}

export default TrendIcon
