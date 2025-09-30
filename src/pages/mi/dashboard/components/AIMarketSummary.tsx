import { Box, Card, Chip, Stack } from '@mui/material'
import { useMemo } from 'react'

import DashboardCardHeader from './DashboardCardHeader'
import KeyEconomicIndicators from './KeyEconomicIndicators'
import KeyMetrics from './KeyMetrics'
import MarketRecap from './MarketRecap'
import StrategyCheckpoints from './StrategyCheckpoints'

import aiSummaryIcon from '@/assets/dashboard/ai-summary.svg'
import { MarketItem } from '@/service/mi/dashboard'

// STRATEGY CHECKPOINTS 샘플 데이터
const strategyCheckpointsSampleItems: MarketItem[] = [
  {
    id: 's1',
    title: '단기 변동성 헤지',
    summary: [
      'PI/EIA 주간 재고와 우크라이나 관련 헤드라인에 따른 변동성 확대 가능—콜라(collar)·캘린더 스프레드 중심의 가격 헷지 비중 점검.',
    ],
    sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
  },
  {
    id: 's2',
    title: '중기 베어리시 리스크 대비',
    summary: [
      'OPEC+ 증산 기조와 \'스마일\' 커브는 중월물 약세 신호—Q4~Q1 인수·판매계약(Offtake) 가격 산정 시 커브 리프라이싱 시나리오 반영.',
    ],
    sources: [
      { name: 'Reuters', link: 'https://reuters.com' },
      { name: 'Bloomberg', link: 'https://bloomberg.com' },
    ],
  },
  {
    id: 's3',
    title: '원가/환리스크 관리',
    summary: ['GBP·EUR 변동성 확대(영국 CPI 서프라이즈) 가능—달러 표시 원유 구매 기업은 환헤지(GBP/USD, EUR/USD) 루과 패스스루 점검.'],
    sources: [
      { name: 'Reuters', link: 'https://reuters.com' },
      { name: 'Bloomberg', link: 'https://bloomberg.com' },
    ],
  },
]

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
        <StrategyCheckpoints items={strategyCheckpointsSampleItems} />
      </Box>
      <Box display={'flex'} flexDirection={'column'} gap={'11px'} width={600}>
        <KeyMetrics />
        <KeyEconomicIndicators />
      </Box>
    </Box>
  </Card>
)

export default AIMarketSummary
