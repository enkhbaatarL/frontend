import { Stack, Typography, type StackProps } from '@mui/material'

import InfoTooltip from './InfoTooltip'

interface SectionHeaderProps extends StackProps {
  title: string
  tooltipTitle?: string
}

const SectionHeader = ({ title, tooltipTitle, marginBottom = '18px', ...props }: SectionHeaderProps) => (
  <Stack direction="row" alignItems="center" gap={1} marginBottom={marginBottom} {...props}>
    <Typography variant="body2" color="gray.90" sx={{ fontWeight: 700, fontSize: 14 }}>
      {title}
    </Typography>
    {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
  </Stack>
)

export default SectionHeader
