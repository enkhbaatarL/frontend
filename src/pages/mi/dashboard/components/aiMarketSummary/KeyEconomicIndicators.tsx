import { Box, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ReactNode, useRef, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import useCodeData from '@/hooks/useCodeData'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import dashboardService, { IKeyEconomicIndicatorItem } from '@/service/mi/dashboard'

// const sampleData = [
//   {
//     id: 'e1',
//     time: '10:00',
//     imp: 'High',
//     event: 'KOSPI (Final, Aug)',
//     for: 'Aug',
//     actual: '3.8%',
//     forecast: '3.7%',
//     previous: '3.6%',
//   },
//   {
//     id: 'e2',
//     time: '15:00',
//     imp: 'Medium',
//     event: 'Japan Trade Balance (Jul) Japan Trade Balance (Jul)',
//     for: 'Aug',
//     actual: '-4.1%',
//     forecast: '-',
//     previous: '-4.1%',
//   },
//   {
//     id: 'e3',
//     time: '16:30',
//     imp: 'Low',
//     event: 'Eurozone CPI (Final, Aug)',
//     for: 'Jul',
//     actual: '2.0%',
//     forecast: '2.0%',
//     previous: '2.0%',
//   },
//   {
//     id: 'e4',
//     time: '20:00',
//     imp: 'Medium',
//     event: 'China CPI (Aug)',
//     for: 'Aug',
//     actual: '3.5%',
//     forecast: '3.4%',
//     previous: '3.3%',
//   },
// ]

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

// refinitivPriority를 ImportanceLevel로 매핑
const mapPriorityToLevel = (priority: number): ImportanceLevel => {
  if (priority === 2) return 'High'
  if (priority === 1) return 'Medium'
  return 'Low'
}

// 값 포맷팅 함수 (unitPrefix + unit)
const formatValue = (value: number | null, unitPrefix: string | null, unit: string): string => {
  if (value === null) return '-'

  // unitPrefix가 K, B, M, T 중 하나일 때만 붙임
  const validPrefixes = ['K', 'B', 'M', 'T']
  const prefix = unitPrefix && validPrefixes.includes(unitPrefix) ? unitPrefix : ''

  return `${prefix}${value} ${unit}`
}

// 시간 포맷팅 (HH:mm:ss -> HH:mm)
const formatTime = (time: string): string => time.substring(0, 5) // HH:mm만 추출

// 날짜 포맷팅 (YYYY-MM-DD -> 간단한 형식)
const formatDate = (date: string): string => dayjs(date).format('MMM DD')

const KeyEconomicIndicators = () => {
  const { t } = useTranslation()
  const { marketCategoryCodeList } = useCodeData()

  // categoryCode가 없으면 첫 번째 카테고리 사용
  const defaultCategoryCode = useMemo(() => {
    if (marketCategoryCodeList && marketCategoryCodeList.length > 0) {
      return marketCategoryCodeList[0].codeId
    }

    return ''
  }, [marketCategoryCodeList])

  const { data: keyEconomicIndicators, isLoading } = useQuery({
    queryKey: ['getKeyEconomicIndicators', defaultCategoryCode],
    queryFn: async () => await dashboardService.getKeyEconomicIndicators(defaultCategoryCode),
    enabled: !!defaultCategoryCode,
  })

  const indicatorsData = useMemo(() => {
    if (!keyEconomicIndicators?.relatedEconomicIndicators) return []

    return keyEconomicIndicators.relatedEconomicIndicators.map((item: IKeyEconomicIndicatorItem) => ({
      id: item.economicCalendarId.toString(),
      time: formatTime(item.economicIndicatorPresentationTime),
      imp: mapPriorityToLevel(item.refinitivPriority),
      event: item.economicIndicatorName,
      for: formatDate(item.economicIndicatorPresentationDay),
      actual: formatValue(item.economicIndicatorRealValue, item.unitPrefix, item.unit),
      forecast: formatValue(item.economicIndicatorPredictionValue, item.unitPrefix, item.unit),
      previous: formatValue(item.economicIndicatorPresentationPriorValue, item.unitPrefix, item.unit),
    }))
  }, [keyEconomicIndicators])

  return (
    <Box padding="12px">
      <SectionHeader title="Key Economic Indicators" tooltipTitle={t('dashboard.keyEconomicIndicators.tooltipTitle')} mb="10px" bold />
      <Stack gap="10px">
        <Stack>
          <Stack direction="row" alignItems="center" height="32px" gap="4px" borderBottom="1px solid #868E96">
            <HeaderCell width="60px" textAlign="center">
              Time
            </HeaderCell>
            <HeaderCell width="44px" textAlign="center">
              Imp.
            </HeaderCell>
            <HeaderCell width="200px" textAlign="left">
              Event
            </HeaderCell>
            {/* <HeaderCell width="50px" textAlign="center">
              For
            </HeaderCell> */}
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
          {isLoading ? (
            <Stack height="38px" alignItems="center" justifyContent="center">
              <Typography variant="body2M14" color="gray.60">
                Loading...
              </Typography>
            </Stack>
          ) : (
            indicatorsData.map((data, index) => (
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
                  <ImportanceIcon level={data.imp} />
                </Stack>
                <BodyCell width="200px" textAlign="left">
                  {data.event}
                </BodyCell>
                {/* <BodyCell width="50px" textAlign="center">
                  {data.for}
                </BodyCell> */}
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
            ))
          )}
        </Stack>
        {keyEconomicIndicators?.content && keyEconomicIndicators.content.length > 0 && (
          <Stack padding="12px 22px" gap="10px">
            {keyEconomicIndicators.content.map((content, index) => (
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
        )}
      </Stack>
    </Box>
  )
}

export default KeyEconomicIndicators
