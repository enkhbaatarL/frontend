import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Stack, Typography, Switch, Collapse, Fade } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import defaultIcon from '@/assets/icons/default.png'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import Feed from '@/pages/mi/dashboard/components/newsFeed/Feed'
import Timeline from '@/pages/mi/dashboard/components/newsFeed/Timeline'
import codeService from '@/service/common/code'
import dashboardService from '@/service/mi/dashboard'
import { getMarketIconInfo } from '@/utils/marketIcons'

const getMarketCategoryLabel = (codeId: string) => {
  const { icon, label } = getMarketIconInfo(codeId)

  return label === 'Unknown' ? null : (
    <Stack direction="row" alignItems="center" gap="6px">
      <Box component="img" width={22} height={22} src={icon} alt={codeId} /> {label}
    </Stack>
  )
}

const dummyCompaniesOptions: SelectMenuItem[] = [
  {
    group: 'company',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={defaultIcon} alt="all markets" /> Company 1
      </Stack>
    ),
    value: 'company-1',
  },
  {
    group: 'company',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={defaultIcon} alt="all markets" /> Company 2
      </Stack>
    ),
    value: 'company-2',
  },
]

const switchOptions: SelectMenuItem[] = [
  { label: 'Timeline', value: 'timeline' },
  { label: 'Feed', value: 'feed', disabled: true },
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

const NewsFeed = () => {
  const [categoryCode, setCategoryCode] = useState<string>('')

  const [displayStates, setDisplayStates] = useState<{ [key: string]: boolean }>({
    timeline: true,
    feed: true,
  })

  const { data: marketCategoryCode } = useQuery({
    queryKey: ['marketCategoryCode'],
    queryFn: async () => await codeService.getNewsMarketCategoryCode(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: timelineItems } = useQuery({
    queryKey: ['timeline', categoryCode],
    queryFn: async () => await dashboardService.getTimeline(categoryCode),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!categoryCode,
  })

  const { data: newsFeedItems } = useQuery({
    queryKey: ['newsFeed', categoryCode],
    queryFn: async () => await dashboardService.getNewsFeed(categoryCode),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!categoryCode,
  })

  const marketCategoryCodeOptions = useMemo(
    (): SelectMenuItem[] => [
      ...(marketCategoryCode
        ?.map((code) => ({
          group: 'marketCategory',
          label: getMarketCategoryLabel(code.codeId),
          value: code.codeId,
        }))
        .filter(({ label }) => label !== null) ?? []),
      ...dummyCompaniesOptions,
    ],
    [marketCategoryCode],
  )

  const handleSwitchToggle = (value: string) => {
    setDisplayStates((prev) => ({
      ...prev,
      [value]: !prev[value],
    }))
  }

  useEffect(() => {
    if (marketCategoryCodeOptions.length > 0) {
      setCategoryCode(marketCategoryCodeOptions[0].value)
    }
  }, [marketCategoryCodeOptions])

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
            sx={{ minWidth: 148 }}
            groupDisplayType="divider"
          />
          <MIMenu
            label={<SettingsIcon sx={{ width: 20, height: 20, color: 'gray.70' }} />}
            displayType="button"
            variant="outlined"
            menuPosition="right"
            menuPositionOffset={{ right: -10 }}
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
            <Timeline my="12px" timeLineItems={timelineItems} />
          </Box>
        </Fade>
      </Collapse>
      <Feed newsFeedItems={newsFeedItems} />
    </DashboardCard>
  )
}

export default NewsFeed
