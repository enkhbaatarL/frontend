import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { FC, useMemo, useState } from 'react'

import arBgImg from '@/assets/asset-report-bg.png'
import bgCardImg from '@/assets/bgcard.png'
import cmrBgImg from '@/assets/commodity-market-report-bg.png'
import diBgImg from '@/assets/deal-insight-bg.png'
import iBgImg from '@/assets/insight-bg.png'
import pshImg from '@/assets/product_symbol_hover.png'
import MIBage from '@/components/common/bage/MIBage'
import MILine from '@/components/common/divider/MILine'

export type ReportType = 'A_INSIGHT' | 'A_CMMDT_MRKT_RPT' | 'A_CMPY_RPT' | 'A_ASST_RPT' | 'A_DEAL_INSIGHT' | 'A_INFORM'
export interface Report {
  type: ReportType
  title: string
  date: string
  source: string
  typeId: string
}
interface InsightsCardBtnProps {
  report: Report
  index: number
}

const InsightsCardBtn: FC<InsightsCardBtnProps> = ({ report, index }) => {
  const [isHover, setIsHover] = useState(false)

  const background = useMemo(() => {
    if (!isHover) {
      return `url(${bgCardImg})`
    }

    switch (report.type) {
      case 'A_ASST_RPT':
        return `url(${arBgImg})`
      case 'A_CMMDT_MRKT_RPT':
        return `url(${cmrBgImg})`
      case 'A_DEAL_INSIGHT':
        return `url(${diBgImg})`
      case 'A_INSIGHT':
        return `url(${iBgImg})`
      case 'A_CMPY_RPT':
      default:
        return `url(${bgCardImg})`
    }
  }, [report.type, isHover])

  const reportType = useMemo(() => {
    switch (report.type) {
      case 'A_ASST_RPT':
        return 'Asset Report'
      case 'A_CMMDT_MRKT_RPT':
        return 'Commodity Market Report'
      case 'A_DEAL_INSIGHT':
        return 'Deal Insight'
      case 'A_INSIGHT':
        return 'Insight'
      case 'A_CMPY_RPT':
        return 'Company Report'
      default:
        return 'Inform'
    }
  }, [report.type])

  const formatDate = useMemo(() => {
    const date = new Date(report.date.replace(' ', 'T'))

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
  }, [report.date])

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
            transition: 'all 0.3s linear',
          },
        }}
      >
        <img src={pshImg} alt="pshImg" />
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
        <MIBage color={report.type} label={reportType} />
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
            {formatDate}
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
