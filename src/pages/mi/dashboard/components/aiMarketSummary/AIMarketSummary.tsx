import { Box, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'

import AiSummaryIcon from '@/assets/dashboard/ai-summary.svg'
import audioFile from '@/assets/dashboard/temp/empty_audio.wav'
import useCodeData from '@/hooks/useCodeData'
import ContentReader from '@/pages/mi/dashboard/components/aiMarketSummary/ContentReader'
import KeyEconomicIndicators from '@/pages/mi/dashboard/components/aiMarketSummary/KeyEconomicIndicators'
import MarketRecap from '@/pages/mi/dashboard/components/aiMarketSummary/MarketRecap'
import Watchlist from '@/pages/mi/dashboard/components/aiMarketSummary/Watchlist'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/common/UpdatedInfoChip'
import dashboardService from '@/service/mi/dashboard'

dayjs.extend(utc)

interface Props {
  period?: string
  dateRange?: string
  criteriaDate?: string
  defaultCategoryCode?: string
}

const AIMarketSummary = ({ period, dateRange, criteriaDate, defaultCategoryCode: propDefaultCategoryCode }: Props) => {
  const { marketCategoryCodeList } = useCodeData()

  // newsMarketCategoryCode가 있으면 사용, 없으면 첫 번째 카테고리 사용
  const defaultCategoryCode = useMemo(() => {
    if (propDefaultCategoryCode) {
      return propDefaultCategoryCode
    }

    if (marketCategoryCodeList && marketCategoryCodeList.length > 0) {
      return marketCategoryCodeList[0].codeId
    }

    return ''
  }, [propDefaultCategoryCode, marketCategoryCodeList])

  const { data: marketRecap } = useQuery({
    queryKey: ['getMarketRecap', defaultCategoryCode, criteriaDate],
    queryFn: async () => await dashboardService.getMarketRecap(defaultCategoryCode, criteriaDate!),
    enabled: !!defaultCategoryCode && !!criteriaDate,
  })

  // analysisFrequency와 analysisPeriod를 사용해서 날짜 범위 계산
  const { calculatedPeriod, calculatedDateRange } = useMemo(() => {
    if (marketRecap?.analysisFrequency && marketRecap?.analysisPeriod && marketRecap.analysisPeriod.length >= 2) {
      const startTimestamp = Number.parseInt(marketRecap.analysisPeriod[0], 10)
      const endTimestamp = Number.parseInt(marketRecap.analysisPeriod[1], 10)

      const startDate = dayjs(startTimestamp).utc()
      const endDate = dayjs(endTimestamp).utc()

      const formattedDateRange = `${startDate.format('MMM DD HH:mm')} - ${endDate.format('MMM DD HH:mm')}`

      return {
        calculatedPeriod: marketRecap.analysisFrequency,
        calculatedDateRange: formattedDateRange,
      }
    }

    return {
      calculatedPeriod: '',
      calculatedDateRange: '',
    }
  }, [marketRecap?.analysisFrequency, marketRecap?.analysisPeriod])

  const displayPeriod = period || calculatedPeriod
  const displayDateRange = dateRange || calculatedDateRange

  return (
    <DashboardCard
      icon={AiSummaryIcon}
      title={
        <Stack direction="row" alignItems="center" gap={'6px'}>
          AI Market Summary
          <Box ml="6px">
            <ContentReader audioUrl={audioFile} />
          </Box>
        </Stack>
      }
      headerContent={
        <Stack direction="row" alignItems="center" gap={'8px'}>
          {displayPeriod && <UpdatedInfoChip label={displayPeriod} color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />}
          {displayDateRange && <UpdatedInfoChip label={displayDateRange} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />}
        </Stack>
      }
    >
      <Stack gap="22px" flex={1} width={708}>
        <MarketRecap marketRecap={marketRecap} />
      </Stack>
      <Stack gap="12px" width={600}>
        <Watchlist />
        <KeyEconomicIndicators criteriaDate={criteriaDate} defaultCategoryCode={defaultCategoryCode} />
      </Stack>
    </DashboardCard>
  )
}

export default AIMarketSummary
