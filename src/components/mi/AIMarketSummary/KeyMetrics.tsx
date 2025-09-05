import { Box, Card, Stack, Typography } from '@mui/material'

import SectionHeader from './SectionHeader'

type MarketDirection = 'up' | 'down' | 'flat'

interface MetricItem {
  id: string
  name: string
  value: string
  change: string
  changePercent: string
  date: string
  trend: MarketDirection
}

const getTrendColor = (trend: MarketDirection) => {
  if (trend === 'up') return '#498B47'
  if (trend === 'down') return '#CC4D50'
  return 'gray.70'
}

const MetricItem = ({ item }: { item: MetricItem }) => (
  <Box
    display="flex"
    alignItems="center"
    padding="2px 4px"
    gap={'3px'}
    height={26}
    sx={{
      boxShadow: '0 0.5px 0 0 #DEE2E6',
    }}
  >
    <Box display="flex" alignItems="center" gap={'6px'} flex={1}>
      <Box
        width={18}
        height={18}
        borderRadius="50%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          backgroundColor: '#868E96',
          color: 'white',
          fontSize: 12,
        }}
      >
        D
      </Box>
      <Typography variant="body2" color="gray.70">
        {item.name}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color="gray.90" sx={{ fontWeight: 500 }}>
        {item.value}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color={getTrendColor(item.trend)} sx={{ fontWeight: 500 }}>
        {item.change}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color={getTrendColor(item.trend)} sx={{ fontWeight: 500 }}>
        {item.changePercent}
      </Typography>
    </Box>
    <Box width={40} textAlign="right">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 11 }}>
        {item.date}
      </Typography>
    </Box>
  </Box>
)

interface KeyMetricsProps {
  metrics?: MetricItem[]
}

const KeyMetrics = ({ metrics = [] }: KeyMetricsProps) => {
  // 샘플 데이터
  const sampleMetrics: MetricItem[] = [
    {
      id: 'm1',
      name: 'ICE Brent (USD/bbl)',
      value: '66.34',
      change: '-0.55',
      changePercent: '-0.84%',
      date: '08-20',
      trend: 'down',
    },
    {
      id: 'm2',
      name: 'NYMEX WTI (USD/bbl)',
      value: '63.00',
      change: '-1.05',
      changePercent: '-1.69%',
      date: '08-20',
      trend: 'down',
    },
    {
      id: 'm3',
      name: 'Dubai Spot (USD/bbl)',
      value: '68.05',
      change: '+0.39',
      changePercent: '+0.10%',
      date: '08-20',
      trend: 'up',
    },
    {
      id: 'm4',
      name: 'NYMEX JKM (USD/MMBtu)',
      value: '10.93',
      change: '-0.02',
      changePercent: '-0.18%',
      date: '08-20',
      trend: 'down',
    },
    {
      id: 'm5',
      name: 'ICE TTF (USD/MMBtu)',
      value: '10.69',
      change: '-0.02',
      changePercent: '-0.17%',
      date: '08-20',
      trend: 'down',
    },
    {
      id: 'm6',
      name: 'NYMEX HH (USD/MMBtu)',
      value: '2.27',
      change: '-0.12',
      changePercent: '-4.29%',
      date: '08-20',
      trend: 'down',
    },
    {
      id: 'm7',
      name: 'EU Storage (bcm)',
      value: '62.16',
      change: '+0.27',
      changePercent: '+0.44%',
      date: '08-20',
      trend: 'up',
    },
    {
      id: 'm8',
      name: 'US Permian Wells Drilled',
      value: '431.0',
      change: '-5',
      changePercent: '-1.10%',
      date: '08-18',
      trend: 'down',
    },
    {
      id: 'm9',
      name: 'US Haynesville Wells Drilled',
      value: '38.0',
      change: '-1',
      changePercent: '-1.82%',
      date: '08-18',
      trend: 'down',
    },
    {
      id: 'm10',
      name: 'US Appalachia Wells Drilled',
      value: '65.0',
      change: '-1',
      changePercent: '-2.50%',
      date: '08-18',
      trend: 'down',
    },
  ]

  const displayMetrics = metrics.length > 0 ? metrics : sampleMetrics

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        padding: '12px',
      }}
    >
      <SectionHeader
        title="KEY METRICS"
        tooltipTitle="시장에서 가장 중요하게 모니터링되는 가격 및 공급 지표를 제공합니다. 실시간 변동을 통해 시장의 단기 흐름과 가격 방향성을 파악할 수 있습니다."
        marginBottom={'8px'}
      />
      <Stack gap={0}>
        {displayMetrics.map((item) => (
          <MetricItem key={item.id} item={item} />
        ))}
      </Stack>
    </Card>
  )
}

export default KeyMetrics
