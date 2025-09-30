import { Box, Stack, Typography, type StackProps } from '@mui/material'

import InfoTooltip from '@/pages/mi/dashboard/components/InfoTooltip'

interface SectionHeaderProps extends StackProps {
  title: string
  tooltipTitle?: string
}

const SectionHeader = ({ title, tooltipTitle, height = '32px', ...props }: SectionHeaderProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" height={height} {...props}>
    <Box display="flex" alignItems="center" gap={1}>
      <Typography color="gray.90" sx={{ fontWeight: 700, fontSize: 20, lineHeight: 0 }}>
        {title}
      </Typography>
      {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
    </Box>
    {props.children}
  </Stack>
)

export default SectionHeader
