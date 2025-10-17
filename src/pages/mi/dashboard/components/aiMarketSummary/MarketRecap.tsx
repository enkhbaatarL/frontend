import { Box, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import Checkpoints from '@/pages/mi/dashboard/components/aiMarketSummary/Checkpoints'
import Highlights from '@/pages/mi/dashboard/components/aiMarketSummary/Highlights'
import Sentiment from '@/pages/mi/dashboard/components/aiMarketSummary/Sentiment'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'

const MarketRecap = () => {
  const navigate = useNavigate()

  return (
    <Box padding="12px">
      <SectionHeader title="Market Recap" mb="10px" bold>
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/dashboard/market-recap')
          }}
        >
          Market Recap
        </MIButton>
      </SectionHeader>
      <Stack py="12px" gap="24px">
        <Sentiment />
        <Highlights />
        <Checkpoints />
      </Stack>
    </Box>
  )
}

export default MarketRecap
