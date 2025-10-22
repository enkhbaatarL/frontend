import { Box, Stack } from '@mui/material'

import Checkpoints from '@/pages/mi/dashboard/components/aiMarketSummary/Checkpoints'
import Highlights from '@/pages/mi/dashboard/components/aiMarketSummary/Highlights'
import Sentiment from '@/pages/mi/dashboard/components/aiMarketSummary/Sentiment'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'

const MarketRecap = () => (
  <Box padding="12px">
    <SectionHeader title="Market Recap" link="/mi/dashboard/market-recap" mb="10px" bold />
    <Stack py="12px" gap="24px">
      <Sentiment />
      <Highlights />
      <Checkpoints />
    </Stack>
  </Box>
)

export default MarketRecap
