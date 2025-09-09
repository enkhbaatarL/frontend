import { Box, Card, Stack, Typography, Chip } from '@mui/material'

import SectionHeader from './SectionHeader'

const SmallBadge = ({ label }: { label: string }) => (
  <Chip
    label={
      <Typography
        component="span"
        sx={{
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.4,
          color: '#FFFFFF',
        }}
      >
        {label}
      </Typography>
    }
    sx={{
      width: 30,
      height: 18,
      backgroundColor: '#868E96',
      borderRadius: '4px',
      '& .MuiChip-label': {
        padding: 0,
        overflow: 'unset',
      },
    }}
  />
)

interface EconomicIndicator {
  id: string
  country: string
  name: string
  actual: string
  forecast: string
  previous: string
}

const EconomicIndicatorItem = ({ item }: { item: EconomicIndicator }) => (
  <Box display="flex" alignItems="center" padding="4px" borderBottom="0.5px solid #DEE2E6" gap={'8px'}>
    <Box display="flex" alignItems="center" gap={'6px'} flex={1}>
      <SmallBadge label={item.country} />
      <Typography variant="body2" color="gray.70">
        {item.name}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color="gray.90" sx={{ fontWeight: 500 }}>
        {item.actual}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color="gray.70" sx={{ fontWeight: 500 }}>
        {item.forecast}
      </Typography>
    </Box>
    <Box width={70} textAlign="right">
      <Typography variant="body2" color="gray.70" sx={{ fontWeight: 500 }}>
        {item.previous}
      </Typography>
    </Box>
  </Box>
)

interface KeyEconomicIndicatorsProps {
  indicators?: EconomicIndicator[]
  summary?: string[]
}

const KeyEconomicIndicators = ({ indicators = [], summary = [] }: KeyEconomicIndicatorsProps) => {
  // 샘플 데이터
  const sampleIndicators: EconomicIndicator[] = [
    {
      id: 'e1',
      country: 'GBR',
      name: 'U.K. CPI YoY (Jul)',
      actual: '3.8%',
      forecast: '3.7%',
      previous: '3.6%',
    },
    {
      id: 'e2',
      country: 'JPN',
      name: 'Japan Trade Balance (Jul)',
      actual: '-1175억 엔',
      forecast: '-',
      previous: '1531억 엔',
    },
    {
      id: 'e3',
      country: 'EUR',
      name: 'Eurozone CPI (Final, Jul)',
      actual: '2.0%',
      forecast: '2.0%',
      previous: '2.0%',
    },
  ]

  const sampleSummary = [
    '가격 모멘텀: API의 예상초과 재고 감소로 단기 상방이나, 중월 커브 약세·공급증가 시그널로 중기 하방 리스크가 더 두드러짐.',
    '거시 변수: 英 물가 서프라이즈 → 파운드 강세/달러 약세 가능성은 달러표시 유가에 우호하나, 유럽 물가 안정은 수요 측면에서 중립적.',
    '수요/무역: 일본의 7월 무역적자는 아시아 지역 수요 온도 하락 신호—특히 자동차·자본재 흐름 둔화 시 제품 수요/정제 마진에 부담',
  ]

  const displayIndicators = indicators.length > 0 ? indicators : sampleIndicators
  const displaySummary = summary.length > 0 ? summary : sampleSummary

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #DEE2E6',
        borderRadius: '4px',
        padding: '12px 10px',
      }}
    >
      <SectionHeader
        title="KEY ECONOMIC INDICATORS"
        tooltipTitle="최근 24시간 내 발표된 주요 경제지표를 집계해 시장에 미치는 영향을 해석합니다. 거시 변수와 시장 간의 연계성을 파악하는 데 활용됩니다."
        marginBottom={'7px'}
      />

      <Box display="flex" alignItems="center" padding="0 4px" borderBottom="0.5px solid #DEE2E6" gap={1}>
        <Box flex={1} />
        <Box width={74} textAlign="right">
          <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
            Actual
          </Typography>
        </Box>
        <Box width={74} textAlign="right">
          <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
            Forecast
          </Typography>
        </Box>
        <Box width={74} textAlign="right">
          <Typography variant="body3" color="gray.70" sx={{ fontSize: 12, fontWeight: 500 }}>
            Previous
          </Typography>
        </Box>
      </Box>

      <Stack gap={'2px'}>
        {displayIndicators.map((item) => (
          <EconomicIndicatorItem key={item.id} item={item} />
        ))}
      </Stack>

      <Box padding="12px 0">
        {displaySummary.map((content, index) => (
          <Typography
            key={`content-${index}`}
            variant="body2"
            color="gray.70"
            sx={{
              lineHeight: 1.4,
              paddingLeft: '21px',
              textIndent: '-16px',
              '&::before': {
                content: '"•"',
                marginRight: '8px',
                color: 'gray.70',
              },
              marginBottom: '1px',
            }}
          >
            {content}
          </Typography>
        ))}
      </Box>
    </Card>
  )
}

export default KeyEconomicIndicators
