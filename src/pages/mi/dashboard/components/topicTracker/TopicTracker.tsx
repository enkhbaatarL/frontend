import SouthAmericaIcon from '@mui/icons-material/SouthAmerica'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import topicSampleImg1 from '@/assets/dashboard/temp/topic-sample1.png'
import topicSampleImg2 from '@/assets/dashboard/temp/topic-sample2.png'
// import topicSampleImg3 from '@/assets/dashboard/temp/topic-sample3.png'
import topicSampleImg4 from '@/assets/dashboard/temp/topic-sample4.png'
import topicTrackerIcon from '@/assets/dashboard/topic-tracker.svg'
import MITopic from '@/components/common/topic/MITopic'
import AiSummary, { AiSummaryHandle, AiSummaryData } from '@/pages/mi/dashboard/components/common/AiSummary'
import CategoryChip from '@/pages/mi/dashboard/components/common/CategoryChip'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'

const topics = [
  {
    label: 'All',
    value: '',
  },
  {
    label: 'Trump Tariff',
    value: 'trump_tariff',
    image: topicSampleImg1,
  },
  {
    label: 'OPEC+',
    value: 'opec+',
    image: topicSampleImg2,
  },
  {
    label: 'Sanctions',
    value: 'sanctions',
    image: topicSampleImg4,
  },
  {
    label: 'Federal Reserve',
    value: 'federal_reserve',
    isPending: true,
  },
]

const sampleData = [
  {
    id: 1,
    time: '04:30',
    date: 'Sep 23',
    topic: 'sanctions',
    region: 'Europe',
    title: 'How Russia\'s Sanctions Evasion Could Create Lasting Costs',
    source: 'The New York Times',
    publishedAt: 'September 23, 2025 at 04:40 AM',
  },
  {
    id: 2,
    time: '04:00',
    date: 'Sep 23',
    topic: 'trump_tariff',
    region: 'North America',
    title: 'Trump\'s Tariffs Are Damaging America\'s Biggest Foreign Source of Screws',
    source: 'Reuters',
    publishedAt: 'September 23, 2025 at 04:00 AM',
  },
  {
    id: 3,
    time: '02:00',
    date: 'Sep 23',
    topic: 'opec+',
    region: 'Middle East',
    title: 'What\'s The Real Reason Behind OPEC\'s Surprise Oil Production Boost',
    source: 'OilPrice.com',
    publishedAt: 'September 23, 2025 at 02:00 AM',
  },
  {
    id: 4,
    time: '01:15',
    date: 'Sep 23',
    topic: 'trump_tariff',
    region: 'Asia',
    title: 'India can shrug off Donald Trump\'s tariffs',
    source: 'Reuters',
    publishedAt: 'September 23, 2025 at 01:15 AM',
  },
  {
    id: 5,
    time: '17:50',
    date: 'Sep 22',
    topic: 'trump_tariff',
    region: 'Global',
    title: 'Trump\'s tariffs, deportations and climate change are making groceries more expensive',
    source: 'Reuters',
    publishedAt: 'September 22, 2025 at 17:50 PM',
  },
  {
    id: 6,
    time: '10:30',
    date: 'Sep 22',
    topic: 'trump_tariff',
    region: 'Europe',
    title: 'Plan to slash US steel tariffs shelved hours before Donald Trump\'s UK visit',
    source: 'Reuters',
    publishedAt: 'September 22, 2025 at 10:30 AM',
  },
  {
    id: 7,
    time: '09:00',
    date: 'Sep 22',
    topic: 'opec+',
    region: 'Middle East',
    title: 'Iraq Boosts Oil Exports Amid Ongoing OPEC+ Adjustments',
    source: 'Reuters',
    publishedAt: 'September 22, 2025 at 09:00 AM',
  },
]

const TopicTrackerItem = ({ item }: { item: (typeof sampleData)[0] }) => {
  const aiSummaryRef = useRef<AiSummaryHandle>(null)
  const { t } = useTranslation()

  const getIcon = (topicValue: string) => {
    const topic = topics.find(({ value }) => value === topicValue)
    return topic?.image
  }

  const handleClick = () => {
    aiSummaryRef.current?.toggle()
  }

  // 임시 AI 요약 조회 함수
  const fetchTopicSummary = async (): Promise<AiSummaryData> => {
    const summaryData: AiSummaryData = {
      title: t('dashboard.sampleData.feed.summary.title'),
      summary: [
        t('dashboard.sampleData.feed.summary.summary.0'),
        // t('dashboard.sampleData.feed.summary.summary.1'),
        t('dashboard.sampleData.feed.summary.summary.2'),
        // t('dashboard.sampleData.feed.summary.summary.3'),
        // t('dashboard.sampleData.feed.summary.summary.4'),
      ].filter(Boolean),
    }

    return new Promise<AiSummaryData>((resolve) => {
      setTimeout(() => {
        resolve(summaryData)
      }, 1000)
    })
  }

  return (
    <Stack py="12px" sx={{ cursor: 'pointer', userSelect: 'none' }}>
      <Stack direction="row" onClick={handleClick}>
        <Stack width="60px" alignItems="center" gap="8px" flexShrink={0}>
          <Stack>
            <Typography variant="body1M16" color="contentText.Normal">
              {item.time}
            </Typography>
            <Typography variant="body2M14" color="contentText.Subtext">
              {item.date}
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" component="div" color="contentBorder.Normal" sx={{ flex: 1, width: '1px' }} />
        </Stack>
        <Stack px="8px" flex={1} overflow="hidden">
          <Stack direction="row" gap="8px">
            <CategoryChip>
              <Box component="img" src={getIcon(item.topic) ?? ''} />
            </CategoryChip>
            <CategoryChip padding="6px 8px 6px 6px">
              <Stack direction="row" alignItems="center" gap="4px">
                <SouthAmericaIcon sx={{ fontSize: 16, color: 'content.iconEnabled' }} />
                <Typography variant="labelText" color="content.textNormal">
                  {item.region}
                </Typography>
              </Stack>
            </CategoryChip>
          </Stack>
          <Stack py="12px" gap="4px">
            <Typography
              py="4px"
              variant="heading4"
              fontWeight={500}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {item.title}
            </Typography>
            <Stack direction="row" gap="8px">
              <Typography variant="body2SB14" color="content.textNormal">
                {item.source}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ height: '12px', borderColor: 'contentBorder.Normal' }} />
              <Typography variant="body2SB14" color="content.textNormal">
                {item.publishedAt}
              </Typography>
            </Stack>
          </Stack>
          <AiSummary ref={aiSummaryRef} fetchSummary={fetchTopicSummary} />
        </Stack>
      </Stack>
    </Stack>
  )
}

const TopicTracker = () => {
  const [selectedTopic, setSelectedTopic] = useState(topics[0].value)

  return (
    <DashboardCard
      icon={topicTrackerIcon}
      title="Topic Tracker"
      link="/mi/topic-tracker"
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={630}
      gap="20px"
    >
      <MITopic topics={topics} selectedTopic={selectedTopic} onClick={(topic) => setSelectedTopic(topic.value)} />
      <Stack gap="10px">
        {sampleData.map((item) => (
          <TopicTrackerItem key={item.id} item={item} />
        ))}
      </Stack>
    </DashboardCard>
  )
}

export default TopicTracker
