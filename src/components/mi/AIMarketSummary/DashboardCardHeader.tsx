import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

interface DashboardCardHeaderProps {
  icon: string
  title: ReactNode
  updatedTime: ReactNode
  padding?: string
}

const DashboardCardHeader = ({ icon, title, updatedTime, padding = '15px' }: DashboardCardHeaderProps) => (
  <Box height={'60px'}>
    <Box p={padding} sx={{ borderBottom: '1px solid #DEE2E6' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" gap={'2px'}>
          <Box width={30} height={24} display="flex" alignItems="center" justifyContent="center">
            <img src={icon} alt="icon" width={22} height={22} />
          </Box>
          <Typography component="div" color="gray.90" sx={{ fontWeight: 700, fontSize: 20 }}>
            {title}
          </Typography>
        </Stack>
        {updatedTime}
      </Stack>
    </Box>
  </Box>
)

export default DashboardCardHeader
