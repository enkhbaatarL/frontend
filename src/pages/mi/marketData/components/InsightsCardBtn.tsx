import { Grid2 as Grid, Typography } from '@mui/material'
import { FC } from 'react'

import MIBage from '@/components/common/bage/MIBage'
import MILine from '@/components/common/divider/MILine'
import { Report } from '@/hooks/useMockReports'

interface InsightsCardBtnProps {
  report: Report
  index: number
}

const InsightsCardBtn: FC<InsightsCardBtnProps> = ({ report, index }) => (
  <Grid
    height={index > 3 ? 220 : 340}
    container
    direction={'column'}
    alignItems={'start'}
    justifyContent={'space-between'}
    borderRadius={1}
    sx={{
      background: 'url(\'/src/assets/bgcard.png\') center / cover no-repeat',
      padding: {
        xs: '20px',
        md: '20px 80px 20px 20px',
      },
    }}
  >
    <MIBage color={report.type} label={report.type} />
    <Typography sx={{ WebkitLineClamp: index > 3 ? 3 : 6 }} color="white" mt={4.5} mb={'auto'} component="h4" variant="titleCardInsight">
      {report.title}
    </Typography>
    <Grid container alignItems="center">
      <Typography color={'#fff'} variant={'subtext'}>
        {report.date}
      </Typography>
      <MILine margin={'0 6px'} direction={'vertical'} backgroundColor={'white'} thickness={2} length={7} borderRadius={10} />
      <Typography color={'#fff'} variant={'subtext'}>
        {report.source}
      </Typography>
    </Grid>
  </Grid>
)

export default InsightsCardBtn
