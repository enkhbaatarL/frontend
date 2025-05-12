import { Box, Grid2 as Grid, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'

import MIBage from '@/components/common/bage/MIBage.tsx'
import MILine from '@/components/common/divider/MILine.tsx'
import { Report } from '@/hooks/useMockReports.tsx'

interface InsightsCardBtnProps {
  report: Report
  index: number
}

const InsightsCardBtn: React.FC<InsightsCardBtnProps> = ({ report, index }) => {
  const [isHover, setIsHover] = useState(false)

  const background = useMemo(() => {
    if (!isHover) {
      return 'url(\'/src/assets/bgcard.png\')'
    }

    switch (report.type) {
      case 'Asset Report':
        return ' url(\'/src/assets/asset-report-bg.png\')'
      case 'Commodity Market Report':
        return 'url(\'/src/assets/commodity-market-report-bg.png\')'
      case 'Deal Insight':
        return 'url(\'/src/assets/deal-insight-bg.png\')'
      case 'Insight':
        return 'url(\'/src/assets/insight-bg.png\')'
      default:
        return 'url(\'/src/assets/bgcard.png\')'
    }
  }, [report.type, isHover])

  return (
    <Box
      sx={{
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          backgroundImage: background,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '50% / cover',
          inset: 0,
          '& img': {
            position: 'absolute',
            bottom: 0,
            right: 0,
            opacity: isHover ? 1 : 0.3,
            transition: '0.3s',
          },
        }}
      >
        <img src="/src/assets/product_symbol_hover.png" />
      </Box>
      <Grid
        height={index > 3 ? 220 : 340}
        container
        direction={'column'}
        alignItems={'start'}
        justifyContent={'space-between'}
        borderRadius={1}
        sx={{
          position: 'relative',
          zIndex: 1,
          padding: {
            xs: '20px',
            md: '20px 80px 20px 20px',
          },
        }}
        onMouseOver={() => setIsHover(true)}
        onMouseOut={() => setIsHover(false)}
      >
        <MIBage color={report.type} label={report.type} />
        <Typography
          sx={{ WebkitLineClamp: index > 3 ? 3 : 6 }}
          color="white"
          mt={4.5}
          mb={'auto'}
          component="h4"
          variant="titleCardInsight"
        >
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
    </Box>
  )
}

export default InsightsCardBtn
