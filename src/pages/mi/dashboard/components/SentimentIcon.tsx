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

interface Props {
  sentiment: string //'positive' | 'negative' | 'neutral'
  impact: string //'high' | 'medium' | 'low'
}

const getSentimentIcon = (sentiment: string, impact: string) => {
  if (sentiment === 'positive') {
    if (impact === 'high') return positiveHighIcon
    if (impact === 'medium') return positiveMediumIcon
    return positiveLowIcon
  }
  if (sentiment === 'negative') {
    if (impact === 'high') return negativeHighIcon
    if (impact === 'medium') return negativeMediumIcon
    return negativeLowIcon
  }
  if (sentiment === 'neutral') {
    if (impact === 'high') return neutralHighIcon
    if (impact === 'medium') return neutralMediumIcon
    return neutralLowIcon
  }

  return null
}

const SentimentIcon = ({ sentiment, impact }: Props) => {
  const icon = getSentimentIcon(sentiment, impact)

  return icon && <Box component="img" src={icon} alt={sentiment} />
}

export default SentimentIcon
