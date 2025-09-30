import { Box, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { ReactNode, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import MIButton from '@/components/common/button/MIButton'
import SectionHeader from '@/pages/mi/dashboard/components/SectionHeader'

const sampleData = [
  {
    name: 'ICE Brent (USD/bbl)',
    value: '66.34',
    change: '-0.55',
    changePercent: '-0.84%',
    period: 'D',
  },
  {
    name: 'NYMEX WTI (USD/bbl)',
    value: '63.00',
    change: '-1.05',
    changePercent: '-1.69%',
    period: 'W',
  },
  {
    name: 'Dubai Spot (USD/bbl)Dubai Spot (USD/bbl)Dubai Spot (USD/bbl)',
    value: '68.05',
    change: '+0.39',
    changePercent: '+0.10%',
    period: 'M',
  },
  {
    name: 'NYMEX JKM (USD/MMBtu)',
    value: '10.93',
    change: '-0.02',
    changePercent: '-0.18%',
    period: 'Q',
  },
  {
    name: 'ICE TTF (USD/MMBtu)',
    value: '10.69',
    change: '-0.02',
    changePercent: '-0.17%',
    period: 'Q',
  },
  {
    name: 'NYMEX HH (USD/MMBtu)',
    value: '2.27',
    change: '-0.12',
    changePercent: '-4.29%',
    period: 'Q',
  },
  {
    name: 'EU Storage (bcm)',
    value: '62.16',
    change: '+0.27',
    changePercent: '+0.44%',
    period: 'Q',
  },
  {
    name: 'US Permian Wells Drilled',
    value: '431.0',
    change: '-5',
    changePercent: '-1.10%',
    period: 'Q',
  },
  {
    name: 'US Haynesville Wells Drilled',
    value: '38.0',
    change: '-1',
    changePercent: '-1.82%',
    period: 'Q',
  },
  {
    name: 'US Appalachia Wells Drilled',
    value: '65.0',
    change: '-1',
    changePercent: '-2.50%',
    period: 'Q',
  },
  {
    name: 'Singapore Gasoil (USD/ton)',
    value: '720.50',
    change: '+5.20',
    changePercent: '+0.73%',
    period: 'D',
  },
  {
    name: 'Rotterdam Gasoline (USD/ton)',
    value: '680.10',
    change: '-3.40',
    changePercent: '-0.50%',
    period: 'D',
  },
  {
    name: 'Henry Hub Spot (USD/MMBtu)',
    value: '2.35',
    change: '+0.08',
    changePercent: '+3.52%',
    period: 'D',
  },
  {
    name: 'Japan LNG Import (USD/MMBtu)',
    value: '11.20',
    change: '+0.15',
    changePercent: '+1.36%',
    period: 'M',
  },
  {
    name: 'China LNG Import (USD/MMBtu)',
    value: '10.85',
    change: '-0.10',
    changePercent: '-0.91%',
    period: 'M',
  },
]

const HeaderCell = ({ children, width, textAlign }: { children: ReactNode; width: string; textAlign: TypographyProps['textAlign'] }) => (
  <Typography px="8px" variant="body2SB14" color="gray.60" width={width} boxSizing="border-box" textAlign={textAlign}>
    {children}
  </Typography>
)

interface BodyCellProps extends TypographyProps {
  width: string
  textAlign: TypographyProps['textAlign']
  color: TypographyProps['color']
}

const BodyCell = ({ children, width, textAlign, color, ...props }: BodyCellProps) => {
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
      color={color}
      width={width}
      boxSizing="border-box"
      textAlign={textAlign}
      noWrap
      sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
      {...props}
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

const Watchlist = () => {
  const navigate = useNavigate()

  return (
    <Box padding="12px">
      <SectionHeader
        title="Watchlist"
        tooltipTitle="시장에서 가장 중요하게 모니터링되는 가격 및 공급 지표를 제공합니다. 실시간 변동을 통해 시장의 단기 흐름과 가격 방향성을 파악할 수 있습니다."
        mb="10px"
        bold
      >
        <MIButton
          size="h32"
          color="gray"
          type="outlined"
          onClick={() => {
            navigate('/mi/market-data')
          }}
        >
          Market Metrics
        </MIButton>
      </SectionHeader>
      <Stack>
        <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
          <HeaderCell width="276px" textAlign="left">
            Name
          </HeaderCell>
          <HeaderCell width="100px" textAlign="right">
            Price
          </HeaderCell>
          <HeaderCell width="90px" textAlign="right">
            Change
          </HeaderCell>
          <HeaderCell width="90px" textAlign="right">
            Change %
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
            <BodyCell width="34px" textAlign="left" color="gray.70" pr="3px">
              <Stack
                width="20px"
                height="20px"
                color="#FFFFFF"
                borderRadius="50%"
                alignItems="center"
                justifyContent="center"
                fontSize={12}
                sx={{
                  backgroundColor: 'gray.50',
                }}
              >
                {data.period}
              </Stack>
            </BodyCell>
            <BodyCell width="242px" textAlign="left" color="gray.70" pl="3px">
              {data.name}
            </BodyCell>
            <BodyCell width="100px" textAlign="right" color="gray.70">
              {data.value}
            </BodyCell>
            <BodyCell width="90px" textAlign="right" color={data.change.startsWith('-') ? 'decrease' : 'increase'}>
              {data.change}
            </BodyCell>
            <BodyCell width="90px" textAlign="right" color={data.changePercent.startsWith('-') ? 'decrease' : 'increase'}>
              {data.changePercent}
            </BodyCell>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export default Watchlist
