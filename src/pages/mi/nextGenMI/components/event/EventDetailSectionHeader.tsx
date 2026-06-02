import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { Stack, Typography } from '@mui/material'
import { ReactNode, useId } from 'react'

import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'

interface EventDetailSectionHeaderProps {
  icon: ReactNode
  title: string
  tooltipTitle?: string
  /** AI Insights 섹션 - 타이틀|아이콘 그라데이션 */
  titleGradient?: boolean
}

const AI_INSIGHTS_HEADER_GRADIENT =
  'linear-gradient(259.38deg, rgba(0, 102, 255, 0) 8.47%, rgba(123, 71, 255, 0.5) 101.97%), linear-gradient(118.82deg, rgb(0, 151, 232) 24.329%, rgb(42, 49, 191) 70.711%)'

const aiInsightsTitleGradientSx = {
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.4,
  backgroundImage: AI_INSIGHTS_HEADER_GRADIENT,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
} as const

const AiInsightsGradientIcon = () => {
  const gradientId = useId().replace(/:/g, '')

  return (
    <>
      <svg width={0} height={0} aria-hidden style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="24.33%" stopColor="#0097E8" />
            <stop offset="70.71%" stopColor="#2A31BF" />
          </linearGradient>
        </defs>
      </svg>
      <AutoAwesomeRoundedIcon sx={{ fontSize: 30, fill: `url(#${gradientId})` }} />
    </>
  )
}

const BoxIconWrap = ({ children }: { children: ReactNode }) => (
  <Stack width={30} height={30} alignItems="center" justifyContent="center" flexShrink={0}>
    {children}
  </Stack>
)

const EventDetailSectionHeader = ({ icon, title, tooltipTitle, titleGradient = false }: EventDetailSectionHeaderProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
    <Stack direction="row" alignItems="center" gap={0.75}>
      <BoxIconWrap>{titleGradient ? <AiInsightsGradientIcon /> : icon}</BoxIconWrap>
      <Typography
        sx={titleGradient ? aiInsightsTitleGradientSx : { color: 'contentText.Black', fontSize: 20, fontWeight: 600, lineHeight: 1.4 }}
      >
        {title}
      </Typography>
      {tooltipTitle !== undefined ? <InfoTooltip title={tooltipTitle} /> : null}
    </Stack>
    <Stack width={36} height={36} flexShrink={0} />
  </Stack>
)

export default EventDetailSectionHeader
