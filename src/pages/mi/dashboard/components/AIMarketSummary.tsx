import { Box, Chip, Stack } from '@mui/material'
import { useMemo } from 'react'

import AiSummaryIcon from '@/assets/dashboard/ai-summary.svg'
import ContentReader from '@/pages/mi/dashboard/components/ContentReader'
import DashboardCard from '@/pages/mi/dashboard/components/DashboardCard'
import KeyEconomicIndicators from '@/pages/mi/dashboard/components/KeyEconomicIndicators'
import MarketRecap from '@/pages/mi/dashboard/components/MarketRecap'
import Watchlist from '@/pages/mi/dashboard/components/Watchlist'

interface Props {
  period?: string
  dateRange?: string
}

const UpdatedInfoChip = ({ label, color }: { label: string; color: { backgroundColor: string; color: string } }) => {
  const chipStyle = useMemo(
    () => ({
      backgroundColor: color.backgroundColor,
      color: color.color,
      height: '36px',
      borderRadius: '10px',
      fontSize: 14,
      fontWeight: 500,
    }),
    [color],
  )

  return <Chip label={label} sx={chipStyle} />
}

const AIMarketSummary = ({ period = '24H', dateRange = 'Sep 14 07:00 - Sep 15 07:00' }: Props) => (
  <DashboardCard
    icon={AiSummaryIcon}
    title={
      <Stack direction="row" alignItems="center" gap={'6px'}>
        AI Market Summary
        <Box ml="6px">
          <ContentReader />
        </Box>
      </Stack>
    }
    headerContent={
      <Stack direction="row" alignItems="center" gap={'8px'}>
        <UpdatedInfoChip label={period} color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />
        <UpdatedInfoChip label={dateRange} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
      </Stack>
    }
  >
    <Stack gap="22px" flex={1} width={708}>
      <MarketRecap />
    </Stack>
    <Stack gap="12px" width={600}>
      <Watchlist />
      <KeyEconomicIndicators />
    </Stack>
  </DashboardCard>
)

export default AIMarketSummary
