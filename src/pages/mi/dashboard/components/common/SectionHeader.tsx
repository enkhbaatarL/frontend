import { Box, Stack, Typography, type StackProps } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import ArrowRightIcon from '@/components/common/icons/ArrowRight'
import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'

interface SectionHeaderProps extends StackProps {
  title: string
  link?: string
  tooltipTitle?: string
  bold?: boolean
}

const SectionHeader = ({ title, link, tooltipTitle, height = '32px', bold = false, ...props }: SectionHeaderProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (link) {
      navigate(link)
    }
  }

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" height={height} sx={{ userSelect: 'none' }} {...props}>
      <Box display="flex" alignItems="center" gap={1} onClick={handleClick} sx={{ cursor: link ? 'pointer' : 'default' }}>
        <Box display="flex" alignItems="center" gap="4px">
          <Typography color="gray.90" sx={{ fontWeight: bold ? 700 : 600, fontSize: 20, lineHeight: 0 }}>
            {title}
          </Typography>
        </Box>
        {tooltipTitle && <InfoTooltip title={tooltipTitle} />}
        {link && <ArrowRightIcon width={30} height={30} />}
      </Box>
      {props.children}
    </Stack>
  )
}

export default SectionHeader
