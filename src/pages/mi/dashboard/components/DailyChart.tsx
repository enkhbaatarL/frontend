import { Box, Grid2 as Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import Marquee from 'react-fast-marquee'
import { useNavigate } from 'react-router-dom'

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

interface Props {
  data?: MarketDataItemInfo[]
}

const DailyChart = ({ data = [] }: Props) => {
  const navigate = useNavigate()

  const mappedList: ProcessedMarketDataItem[] = useMemo(
    () =>
      data.map((item) => {
        const summary = item.marketMetaDataSummary
        return {
          ...item,
          marketMetaDataSummary: {
            ...summary,
            ...getMinimumAvailableChange(summary),
          },
        }
      }),
    [data],
  )

  const onClickItem = (item: ProcessedMarketDataItem) => {
    navigate(`/mi/data-detail/${item.marketMetaDataSummary.goodsNo}/${item.marketMetaDataSummary.goodsDataNo}`, {
      state: { goodsDataSrcNo: item.marketMetaDataSummary.goodsDataSourceNo },
    })
  }

  return (
    <Box
      sx={{
        overflowX: 'hidden',
        bgcolor: '#fff',
        borderBottom: '1px solid #DEE2E6',
        height: '76px',
      }}
    >
      <Marquee pauseOnHover={true} gradient={false} speed={20} style={{ height: '76px', backgroundColor: '#fff' }} autoFill>
        {mappedList.map((item, idx) => {
          const summary = item.marketMetaDataSummary
          const isPositive = summary.direction === 'up'
          const color = isPositive ? '#3C8A36' : summary.direction === 'down' ? '#A9141A' : 'gray.60'
          const isPermitted = item.isPermitted

          const displayData = {
            goodsDataSourceNm: summary.goodsDataSourceNm,
            lastValue: isPermitted ? summary.lastValue : 0.0,
            change: isPermitted ? summary.change : 0.0,
            changePercent: isPermitted ? summary.changePercent : 0.0,
            lastUpdateDt: isPermitted ? dayjs(summary.lastUpdateDt).format('YYYY-MM-DD') : 'YYYY-MM-DD',
            unit: isPermitted ? summary.unit : 'N/A',
            currency: isPermitted ? summary.currency : 'N/A',
          }

          return (
            <Box
              key={idx}
              flexShrink={0}
              bgcolor={'#fff'}
              mx={'35px'}
              p={3}
              onClick={isPermitted ? () => onClickItem(item) : undefined}
              sx={{
                cursor: isPermitted ? 'pointer' : 'auto',
                userSelect: 'none',
              }}
            >
              <Typography
                fontWeight={600}
                color="gray.70"
                component="div"
                fontSize={'14px'}
                lineHeight={1}
                mb={1}
                sx={{ WebkitLineClamp: 1 }}
                variant="fileName"
              >
                {displayData.goodsDataSourceNm}
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ filter: !isPermitted ? 'blur(3px)' : 'none' }}>
                  <Grid mb={1} container wrap="nowrap" alignItems="center" gap={'4px'}>
                    <Typography lineHeight={1.4} color="gray.90" variant="body2">
                      {displayData.lastValue}
                    </Typography>
                    <Typography lineHeight={1.4} color={!isPermitted ? 'gray.90' : color} variant="body2">
                      {`${isPositive ? '+' : ''}${displayData.change} (${isPositive ? '+' : ''}${displayData.changePercent}%)`}
                    </Typography>
                  </Grid>
                  <Grid container wrap="nowrap" alignItems="center" gap={'5px'}>
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {displayData.lastUpdateDt}
                    </Typography>
                    <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {displayData.unit}
                    </Typography>
                    <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
                    <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60" variant="body2">
                      {displayData.currency}
                    </Typography>
                  </Grid>
                </Box>
                {!isPermitted && (
                  <Box
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    position={'absolute'}
                    sx={{ inset: '-4px -8px', backgroundColor: 'rgba(255, 255, 255, 0.4)', color: '#868E96' }}
                  >
                    <LockOutlinedIcon width={24} height={24} />
                  </Box>
                )}
              </Box>
            </Box>
          )
        })}
      </Marquee>
    </Box>
  )
}

export default DailyChart
