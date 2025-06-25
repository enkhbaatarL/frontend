import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import MIBage, { MIChipColor } from '@/components/common/bage/MIBage'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { Report } from '@/pages/mi/insights/InsightsPage'
import theme from '@/theming'

interface InsightsDocumentItemProps {
  report: Report
}

const getRandomString = (length: number) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz        '
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const InsightsDocumentItem: FC<InsightsDocumentItemProps> = ({ report }) => {
  const navigate = useNavigate()

  const isPermitted = useMemo(() => report.isViewable, [report.isViewable])

  const formatDate = useMemo(() => {
    const date = new Date(report.date.replace(' ', 'T'))

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
  }, [report.date])

  const convertToType = (type: string) => {
    switch (type) {
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
      case 'A_INFORM':
        return 'Inform'
      default:
        return '-'
    }
  }

  return (
    <Grid
      container
      direction={'column'}
      alignItems={'start'}
      justifyContent={'space-between'}
      padding={2.5}
      gap={2.5}
      onClick={() => {
        if (!isPermitted) return

        navigate(`/mi/data-detail/${report.goodsNo}/${report.goodsDataNo}`)
      }}
      sx={{
        cursor: isPermitted ? 'pointer' : 'default',
        transition: '0.3s',
        '&:hover': {
          backgroundColor: isPermitted ? theme.palette.gray[5] : 'transparent',
        },
      }}
    >
      <Box display={'flex'} alignItems={'center'} gap={1}>
        {report.types?.map((type) => <MIBage key={type} size={'h20'} color={type as MIChipColor} label={convertToType(type)} />)}
      </Box>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
        }}
      >
        <Typography
          color="gray.90"
          fontSize={20}
          component="div"
          variant="body4"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            filter: !isPermitted ? 'blur(6px)' : 'none',
          }}
        >
          {isPermitted ? report.title : getRandomString(120)}
        </Typography>
        <Typography
          color="gray.60"
          component="div"
          variant="body1R16"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            filter: !isPermitted ? 'blur(6px)' : 'none',
          }}
        >
          {isPermitted ? report.subtitle : getRandomString(120)}
        </Typography>
        {!isPermitted && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            position={'absolute'}
            sx={{ inset: '-8px -12px', backgroundColor: 'rgba(255, 255, 255, 0.6)', color: '#868E96' }}
          >
            <LockOutlinedIcon width={24} height={24} />
          </Box>
        )}
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
