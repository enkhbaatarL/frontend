import { Box, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import ArrowRightIcon from '@/components/common/icons/ArrowRight'

interface DashboardCardHeaderProps {
  icon?: string
  title: ReactNode
  link?: string
  children?: ReactNode
  padding?: number | string
  height?: number | string
}

const DashboardCardHeader = ({ icon, title, link, children, padding = '27px 24px', height = '90px' }: DashboardCardHeaderProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (link) {
      navigate(link)
    }
  }

  const titleString = typeof title === 'string' ? title : String(title)

  return (
    <Box height={height} p={padding} display="flex" alignItems="center" boxSizing="border-box" sx={{ userSelect: 'none' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
        <Stack direction="row" alignItems="center" gap={'6px'} onClick={handleClick} sx={{ cursor: link ? 'pointer' : 'default' }}>
          {icon && (
            <Box width={30} height={30} display="flex" alignItems="center" justifyContent="center">
              <img src={icon} alt="icon" width={30} height={30} draggable={false} />
            </Box>
          )}
          <Box display="flex" alignItems="center" gap="6px">
            <Typography component="div" color="gray.90" sx={{ fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
              {title}
            </Typography>
            {titleString === 'Topic Tracker' && (
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#7A8790',
                  display: 'flex',
                  alignItems: 'center',
                  alignSelf: 'baseline',
                  marginTop: '7px',
                }}
              >
                Beta
              </Typography>
            )}
          </Box>
          {link && <ArrowRightIcon width={30} height={30} />}
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}

export default DashboardCardHeader
