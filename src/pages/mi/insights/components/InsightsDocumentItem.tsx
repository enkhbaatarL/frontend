import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { FC, useMemo } from 'react'
// import { useNavigate } from 'react-router-dom'

import MIBage, { MIChipColor } from '@/components/common/bage/MIBage'
import MILine from '@/components/common/divider/MILine'
import { Report } from '@/pages/mi/insights/InsightsPage'
import theme from '@/theming'

interface InsightsDocumentItemProps {
  report: Report
}

const InsightsDocumentItem: FC<InsightsDocumentItemProps> = ({ report }) => {
  // const navigate = useNavigate()

  const formatDate = useMemo(() => {
    const date = new Date(report.date.replace(' ', 'T'))

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [report.date])

  return (
    <Grid
      container
      direction={'column'}
      alignItems={'start'}
      justifyContent={'space-between'}
      padding={2.5}
      gap={2.5}
      // onClick={() => navigate('/user/data-visualization')}
      sx={{
        cursor: 'pointer',
        transition: '0.3s',
        '&:hover': {
          backgroundColor: theme.palette.gray[5],
        },
      }}
    >
      <Box display={'flex'} alignItems={'center'} gap={1}>
        {report.types?.map((type) => <MIBage key={type} size={'h20'} color={type as MIChipColor} label={type} />)}
      </Box>
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
          {formatDate}
        </Typography>
        <MILine margin={'0 6px'} direction={'vertical'} backgroundColor={'gray.30'} thickness={2} length={7} borderRadius={10} />
        <Typography color={'#354564'} variant={'body4'}>
          {report.source}
        </Typography>
      </Grid>
    </Grid>
  )
}

export default InsightsDocumentItem
