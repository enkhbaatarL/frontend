import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

interface DashboardCardHeaderProps {
  icon?: string
  title: ReactNode
  children?: ReactNode
  padding?: string
  height?: number | string
}

const DashboardCardHeader = ({ icon, title, children, padding = '27px 24px', height = '90px' }: DashboardCardHeaderProps) => (
  <Box height={height} p={padding} display="flex" alignItems="center" boxSizing="border-box">
    <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
      <Stack direction="row" alignItems="center" gap={'6px'}>
        <Box width={30} height={30} display="flex" alignItems="center" justifyContent="center">
          {icon && <img src={icon} alt="icon" width={30} height={30} />}
        </Box>
        <Typography component="div" color="gray.90" sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Stack>
  </Box>
)

export default DashboardCardHeader
