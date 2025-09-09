import { Box, Stack } from '@mui/material'

import AIMarketSummaryItem, { IAIMarketSummaryItem } from './AIMarketSummaryItem'
import SectionHeader from './SectionHeader'

import negativeIcon from '@/assets/dashboard/negative.svg'
import neutralIcon from '@/assets/dashboard/neutral.svg'
import noClearIcon from '@/assets/dashboard/no-clear.svg'
import positiveIcon from '@/assets/dashboard/positive.svg'
import { MarketItem } from '@/service/mi/dashboard'

type IconType = 'positive' | 'negative' | 'neutral' | 'no-clear'

const getIconSrc = (type: IconType) => {
  switch (type) {
    case 'positive':
      return positiveIcon
    case 'negative':
      return negativeIcon
    case 'neutral':
      return neutralIcon
    case 'no-clear':
      return noClearIcon
    default:
      return noClearIcon
  }
}

interface MarketRecapProps {
  items?: MarketItem[]
}

const MarketRecap = ({ items = [] }: MarketRecapProps) => (
  <Box>
    <SectionHeader
      title="MARKET RECAP"
      tooltipTitle="최근 24시간의 뉴스와 데이터를 분석해, 시장에 영향을 준 핵심 사건들을 간략히 정리합니다."
    />
    <Stack gap={'18px'}>
      {items.map((item: IAIMarketSummaryItem) => {
        item.iconSrc = getIconSrc(item.impact as IconType)

        return <AIMarketSummaryItem key={item.id} item={item} />
      })}
    </Stack>
  </Box>
)

export default MarketRecap
