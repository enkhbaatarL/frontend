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
import { Directionality } from '@/service/mi/dashboard'

export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW'

interface Props {
  directionality: Directionality
  impactScore: number
}

const getDirectionalIconSrc = (directionality: Directionality, impactLevel: ImpactLevel) => {
  if (directionality === Directionality.Upward) {
    if (impactLevel === 'HIGH') return positiveHighIcon
    if (impactLevel === 'MEDIUM') return positiveMediumIcon
    return positiveLowIcon
  }
  if (directionality === Directionality.Downward) {
    if (impactLevel === 'HIGH') return negativeHighIcon
    if (impactLevel === 'MEDIUM') return negativeMediumIcon
    return negativeLowIcon
  }
  if (directionality === Directionality.Neutral) {
    if (impactLevel === 'HIGH') return neutralHighIcon
    if (impactLevel === 'MEDIUM') return neutralMediumIcon
    return neutralLowIcon
  }

  return null
}

const getImpactLevel = (impactScore: number): ImpactLevel => {
  if (impactScore >= 9) return 'HIGH'
  if (impactScore >= 7) return 'MEDIUM'
  return 'LOW'
}

const DirectionalIcon = ({ directionality, impactScore }: Props) => {
  const icon = getDirectionalIconSrc(directionality, getImpactLevel(impactScore))

  return icon && <Box component="img" src={icon} alt={directionality} />
}

export default DirectionalIcon
