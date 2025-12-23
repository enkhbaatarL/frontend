import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'

import AiSummaryIcon from '@/assets/dashboard/ai-summary.svg'
import audioFile from '@/assets/dashboard/temp/empty_audio.wav'
import ContentReader from '@/pages/mi/dashboard/components/aiMarketSummary/ContentReader'
import KeyEconomicIndicators from '@/pages/mi/dashboard/components/aiMarketSummary/KeyEconomicIndicators'
import MarketRecap from '@/pages/mi/dashboard/components/aiMarketSummary/MarketRecap'
import Watchlist from '@/pages/mi/dashboard/components/aiMarketSummary/Watchlist'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/common/UpdatedInfoChip'

dayjs.extend(utc)

interface Props {
  period?: string
  dateRange?: string
}

const AIMarketSummary = ({ period, dateRange }: Props) => {
  // UTC 기준으로 날짜 범위 계산
  const { calculatedPeriod, calculatedDateRange } = useMemo(() => {
    const now = dayjs().utc()
    const today = now.startOf('day').add(7, 'hour') // 오늘 07:00 UTC
    const isMonday = now.day() === 1 // 월요일인지 확인

    let startDate: dayjs.Dayjs
    let endDate: dayjs.Dayjs
    let periodValue: string

    if (isMonday) {
      // 월요일이면: 이전 금요일 07:00 ~ 오늘(월요일) 07:00
      startDate = today.subtract(3, 'day') // 3일 전 = 금요일
      endDate = today
      periodValue = '72H'
    } else {
      // 월요일이 아니면: 전일 07:00 ~ 당일 07:00
      startDate = today.subtract(1, 'day')
      endDate = today
      periodValue = '24H'
    }

    const formattedDateRange = `${startDate.format('MMM DD HH:mm')} - ${endDate.format('MMM DD HH:mm')}`

    return {
      calculatedPeriod: periodValue,
      calculatedDateRange: formattedDateRange,
    }
  }, [])

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
          <UpdatedInfoChip label={displayPeriod} color={{ backgroundColor: '#FAEBE3', color: '#B74306' }} />
          <UpdatedInfoChip label={displayDateRange} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
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
}

export default AIMarketSummary
