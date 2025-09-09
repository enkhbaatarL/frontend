import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Card, Stack, Typography } from '@mui/material'

import DashboardCardHeader from './DashboardCardHeader'

import eventCalendarIcon from '@/assets/dashboard/event-calendar.svg'
import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MIButton from '@/components/common/button/MIButton'

type ImportanceLevel = 'High' | 'Medium' | 'Low'
type ValueState = 'positive' | 'negative' | 'default'

interface EventItem {
  id: string
  time: string
  country: string
  importance: ImportanceLevel
  event: string
  actual?: string
  forecast?: string
  previous?: string
  actualState?: ValueState
  forecastState?: ValueState
  previousState?: ValueState
}

const ImportanceIcon = ({ level }: { level: ImportanceLevel }) => {
  switch (level) {
    case 'High':
      return <img src={levelHighIcon} alt="level-high" />
    case 'Medium':
      return <img src={levelMediumIcon} alt="level-medium" />
    case 'Low':
      return <img src={levelLowIcon} alt="level-low" />
    default:
      return <img src={levelNotRatedIcon} alt="level-not-rated" />
  }
}

const getValueColor = (state?: ValueState) => {
  switch (state) {
    case 'positive':
      return '#498B47'
    case 'negative':
      return '#CC4D50'
    default:
      return undefined
  }
}

const EventItem = ({ item }: { item: EventItem }) => (
  <Box display="flex" alignItems="center" padding="4px" borderBottom="0.5px solid #DEE2E6" gap="10px">
    <Box width={42} textAlign="center">
      <Typography variant="body2" color="gray.90" sx={{ fontWeight: 500, fontSize: 14 }}>
        {item.time}
      </Typography>
    </Box>

    <Box width={42} textAlign="center">
      <Typography variant="body2" color="gray.90" sx={{ fontWeight: 500, fontSize: 14 }}>
        {item.country}
      </Typography>
    </Box>

    <Box flex={1} display="flex" alignItems="center" gap="10px" minWidth={0}>
      <ImportanceIcon level={item.importance} />
      <Typography
        variant="body2"
        color="gray.70"
        sx={{
          fontSize: 14,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: 1,
        }}
      >
        {item.event}
      </Typography>
    </Box>

    <Box width={60} textAlign="right">
      <Typography variant="body2" color="gray.90" sx={{ fontWeight: 500, fontSize: 14, color: getValueColor(item.actualState) }}>
        {item.actual ?? ''}
      </Typography>
    </Box>

    <Box width={60} textAlign="right">
      <Typography variant="body2" color="gray.70" sx={{ fontWeight: 500, fontSize: 14, color: getValueColor(item.forecastState) }}>
        {item.forecast ?? ''}
      </Typography>
    </Box>

    <Box width={60} textAlign="right">
      <Typography variant="body2" color="gray.70" sx={{ fontWeight: 500, fontSize: 14, color: getValueColor(item.previousState) }}>
        {item.previous ?? ''}
      </Typography>
    </Box>
  </Box>
)

const TableHeader = () => (
  <Box display="flex" alignItems="center" padding="0 4px" borderBottom="0.5px solid #DEE2E6" gap="10px">
    <Box width={42} textAlign="center">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        TIME
      </Typography>
    </Box>
    <Box width={42} textAlign="center">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        CTRY
      </Typography>
    </Box>
    <Box flex={1}>
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        EVENT
      </Typography>
    </Box>
    <Box width={60} textAlign="right">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        ACTUAL
      </Typography>
    </Box>
    <Box width={60} textAlign="right">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        FORECAST
      </Typography>
    </Box>
    <Box width={60} textAlign="right">
      <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
        PREVIOUS
      </Typography>
    </Box>
  </Box>
)

const CurrentTimeIndicator = () => (
  <Box
    height="1px"
    margin="-1px 4px 0"
    sx={{
      backgroundColor: '#212529',
    }}
  />
)

interface EventCalendarProps {
  items?: EventItem[]
}

const EventCalendar = ({ items = [] }: EventCalendarProps) => {
  const sampleItems: EventItem[] = [
    {
      id: '1',
      time: '19:01',
      country: 'GBP',
      importance: 'Medium',
      event: 'BRC Retail Sales Monitor (YoY) (Jul)',
      actual: '1.8%',
      actualState: 'negative',
      forecast: '2.1%',
      previous: '2.7%',
    },
    {
      id: '2',
      time: '19:50',
      country: 'JPY',
      importance: 'Low',
      event: 'M2 Money Stock (YoY)',
      actual: '1.0%',
      actualState: 'positive',
      forecast: '0.6%',
      previous: '0.9%',
    },
    {
      id: '3',
      time: '19:50',
      country: 'JPY',
      importance: 'Low',
      event: 'M3 Money Stock (YoY)',
      actual: '2,211.9B',
      forecast: '',
      previous: '2,204.3B',
      previousState: 'negative',
    },
    {
      id: '4',
      time: '20:00',
      country: 'SGD',
      importance: 'Low',
      event: 'HCOB France Manufacturing PMI (Jul)',
      actual: '4.4%',
      actualState: 'positive',
      forecast: '4.3%',
      previous: '4.3%',
    },
    {
      id: '5',
      time: '21:30',
      country: 'AUD',
      importance: 'Medium',
      event: 'NAB Business Confidence (Jul)',
      actual: '7',
      forecast: '',
      previous: '5',
    },
    {
      id: '6',
      time: '00:30',
      country: 'AUD',
      importance: 'High',
      event: 'RBA Interest Rate Decision (Aug)',
      actual: '',
      actualState: 'positive',
      forecast: '3.60%',
      previous: '3.85%',
    },
    {
      id: '7',
      time: '00:30',
      country: 'AUD',
      importance: 'Medium',
      event: 'RBA Monetary Policy Statement',
      actual: '',
      actualState: 'positive',
      forecast: '',
      previous: '',
      previousState: 'negative',
    },
    {
      id: '8',
      time: '00:30',
      country: 'AUD',
      importance: 'Medium',
      event: 'RBA Rate Statement',
      actual: '',
      forecast: '',
      previous: '',
      previousState: 'negative',
    },
    {
      id: '9',
      time: '02:00',
      country: 'GBP',
      importance: 'Low',
      event: 'Average Earnings ex Bonus (Jun)',
      actual: '',
      forecast: '4.7%',
      previous: '5.0%',
    },
    {
      id: '10',
      time: '02:00',
      country: 'GBP',
      importance: 'Medium',
      event: 'Average Earnings Index +Bonus (Jun)',
      actual: '',
      forecast: '',
      previous: '5.0%',
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
        icon={eventCalendarIcon}
        title="Event Calendar"
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
                5분 전 업데이트
              </Typography>
            </Stack>
          </Stack>
        }
        padding="17px 15px"
      />

      <Box padding="14px 7px">
        <TableHeader />

        <Stack gap="2px" py="6px">
          {displayItems.map((item, index) => (
            <Box key={item.id}>
              {index === 5 && <CurrentTimeIndicator />}
              <EventItem item={item} />
            </Box>
          ))}
        </Stack>
      </Box>

      <Box padding="12px">
        <MIButton width="100%" color="gray" type="outlined" contentType="text" size="h42" onClick={() => {}}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" color="gray.90" sx={{ fontWeight: 600 }}>
              View more
            </Typography>
            <KeyboardArrowRightIcon sx={{ fontSize: 20, color: '#868E96' }} />
          </Box>
        </MIButton>
      </Box>
    </Card>
  )
}

export default EventCalendar
