import SettingsIcon from '@mui/icons-material/Settings'
import { Box, Stack, Typography, Switch, Collapse, Fade } from '@mui/material'
import { useState, useRef } from 'react'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import crudeOilIcon from '@/assets/icons/crude-oil.png'
import defaultIcon from '@/assets/icons/default.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import MIMenu from '@/components/common/menu/MIMenu'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import DashboardCard, { DashboardCardRef } from '@/pages/mi/dashboard/components/common/DashboardCard'
import Feed from '@/pages/mi/dashboard/components/newsFeed/Feed'
import Timeline from '@/pages/mi/dashboard/components/newsFeed/Timeline'

const marketsOptions: SelectMenuItem[] = [
  {
    group: 'market',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={crudeOilIcon} alt="crude oil" /> Crude Oil
      </Stack>
    ),
    value: 'crude-oil',
  },
  {
    group: 'market',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={lngIcon} alt="lng" /> Natural Gas
      </Stack>
    ),
    value: 'natural-gas',
  },
  {
    group: 'market',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={semiconductorIcon} alt="semiconductor" /> Semiconductor
      </Stack>
    ),
    value: 'semiconductor',
  },
  {
    group: 'market',
    label: (
      <Stack direction="row" alignItems="center" gap="6px">
        <Box component="img" width={22} height={22} src={evBatteryIcon} alt="ev battery" /> EV Battery
      </Stack>
    ),
    value: 'ev-battery',
  },
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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const dashboardCardRef = useRef<DashboardCardRef>(null)
  const [selectedMarket, setSelectedMarket] = useState<string>(marketsOptions[0].value)

  const [displayStates, setDisplayStates] = useState<{ [key: string]: boolean }>({
    timeline: true,
    feed: true,
  })

  const handleItemClick = async (id: string) => {
    setSelectedItemId(null)
    // DashboardCard가 펼쳐질 때까지 기다린 후 스크롤 시작
    await dashboardCardRef.current?.expand()
    setSelectedItemId(id)
  }

  const handleSwitchToggle = (value: string) => {
    setDisplayStates((prev) => ({
      ...prev,
      [value]: !prev[value],
    }))
  }

  return (
    <DashboardCard
      ref={dashboardCardRef}
      icon={newsFeedIcon}
      title="News Feed"
      link="/mi/news-list"
      headerContent={
        <Stack direction="row" gap="8px">
          <MISelectMenu
            variant="outlined"
            selected={selectedMarket}
            onSelected={setSelectedMarket}
            items={marketsOptions}
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
            <Timeline my="12px" onItemClick={handleItemClick} />
          </Box>
        </Fade>
      </Collapse>
      <Feed selectedItemId={selectedItemId} onItemHighlighted={() => setSelectedItemId(null)} />
    </DashboardCard>
  )
}

export default NewsFeed
