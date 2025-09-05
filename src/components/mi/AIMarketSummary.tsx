import { Box, Card, Divider, Stack, Typography } from '@mui/material'

import KeyEconomicIndicators from './AIMarketSummary/KeyEconomicIndicators'
import KeyMetrics from './AIMarketSummary/KeyMetrics'
import MarketRecap from './AIMarketSummary/MarketRecap'
import StrategyCheckpoints from './AIMarketSummary/StrategyCheckpoints'

import GeneratingIcon from '@/components/common/icons/agent/GeneratingIcon'
import { MarketItem } from '@/service/mi/mainDashboard'

// MARKET RECAP 샘플 데이터
const marketRecapSampleItems: MarketItem[] = [
  {
    id: '1',
    title: '미·러·우 평화협상 기대감 재부상으로 전일 유가 하락, 금일 반등',
    summary: [
      '9일 아시아장·글로벌장에서는 우크라이나 전쟁 종식 관련 외교 모멘텀 기대감으로 유가가 소폭 하락(Brent 약 $66.53).',
      '20일 들어 협상 불확실성과 재고 감소 소식이 겹치며 반등. 영향도: Neutral → 단기 변동성 확대.',
    ],
    sources: [
      { name: 'Reuters', link: 'https://reuters.com' },
      { name: 'Investing.com', link: 'https://investing.com' },
      { name: 'Bloomberg', link: 'https://bloomberg.com' },
    ],
    impact: 'neutral',
  },
  {
    id: '2',
    title: 'API: 미 원유 재고 \'주간 240만 배럴 감소\'(8/15 주)',
    summary: [
      '컨센서스(약 120만 배럴 감소) 대비 큰 폭의 감소로 단기 가격 지지 요인.',
      '다만 휘발유·중간유 재고는 증가해 수요 신호는 엇갈림.',
    ],
    sources: [
      { name: 'Argaam', link: 'https://argaam.com' },
      { name: 'Reuters', link: 'https://reuters.com' },
      { name: 'Bloomberg', link: 'https://bloomberg.com' },
    ],
    impact: 'positive',
  },
  {
    id: '3',
    title: '유가 곡선 \'스마일\'(근월·장기>중월) 구조 지속',
    summary: ['EA/EIA의 중기 공급과잉 전망(\'25~\'26년)과 현물 타이트함이 공존.', '중월 구간 프리미엄 축소는 중기 하방 리스크를 시사.'],
    sources: [{ name: 'Reuters', link: 'https://reuters.com' }],
    impact: 'negative',
  },
  {
    id: '4',
    title: '가스 가격: TTF 소폭 상승, JKM 보합권',
    summary: [
      'TTF(ICE Endex Oct\'25)가 약 €31.645/MWh(+0.352), JKM(플랫츠 선물) $10.915/MMBtu로 비교적 안정.',
      '정제 마진·연료 대체 수요에 미치는 영향은 제한적.',
    ],
    sources: [
      { name: 'Investing.com', link: 'https://investing.com' },
      { name: 'Reuters', link: 'https://reuters.com' },
      { name: 'Bloomberg', link: 'https://bloomberg.com' },
    ],
    impact: 'no-clear',
  },
]

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

const AIMarketSummary = ({ lastUpdated = 'Aug 19 09:00 - Aug 20 09:00' }: AIMarketSummaryProps) => (
  <Card
    elevation={0}
    sx={{
      width: 1380,
      border: '1px solid #DEE2E6',
      borderRadius: '4px',
      padding: 0,
    }}
  >
    <Box height={'60px'}>
      <Box p={'15px'} sx={{ borderBottom: '1px solid #DEE2E6' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" gap={'6px'}>
            <GeneratingIcon width={27} height={27} style={{ marginBottom: '-6px' }} />
            <Typography color="gray.90" sx={{ fontWeight: 700, fontSize: 20 }}>
              AI Market Summary
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={'9px'} px={'10px'}>
            <Stack direction="row" alignItems="center" gap={'4px'}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: '#ADB5BD',
                }}
              />
              <Typography variant="body3" color="gray.70" sx={{ fontSize: 12 }}>
                최근 24시간
              </Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body3" color="gray.70" sx={{ fontSize: 12 }}>
              {lastUpdated}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>

    <Box py={'28px'} px={'24px'} sx={{ display: 'flex', gap: '24px' }}>
      <Box display={'flex'} flexDirection={'column'} gap={'22px'} flex={1} width={708}>
        <MarketRecap items={marketRecapSampleItems} />
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
