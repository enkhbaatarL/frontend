import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import Marquee from 'react-fast-marquee'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { MarketDataItemInfo } from '@/service/mi/forecast'

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
  let direction: string
  if (change > 0) {
    direction = 'up'
  } else if (change < 0) {
    direction = 'down'
  } else {
    direction = 'flat'
  }
  return { unit, change, changePercent, direction }
}

interface Props {
  data?: MarketDataItemInfo[]
}

const getChangeColor = (direction: string): string => {
  if (direction === 'up') {
    return '#498B47'
  } else if (direction === 'down') {
    return '#CC4D50'
  }
  return '#495057'
}

interface DisplayData {
  goodsDataSourceNm: string
  lastValue: number
  change: number
  changePercent: number
  lastUpdateDt: string
  unit: string
  currency: string
}

const MarketItemContent = ({
  displayData,
  isPositive,
  color,
  isPermitted,
}: {
  displayData: DisplayData
  isPositive: boolean
  color: string
  isPermitted: boolean
}) => (
  <Box display={'flex'} alignItems={'center'} gap={'6px'}>
    <Typography
      fontWeight={600}
      color="#495057"
      component="div"
      fontSize={'14px'}
      lineHeight={1}
      sx={{
        WebkitLineClamp: 1,
        maxWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      variant="fileName"
    >
      {displayData.goodsDataSourceNm}
    </Typography>
    <Box display={'flex'} alignItems={'center'} gap={'4px'}>
      <Typography lineHeight={1.4} color="#495057" variant="body2" fontWeight={600} fontSize={'14px'}>
        {displayData.lastValue?.toLocaleString() ?? '0'}
      </Typography>
      <Typography lineHeight={1.4} color={!isPermitted ? '#495057' : color} variant="body2" fontWeight={600} fontSize={'14px'}>
        {`${isPositive ? '+' : ''}${displayData.changePercent}%`}
      </Typography>
    </Box>
  </Box>
)

const MarketItem = ({ item, onClickItem }: { item: ProcessedMarketDataItem; onClickItem: (item: ProcessedMarketDataItem) => void }) => {
  const summary = item.marketMetaDataSummary
  const isPositive = summary.direction === 'up'
  const color = getChangeColor(summary.direction)
  const isPermitted = item.isPermitted

  const displayData = {
    goodsDataSourceNm: summary.goodsDataSourceNm,
    lastValue: isPermitted ? (summary.lastValue ?? 0.0) : 0.0,
    change: isPermitted ? summary.change : 0.0,
    changePercent: isPermitted ? summary.changePercent : 0.0,
    lastUpdateDt: isPermitted ? dayjs(summary.lastUpdateDt).format('YYYY-MM-DD') : 'YYYY-MM-DD',
    unit: isPermitted ? summary.unit : 'N/A',
    currency: isPermitted ? summary.currency : 'N/A',
  }

  return (
    <Box
      flexShrink={0}
      bgcolor={'#fff'}
      mx={'20px'}
      p={'4px'}
      onClick={isPermitted ? () => onClickItem(item) : undefined}
      sx={{
        cursor: isPermitted ? 'pointer' : 'auto',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '28px',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ filter: !isPermitted ? 'blur(3px)' : 'none' }}>
          <MarketItemContent displayData={displayData} isPositive={isPositive} color={color} isPermitted={isPermitted} />
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
        height: '40px',
      }}
    >
      <Marquee pauseOnHover={true} gradient={false} speed={20} style={{ height: '40px', backgroundColor: '#fff' }} autoFill>
        {mappedList.map((item) => (
          <MarketItem
            key={`${item.marketMetaDataSummary.goodsDataSourceNo}-${item.marketMetaDataSummary.goodsNo}`}
            item={item}
            onClickItem={onClickItem}
          />
        ))}
      </Marquee>
    </Box>
  )
}

export default DailyChart
