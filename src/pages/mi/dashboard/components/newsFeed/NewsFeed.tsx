import { Box, Stack } from '@mui/material'
import { useState, useRef } from 'react'

import newsFeedIcon from '@/assets/dashboard/news-feed.svg'
import crudeOilIcon from '@/assets/icons/crude-oil.png'
import defaultIcon from '@/assets/icons/default.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import ButtonSelect, { ButtonSelectItem } from '@/components/common/select/ButtonSelect'
import DashboardCard, { DashboardCardRef } from '@/pages/mi/dashboard/components/common/DashboardCard'
import Feed from '@/pages/mi/dashboard/components/newsFeed/Feed'
import Timeline from '@/pages/mi/dashboard/components/newsFeed/Timeline'

const marketsOptions: ButtonSelectItem[] = [
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

const NewsFeed = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const dashboardCardRef = useRef<DashboardCardRef>(null)
  const [selectedMarket, setSelectedMarket] = useState<string>(marketsOptions[0].value)

  const handleItemClick = async (id: string) => {
    setSelectedItemId(null)
    // DashboardCard가 펼쳐질 때까지 기다린 후 스크롤 시작
    await dashboardCardRef.current?.expand()
    setSelectedItemId(id)
  }

  return (
    <DashboardCard
      ref={dashboardCardRef}
      icon={newsFeedIcon}
      title="News Feed"
      link="/mi/news-list"
      headerContent={
        <ButtonSelect
          variant="outlined"
          selected={selectedMarket}
          onSelected={setSelectedMarket}
          items={marketsOptions}
          sx={{ minWidth: 140 }}
          groupDisplayType="divider"
        />
      }
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={1300}
    >
      <Timeline my="12px" onItemClick={handleItemClick} />
      <Feed selectedItemId={selectedItemId} onItemHighlighted={() => setSelectedItemId(null)} />
    </DashboardCard>
  )
}

export default NewsFeed
