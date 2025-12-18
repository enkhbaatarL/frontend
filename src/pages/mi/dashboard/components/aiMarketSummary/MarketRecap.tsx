import { Box, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import Checkpoints from '@/pages/mi/dashboard/components/aiMarketSummary/Checkpoints'
import Highlights from '@/pages/mi/dashboard/components/aiMarketSummary/Highlights'
import Sentiment from '@/pages/mi/dashboard/components/aiMarketSummary/Sentiment'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import dashboardService from '@/service/mi/dashboard'

const MarketRecap = () => {
  const { data: marketRecap } = useQuery({
    queryKey: ['getMarketRecap'],
    queryFn: async () => await dashboardService.getMarketRecap(),
  })

  return (
    <Box padding="12px">
      <SectionHeader title="Market Recap" link="/mi/ai-market-summary" mb="10px" bold />
      <Stack py="12px" gap="24px">
        <Sentiment sentiments={marketRecap?.sentiments} />
        <Highlights highlights={marketRecap?.highlights} />
        <Checkpoints checkpoints={marketRecap?.checkpoints} />
      </Stack>
    </Box>
  )
}

export default MarketRecap
