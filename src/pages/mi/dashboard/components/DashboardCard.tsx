import { Card, CardProps, Stack } from '@mui/material'
import { ReactNode } from 'react'

import DashboardCardHeader from '@/pages/mi/dashboard/components/DashboardCardHeader'

interface Props extends Omit<CardProps, 'title'> {
  icon?: string
  title: ReactNode
  headerContent?: ReactNode
  direction?: 'row' | 'column'
  gap?: number | string
}

const DashboardCard = ({ icon, title, headerContent, children, direction = 'row', gap = '24px', ...props }: Props) => (
  <Card
    elevation={0}
    {...props}
    sx={{
      border: '1px solid #DEE2E6',
      borderRadius: '10px',
      padding: 0,
      ...props.sx,
    }}
  >
    <DashboardCardHeader icon={icon} title={title}>
      {headerContent}
    </DashboardCardHeader>
    <Stack px="24px" direction={direction} gap={gap}>
      {children}
    </Stack>
  </Card>
)

export default DashboardCard
