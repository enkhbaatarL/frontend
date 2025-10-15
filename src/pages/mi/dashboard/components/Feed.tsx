import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SouthAmericaIcon from '@mui/icons-material/SouthAmerica'
import { Box, Divider, Stack, Typography, Collapse, Fade } from '@mui/material'
import { Fragment, ReactNode, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import crudeOilIcon from '@/assets/icons/crude-oil.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import MIButton from '@/components/common/button/MIButton'
import DashboardSelect from '@/pages/mi/dashboard/components/DashboardSelect'
import SentimentIcon from '@/pages/mi/dashboard/components/SentimentIcon'
import Summarizing from '@/pages/mi/dashboard/components/Summarizing'

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
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
    id: '5',
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
    id: '6',
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
    id: '7',
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
    id: '8',
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
    id: '9',
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
    id: '10',
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
    id: '11',
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
    id: '12',
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
    id: '13',
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
    id: '14',
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
    id: '15',
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

const FeedIconWrapper = ({ children, padding = '0' }: { children: ReactNode; padding?: string }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    borderRadius="4px"
    bgcolor="white"
    border="1px solid"
    borderColor="content.borderEnabled"
    height={26}
    minWidth={26}
    boxSizing="border-box"
    padding={padding}
  >
    {children}
  </Stack>
)

const FeedItem = ({ item }: { item: (typeof sampleItems)[0] }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<{ title: string; summary: string[] } | null>(null)
  const { t, i18n } = useTranslation()

  const summary = useMemo(
    () => ({
      title: t('dashboard.sampleData.feed.summary.title'),
      summary: [
        t('dashboard.sampleData.feed.summary.summary.0'),
        t('dashboard.sampleData.feed.summary.summary.1'),
        t('dashboard.sampleData.feed.summary.summary.2'),
        t('dashboard.sampleData.feed.summary.summary.3'),
        t('dashboard.sampleData.feed.summary.summary.4'),
      ].filter(Boolean),
    }),
    [t, i18n.language],
  )

  // 언어 변경 시 summary 초기화 (일본어 데모 대응 임시 코드)
  useEffect(() => {
    setAiSummary(null)
    setIsExpanded(false)
  }, [i18n.language])

  const handleClick = () => {
    if (!aiSummary) {
      setIsExpanded(true)
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setAiSummary(summary)
      }, 1000)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <Stack
      padding="12px 18px"
      borderRadius="10px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        backgroundColor: isExpanded ? '#F0F3F6' : 'transparent',
        '&:hover': {
          backgroundColor: '#F0F3F6',
        },
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      <Stack direction="row" gap="8px">
        {getFeedIcon(item.type) && (
          <FeedIconWrapper>
            <Box component="img" width={22} height={22} src={getFeedIcon(item.type)} alt={item.type} />
          </FeedIconWrapper>
        )}
        {item.isGlobal && (
          <FeedIconWrapper padding="6px 8px 6px 6px">
            <Stack direction="row" alignItems="center" gap="4px">
              <SouthAmericaIcon sx={{ fontSize: 16, color: 'content.iconEnabled' }} />
              <Typography variant="labelText" color="content.textNormal">
                Global
              </Typography>
            </Stack>
          </FeedIconWrapper>
        )}
        {item.sentiment && (
          <FeedIconWrapper>
            <SentimentIcon sentiment={item.sentiment} impact={item.impact} />
          </FeedIconWrapper>
        )}
        {!!item.impactScore && (
          <FeedIconWrapper padding="6px 8px">
            <Typography variant="body2SB14" color="content.textNormal">
              {item.impactScore}
            </Typography>
          </FeedIconWrapper>
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

      <Collapse
        in={isExpanded}
        timeout={300}
        sx={{
          '& .MuiCollapse-wrapper': {
            transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          },
        }}
      >
        <Box>
          {isLoading ? (
            <Box pr="24px">
              <Summarizing />
            </Box>
          ) : (
            <Box>
              <Fade in={!!aiSummary} timeout={800}>
                <Stack pt="10px" gap="6px">
                  <Typography variant="body1B16" color="content.textNormal">
                    {aiSummary?.title}
                  </Typography>
                  <Stack pl="22px">
                    {aiSummary?.summary.map((summary, index) => (
                      <Typography
                        key={index}
                        variant="body1M16"
                        color="content.textNormal"
                        lineHeight={1.4}
                        sx={{
                          textIndent: '-14px',
                          '&::before': {
                            content: '"•"',
                            marginRight: '6px',
                            color: 'gray.70',
                          },
                        }}
                      >
                        {summary}
                      </Typography>
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" mt="14px">
                    <Stack direction="row" alignItems="center" boxSizing="border-box" gap="4px">
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Subtext' }} />
                      <Typography variant="subtext2" color="contentText.Subtext">
                        {t('dashboard.feed.summary.aiDescription')}
                      </Typography>
                    </Stack>
                    <MIButton
                      width="100%"
                      color="gray"
                      type="outlined"
                      contentType="text"
                      size="h28"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtext3" color="content.textNormal">
                          View Original
                        </Typography>
                      </Box>
                    </MIButton>
                  </Stack>
                </Stack>
              </Fade>
            </Box>
          )}
        </Box>
      </Collapse>
    </Stack>
  )
}

const Feed = () => {
  const [filter1, setFilter1] = useState(filter1Options[0].value)
  const [filter2, setFilter2] = useState(filter2Options[0].value)
  const [filter3, setFilter3] = useState(filter3Options[0].value)

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
          <DashboardSelect
            variant="outlined"
            selectType="none"
            selected={filter1}
            onSelected={setFilter1}
            items={filter1Options}
            sx={{ minWidth: 140 }}
            menuPosition="left"
          />
          <DashboardSelect
            variant="outlined"
            selectType="none"
            selected={filter2}
            onSelected={setFilter2}
            items={filter2Options}
            sx={{ minWidth: 100 }}
          />
          <DashboardSelect
            variant="outlined"
            selectType="none"
            selected={filter3}
            onSelected={setFilter3}
            items={filter3Options}
            sx={{ minWidth: 110 }}
          />
        </Stack>
      </Stack>
      <Stack py="12px">
        {sampleItems.map((item, index) => (
          <Fragment key={item.id}>
            {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
            <FeedItem item={item} />
          </Fragment>
        ))}
      </Stack>
      <Box padding="6px 0 18px">
        <MIButton width="100%" color="gray" type="outlined" contentType="text" size="h42" onClick={() => {}}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" color="gray.90" fontWeight={600}>
              Load more
            </Typography>
          </Box>
        </MIButton>
      </Box>
    </Stack>
  )
}

export default Feed
