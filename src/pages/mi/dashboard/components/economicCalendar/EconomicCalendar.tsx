import { Box, Stack, Typography, TypographyProps, Tooltip, Chip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { ReactNode, useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import economicCalendarIcon from '@/assets/dashboard/economic-calendar.svg'
import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MIFilterMenu, { FilterGroupConfig } from '@/components/common/menu/MIFilterMenu'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import useCodeData from '@/hooks/useCodeData'
import DashboardCard from '@/pages/mi/dashboard/components/common/DashboardCard'
import UpdatedInfoChip from '@/pages/mi/dashboard/components/common/UpdatedInfoChip'
import dashboardService from '@/service/mi/dashboard'
import { formatValue } from '@/utils/number'

const importanceOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
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

const EconomicCalendar = ({ criteriaDate }: Props) => {
  const navigate = useNavigate()
  const [importance, setImportance] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const { economicCalendarCategoryCodeList } = useCodeData()

  const filterGroups: FilterGroupConfig[][] = useMemo(
    () => [
      [
        {
          key: 'importance',
          title: 'Importance',
          filters: importanceOptions,
          width: '146px',
        },
      ],
      [
        {
          key: 'categories',
          title: 'Category',
          filters: economicCalendarCategoryCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? [],
          width: '186px',
        },
      ],
    ],
    [economicCalendarCategoryCodeList],
  )

  const initialFilterValues = useMemo(
    () => ({
      importance: importance ?? [],
      categories: categories ?? [],
    }),
    [importance, categories],
  )

  const appliedFiltersCount = useMemo(() => [...importance, ...categories].length, [importance, categories])

  const handleApplyFilters = (filterValues: { [key: string]: string[] }, save?: boolean) => {
    setImportance(filterValues.importance ?? [])
    setCategories(filterValues.categories ?? [])

    if (save) {
      localStorage.setItem(
        'economicCalendarFilters',
        JSON.stringify({ importance: filterValues.importance ?? [], categories: filterValues.categories ?? [] }),
      )
    } else {
      localStorage.removeItem('economicCalendarFilters')
    }
  }

  useEffect(() => {
    if (!isInitialized) {
      const savedFilters = localStorage.getItem('economicCalendarFilters')

      if (savedFilters) {
        const { importance: savedImportance, categories: savedCategories } = JSON.parse(savedFilters)

        setImportance(savedImportance ?? [])
        setCategories(savedCategories ?? [])
      }

      setIsInitialized(true)
    }
  }, [isInitialized])

  const { data: economicCalendarWidgetData, isLoading } = useQuery({
    queryKey: ['getEconomicCalendarWidget', criteriaDate, importance, categories],
    queryFn: async () => await dashboardService.getEconomicCalendarWidget(criteriaDate!, { importance, categories }),
    enabled: !!criteriaDate,
  })

  const getFormattedValue = (value: number | null, unitPrefix: string | null, unit: string | null) => {
    if (value === null) return '-'

    const isCurrency = ['$', '€', '¥', '£'].includes(unit ?? '')

    return `${formatValue(value, isCurrency ? (unit ?? '') : '', 'en-US', 1)}${unitPrefix ? unitPrefix : ''}${!isCurrency && unit ? `${unitPrefix ? ' ' : ''}${unit}` : ''}`
  }

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
        <MIFilterMenu
          filterGroups={filterGroups}
          initialValues={initialFilterValues}
          appliedFiltersCount={appliedFiltersCount}
          onApply={handleApplyFilters}
          showSaveOption={true}
          initialSaveOn={Boolean(localStorage.getItem('economicCalendarFilters'))}
          enableHoverBackground
        />
        {economicCalendarWidgetData?.updateTime && (
          <UpdatedInfoChip label={economicCalendarWidgetData?.updateTime ?? ''} color={{ backgroundColor: '#F1F3F5', color: '#495057' }} />
        )}
      </Stack>
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
              <HeaderCell width="132px" textAlign="left">
                Event
              </HeaderCell>
              <HeaderCell width="100px" textAlign="right">
                Actual
              </HeaderCell>
              <HeaderCell width="100px" textAlign="right">
                Forecast
              </HeaderCell>
              <HeaderCell width="100px" textAlign="right">
                Prior
              </HeaderCell>
            </Stack>
            {Array.from({ length: 10 }, (_, index) => (
              <Stack
                key={`economic-calendar-skeleton-${index}`}
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
                <Box width="132px" px="8px">
                  <MIBaseSkeleton.TextLine width="120px" height={14} />
                </Box>
                <Box width="100px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
                <Box width="100px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
                <Box width="100px" display="flex" justifyContent="flex-end" pr="8px">
                  <MIBaseSkeleton.TextLine width="60px" height={14} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : !economicCalendarWidgetData?.economicCalendarWidgetList ||
          economicCalendarWidgetData.economicCalendarWidgetList.length === 0 ? (
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
                <HeaderCell width="132px" textAlign="left">
                Event
                </HeaderCell>
                <HeaderCell width="100px" textAlign="right">
                Actual
                </HeaderCell>
                <HeaderCell width="100px" textAlign="right">
                Forecast
                </HeaderCell>
                <HeaderCell width="100px" textAlign="right">
                Prior
                </HeaderCell>
              </Stack>
              {(economicCalendarWidgetData?.economicCalendarWidgetList ?? []).map((data, index) => (
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
                  <BodyCell width="132px" textAlign="left">
                    {data.economicIndicatorName}
                  </BodyCell>
                  <Stack width="100px" justifyContent="center" alignItems="flex-end" pr="8px">
                    {data.status === 'SCHEDULED' ? (
                      <TBABadge />
                    ) : (
                      <BodyCell width="100px" textAlign="right">
                        {getFormattedValue(data.economicIndicatorRealValue, data.unitPrefix, data.unit)}
                      </BodyCell>
                    )}
                  </Stack>
                  <BodyCell width="100px" textAlign="right">
                    {getFormattedValue(data.economicIndicatorPredictionValue, data.unitPrefix, data.unit)}
                  </BodyCell>
                  <BodyCell width="100px" textAlign="right">
                    {getFormattedValue(data.economicIndicatorPresentationPriorValue, data.unitPrefix, data.unit)}
                  </BodyCell>
                </Stack>
              ))}
            </Stack>
          )}
      </Stack>
    </DashboardCard>
  )
}

export default EconomicCalendar
