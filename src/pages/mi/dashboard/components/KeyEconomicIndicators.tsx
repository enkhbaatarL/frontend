import { Box, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { ReactNode, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'

const sampleData = [
  {
    id: 'e1',
    country: 'KR',
    name: 'KOSPI (Final, Aug)',
    for: 'Aug',
    actual: '3.8%',
    forecast: '3.7%',
    previous: '3.6%',
  },
  {
    id: 'e2',
    country: 'JP',
    name: 'Japan Trade Balance (Jul) Japan Trade Balance (Jul)',
    for: 'Jul',
    actual: '-4.1%',
    forecast: '-',
    previous: '-4.1%',
  },
  {
    id: 'e3',
    country: 'EU',
    name: 'Eurozone CPI (Final, Aug)',
    for: 'Aug',
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

const HeaderCell = ({ children, width, textAlign }: { children: ReactNode; width: string; textAlign: TypographyProps['textAlign'] }) => (
  <Typography px="8px" variant="body2SB14" color="gray.60" width={width} boxSizing="border-box" textAlign={textAlign}>
    {children}
  </Typography>
)

const BodyCell = ({ children, width, textAlign }: { children: ReactNode; width: string; textAlign: TypographyProps['textAlign'] }) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsOverflowing(isOverflow)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [children])

  const content = (
    <Typography
      ref={textRef}
      px="8px"
      variant="body2SB14"
      color="gray.70"
      width={width}
      boxSizing="border-box"
      textAlign={textAlign}
      noWrap
      sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
    >
      {children}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={children} placement="top" followCursor>
      {content}
    </Tooltip>
  ) : (
    content
  )
}

const KeyEconomicIndicators = () => {
  const navigate = useNavigate()

  return (
    <Box padding="12px">
      <SectionHeader
        title="Key Economic Indicators"
        tooltipTitle="최근 24시간 내 발표된 주요 경제지표를 집계해 시장에 미치는 영향을 해석합니다. 거시 변수와 시장 간의 연계성을 파악하는 데 활용됩니다."
        mb="10px"
        bold
      >
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/economic-event')
          }}
        >
          Economic Calendar
        </MIButton>
      </SectionHeader>
      <Stack gap="10px">
        <Stack>
          <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
            <HeaderCell width="50px" textAlign="center">
              Ctry.
            </HeaderCell>
            <HeaderCell width="192px" textAlign="left">
              Event
            </HeaderCell>
            <HeaderCell width="50px" textAlign="center">
              For
            </HeaderCell>
            <HeaderCell width="80px" textAlign="right">
              Actual
            </HeaderCell>
            <HeaderCell width="80px" textAlign="right">
              Forecast
            </HeaderCell>
            <HeaderCell width="80px" textAlign="right">
              Prior
            </HeaderCell>
          </Stack>
          {sampleData.map((data, index) => (
            <Stack
              key={`${data.name}-${index}`}
              direction="row"
              alignItems="center"
              height="38px"
              gap="4px"
              borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
            >
              <BodyCell width="50px" textAlign="center">
                {data.country}
              </BodyCell>
              <BodyCell width="192px" textAlign="left">
                {data.name}
              </BodyCell>
              <BodyCell width="50px" textAlign="center">
                {data.for}
              </BodyCell>
              <BodyCell width="80px" textAlign="right">
                {data.actual}
              </BodyCell>
              <BodyCell width="80px" textAlign="right">
                {data.forecast}
              </BodyCell>
              <BodyCell width="80px" textAlign="right">
                {data.previous}
              </BodyCell>
            </Stack>
          ))}
        </Stack>
        <Stack padding="12px 22px" gap="10px">
          {sampleSummary.map((content, index) => (
            <Typography
              key={`content-${index}`}
              variant="body1M16"
              color="gray.70"
              sx={{
                textIndent: '-14px',
                '&::before': {
                  content: '"•"',
                  marginRight: '6px',
                  color: 'gray.70',
                },
              }}
            >
              {content}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export default KeyEconomicIndicators
