import { Box, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import useCodeData from '@/hooks/useCodeData'
import Checkpoints from '@/pages/mi/dashboard/components/aiMarketSummary/Checkpoints'
import Highlights from '@/pages/mi/dashboard/components/aiMarketSummary/Highlights'
import Sentiment from '@/pages/mi/dashboard/components/aiMarketSummary/Sentiment'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import dashboardService from '@/service/mi/dashboard'

interface MarketRecapProps {
  categoryCode?: string
}

const MarketRecap = ({ categoryCode }: MarketRecapProps) => {
  const { marketCategoryCodeList } = useCodeData()

  // categoryCode가 없으면 첫 번째 카테고리 사용
  const defaultCategoryCode = useMemo(() => {
    if (categoryCode) return categoryCode
    if (marketCategoryCodeList && marketCategoryCodeList.length > 0) {
      return marketCategoryCodeList[0].codeId
    }

    return ''
  }, [categoryCode, marketCategoryCodeList])

  const { data: marketRecap } = useQuery({
    queryKey: ['getMarketRecap', defaultCategoryCode],
    queryFn: async () => await dashboardService.getMarketRecap(defaultCategoryCode),
    enabled: !!defaultCategoryCode,
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
