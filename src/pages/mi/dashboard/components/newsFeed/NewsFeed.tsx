import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Stack, Typography, Switch, Collapse, Fade } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import useCodeData from '@/hooks/useCodeData'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import Feed from '@/pages/mi/dashboard/components/newsFeed/Feed'
import Timeline from '@/pages/mi/dashboard/components/newsFeed/Timeline'
import dashboardService, { DirectionType } from '@/service/mi/dashboard'
import { getMarketIconInfo } from '@/utils/marketIcons'

const switchOptions: SelectMenuItem[] = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Feed', value: 'feed', disabled: true },
]

const feedOrderOptions: SelectMenuItem[] = [
  { label: 'Highest', value: 'HIGHEST' },
  { label: 'Lowest', value: 'LOWEST' },
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Oldest', value: 'OLDEST' },
]

const SettingsMenuItem = ({
  item: { label, value, disabled },
  isDisplayed,
  onToggle,
}: {
  item: SelectMenuItem
  isDisplayed: boolean
  onToggle: (value: string) => void
}) => (
  <Box
    key={value}
    onClick={() => (disabled ? null : onToggle(value))}
    borderRadius="10px"
    py="4px"
    sx={{
      cursor: disabled ? 'default' : 'pointer',
      textWrap: 'nowrap',
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" gap="12px" component="div">
      <Typography
        variant="body2M14"
        color={isDisplayed ? 'gray.70' : 'gray.60'}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </Typography>
      <Switch
        checked={isDisplayed}
        size="small"
        disabled={disabled}
        sx={{
          margin: 0,
        }}
      />
    </Stack>
  </Box>
)

interface Props {
  criteriaDate?: string
}

const NewsFeed = ({ criteriaDate }: Props) => {
  const [categoryCode, setCategoryCode] = useState<string>('')
  const [sentiments, setSentiments] = useState<DirectionType[]>([])
  const [impactScores, setImpactScores] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sort, setSort] = useState<string>(feedOrderOptions[0].value)

  const [displayStates, setDisplayStates] = useState<{ [key: string]: boolean }>({
    timeline: true,
    feed: true,
  })

  const { marketCategoryCodeList } = useCodeData()

  const { data: timelineItems, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['timeline', categoryCode, criteriaDate],
    queryFn: async () => await dashboardService.getTimeline(categoryCode, criteriaDate!),
    enabled: !!categoryCode && !!criteriaDate,
  })

  const { data: newsFeedItems, isLoading: isNewsFeedLoading } = useQuery({
    queryKey: ['newsFeed', categoryCode, sort, sentiments.join(','), impactScores.join(','), regions.join(','), criteriaDate],
    queryFn: async () =>
      await dashboardService.getNewsFeed(
        categoryCode,
        {
          sort,
          sentiments,
          impactScores,
          regions,
        },
        criteriaDate!,
      ),
    enabled: !!categoryCode && !!criteriaDate,
  })

  const marketCategoryCodeOptions = useMemo(
    (): SelectMenuItem[] => [
      ...(marketCategoryCodeList
        ?.map((code) => {
          const { icon, label } = getMarketIconInfo(code.codeId)

          return {
            group: 'marketCategory',
            icon: <Box component="img" width={22} height={22} src={icon} alt={code.codeId} />,
            label,
            value: code.codeId,
          }
        })
        .filter(({ label }) => label !== null) ?? []),
    ],
    [marketCategoryCodeList],
  )

  const handleSwitchToggle = (value: string) => {
    setDisplayStates((prev) => ({
      ...prev,
      [value]: !prev[value],
    }))
  }

  const handleApplyFilters = (newSentiments: DirectionType[], newImpactScores: string[], newRegions: string[], save?: boolean) => {
    setSentiments(newSentiments)
    setImpactScores(newImpactScores)
    setRegions(newRegions)

    if (save) {
      localStorage.setItem(
        'newsFeedFilters',
        JSON.stringify({ sentiments: newSentiments, impactScores: newImpactScores, regions: newRegions }),
      )
    } else {
      localStorage.removeItem('newsFeedFilters')
    }
  }

  useEffect(() => {
    if (marketCategoryCodeOptions.length > 0 && !isInitialized) {
      setCategoryCode(marketCategoryCodeOptions[0].value)

      const savedFilters = localStorage.getItem('newsFeedFilters')

      if (savedFilters) {
        const { sentiments: savedSentiments, impactScores: savedImpactScores, regions: savedRegions } = JSON.parse(savedFilters)

        setSentiments(savedSentiments)
        setImpactScores(savedImpactScores)
        setRegions(savedRegions)
      }

      setIsInitialized(true)
    }
  }, [marketCategoryCodeOptions, isInitialized])

  return (
    <DashboardCard
      icon={newsFeedIcon}
      title="News Feed"
      link="/mi/market-news"
      headerContent={
        <Stack direction="row" gap="8px">
          <MISelectMenu
            variant="outlined"
            selected={categoryCode}
            onSelected={setCategoryCode}
            items={marketCategoryCodeOptions}
            sx={{ minWidth: 148, height: '36px' }}
            groupDisplayType="divider"
            enableHoverBackground
          />
          <MIMenu
            open={isSettingsMenuOpen}
            label={<SettingsIcon sx={{ width: 20, height: 20, color: 'gray.70' }} />}
            variant="outlined"
            placement="bottom-end"
            menuPositionOffset={{ right: -10 }}
            onOpenChange={setIsSettingsMenuOpen}
            enableHoverBackground
            sx={{
              height: '36px',
              padding: '8px',
            }}
          >
            <Stack padding="12px" gap="12px" minWidth={154} boxSizing="border-box">
              {switchOptions.map((item) => (
                <SettingsMenuItem key={item.value} item={item} isDisplayed={displayStates[item.value]} onToggle={handleSwitchToggle} />
              ))}
            </Stack>
          </MIMenu>
        </Stack>
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={1300}
      gap={0}
    >
      <Collapse
        in={displayStates.timeline}
        timeout={400}
        sx={{
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <Fade
          in={displayStates.timeline}
          timeout={300}
          style={{
            transitionDelay: displayStates.timeline ? '100ms' : '0ms',
          }}
        >
          <Box mb="24px">
            <Timeline my="12px" timeLineItems={timelineItems} loading={isTimelineLoading} />
          </Box>
        </Fade>
      </Collapse>
      <Feed
        newsFeedItems={newsFeedItems}
        onApplyFilters={handleApplyFilters}
        appliedFiltersCount={[...sentiments, ...impactScores, ...regions].length}
        initialFilters={{ sentiments, impactScores, regions }}
        order={sort}
        orderOptions={feedOrderOptions}
        onOrderChange={setSort}
        isLoading={isNewsFeedLoading}
      />
    </DashboardCard>
  )
}

export default NewsFeed
