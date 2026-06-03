import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { Stack, Typography } from '@mui/material'

import type { ReactNode } from 'react'

import RotatingGradientClip from '@/components/common/gradient/RotatingGradientClip'
import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'

interface EventDetailSectionHeaderProps {
  icon: ReactNode
  title: string
  tooltipTitle?: string
  /** AI Insights 섹션 - 타이틀|아이콘 그라데이션 */
  titleGradient?: boolean
}

const AI_INSIGHTS_AUTO_AWESOME_MASK_IMAGE =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27black%27 d=%27m19.46 8 .79-1.75L22 5.46c.39-.18.39-.73 0-.91l-1.75-.79L19.46 2c-.18-.39-.73-.39-.91 0l-.79 1.75-1.76.79c-.39.18-.39.73 0 .91l1.75.79.79 1.76c.18.39.74.39.92 0M11.5 9.5 9.91 6c-.35-.78-1.47-.78-1.82 0L6.5 9.5 3 11.09c-.78.36-.78 1.47 0 1.82l3.5 1.59L8.09 18c.36.78 1.47.78 1.82 0l1.59-3.5 3.5-1.59c.78-.36.78-1.47 0-1.82zm7.04 6.5-.79 1.75-1.75.79c-.39.18-.39.73 0 .91l1.75.79.79 1.76c.18.39.73.39.91 0l.79-1.75 1.76-.79c.39-.18.39-.73 0-.91l-1.75-.79-.79-1.76c-.18-.39-.74-.39-.92 0%27/%3E%3C/svg%3E")'

const aiInsightsTitleGradientSx = {
  display: 'inline-block',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.4,
} as const

const aiInsightsDiscIconSx = {
  width: '30px',
  height: '30px',
  lineHeight: 0,
  filter: 'drop-shadow(0 0 6px rgba(0, 151, 232, 0.18))',
} as const

const BoxIconWrap = ({ children }: { children: ReactNode }) => (
  <Stack width="30px" height="30px" alignItems="center" justifyContent="center" flexShrink={0}>
    {children}
  </Stack>
)

const AiInsightsTitleIcon = () => (
  <RotatingGradientClip maskImage={AI_INSIGHTS_AUTO_AWESOME_MASK_IMAGE} maskSize="30px 30px" sx={aiInsightsDiscIconSx} aria-hidden>
    <AutoAwesomeRoundedIcon sx={{ fontSize: '30px' }} />
  </RotatingGradientClip>
)

const AiInsightsTitle = ({ title }: { title: string }) => (
  <RotatingGradientClip sx={aiInsightsTitleGradientSx}>{title}</RotatingGradientClip>
)

const EventDetailSectionHeader = ({ icon, title, tooltipTitle, titleGradient = false }: EventDetailSectionHeaderProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
    <Stack direction="row" alignItems="center" gap={0.75}>
      <Stack direction="row" alignItems="center" gap={0.75}>
        <BoxIconWrap>{titleGradient ? <AiInsightsTitleIcon /> : icon}</BoxIconWrap>
        {titleGradient ? (
          <AiInsightsTitle title={title} />
        ) : (
          <Typography sx={{ color: 'contentText.Black', fontSize: 20, fontWeight: 600, lineHeight: 1.4 }}>{title}</Typography>
        )}
      </Stack>
      {tooltipTitle === undefined ? null : <InfoTooltip title={tooltipTitle} />}
    </Stack>
    <Stack width="36px" height="36px" flexShrink={0} />
  </Stack>
)

export default EventDetailSectionHeader
