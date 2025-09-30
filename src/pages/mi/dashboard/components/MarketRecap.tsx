import { Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'
import Sentiment from '@/pages/mi/dashboard/components/Sentiment'

const MarketRecap = () => {
  const navigate = useNavigate()

  return (
    <Box padding="12px">
      <SectionHeader title="MARKET RECAP" mb="18px">
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
      <Sentiment />
    </Box>
  )
}

export default MarketRecap
