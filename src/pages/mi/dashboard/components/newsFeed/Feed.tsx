import SouthAmericaIcon from '@mui/icons-material/SouthAmerica'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { Fragment, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import crudeOilIcon from '@/assets/icons/crude-oil.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import ButtonSelect from '@/components/common/select/ButtonSelect'
import AiSummary, { AiSummaryHandle, AiSummaryData } from '@/pages/mi/dashboard/components/common/AiSummary'
import CategoryChip from '@/pages/mi/dashboard/components/common/CategoryChip'
import SentimentIcon from '@/pages/mi/dashboard/components/common/SentimentIcon'

const filter1Options = [
  {
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={crudeOilIcon} alt="crude oil" /> Crude Oil
      </Stack>
    ),
    value: '1',
  },
  {
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={evBatteryIcon} alt="ev battery" /> EV Battery
      </Stack>
    ),
    value: '2',
  },
  {
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={lngIcon} alt="lng" /> LNG
      </Stack>
    ),
    value: '3',
  },
  {
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={semiconductorIcon} alt="semiconductor" /> Semiconductor
      </Stack>
    ),
    value: '4',
  },
]

const filter2Options = [{ label: 'Filters', value: 'filters' }]

const filter3Options = [{ label: 'Highest', value: 'highest' }]

const sampleItems = [
  {
    id: 'a1B',
    type: 'crudeOil',
    isGlobal: true,
    sentiment: 'positive',
    impact: 'high',
    impactScore: 9.8,
    title: 'How Russia\'s Sanctions Evasion Could Create Lasting Costs',
    description: 'Crude Oil',
    sources: 'Reuters',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'c2D',
    type: 'crudeOil',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 9.7,
    title: 'Oil Gains Amid Prospects of More Sanctions Against Russia',
    description: 'Crude Oil',
    sources: 'Reuters',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'e3F',
    type: 'crudeOil',
    isGlobal: true,
    sentiment: 'positive',
    impact: 'high',
    impactScore: 9.5,
    title: 'Ukraine hits one of Russia\'s largest oil refining complexes with explosive drone attack',
    description: 'Crude Oil',
    sources: 'Reuters',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'g4H',
    type: 'crudeOil',
    isGlobal: true,
    sentiment: 'positive',
    impact: 'high',
    impactScore: 9.5,
    title: 'Ukraine hits one of Russia\'s largest oil refining complexes with explosive drone attack',
    description: 'Crude Oil',
    sources: 'Reuters',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'i5J',
    type: 'other',
    isGlobal: true,
    sentiment: 'neutral',
    impact: 'medium',
    impactScore: 5.2,
    title: 'China - High-Tenacity Filament Yarn Of Aramids - Market Analysis, Forecast, Size, Trends And Insights Please mention',
    description: 'Other',
    sources: 'Reuters',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'k6L',
    type: 'crudeOil',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'medium',
    impactScore: 7.2,
    title: 'Oil Holds Three-Day Gain With Focus on Russian Supply Risks',
    description: 'Crude Oil',
    sources: 'Reuters',
    date: 'September 17, 2025 at 08:35 AM',
  },
  {
    id: 'm7N',
    type: 'dram',
    isGlobal: true,
    sentiment: 'positive',
    impact: 'medium',
    impactScore: 6.8,
    title: 'SK Hynix deploys High NA EUV to lead DRAM market',
    description: 'DRAM',
    sources: 'The Chosunilbo',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'o8P',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'q9R',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 's0T',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'u1V',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'w2X',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'y3Z',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'b4C',
    type: 'lng',
    isGlobal: true,
    sentiment: 'negative',
    impact: 'high',
    impactScore: 6.7,
    title: 'Market Focus: Geopolitics, price volatility shape the path of LNG',
    description: 'LNG',
    sources: 'Oil & Gas Journal',
    date: 'September 17, 2025 at 10:04 AM',
  },
  {
    id: 'd5E',
    type: 'battery',
    isGlobal: true,
    sentiment: 'neutral',
    impact: 'high',
    impactScore: 5.6,
    title: 'EV battery giant CATL\'s earnings outlook brightens as it extends market share',
    description: 'Battery',
    sources: 'South China Morning Post',
    date: 'September 17, 2025 at 10:04 AM',
  },
]

const getFeedIcon = (type: string): string | undefined => {
  switch (type) {
    case 'crudeOil':
      return crudeOilIcon
    case 'evBattery':
      return evBatteryIcon
    case 'lng':
      return lngIcon
    case 'semiconductor':
      return semiconductorIcon
    default:
      return undefined
  }
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return '#3386C2'
    case 'negative':
      return '#A02A74'
    default:
      return '#A8A8A8' // neutral
  }
}

const FeedItem = ({
  item,
  isHighlighted,
  onRefSet,
}: {
  item: (typeof sampleItems)[0]
  isHighlighted?: boolean
  onRefSet?: (ref: HTMLDivElement | null) => void
}) => {
  const [shouldFlash, setShouldFlash] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const aiSummaryRef = useRef<AiSummaryHandle>(null)
  const { t } = useTranslation()

  const sentimentColor = getSentimentColor(item.sentiment)

  useEffect(() => {
    if (isHighlighted) {
      setShouldFlash(true)
      const timer = setTimeout(() => {
        setShouldFlash(false)
      }, 1300)
      return () => clearTimeout(timer)
    } else {
      // 하이라이트가 해제되면 즉시 애니메이션 중지
      setShouldFlash(false)
      return () => {}
    }
  }, [isHighlighted])

  const handleClick = () => {
    setIsExpanded((prev) => !prev)
    aiSummaryRef.current?.toggle()
  }

  // 임시 AI 요약 조회 함수
  const fetchFeedSummary = async (): Promise<AiSummaryData> => {
    const summaryData: AiSummaryData = {
      title: t('dashboard.sampleData.feed.summary.title'),
      summary: [
        t('dashboard.sampleData.feed.summary.summary.0'),
        t('dashboard.sampleData.feed.summary.summary.1'),
        t('dashboard.sampleData.feed.summary.summary.2'),
        t('dashboard.sampleData.feed.summary.summary.3'),
        t('dashboard.sampleData.feed.summary.summary.4'),
      ].filter(Boolean),
    }

    return new Promise<AiSummaryData>((resolve) => {
      setTimeout(() => {
        resolve(summaryData)
      }, 1000)
    })
  }

  return (
    <Stack
      ref={onRefSet}
      padding="12px 18px"
      borderRadius="10px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        backgroundColor: isExpanded ? '#F0F3F6' : 'transparent',
        border: '1px solid transparent',
        boxSizing: 'border-box',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: `2px solid ${sentimentColor}`,
          borderRadius: '10px',
          boxShadow: `0 0 0 1px ${sentimentColor}40, 0 2px 8px ${sentimentColor}30`,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: shouldFlash ? 1 : 0,
          transform: shouldFlash ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        },
        '&:hover': {
          backgroundColor: '#F0F3F6',
        },
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      <Stack direction="row" gap="8px">
        {getFeedIcon(item.type) && (
          <CategoryChip>
            <Box component="img" width={22} height={22} src={getFeedIcon(item.type)} alt={item.type} />
          </CategoryChip>
        )}
        {item.isGlobal && (
          <CategoryChip padding="6px 8px 6px 6px">
            <Stack direction="row" alignItems="center" gap="4px">
              <SouthAmericaIcon sx={{ fontSize: 16, color: 'content.iconEnabled' }} />
              <Typography variant="labelText" color="content.textNormal">
                Global
              </Typography>
            </Stack>
          </CategoryChip>
        )}
        {item.sentiment && (
          <CategoryChip>
            <SentimentIcon sentiment={item.sentiment} impact={item.impact} />
          </CategoryChip>
        )}
        {!!item.impactScore && (
          <CategoryChip padding="6px 8px">
            <Typography variant="body2SB14" color="content.textNormal">
              {item.impactScore}
            </Typography>
          </CategoryChip>
        )}
      </Stack>
      <Stack py="8px">
        <Typography
          py="4px"
          variant="heading4"
          fontWeight={500}
          noWrap
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}
        >
          {item.title}
        </Typography>
        <Stack direction="row" gap="8px">
          <Typography variant="body2SB14" color="content.textNormal">
            {item.sources}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: '12px', borderColor: 'contentBorder.Normal' }} />
          <Typography variant="body2SB14" color="content.textNormal">
            {item.date}
          </Typography>
        </Stack>
      </Stack>
      <AiSummary ref={aiSummaryRef} fetchSummary={fetchFeedSummary} />
    </Stack>
  )
}

const Feed = ({ selectedItemId, onItemHighlighted }: { selectedItemId?: string | null; onItemHighlighted?: () => void }) => {
  const [filter1, setFilter1] = useState(filter1Options[0].value)
  const [filter2, setFilter2] = useState(filter2Options[0].value)
  const [filter3, setFilter3] = useState(filter3Options[0].value)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 선택된 아이템으로 스크롤
  useEffect(() => {
    if (selectedItemId && itemRefs.current[selectedItemId]) {
      const element = itemRefs.current[selectedItemId]
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 하이라이트가 끝난 후 상태 초기화
      const timer = setTimeout(() => {
        onItemHighlighted?.()
      }, 1500)

      return () => clearTimeout(timer)
    } else {
      // selectedItemId가 null이면 즉시 상태 초기화
      onItemHighlighted?.()
      return () => {}
    }
  }, [selectedItemId, onItemHighlighted])

  return (
    <Stack px="12px">
      <Stack direction="row" padding="6px" justifyContent="space-between" alignItems="center">
        <Stack direction="row" gap="8px" height="32px" alignItems="center">
          <Typography variant="sectionTitleTXL" color="black" height="32px">
            Feed
          </Typography>
          <Box padding="6px 8px" borderRadius="100px" boxSizing="border-box" sx={{ backgroundColor: 'gray.30', userSelect: 'none' }}>
            <Typography component="div" variant="body2SB14" color="content.textBlack" textAlign="center">
              102
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap="8px">
          <ButtonSelect
            variant="outlined"
            selectType="none"
            selected={filter1}
            onSelected={setFilter1}
            items={filter1Options}
            sx={{ minWidth: 140 }}
            menuPosition="left"
          />
          <ButtonSelect
            variant="outlined"
            selectType="none"
            selected={filter2}
            onSelected={setFilter2}
            items={filter2Options}
            sx={{ minWidth: 100 }}
          />
          <ButtonSelect
            variant="outlined"
            selectType="none"
            selected={filter3}
            onSelected={setFilter3}
            items={filter3Options}
            sx={{ minWidth: 110 }}
          />
        </Stack>
      </Stack>
      <Stack mt="12px">
        {sampleItems.map((item, index) => (
          <Fragment key={item.id}>
            {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
            <FeedItem
              item={item}
              isHighlighted={selectedItemId === item.id}
              onRefSet={(ref) => {
                itemRefs.current[item.id] = ref
              }}
            />
          </Fragment>
        ))}
      </Stack>
    </Stack>
  )
}

export default Feed
