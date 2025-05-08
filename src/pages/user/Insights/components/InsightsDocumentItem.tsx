import { Box, Grid2 as Grid, Typography } from '@mui/material'
import React from 'react'

import MIBage from '@/components/common/bage/MIBage.tsx'
import MILine from '@/components/common/divider/MILine.tsx'
import { Report } from '@/hooks/useMockReports.tsx'

interface InsightsDocumentItemProps {
  report: Report
}

const InsightsDocumentItem: React.FC<InsightsDocumentItemProps> = ({ report }) => (
  <Grid container direction={'column'} alignItems={'start'} justifyContent={'space-between'} padding={2.5} gap={2.5} borderRadius={1}>
    <MIBage size={'h20'} color={report.type} label={report.type} />
    <Box>
      <Typography color="gray.90" fontSize={20} component="div" variant="body4">
        {report.title}
      </Typography>
      <Typography color="gray.60" component="div" variant="body1R16">
        {report.subtitle}
      </Typography>
    </Box>
    <Grid container alignItems="center">
      <Typography color={'#354564'} variant={'body4'}>
        {report.date}
      </Typography>
      <MILine margin={'0 6px'} direction={'vertical'} backgroundColor={'gray.30'} thickness={2} length={7} borderRadius={10} />
      <Typography color={'#354564'} variant={'body4'}>
        {report.source}
      </Typography>
    </Grid>
  </Grid>
)

export default InsightsDocumentItem
