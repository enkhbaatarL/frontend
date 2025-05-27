import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useMemo } from 'react'

import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import { MarketDataItemInfo } from '@/service/mi/dashboardData'

interface ItemProps {
  goodsDataNm: string
  lastValue: number
  change: number
  changePercent: number
  lastUpdateDt: string
  currency: string
  direction: string
  unit: string
}

const getMinimumAvailableChange = ({
  lastValue,
  dodChangeValue,
  wowChangeValue,
  momChangeValue,
}: {
  lastValue: number
  dodChangeValue: number | null
  wowChangeValue: number | null
  momChangeValue: number | null
}) => {
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

const DataItem = ({
  goodsDataNm,
  lastValue,
  change,
  changePercent,
  lastUpdateDt,
  currency,
  direction,
  unit,
  index,
}: ItemProps & { index: number }) => {
  const isPositive = direction === 'up'
  const color = isPositive ? '#3C8A36' : direction === 'down' ? '#A9141A' : 'gray.60'

  return (
    <Box paddingY={3} borderTop={index > 0 ? '1px solid #DEE2E6' : 'none'}>
      <Typography
        onClick={() => alert('redirect to detail')}
        fontWeight={600}
        color="gray.70"
        component="div"
        mb="2px"
        variant="fileName"
        sx={{ WebkitLineClamp: 1, cursor: 'pointer' }}
      >
        {goodsDataNm}
      </Typography>

      <Grid mb={1} container wrap="nowrap" alignItems="center" gap="5px">
        <Typography lineHeight={1.6} color="gray.90" variant="body2">
          {lastValue}
        </Typography>
        <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />
        <Typography lineHeight={1.6} color={color} variant="body2">
          {`${isPositive ? '+' : ''}${change} (${isPositive ? '+' : ''}${changePercent}%)`}
        </Typography>
      </Grid>

      <Grid container wrap="nowrap" alignItems="center" gap="5px">
        {[lastUpdateDt, unit, currency].map((text, idx) => (
          <Box key={idx} display="flex" alignItems="center">
            {idx > 0 && <MILine length={6} borderRadius={2.5} thickness={2} direction="vertical" backgroundColor="gray.30" />}
            <Typography lineHeight={1} fontSize={10} fontWeight={400} color="gray.60">
              {text}
            </Typography>
          </Box>
        ))}
      </Grid>
    </Box>
  )
}

const UpdatedData = ({ dataList }: { dataList: MarketDataItemInfo[] }) => {
  const mappedList = useMemo(
    () =>
      dataList.map((data) => {
        const summary = data.marketMetaDataSummary
        return { ...summary, ...getMinimumAvailableChange(summary) }
      }),
    [dataList],
  )

  return (
    <Grid gap={2.5} bgcolor="#fff" container direction="column" p={6} borderRadius={1} border="1px solid" borderColor="gray.30">
      <Typography component="div" color="gray.90" variant="titleBox">
        Updated Data
      </Typography>
      <Box>{mappedList?.map((item, index) => <DataItem key={index} {...item} index={index} />)}</Box>
      <MIButton width="100%" contentType="text" color="gray2" type="outlined" size="h42">
        View all
        <KeyboardArrowRightIcon sx={{ verticalAlign: 'sub', color: '#868E96', ml: '8px' }} fontSize="small" />
      </MIButton>
    </Grid>
  )
}

export default UpdatedData
