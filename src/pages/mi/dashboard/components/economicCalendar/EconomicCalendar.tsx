import { Stack, Typography, TypographyProps, Tooltip, Chip } from '@mui/material'
import { ReactNode, useRef, useState, useEffect } from 'react'

import economicCalendarIcon from '@/assets/dashboard/economic-calendar.svg'
import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/common/UpdatedInfoChip'

const filterOptions = [{ label: 'Filters', value: 'filters' }]

const sampleData = [
  {
    id: 'e1',
    time: '10:00',
    imp: 'Medium',
    event: 'Imports (YoY)',
    actual: '-4.1%',
    forecast: '-4.0%',
    previous: '3.3%',
  },
  {
    id: 'e2',
    time: '11:00',
    imp: 'Medium',
    event: 'Exports (YoY)',
    actual: '2.5%',
    forecast: '2.0%',
    previous: '1.7%',
  },
  {
    id: 'e3',
    time: '12:00',
    imp: 'Medium',
    event: 'Trade Balance',
    actual: '$1.5B',
    forecast: '$1.8B',
    previous: '$2.1B',
  },
  {
    id: 'e4',
    time: '13:00',
    imp: 'Medium',
    event: 'CPI (YoY)',
    actual: '3.2%',
    forecast: '3.5%',
    previous: '2.9%',
  },
  {
    id: 'e5',
    time: '14:00',
    imp: 'Medium',
    event: 'Unemployment Rate',
    actual: '5.0%',
    forecast: '4.9%',
    previous: '5.1%',
  },
  {
    id: 'e6',
    time: '15:00',
    imp: 'Medium',
    event: 'GDP Growth (QoQ)',
    actual: '1.1%',
    forecast: '1.3%',
    previous: '1.0%',
  },
  {
    id: 'e7',
    time: '16:00',
    imp: 'Medium',
    event: 'Retail Sales (MoM)',
    actual: '0.8%',
    forecast: '0.6%',
    previous: '1.2%',
  },
  {
    id: 'e8',
    time: '17:00',
    imp: 'Medium',
    event: 'Consumer Confidence',
    actual: '82.4',
    forecast: '80.7',
    previous: '83.5',
  },
  {
    id: 'e9',
    time: '18:00',
    imp: 'Medium',
    event: 'Interest Rate',
    actual: '0.25%',
    forecast: '0.50%',
    previous: '0.75%',
  },
  {
    id: 'e10',
    time: '19:00',
    imp: 'Medium',
    event: 'Manufacturing PMI',
    actual: '54.2',
    forecast: '53.5',
    previous: '55.0',
  },
  {
    id: 'e11',
    time: '20:00',
    imp: 'High',
    event: 'Federal Funds Rate',
    actual: '5.25%',
    forecast: '5.50%',
    previous: '5.00%',
  },
  {
    id: 'e12',
    time: '21:00',
    imp: 'High',
    event: 'Non-Farm Payrolls',
    actual: '187K',
    forecast: '200K',
    previous: '157K',
  },
  {
    id: 'e13',
    time: '15:00',
    imp: 'Medium',
    event: 'GDP Growth (QoQ)',
    actual: 'TBA',
    forecast: '1.1%',
    previous: '1.0%',
    isTBA: true,
  },
  {
    id: 'e14',
    time: '16:00',
    imp: 'Medium',
    event: 'Retail Sales (MoM)',
    actual: 'TBA',
    forecast: '0.6%',
    previous: '1.2%',
    isTBA: true,
  },
  {
    id: 'e15',
    time: '17:00',
    imp: 'Medium',
    event: 'Consumer Confidence',
    actual: 'TBA',
    forecast: '80.7',
    previous: '83.5',
    isTBA: true,
  },
  {
    id: 'e16',
    time: '18:00',
    imp: 'Medium',
    event: 'Interest Rate',
    actual: 'TBA',
    forecast: '0.50%',
    previous: '0.75%',
    isTBA: true,
  },
  {
    id: 'e17',
    time: '19:00',
    imp: 'Medium',
    event: 'Manufacturing PMI',
    actual: 'TBA',
    forecast: '53.5',
    previous: '55.0',
    isTBA: true,
  },
  {
    id: 'e18',
    time: '20:00',
    imp: 'High',
    event: 'Federal Funds Rate',
    actual: 'TBA',
    forecast: '5.50%',
    previous: '5.00%',
    isTBA: true,
  },
  {
    id: 'e19',
    time: '21:00',
    imp: 'High',
    event: 'Non-Farm Payrolls',
    actual: 'TBA',
    forecast: '200K',
    previous: '157K',
    isTBA: true,
  },
  {
    id: 'e20',
    time: '22:00',
    imp: 'Low',
    event: 'Consumer Price Index',
    actual: 'TBA',
    forecast: '3.2%',
    previous: '3.0%',
    isTBA: true,
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

const TBABadge = () => (
  <Chip
    label="TBA"
    size="small"
    sx={{
      height: 20,
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: '#FFFFFF',
      color: '#495057',
      border: '1px solid #DEE2E6',
      borderRadius: '4px',
    }}
  />
)

const EconomicCalendar = () => {
  const [filter, setFilter] = useState(filterOptions[0].value)

  return (
    <DashboardCard
      icon={economicCalendarIcon}
      title="Economic Calendar"
      link="/mi/economic-calendar"
      sx={{
        overflow: 'visible',
      }}
      direction="column"
      collapsedHeight={660}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <MISelectMenu
          variant="outlined"
          selectType="none"
          selected={filter}
          onSelected={setFilter}
          items={filterOptions}
          sx={{ minWidth: 40 }}
          disabled
        />
        <UpdatedInfoChip label="Sep 15 09:45" color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
      </Stack>
      <Stack gap="10px">
        <Stack>
          <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
            <HeaderCell width="60px" textAlign="center">
              Time
            </HeaderCell>
            <HeaderCell width="44px" textAlign="center">
              Imp.
            </HeaderCell>
            <HeaderCell width="192px" textAlign="left">
              Event
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
              <BodyCell width="192px" textAlign="left">
                {data.event}
              </BodyCell>
              <Stack width="80px" justifyContent="center" alignItems="flex-end" pr="8px">
                {data.isTBA ? (
                  <TBABadge />
                ) : (
                  <BodyCell width="80px" textAlign="right">
                    {data.actual}
                  </BodyCell>
                )}
              </Stack>
              <BodyCell width="80px" textAlign="right">
                {data.forecast}
              </BodyCell>
              <BodyCell width="80px" textAlign="right">
                {data.previous}
              </BodyCell>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </DashboardCard>
  )
}

export default EconomicCalendar
