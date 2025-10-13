import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { getRandomString } from '@/utils/string'
interface DocumentItemProps {
  goodsDataNm: string
  modifyDt: string
  providerNm: string
  index: number
  onClick: () => void
  isViewable?: boolean
}

interface LatestInsightsData {
  providerNo: number
  providerNm: string
  goodsNo: number
  goodsNm: string
  goodsDataNo: number
  goodsDataNm: string
  modifyDt: string
  isViewable?: boolean
}

const DataItem = ({ goodsDataNm, modifyDt, providerNm, index, onClick, isViewable }: DocumentItemProps) => (
  <Box
    p={3}
    borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'}
    onClick={onClick}
    sx={{
      cursor: isViewable ? 'pointer' : 'default',
      '&:hover': {
        backgroundColor: 'contentBG.Hover',
      },
    }}
  >
    <Box
      sx={{
        position: 'relative',
        width: '100%',
      }}
    >
      <Typography
        fontWeight={500}
        color="gray.70"
        component="div"
        sx={{ WebkitLineClamp: 1, filter: !isViewable ? 'blur(5px)' : 'none' }}
        variant="fileName"
      >
        {isViewable ? goodsDataNm : getRandomString(35)}
      </Typography>
      {!isViewable && (
        <Box
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
          position={'absolute'}
          pb={'4px'}
          sx={{ inset: '-4px -10px', backgroundColor: 'rgba(255, 255, 255, 0.7)', color: '#868E96' }}
        >
          <LockOutlinedIcon width={20} height={20} />
        </Box>
      )}
    </Box>
    <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
      <Typography lineHeight={1.4} color="gray.60" variant="subtext2">
        {providerNm}
      </Typography>
      <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
      <Typography whiteSpace="nowrap" lineHeight={1.4} color="gray.60" variant="subtext2">
        {dayjs(modifyDt).format('YYYY-MM-DD ')}
      </Typography>
    </Grid>
  </Box>
)

const LatestData = ({ dataList }: { dataList: LatestInsightsData[] }) => {
  const navigate = useNavigate()

  const onClickRow = (row: LatestInsightsData) => {
    if (!row.isViewable) return

    navigate(`/mi/data-detail/${row.goodsNo}/${row.goodsDataNo}`)
  }

  return (
    <Grid gap={1} bgcolor={'#fff'} container direction="column" p={3} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography padding={2} component="div" color="gray.70" variant="sidePanelTitle">
        Latest Insights
      </Typography>
      <Box>
        {dataList?.map((item, index) => (
          <DataItem
            key={item.goodsDataNo}
            index={index}
            goodsDataNm={item.goodsDataNm}
            modifyDt={item.modifyDt}
            providerNm={item.providerNm}
            onClick={() => onClickRow(item)}
            isViewable={item.isViewable}
          />
        ))}
      </Box>
      <MIButton width={'100%'} contentType={'text'} color={'gray2'} type={'outlined'} size={'h34'} onClick={() => navigate('/mi/insights')}>
        View all
        <KeyboardArrowRightIcon
          sx={{
            verticalAlign: 'sub',
            color: '#868E96',
            ml: '8px',
          }}
          fontSize={'small'}
        />
      </MIButton>
    </Grid>
  )
}
export default LatestData
