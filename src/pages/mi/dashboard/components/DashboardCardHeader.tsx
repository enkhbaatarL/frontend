import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

import ContentReader from '@/pages/mi/dashboard/components/ContentReader'

interface DashboardCardHeaderProps {
  icon: string
  title: ReactNode
  updatedTime?: ReactNode
  padding?: string
  height?: number | string
}

const DashboardCardHeader = ({ icon, title, updatedTime, padding = '27px 24px', height = '90px' }: DashboardCardHeaderProps) => (
  <Box height={height} p={padding} display="flex" alignItems="center" boxSizing="border-box">
    <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
      <Stack direction="row" alignItems="center" gap={'6px'}>
        <Box width={30} height={30} display="flex" alignItems="center" justifyContent="center">
          <img src={icon} alt="icon" width={30} height={30} />
        </Box>
        <Typography component="div" color="gray.90" sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Box ml="6px">
          <ContentReader />
        </Box>
      </Stack>
      {updatedTime}
    </Stack>
  </Box>
)

export default DashboardCardHeader
