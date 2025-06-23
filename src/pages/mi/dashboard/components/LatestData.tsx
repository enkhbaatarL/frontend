import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
interface DocumentItemProps {
  goodsDataNm: string
  modifyDt: string
  providerNm: string
  index: number
  onClick: () => void
}

interface LatestInsightsData {
  providerNo: number
  providerNm: string
  goodsNo: number
  goodsNm: string
  goodsDataNo: number
  goodsDataNm: string
  modifyDt: string
}

const DataItem = ({ goodsDataNm, modifyDt, providerNm, index, onClick }: DocumentItemProps) => (
  <Box paddingY={3} borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'} onClick={onClick} sx={{ cursor: 'pointer' }}>
    <Typography fontWeight={600} color="gray.70" component="div" sx={{ WebkitLineClamp: 1 }} variant="fileName">
      {goodsDataNm}
    </Typography>
    <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
      <Typography lineHeight={1.6} color="gray.60" variant="body2">
        {providerNm}
      </Typography>
      <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
      <Typography whiteSpace="nowrap" lineHeight={1.6} color="gray.60" variant="body2">
        {dayjs(modifyDt).format('YYYY-MM-DD ')}
      </Typography>
    </Grid>
  </Box>
)

const LatestData = ({ dataList }: { dataList: LatestInsightsData[] }) => {
  const navigate = useNavigate()

  const onClickRow = (row: LatestInsightsData) => {
    navigate(`/mi/data-detail/${row.goodsNo}/${row.goodsDataNo}`)
  }

  return (
    <Grid gap={2.5} bgcolor={'#fff'} container direction="column" p={6} borderRadius={1} border={'1px solid'} borderColor={'gray.30'}>
      <Typography component="div" color="gray.90" variant="titleBox">
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
          />
        ))}
      </Box>
      <MIButton width={'100%'} contentType={'text'} color={'gray2'} type={'outlined'} size={'h42'} onClick={() => navigate('/mi/insights')}>
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
