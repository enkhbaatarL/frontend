import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Card, Stack, Typography, Divider, Collapse, Fade } from '@mui/material'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { useState } from 'react'

import DashboardCardHeader from './DashboardCardHeader'
import Summarizing from './Summarizing'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import MIButton from '@/components/common/button/MIButton'
import MISelect from '@/components/common/select/MISelect'

type OutlookType = 'positive' | 'negative' | 'neutral'

interface NewsItem {
  id: string
  provider: string
  date: string
  impactScore: number
  outlook: OutlookType
  title: string
  content?: string
}

const OutlookIcon = ({ type, color }: { type: OutlookType; color?: string }) => {
  const iconProps = { fontSize: 'small' as const, sx: { color } }

  switch (type) {
    case 'positive':
      return <TrendingUpIcon {...iconProps} />
    case 'negative':
      return <TrendingDownIcon {...iconProps} />
    case 'neutral':
    default:
      return <TrendingFlatIcon {...iconProps} />
  }
}

const OutlookChip = ({ type, value }: { type: OutlookType; value: number }) => {
  const getTextColor = () => {
    if (type === 'positive') return '#498B47'
    if (type === 'negative') return '#CC4D50'
    if (type === 'neutral') return '#495057'
    return '#868E96'
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '4px',
        border: `1px solid ${getTextColor()}`,
        borderRadius: '4px',
        height: 22,
      }}
    >
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <OutlookIcon type={type} color={getTextColor()} />
      </Box>
      <Typography
        variant="body2"
        mx="2px"
        sx={{
          fontWeight: 500,
          fontSize: 14,
          lineHeight: '1.4em',
          color: getTextColor(),
        }}
      >
        {value.toFixed(1)}
      </Typography>
    </Box>
  )
}

const ProviderChip = ({ provider }: { provider: string }) => (
  <Box
    width={18}
    height={18}
    borderRadius="50%"
    border="0.5px solid #DEE2E6"
    display="flex"
    alignItems="center"
    justifyContent="center"
    sx={{
      backgroundColor: '#F1F3F5',
    }}
  >
    <Typography variant="body3" color="gray.70" sx={{ fontSize: 8, fontWeight: 600 }}>
      {provider.charAt(0)}
    </Typography>
  </Box>
)

const NewsItem = ({ item }: { item: NewsItem }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    if (isEmpty(item.content)) {
      setIsOpen(true)
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        item.content =
          '미·중 관세 휴전 90일 연장에 일본·호주 증시 사상 최고치, 아시아 증시 전반 상승.\n미·중 관세 휴전 90일 연장 발표에 아시아 주식 전반 상승, 투자 심리 개선됨\n일본 닛케이 지수는 공휴일 이후 기술주 강세를 통해 사상 최고치 경신됨\n호주 ASX 지수는 RBA의 기준금리 3.60% 인하 소식에 신규 최고치 도달함\n중국 CSI 300은 보합세, 홍콩 항셍지수는 소폭 하락함\n관세 휴전은 시장에 안도감을 주어, 이후 발표될 미국 CPI, RBA 금리 결정, 트럼프-푸틴 정상회담에 관심이 집중됨'
      }, 1000)
    } else {
      setIsOpen(!isOpen)
    }
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={'10px'}
      padding="14px 12px 9px"
      borderBottom="0.5px solid #DEE2E6"
      borderRadius="8px"
      marginBottom="10px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: '#F4F6FF',
        },
      }}
      onClick={handleClick}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap="4px" ml="-2px">
          <ProviderChip provider={item.provider} />
          <Typography variant="body2" color="gray.70" sx={{ fontSize: 14 }}>
            {item.provider}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ margin: '6px 6px 0 5px', height: 8 }} />
          <Typography variant="body2" color="gray.70" sx={{ fontSize: 14 }}>
            {dayjs(item.date).format('MM-DD HH:mm')}
          </Typography>
        </Box>
        <Box mr="-4px">
          <OutlookChip type={item.outlook} value={item.impactScore} />
        </Box>
      </Box>

      <Box>
        <Typography variant="body1" color="#495057" sx={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4 }}>
          {item.title}
        </Typography>
      </Box>

      <Collapse
        in={isOpen}
        timeout={300}
        sx={{
          '& .MuiCollapse-wrapper': {
            transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          },
        }}
      >
        <Box>
          {isLoading ? (
            <Box>
              <Summarizing />
            </Box>
          ) : (
            <Box>
              <Fade in={!isEmpty(item.content)} timeout={800}>
                <Box>
                  <Box pt="12px">
                    <Typography variant="body1SB16" color="gray.70" sx={{ fontSize: 14, lineHeight: 1.4 }}>
                      미·중 관세 휴전 90일 연장에 일본·호주 증시 사상 최고치, 아시아 증시 전반 상승.
                    </Typography>
                  </Box>
                  <Box sx={{ padding: '12px 0' }}>
                    <Box pl="12px">
                      {item.content?.split('\n').map((content, index) => (
                        <Typography
                          key={`${item.id}-content-${index}`}
                          variant="body2"
                          color="gray.70"
                          sx={{
                            lineHeight: 1.4,
                            paddingLeft: '16px',
                            textIndent: '-16px',
                            '&::before': {
                              content: '"•"',
                              marginRight: '8px',
                              color: 'gray.70',
                            },
                          }}
                        >
                          {content}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Fade>

              <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                <Box display="flex" alignItems="center" gap="4px">
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: '#868E96' }} />
                  <Typography variant="body2" color="#868E96" sx={{ fontSize: 12, lineHeight: 1.4 }}>
                    AI 요약 결과는 정확하지 않을 수 있으니 중요한 사항은 한 번 더 검토해 주세요.
                  </Typography>
                </Box>
                <MIButton
                  color="gray"
                  type="outlined"
                  contentType="text"
                  size="h28"
                  onClick={(e) => {
                    e.stopPropagation()
                    // 원문보기 로직
                  }}
                >
                  원문보기
                </MIButton>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

const sortOptions = [
  { label: 'Impact Score (High to Low)', value: 'high-to-low' },
  { label: 'Impact Score (Low to High)', value: 'low-to-high' },
  { label: 'Date (Newest)', value: 'newest' },
  { label: 'Date (Oldest)', value: 'oldest' },
]

const FilterSection = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <Box padding="18px 24px 14px">
    <MISelect
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
      options={sortOptions}
      sizeSelect="h40"
      type="button"
      width={240}
      sx={{
        '& .MuiOutlinedInput-root': {
          padding: '2px 0',
          fontSize: '14px',
          '& fieldset': {
            borderColor: '#DEE2E6',
          },
          '&:hover fieldset': {
            borderColor: '#DEE2E6',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#DEE2E6',
          },
        },
      }}
    />
  </Box>
)

interface NewsFeedProps {
  items?: NewsItem[]
}

const NewsFeed = ({ items = [] }: NewsFeedProps) => {
  const [sortValue, setSortValue] = useState('high-to-low')

  const sampleItems: NewsItem[] = [
    {
      id: '1',
      provider: 'Reuters',
      date: '2025-08-21 09:32',
      impactScore: 9.4,
      outlook: 'positive',
      title: 'Oil prices climb 2% on drop in US crude inventories as investors focus on Ukraine peace push',
      content: '',
    },
    {
      id: '2',
      provider: 'Bloomberg',
      date: '2025-08-21 08:15',
      impactScore: 8.8,
      outlook: 'positive',
      title: 'Oil prices climb 2% on drop in US crude inventories as investors focus on Ukraine peace push',
      content: '',
    },
    {
      id: '3',
      provider: 'Financial Times',
      date: '2025-08-21 07:30',
      impactScore: 8.2,
      outlook: 'neutral',
      title: 'War or peace? For oil markets, the Ukraine outcome is insignificant',
      content: '',
    },
    {
      id: '4',
      provider: 'Reuters',
      date: '2025-08-21 06:45',
      impactScore: 8.0,
      outlook: 'positive',
      title: 'China Scoops Up Russian Crude Amid U.S. Pressure on India',
      content: '',
    },
    {
      id: '5',
      provider: 'OilPrice.com',
      date: '2025-08-21 05:20',
      impactScore: 7.9,
      outlook: 'negative',
      title: 'Most Gulf bourses subdued on falling oil prices',
      content: '',
    },
    {
      id: '6',
      provider: 'AP News',
      date: '2025-08-21 04:10',
      impactScore: 7.6,
      outlook: 'positive',
      title: 'Chevron Returns to Iraq with New Deal Covering Exploration and Field Development',
      content: '',
    },
    {
      id: '7',
      provider: 'Reuters',
      date: '2025-08-21 03:25',
      impactScore: 7.5,
      outlook: 'positive',
      title: 'Chinese refiners sweep up Russian oil after Indian demand falls, analysts say',
      content: '',
    },
    {
      id: '8',
      provider: 'Bloomberg',
      date: '2025-08-21 02:40',
      impactScore: 7.3,
      outlook: 'negative',
      title: 'Sinopec interim profit lowest in five years on weaker fuel demand',
      content: '',
    },
    {
      id: '9',
      provider: 'Financial Times',
      date: '2025-08-21 01:55',
      impactScore: 7.2,
      outlook: 'positive',
      title: 'India\'s state-run refiners have returned to buying Russian oil after a brief pause',
      content: '',
    },
    {
      id: '10',
      provider: 'OilPrice.com',
      date: '2025-08-21 01:10',
      impactScore: 7.2,
      outlook: 'positive',
      title: 'China\'s Fuel Exports Jump to 13-Month High',
      content: '',
    },
  ]

  const displayItems = items.length > 0 ? items : sampleItems

  return (
    <Card
      elevation={0}
      sx={{
        width: 800,
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <DashboardCardHeader
        icon={newsFeedIcon}
        title="News Feed"
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
              <Typography variant="body3" color="gray.70" sx={{ fontSize: 12 }}>
                3시간 전 업데이트
              </Typography>
            </Stack>
          </Stack>
        }
        padding="17px 15px"
      />
      <FilterSection value={sortValue} onChange={setSortValue} />

      <Box px="24px">
        <Stack gap={0}>
          {displayItems.map((item) => (
            <NewsItem key={item.id} item={item} />
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

export default NewsFeed
