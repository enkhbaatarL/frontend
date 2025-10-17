import { Box, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { ReactNode, useRef, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MIButton from '@/components/common/button/MIButton'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'

const sampleData = [
  {
    id: 'e1',
    time: '10:00',
    imp: 'High',
    event: 'KOSPI (Final, Aug)',
    for: 'Aug',
    actual: '3.8%',
    forecast: '3.7%',
    previous: '3.6%',
  },
  {
    id: 'e2',
    time: '15:00',
    imp: 'Medium',
    event: 'Japan Trade Balance (Jul) Japan Trade Balance (Jul)',
    for: 'Aug',
    actual: '-4.1%',
    forecast: '-',
    previous: '-4.1%',
  },
  {
    id: 'e3',
    time: '16:30',
    imp: 'Low',
    event: 'Eurozone CPI (Final, Aug)',
    for: 'Jul',
    actual: '2.0%',
    forecast: '2.0%',
    previous: '2.0%',
  },
  {
    id: 'e4',
    time: '20:00',
    imp: 'Medium',
    event: 'China CPI (Aug)',
    for: 'Aug',
    actual: '3.5%',
    forecast: '3.4%',
    previous: '3.3%',
  },
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

type ImportanceLevel = 'High' | 'Medium' | 'Low'

const ImportanceIcon = ({ level }: { level: ImportanceLevel }) => {
  let icon = levelNotRatedIcon
  let alt = 'level-not-rated'

  switch (level) {
    case 'High':
      icon = levelHighIcon
      alt = 'level-high'
      break
    case 'Medium':
      icon = levelMediumIcon
      alt = 'level-medium'
      break
    case 'Low':
      icon = levelLowIcon
      alt = 'level-low'
      break
    default:
      break
  }

  return <img src={icon} width={16} height={16} alt={alt} />
}

const KeyEconomicIndicators = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const sampleSummary = useMemo(
    () =>
      [
        t('dashboard.sampleData.keyEconomicIndicators.sampleSummary.0'),
        t('dashboard.sampleData.keyEconomicIndicators.sampleSummary.1'),
        t('dashboard.sampleData.keyEconomicIndicators.sampleSummary.2'),
      ].filter(Boolean),
    [t],
  )

  return (
    <Box padding="12px">
      <SectionHeader title="Key Economic Indicators" tooltipTitle={t('dashboard.keyEconomicIndicators.tooltipTitle')} mb="10px" bold>
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
            <HeaderCell width="60px" textAlign="center">
              Time
            </HeaderCell>
            <HeaderCell width="44px" textAlign="center">
              Imp.
            </HeaderCell>
            <HeaderCell width="150px" textAlign="left">
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
              key={data.id}
              direction="row"
              alignItems="center"
              height="38px"
              gap="4px"
              borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
              sx={{
                '&:hover': {
                  backgroundColor: '#F8F9FA',
                },
                cursor: 'pointer',
              }}
            >
              <BodyCell width="60px" textAlign="center">
                {data.time}
              </BodyCell>
              <Stack width="44px" justifyContent="center" alignItems="center">
                <ImportanceIcon level={data.imp as ImportanceLevel} />
              </Stack>
              <BodyCell width="150px" textAlign="left">
                {data.event}
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
