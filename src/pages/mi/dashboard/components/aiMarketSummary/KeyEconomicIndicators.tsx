import { Box, Stack, Typography, TypographyProps, Tooltip, Chip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { ReactNode, useRef, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import useCodeData from '@/hooks/useCodeData'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import dashboardService from '@/service/mi/dashboard'
import { formatValue } from '@/utils/number'

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

const ImportanceIcon = ({ level }: { level: number }) => {
  let icon = levelNotRatedIcon
  let alt = 'level-not-rated'

  switch (level) {
    case 3:
      icon = levelHighIcon
      alt = 'level-high'
      break
    case 2:
      icon = levelMediumIcon
      alt = 'level-medium'
      break
    case 1:
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

interface Props {
  criteriaDate?: string
}

const KeyEconomicIndicators = ({ criteriaDate }: Props) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { marketCategoryCodeList } = useCodeData()

  // categoryCode가 없으면 첫 번째 카테고리 사용
  const defaultCategoryCode = useMemo(() => {
    if (marketCategoryCodeList && marketCategoryCodeList.length > 0) {
      return marketCategoryCodeList[0].codeId
    }

    return ''
  }, [marketCategoryCodeList])

  const { data: keyEconomicIndicatorsData, isLoading } = useQuery({
    queryKey: ['getKeyEconomicIndicators', defaultCategoryCode, criteriaDate],
    queryFn: async () => await dashboardService.getKeyEconomicIndicators(defaultCategoryCode, criteriaDate!),
    enabled: !!defaultCategoryCode && !!criteriaDate,
  })

  const getFormattedValue = (value: number | null, unitPrefix: string | null, unit: string | null) => {
    if (value === null) return '-'

    const isCurrency = ['$', '€', '¥', '£'].includes(unit ?? '')

    return `${formatValue(value, isCurrency ? (unit ?? '') : '', 'en-US', 1)}${unitPrefix ? unitPrefix : ''}${!isCurrency && unit ? `${unitPrefix ? ' ' : ''}${unit}` : ''}`
  }

  return (
    <Box padding="12px">
      <SectionHeader title="Key Economic Indicators" tooltipTitle={t('dashboard.keyEconomicIndicators.tooltipTitle')} mb="10px" bold />
      <Stack gap="10px">
        {isLoading ? (
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
            {Array.from({ length: 4 }, (_, index) => (
              <Stack
                key={`key-economic-indicators-skeleton-${index}`}
                direction="row"
                alignItems="center"
                height="38px"
                gap="4px"
                borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
              >
                <Box width="60px" display="flex" justifyContent="center" px="8px">
                  <MIBaseSkeleton.TextLine width="40px" height={14} />
                </Box>
                <Box width="44px" display="flex" justifyContent="center" alignItems="center">
                  <MIBaseSkeleton.Icon width={16} height={16} />
                </Box>
                <Box width="200px" px="8px">
                  <MIBaseSkeleton.TextLine width="180px" height={14} />
                </Box>
                <Box width="80px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
                <Box width="80px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
                <Box width="80px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : !keyEconomicIndicatorsData?.relatedEconomicIndicators || keyEconomicIndicatorsData.relatedEconomicIndicators.length === 0 ? (
          <Stack height={352} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
            <Typography variant="body2SB14" color="gray.50">
              No data available to display.
            </Typography>
          </Stack>
        ) : (
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
            {(keyEconomicIndicatorsData?.relatedEconomicIndicators ?? []).map((data, index) => (
              <Stack
                key={data.economicCalendarId}
                direction="row"
                alignItems="center"
                height="38px"
                gap="4px"
                borderTop={index === 0 ? 'none' : '1px solid #DEE2E6'}
                onClick={() => navigate(`/mi/economic-calendar/${data.code}`)}
                sx={{
                  '&:hover': {
                    backgroundColor: '#F8F9FA',
                  },
                  cursor: 'pointer',
                }}
              >
                <BodyCell width="60px" textAlign="center">
                  {(data.economicIndicatorPresentationTime ?? '').slice(0, 5)}
                </BodyCell>
                <Stack width="44px" justifyContent="center" alignItems="center">
                  <ImportanceIcon level={data.refinitivPriority} />
                </Stack>
                <BodyCell width="200px" textAlign="left">
                  {data.economicIndicatorName}
                </BodyCell>
                <Stack width="80px" justifyContent="center" alignItems="flex-end" pr="8px">
                  {data.status === 'SCHEDULED' ? (
                    <TBABadge />
                  ) : (
                    <BodyCell width="80px" textAlign="right">
                      {getFormattedValue(data.economicIndicatorRealValue, data.unitPrefix, data.unit)}
                    </BodyCell>
                  )}
                </Stack>
                <BodyCell width="80px" textAlign="right">
                  {getFormattedValue(data.economicIndicatorPredictionValue, data.unitPrefix, data.unit)}
                </BodyCell>
                <BodyCell width="80px" textAlign="right">
                  {getFormattedValue(data.economicIndicatorPresentationPriorValue, data.unitPrefix, data.unit)}
                </BodyCell>
              </Stack>
            ))}
          </Stack>
        )}
        {keyEconomicIndicatorsData?.content && keyEconomicIndicatorsData.content.length > 0 && (
          <Stack padding="12px 22px" gap="10px">
            {keyEconomicIndicatorsData.content.map((content, index) => (
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
