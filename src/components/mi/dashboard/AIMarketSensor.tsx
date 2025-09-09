import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Card, Stack, Typography } from '@mui/material'

import DashboardCardHeader from './DashboardCardHeader'
import SensorItem, { SensorItemData } from './SensorItem'

import aiMarketSensorIcon from '@/assets/dashboard/ai-market-sensor.svg'
import MIButton from '@/components/common/button/MIButton'
interface AIMarketSensorProps {
  items?: SensorItemData[]
}

const AIMarketSensor = ({ items = [] }: AIMarketSensorProps) => {
  const sampleItems: SensorItemData[] = [
    {
      id: '1',
      time: '05:20',
      date: '08-05',
      region: 'Global',
      sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
      outlook: 'positive',
      title: 'Oil price "smile curve" 이례적 형성 → 공급 과잉 우려에도 가격·구조 불일치 지속',
      content: '',
    },
    {
      id: '2',
      time: '07:30',
      date: '08-20',
      region: 'Asia Pacific',
      sources: [
        { name: 'US News', link: 'https://usnews.com' },
        { name: 'Reuters', link: 'https://reuters.com' },
      ],
      outlook: 'neutral',
      title: '러시아, 인도에 \'특별 메커니즘\' 통해 원유 공급 지속 강조',
      content: '',
    },
    {
      id: '3',
      time: '06:15',
      date: '08-20',
      region: 'Asia Pacific',
      sources: [
        { name: 'Reuters', link: 'https://reuters.com' },
        { name: 'Bloomberg', link: 'https://bloomberg.com' },
      ],
      outlook: 'neutral',
      title: '인도네시아, 미국산 원유 처리 모듈형 정유소 구축 계획 발표',
      content: '',
    },
    {
      id: '4',
      time: '05:45',
      date: '08-20',
      region: 'Asia Pacific',
      sources: [
        { name: 'Reuters', link: 'https://reuters.com' },
        { name: 'WSJ', link: 'https://wsj.com' },
        { name: 'FT', link: 'https://ft.com' },
      ],
      outlook: 'negative',
      title: '인도 정유사 Nayara, 제재 회피 위해 \'섀도우 플릿\' 활용 공급 유지',
      content: '',
    },
  ]

  const displayItems = items.length > 0 ? items : sampleItems

  return (
    <Card
      elevation={0}
      sx={{
        width: 556,
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <DashboardCardHeader
        icon={aiMarketSensorIcon}
        title="AI Market Sensor"
        updatedTime={
          <Stack direction="row" alignItems="center" gap={'9px'} px={'10px'}>
            <Stack direction="row" alignItems="center" gap={'4px'}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: '#364FC7',
                }}
              />
              <Typography variant="body3" color="gray.70" fontSize={12}>
                최근 24시간
              </Typography>
            </Stack>
          </Stack>
        }
        padding="17px 15px"
      />

      <Box padding="14px 14px 10px">
        <Stack gap={0}>
          {displayItems.map((item) => (
            <SensorItem
              key={item.id}
              item={item}
              onSourceSelected={(_source) => {}}
              onContentLoad={(sensorItem, content) => {
                sensorItem.content = content
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box padding="12px">
        <MIButton width="100%" color="gray" type="outlined" contentType="text" size="h42" onClick={() => {}}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" color="gray.90" fontWeight={600}>
              View more
            </Typography>
            <KeyboardArrowRightIcon fontSize="small" sx={{ color: '#868E96' }} />
          </Box>
        </MIButton>
      </Box>
    </Card>
  )
}

export default AIMarketSensor
