import { Box, Stack } from '@mui/material'

import AIMarketSummaryItem, { IAIMarketSummaryItem } from './AIMarketSummaryItem'
import SectionHeader from './SectionHeader'

import ideaIcon from '@/assets/dashboard/idea.svg'
import { MarketItem } from '@/service/mi/mainDashboard'

interface StrategyCheckpointsProps {
  items?: MarketItem[]
}

const StrategyCheckpoints = ({ items = [] }: StrategyCheckpointsProps) => (
  <Box>
    <SectionHeader
      title="STRATEGY CHECKPOINTS"
      tooltipTitle="시장 데이터와 뉴스 흐름을 종합해, 단기 대응과 리스크 관리를 위해 확인해야 할 전략 체크리스트를 제공합니다."
    />
    <Stack gap={'18px'}>
      {items.map((item: IAIMarketSummaryItem) => {
        item.iconSrc = ideaIcon

        return <AIMarketSummaryItem key={item.id} item={item} />
      })}
    </Stack>
  </Box>
)

export default StrategyCheckpoints
