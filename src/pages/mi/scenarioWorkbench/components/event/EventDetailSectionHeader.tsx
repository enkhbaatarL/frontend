import { Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'

interface EventDetailSectionHeaderProps {
  icon: ReactNode
  title: string
  tooltipTitle?: string
}

const BoxIconWrap = ({ children }: { children: ReactNode }) => (
  <Stack width={30} height={30} alignItems="center" justifyContent="center" flexShrink={0}>
    {children}
  </Stack>
)

const EventDetailSectionHeader = ({ icon, title, tooltipTitle }: EventDetailSectionHeaderProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
    <Stack direction="row" alignItems="center" gap={0.75}>
      <BoxIconWrap>{icon}</BoxIconWrap>
      <Typography color="contentText.Black" fontSize={20} fontWeight={600} lineHeight={1.4}>
        {title}
      </Typography>
      {tooltipTitle !== undefined ? <InfoTooltip title={tooltipTitle} /> : null}
    </Stack>
    <Stack width={36} height={36} flexShrink={0} />
  </Stack>
)

export default EventDetailSectionHeader
