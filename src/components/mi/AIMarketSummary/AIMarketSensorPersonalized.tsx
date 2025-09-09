import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, Card, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'

import DashboardCardHeader from './DashboardCardHeader'
import SensorItem, { SensorItemData } from './SensorItem'

import aiMarketSensorIcon from '@/assets/dashboard/ai-market-sensor.svg'
import MIButton from '@/components/common/button/MIButton'
import CategoryChip from '@/components/common/chip/CategoryChip'
interface CategoryChipData {
  id: string
  name: string
  isActive: boolean
  image?: string
}

const CategorySection = () => {
  const [categories, setCategories] = useState<CategoryChipData[]>([
    { id: '1', name: 'Trump Tariff', isActive: true },
    { id: '2', name: 'Fed', isActive: false },
    { id: '3', name: 'OPEC+', isActive: false },
  ])

  const handleCategoryClick = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        isActive: category.id === categoryId,
      })),
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          name={category.name}
          isActive={category.isActive}
          image={category.image}
          onClick={() => handleCategoryClick(category.id)}
        />
      ))}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '0.5px solid #ADB5BD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AddIcon sx={{ fontSize: 24, color: '#ADB5BD' }} />
      </Box>
    </Box>
  )
}

interface AIMarketSensorPersonalizedProps {
  items?: SensorItemData[]
}

const AIMarketSensorPersonalized = ({ items = [] }: AIMarketSensorPersonalizedProps) => {
  const sampleItems: SensorItemData[] = [
    {
      id: '1',
      time: '08:00',
      date: '08-20',
      region: 'Global',
      sources: [{ name: 'KCIF', link: 'https://kcif.com' }],
      title: 'S&P, 관세 수익 반영해 미국 AA+ 신용 등급 유지',
      content: '',
    },
    {
      id: '2',
      time: '06:00',
      date: '08-20',
      region: 'Asia Pacific',
      sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
      title: '인도 중앙은행 "트럼프 관세, 성장 리스크" 경고',
      content: '',
    },
    {
      id: '3',
      time: '05:30',
      date: '08-20',
      region: 'Global',
      sources: [{ name: 'AP News', link: 'https://apnews.com' }],
      outlook: 'negative',
      title: '연준 위원들 "관세가 인플레이션 위험" 우려 표명',
      content: '',
    },
    {
      id: '4',
      time: '05:30',
      date: '08-20',
      region: 'Global',
      sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
      title: '트럼프-푸틴 회담 이후, 관세 중단으로 유가 하방 압력',
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
        title={
          <Box display="flex" alignItems="center" gap="6px">
            <Box>AI Market Sensor</Box>
            <Chip
              label={
                <Typography
                  component="span"
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#495057',
                  }}
                >
                  Personalized
                </Typography>
              }
              sx={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #495057',
                borderRadius: '6px',
                padding: '0 6px',
                height: 'auto',
                '& .MuiChip-label': {
                  padding: 0,
                  overflow: 'unset',
                },
              }}
            />
          </Box>
        }
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
      <Box padding="28px 34px 0">
        <CategorySection />
      </Box>

      <Box padding="10px 14px">
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

export default AIMarketSensorPersonalized
