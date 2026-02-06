import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import arBgImg from '@/assets/asset-report-bg.png'
import bgCardImg from '@/assets/bgcard.png'
import cmrBgImg from '@/assets/commodity-market-report-bg.png'
import cntryBgImg from '@/assets/country-report-bg.png'
import dataBgImg from '@/assets/data-bg.png'
import diBgImg from '@/assets/deal-insight-bg.png'
import horizonsBgImg from '@/assets/horizons-bg.png'
import iBgImg from '@/assets/insight-bg.png'
import pshImg from '@/assets/product_symbol_hover.png'
import rsrchBgImg from '@/assets/research-presentation-bg.png'
import edBgImg from '@/assets/the-edge-bg.png'
import MIBage from '@/components/common/bage/MIBage'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'

export type ReportType =
  | 'A_INSIGHT'
  | 'A_CMMDT_MRKT_RPT'
  | 'A_CMPY_RPT'
  | 'A_ASST_RPT'
  | 'A_DEAL_INSIGHT'
  | 'A_INFORM'
  | 'A_RSRCH_PRSNTTN'
  | 'A_CNTRY_RPT'
  | 'A_HORIZONS'
  | 'A_EDGE'
  | 'A_DATA'
export interface Report {
  type: ReportType
  title: string
  date: string
  source: string
  typeId: string
  goodsNo?: number
  viewable: boolean
}
interface InsightsCardBtnProps {
  report: Report
  index: number
}

const InsightsCardBtn: FC<InsightsCardBtnProps> = ({ report, index }) => {
  const [isHover, setIsHover] = useState(false)
  const navigate = useNavigate()

  const isPermitted = useMemo(() => report.viewable, [report.viewable])

  const backgroundImageUrl = useMemo(() => {
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
        return `url(${iBgImg})`
      case 'A_EDGE':
        return `url(${edBgImg})`
      case 'A_RSRCH_PRSNTTN':
        return `url(${rsrchBgImg})`
      case 'A_CNTRY_RPT':
        return `url(${cntryBgImg})`
      case 'A_HORIZONS':
        return `url(${horizonsBgImg})`
      case 'A_DATA':
        return `url(${dataBgImg})`
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
      case 'A_EDGE':
        return 'The Edge'
      case 'A_RSRCH_PRSNTTN':
        return 'Research Presentation'
      case 'A_CNTRY_RPT':
        return 'Country Report'
      case 'A_HORIZONS':
        return 'Horizons'
      case 'A_INFORM':
        return 'Inform'
      case 'A_DATA':
        return 'Data'
      default:
        return ''
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
        cursor: isPermitted ? 'pointer' : 'default',
        transition: 'all 0.3s ease-in-out',
        transform: isHover ? 'scale3d(0.994, 0.994, 0.994)' : 'scale3d(1, 1, 1)',
        backgroundColor: 'transparent',
        boxShadow: isHover ? 'none' : '0px 5px 15px rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onMouseOver={() => isPermitted && setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onClick={() => {
        if (!isPermitted) return

        navigate(`/mi/data-detail/${report.goodsNo}/${report.typeId}`)
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          backgroundImage: backgroundImageUrl,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          inset: 0,
          transition: 'background-image 0.3s linear',
          '& img': {
            position: 'absolute',
            bottom: 0,
            right: 0,
            opacity: isHover ? 1 : 0.3,
            transform: isHover ? 'scale(1)' : 'scale(0.95)',
            transformOrigin: 'right bottom',
            transition: 'opacity 0.3s linear, transform 0.4s ease 0.1s',
          },
        }}
      >
        <img src={pshImg} alt="pshImg" />
      </Box>
      <Grid
        height={index > 7 ? 220 : 340}
        container
        direction={'column'}
        alignItems={'start'}
        justifyContent={'space-between'}
        sx={{
          position: 'relative',
          zIndex: 1,
          padding: {
            xs: '20px',
            md: '20px 80px 20px 20px',
          },
          transition: 'padding 0.3s ease',
        }}
      >
        <MIBage
          color={report.type}
          label={reportType}
          sx={{
            transition: 'all 0.2s ease-out',
            opacity: isHover ? 0.8 : 1,
          }}
        />
        <Typography
          sx={{
            WebkitLineClamp: index > 3 ? 3 : 6,
            transition: 'all 0.2s ease-out 0.03s',
            color: 'white',
            mt: 4.5,
            mb: 'auto',
            filter: !isPermitted ? 'blur(8px)' : 'none',
            overflowWrap: 'anywhere',
          }}
          component="h4"
          variant="titleCardInsight"
        >
          {isPermitted ? report.title : 'Don\'t have permission to view'}
        </Typography>
        {!isPermitted && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            position={'absolute'}
            sx={{ inset: '0px -6px', color: '#E9ECEF' }}
          >
            <LockOutlinedIcon width={28} height={28} />
          </Box>
        )}
        <Grid
          container
          alignItems="center"
          sx={{
            transition: 'all 0.2s ease-out 0.1s',
            transform: isHover ? 'translateY(1px)' : 'translateY(0px)',
          }}
        >
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
