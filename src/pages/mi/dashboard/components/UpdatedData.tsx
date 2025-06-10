import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { MarketDataItemInfo } from '@/service/mi/dashboardData'

type MarketMetaDataSummary = MarketDataItemInfo['marketMetaDataSummary']

interface ProcessedMarketDataItem extends MarketDataItemInfo {
  marketMetaDataSummary: MarketMetaDataSummary & {
    change: number
    changePercent: number
    direction: string
    unit: string
  }
}

const getMinimumAvailableChange = ({ lastValue, dodChangeValue, wowChangeValue, momChangeValue }: MarketMetaDataSummary) => {
  let changeEntry: { unit: string; change: number }
  if (dodChangeValue !== null) {
    changeEntry = { unit: 'DoD', change: dodChangeValue }
  } else if (wowChangeValue !== null) {
    changeEntry = { unit: 'WoW', change: wowChangeValue }
  } else {
    changeEntry = { unit: 'MoM', change: momChangeValue ?? 0 }
  }
  const { unit, change } = changeEntry
  const changePercent = lastValue !== 0 ? +((change / (lastValue - change)) * 100).toFixed(2) : 0
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  return { unit, change, changePercent, direction }
}

const DataItem = ({ data, index, onClick }: { data: ProcessedMarketDataItem; index: number; onClick: () => void }) => {
  const { isPermitted, marketMetaDataSummary: summary } = data
  const { goodsDataSourceNm, lastValue, change, changePercent, lastUpdateDt, currency, direction, unit } = summary
  const isPositive = direction === 'up'
  const color = isPositive ? '#3C8A36' : direction === 'down' ? '#A9141A' : 'gray.60'

  return (
    <Box paddingY={3} borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'} position="relative">
      <Typography
        onClick={isPermitted ? onClick : undefined}
        fontWeight={600}
        color="gray.70"
        component="div"
        mb="2px"
        variant="fileName"
        sx={{ WebkitLineClamp: 1, cursor: isPermitted ? 'pointer' : 'auto' }}
      >
        {goodsDataSourceNm}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ filter: !isPermitted ? 'blur(5px)' : 'none' }}>
          <Grid mb={1} container wrap="nowrap" alignItems="center" gap="5px">
            <Typography lineHeight={1.6} color="gray.90" variant="body2">
              {isPermitted ? lastValue : 0.0}
            </Typography>
            <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
            <Typography lineHeight={1.6} color={isPermitted ? color : 'gray.60'} variant="body2">
              {isPermitted ? `${isPositive ? '+' : ''}${change} (${isPositive ? '+' : ''}${changePercent}%)` : '+0.00 (+0.00%)'}
            </Typography>
          </Grid>
          <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
            <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
              {isPermitted ? dayjs(lastUpdateDt).format('MMMM D, YYYY') : 'MMMM D, YYYY'}
            </Typography>
            <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
            <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
              {isPermitted ? unit : 'N/A'}
            </Typography>
            <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
            <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
              {isPermitted ? currency : 'N/A'}
            </Typography>
          </Grid>
        </Box>
        {!isPermitted && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            position={'absolute'}
            sx={{ inset: '0px -6px', backgroundColor: 'rgba(255, 255, 255, 0.4)', color: '#868E96' }}
          >
            <LockOutlinedIcon width={22} height={22} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

const UpdatedData = ({ dataList }: { dataList: MarketDataItemInfo[] }) => {
  const navigate = useNavigate()
  const mappedList: ProcessedMarketDataItem[] = useMemo(
    () =>
      dataList.map((data) => {
        const summary = data.marketMetaDataSummary
        return {
          ...data,
          marketMetaDataSummary: {
            ...summary,
            ...getMinimumAvailableChange(summary),
          },
        }
      }),
    [dataList],
  )

  const onClickRow = (row: ProcessedMarketDataItem) => {
    if (row.isPermitted) {
      navigate(`/mi/data-detail/${row.marketMetaDataSummary.goodsNo}/${row.marketMetaDataSummary.goodsDataNo}`, {
        state: { goodsDataSrcNo: row.marketMetaDataSummary.goodsDataSourceNo },
      })
    }
  }

  return (
    <Grid gap={2.5} bgcolor="#fff" container direction="column" p={6} borderRadius={1} border="1px solid" borderColor="gray.30">
      <Typography component="div" color="gray.90" variant="titleBox">
        Updated Data
      </Typography>
      <Box>
        {mappedList?.slice(0, 5).map((item, index) => <DataItem key={index} data={item} index={index} onClick={() => onClickRow(item)} />)}
      </Box>
      <MIButton width="100%" contentType="text" color="gray2" type="outlined" size="h42" onClick={() => navigate('/mi/market-data')}>
        View all
        <KeyboardArrowRightIcon sx={{ verticalAlign: 'sub', color: '#868E96', ml: '8px' }} fontSize="small" />
      </MIButton>
    </Grid>
  )
}

export default UpdatedData
