import { Box, Card, Chip, Stack } from '@mui/material'
import { useMemo } from 'react'

import DashboardCardHeader from './DashboardCardHeader'
import KeyEconomicIndicators from './KeyEconomicIndicators'
import KeyMetrics from './KeyMetrics'
import MarketRecap from './MarketRecap'

import aiSummaryIcon from '@/assets/dashboard/ai-summary.svg'

// 메인 AI Market Summary 컴포넌트
interface AIMarketSummaryProps {
  lastUpdated?: string
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

const AIMarketSummary = ({ lastUpdated = 'Sep 14 07:00 - Sep 15 07:00' }: AIMarketSummaryProps) => (
  <Card
    elevation={0}
    sx={{
      width: 1380,
      border: '1px solid #DEE2E6',
      borderRadius: '4px',
      padding: 0,
    }}
  >
    <DashboardCardHeader
      icon={aiSummaryIcon}
      title="AI Market Summary"
      updatedTime={
        <Stack direction="row" alignItems="center" gap={'8px'}>
          <UpdatedInfoChip label="24H" color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />
          <UpdatedInfoChip label={lastUpdated} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
        </Stack>
      }
    />
    <Box px="24px" sx={{ display: 'flex', gap: '24px' }}>
      <Box display={'flex'} flexDirection={'column'} gap={'22px'} flex={1} width={708}>
        <MarketRecap />
      </Box>
      <Box display={'flex'} flexDirection={'column'} gap={'11px'} width={600}>
        <KeyMetrics />
        <KeyEconomicIndicators />
      </Box>
    </Box>
  </Card>
)

export default AIMarketSummary
