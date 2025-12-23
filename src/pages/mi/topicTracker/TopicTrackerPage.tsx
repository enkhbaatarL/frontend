import { Box, Collapse, Grid2 as Grid, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { useState, useRef, useEffect, ReactNode } from 'react'

import MariBadge from '@/components/common/bage/MariBadge'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIFilterMenu from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton'
import Summarizing from '@/pages/mi/dashboard/components/common/Summarizing'

interface SummaryDetail {
  title: string
  summary: string[]
}

interface SummaryItem {
  id: string
  date: string
  time: string
  topic: string
  source: string
  region: string
  event: string
  summaryDetail?: SummaryDetail
}

const HeaderCell = ({ children, width, textAlign }: { children: ReactNode; width: string; textAlign: TypographyProps['textAlign'] }) => (
  <Typography
    px="12px"
    py="8px"
    variant="body2SB14"
    color="gray.60"
    width={width}
    boxSizing="border-box"
    textAlign={textAlign}
    sx={{
      fontSize: '13px',
      fontWeight: 600,
      lineHeight: 1.4,
    }}
  >
    {children}
  </Typography>
)

interface BodyCellProps extends TypographyProps {
  width?: string
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
      px="12px"
      py="10px"
      variant="body2SB14"
      color={color}
      width={width}
      maxWidth="100%"
      boxSizing="border-box"
      textAlign={textAlign}
      noWrap
      sx={{
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        minWidth: 0,
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
      }}
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

const TopicTrackerPage = () => {
  const [isListLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null)
  const [loadedRowIds, setLoadedRowIds] = useState<Set<string>>(new Set())
  const [pagination, setPagination] = useState({ size: 20 })

  const sampleData: SummaryItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      time: '10:30',
      topic: 'Oil Market',
      source: 'Reuters',
      region: 'Middle East',
      event: 'Crude Oil Price Surge: Supply Disruptions Drive Three-Month High',
      summaryDetail: {
        title: 'Crude Oil Price Surge: Supply Disruptions Drive Three-Month High',
        summary: [
          'Crude oil prices reached a three-month high due to unexpected supply disruptions in key production regions, including the Middle East and North America.',
          'Market analysts attribute the surge to geopolitical tensions and production facility maintenance schedules that have reduced global supply.',
          'The volatility is expected to continue in the coming weeks as markets react to inventory reports and OPEC+ production decisions.',
          'Investors are closely monitoring demand indicators from major consuming nations, particularly China and the United States.',
        ],
      },
    },
    {
      id: '2',
      date: '2024-01-14',
      time: '14:20',
      topic: 'Gas Market',
      source: 'Bloomberg',
      region: 'North America',
      event: 'Natural gas inventories showed a significant decrease, indicating strong demand during the winter season.',
      summaryDetail: {
        title: 'Natural gas inventories showed a significant decrease, indicating strong demand during the winter season.',
        summary: [
          'Natural gas inventories decreased significantly, reflecting robust demand during the peak winter heating season.',
          'The decline is consistent with historical patterns but more pronounced than previous years, indicating higher consumption rates.',
          'This trend is expected to continue through February as cold weather persists across major consuming regions.',
          'Price movements will depend on weather forecasts and the pace of inventory drawdowns in the coming weeks.',
        ],
      },
    },
    {
      id: '3',
      date: '2024-01-13',
      time: '09:15',
      topic: 'Precious Metals',
      source: 'FT',
      region: 'Global',
      event: 'Gold prices reached a new record high as investors seek safe-haven assets amid geopolitical tensions.',
      summaryDetail: {
        title: 'Gold prices reached a new record high as investors seek safe-haven assets amid geopolitical tensions.',
        summary: [
          'Gold prices reached a new record high as investors seek safe-haven assets amid escalating geopolitical tensions.',
          'Central bank policies, particularly interest rate decisions, remain a critical factor influencing gold market dynamics.',
          'The precious metal has benefited from both retail and institutional demand, with ETF holdings increasing significantly.',
          'Analysts suggest that gold may continue to perform well if uncertainty persists in global markets.',
        ],
      },
    },
    {
      id: '4',
      date: '2024-01-12',
      time: '16:45',
      topic: 'Base Metals',
      source: 'Reuters',
      region: 'Asia',
      event: 'Copper futures declined due to concerns over global manufacturing slowdown.',
      summaryDetail: {
        title: 'Copper futures declined due to concerns over global manufacturing slowdown.',
        summary: [
          'Copper futures declined due to growing concerns over a global manufacturing slowdown, particularly in Europe and Asia.',
          'Chinese demand indicators, while currently weak, suggest a potential recovery in the second quarter as stimulus measures take effect.',
          'Supply-side factors remain stable, with production levels meeting current demand expectations.',
          'Market participants are monitoring inventory levels and trade data for signs of demand recovery.',
        ],
      },
    },
    {
      id: '5',
      date: '2024-01-11',
      time: '11:00',
      topic: 'Agriculture',
      source: 'WSJ',
      region: 'Global',
      event: 'Wheat prices stabilized after recent volatility. Weather patterns in major growing regions will be critical.',
      summaryDetail: {
        title: 'Wheat prices stabilized after recent volatility. Weather patterns in major growing regions will be critical.',
        summary: [
          'Wheat prices stabilized after a period of significant volatility driven by supply concerns and export restrictions.',
          'Weather patterns in major growing regions, including the United States, Russia, and Australia, will be critical for price direction.',
          'The next quarter will be particularly important as planting seasons begin and early crop conditions become apparent.',
          'Trade flows and geopolitical developments continue to influence market sentiment and pricing dynamics.',
        ],
      },
    },
    {
      id: '6',
      date: '2024-01-10',
      time: '13:30',
      topic: 'Precious Metals',
      source: 'Bloomberg',
      region: 'South Africa',
      event: 'Platinum group metals showed mixed performance with palladium gaining while platinum remained flat.',
      summaryDetail: {
        title: 'Platinum group metals showed mixed performance with palladium gaining while platinum remained flat.',
        summary: [
          'Platinum group metals showed mixed performance, with palladium gaining while platinum remained relatively flat.',
          'Automotive sector demand remains the primary driver, with electric vehicle adoption trends influencing long-term outlook.',
          'Supply constraints in South Africa, a major producer, continue to support prices despite demand uncertainties.',
          'Industrial applications, particularly in chemical processing, provide additional demand support for these metals.',
        ],
      },
    },
    {
      id: '7',
      date: '2024-01-09',
      time: '08:20',
      topic: 'Energy',
      source: 'FT',
      region: 'Global',
      event: 'Energy sector stocks rallied on the back of strong oil prices. Renewable energy investments continue to grow.',
      summaryDetail: {
        title: 'Energy sector stocks rallied on the back of strong oil prices. Renewable energy investments continue to grow.',
        summary: [
          'Energy sector stocks rallied significantly on the back of strong oil prices and improved earnings outlooks.',
          'Renewable energy investments continue to grow despite traditional energy sector gains, reflecting diversified energy strategies.',
          'The rally reflects both short-term commodity price movements and longer-term structural shifts in the energy landscape.',
          'Investor sentiment has improved as companies demonstrate resilience and adaptability to changing market conditions.',
        ],
      },
    },
    {
      id: '8',
      date: '2024-01-08',
      time: '15:10',
      topic: 'Agriculture',
      source: 'Reuters',
      region: 'Latin America',
      event: 'Agricultural commodities face headwinds from currency fluctuations. Export volumes remain strong.',
      summaryDetail: {
        title: 'Agricultural commodities face headwinds from currency fluctuations. Export volumes remain strong.',
        summary: [
          'Agricultural commodities face headwinds from currency fluctuations, particularly in emerging market currencies.',
          'Export volumes remain strong despite pricing pressures, indicating robust underlying demand for agricultural products.',
          'The strength of the U.S. dollar has made exports more expensive for some buyers, potentially impacting future demand.',
          'Weather-related production risks and supply chain dynamics continue to influence market fundamentals.',
        ],
      },
    },
  ]

  const handleApplyFilters = (filterValues: { [key: string]: string[] }, _save?: boolean) => {
    setCategoryFilter(filterValues.category ?? [])
  }

  const handleRowClick = async (item: SummaryItem) => {
    const hasDetail = !!item.summaryDetail
    if (!hasDetail) return

    const isExpanded = expandedRowIds.has(item.id)
    const isLoaded = loadedRowIds.has(item.id)

    if (isExpanded) {
      setExpandedRowIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
      setLoadingRowId(null)
    } else {
      setExpandedRowIds((prev) => new Set(prev).add(item.id))

      if (!isLoaded) {
        setLoadingRowId(item.id)

        await new Promise((resolve) => setTimeout(resolve, 800))

        setLoadingRowId(null)
        setLoadedRowIds((prev) => new Set(prev).add(item.id))
      }
    }
  }

  return (
    <MISkeleton variant={'aiMarketSummary'}>
      <MIPageHeadline title="Topic Tracker" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Stack maxWidth={1440} width="100%" padding="50px 30px" margin="auto" gap="24px" boxSizing="border-box" overflow="hidden">
        <Stack gap="24px">
          <Stack direction="row" gap="24px">
            <Stack flexGrow={1} gap="24px" sx={{ minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap="12px">
                  <MISearchInput
                    storageKey="ai-market-summary"
                    value={''}
                    placeholder="Search for events"
                    onChange={() => {}}
                    onSearch={() => {}}
                    onClear={() => {}}
                  />
                  <MIFilterMenu
                    filterGroups={[
                      [
                        {
                          key: 'topic',
                          title: 'Topic',
                          filters: [
                            { label: 'Trump Tariff', value: 'Trump Tariff' },
                            { label: 'Russian Sanctions', value: 'Russian Sanctions' },
                            { label: 'OPEC+ ', value: 'OPEC+' },
                            { label: 'Added Topic', value: 'Added Topic' },
                          ],
                          width: 200,
                        },
                      ],
                      [
                        {
                          key: 'region',
                          title: 'Region',
                          filters: [
                            { label: 'Global', value: 'Global' },
                            { label: 'Asia Pacific', value: 'Asia Pacific' },
                            { label: 'North America', value: 'North America' },
                            { label: 'Latin American', value: 'Latin American' },
                            { label: 'Europe', value: 'Europe' },
                            { label: 'Middle East', value: 'Middle East' },
                            { label: 'Africa', value: 'Africa' },
                          ],
                          width: 200,
                        },
                      ],
                    ]}
                    initialValues={{
                      category: [],
                    }}
                    appliedFiltersCount={categoryFilter.length}
                    onApply={handleApplyFilters}
                    // showSaveOption={false}
                    sx={{ minWidth: 105 }}
                  />
                </Stack>
                <Stack direction="row" gap="12px">
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={[
                      { label: 'Last 30 days', value: '30days' },
                      { label: 'Last 90 days', value: '90days' },
                      { label: 'Last 12 months', value: '12months' },
                      { label: 'All time', value: '' },
                    ]}
                    selected={'30days'}
                    onSelected={() => {}}
                  />
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={[
                      { label: 'Newest', value: 'NEWEST' },
                      { label: 'Oldest', value: 'OLDEST' },
                    ]}
                    selected={'NEWEST'}
                    onSelected={() => {}}
                  />
                </Stack>
              </Stack>
              <Stack gap="6px">
                <MILine backgroundColor="gray.30" />
                <Box py="12px">
                  <Stack sx={{ userSelect: 'none' }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      height="36px"
                      gap="4px"
                      borderBottom="1px solid #CED4DA"
                      bgcolor="#F8F9FA"
                      sx={{ width: '100%' }}
                    >
                      <Box width="110px" flexShrink={0}>
                        <HeaderCell width="100%" textAlign="center">
                          Date
                        </HeaderCell>
                      </Box>
                      <Box width="70px" flexShrink={0}>
                        <HeaderCell width="100%" textAlign="left">
                          Time
                        </HeaderCell>
                      </Box>
                      <Box width="115px" flexShrink={0}>
                        <HeaderCell width="100%" textAlign="left">
                          Topic
                        </HeaderCell>
                      </Box>
                      <Box width="80px" flexShrink={0}>
                        <HeaderCell width="100%" textAlign="left">
                          Source
                        </HeaderCell>
                      </Box>
                      <Box width="115px" flexShrink={0}>
                        <HeaderCell width="100%" textAlign="left">
                          Region
                        </HeaderCell>
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <HeaderCell width="100%" textAlign="left">
                          Event
                        </HeaderCell>
                      </Box>
                    </Stack>
                    {isListLoading ? (
                      <>
                        {Array.from({ length: 10 }, (_, index) => (
                          <Stack
                            key={`summary-skeleton-${index}`}
                            direction="row"
                            alignItems="center"
                            minHeight="38px"
                            gap="4px"
                            borderBottom="1px solid #DEE2E6"
                            bgcolor="#FFFFFF"
                            sx={{ width: '100%' }}
                          >
                            <Box width="110px" flexShrink={0} display="flex" alignItems="center" justifyContent="center" px="12px">
                              <MIBaseSkeleton.TextLine width="80px" height={14} />
                            </Box>
                            <Box width="70px" flexShrink={0} display="flex" alignItems="center" px="12px">
                              <MIBaseSkeleton.TextLine width="45px" height={14} />
                            </Box>
                            <Box width="115px" flexShrink={0} display="flex" alignItems="center" px="12px">
                              <MIBaseSkeleton.TextLine width="90px" height={14} />
                            </Box>
                            <Box width="80px" flexShrink={0} display="flex" alignItems="center" px="12px">
                              <MIBaseSkeleton.TextLine width="60px" height={14} />
                            </Box>
                            <Box width="115px" flexShrink={0} display="flex" alignItems="center" px="12px">
                              <MIBaseSkeleton.TextLine width="85px" height={14} />
                            </Box>
                            <Box flex={1} minWidth={0} display="flex" alignItems="center" px="12px">
                              <MIBaseSkeleton.TextLine width="100%" height={14} />
                            </Box>
                          </Stack>
                        ))}
                      </>
                    ) : (
                      <>
                        {sampleData.map((item) => {
                          const isExpanded = expandedRowIds.has(item.id)
                          const isLoading = loadingRowId === item.id
                          const hasDetail = !!item.summaryDetail

                          return (
                            <Box key={`summary-item-${item.id}`}>
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                minHeight="38px"
                                gap="4px"
                                borderBottom="1px solid #DEE2E6"
                                bgcolor={isExpanded ? '#F8F9FA' : '#FFFFFF'}
                                sx={{
                                  width: '100%',
                                  '&:hover': {
                                    backgroundColor: '#F8F9FA',
                                  },
                                  cursor: hasDetail ? 'pointer' : 'default',
                                }}
                                onClick={() => handleRowClick(item)}
                              >
                                <Box width="110px" flexShrink={0} display="flex" alignItems="flex-start">
                                  <BodyCell width="100%" textAlign="center" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                    {item.date}
                                  </BodyCell>
                                </Box>
                                <Box width="70px" flexShrink={0} display="flex" alignItems="flex-start">
                                  <BodyCell width="100%" textAlign="left" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                    {item.time}
                                  </BodyCell>
                                </Box>
                                <Box width="115px" flexShrink={0} display="flex" alignItems="flex-start">
                                  <BodyCell width="100%" textAlign="left" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                    {item.topic}
                                  </BodyCell>
                                </Box>
                                <Box width="80px" flexShrink={0} display="flex" alignItems="flex-start">
                                  <BodyCell width="100%" textAlign="left" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                    {item.source}
                                  </BodyCell>
                                </Box>
                                <Box width="115px" flexShrink={0} display="flex" alignItems="flex-start">
                                  <BodyCell width="100%" textAlign="left" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                    {item.region}
                                  </BodyCell>
                                </Box>
                                <Box
                                  flex={1}
                                  minWidth={0}
                                  maxWidth="100%"
                                  minHeight="38px"
                                  position="relative"
                                  display="flex"
                                  alignItems="flex-start"
                                  sx={{ overflow: 'hidden', boxSizing: 'border-box' }}
                                >
                                  <Collapse
                                    in={!isExpanded}
                                    timeout={300}
                                    sx={{
                                      position: 'absolute',
                                      width: '100%',
                                      maxWidth: '100%',
                                      '& .MuiCollapse-wrapper': {
                                        transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                        maxWidth: '100%',
                                      },
                                    }}
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      minHeight="38px"
                                      sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                                    >
                                      <BodyCell width="100%" textAlign="left" color="gray.70">
                                        {item.event}
                                      </BodyCell>
                                    </Box>
                                  </Collapse>
                                  <Collapse
                                    in={isExpanded}
                                    timeout={300}
                                    sx={{
                                      width: '100%',
                                      maxWidth: '100%',
                                      '& .MuiCollapse-root': {
                                        width: '100%',
                                        maxWidth: '100%',
                                      },
                                      '& .MuiCollapse-wrapper': {
                                        transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
                                        width: '100%',
                                        maxWidth: '100%',
                                      },
                                      '& .MuiCollapse-wrapperInner': {
                                        width: '100%',
                                        maxWidth: '100%',
                                      },
                                    }}
                                  >
                                    <Box
                                      width="100%"
                                      maxWidth="100%"
                                      px="12px"
                                      py="10px"
                                      sx={{
                                        minWidth: 0,
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      {isLoading ? (
                                        <Box pr="24px">
                                          <Summarizing size={24} />
                                        </Box>
                                      ) : (
                                        <Stack gap="6px" sx={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                                          <Typography
                                            variant="body1B16"
                                            color="content.textNormal"
                                            sx={{
                                              fontSize: '14px',
                                              fontWeight: 400,
                                              lineHeight: 1.4,
                                              color: '#000000',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'break-word',
                                              width: '100%',
                                              maxWidth: '100%',
                                              boxSizing: 'border-box',
                                            }}
                                          >
                                            {item.summaryDetail?.title}
                                          </Typography>
                                          <Stack pl="22px" sx={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                                            {item.summaryDetail?.summary.map((summary, summaryIndex) => (
                                              <Typography
                                                key={`${item.id}-summary-${summaryIndex}`}
                                                variant="body1M16"
                                                color="content.textNormal"
                                                lineHeight={1.4}
                                                sx={{
                                                  fontSize: '14px',
                                                  fontWeight: 400,
                                                  color: '#000000',
                                                  textIndent: '-14px',
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  width: '100%',
                                                  maxWidth: '100%',
                                                  boxSizing: 'border-box',
                                                  '&::before': {
                                                    content: '"•"',
                                                    marginRight: '6px',
                                                    color: 'gray.70',
                                                  },
                                                }}
                                              >
                                                {summary}
                                              </Typography>
                                            ))}
                                          </Stack>
                                        </Stack>
                                      )}
                                    </Box>
                                  </Collapse>
                                </Box>
                              </Stack>
                            </Box>
                          )
                        })}
                      </>
                    )}
                  </Stack>
                </Box>
              </Stack>
              {sampleData.length > 0 && (
                <MIPagination
                  data={{
                    detail: sampleData,
                    currentPage: 1,
                    totalPages: 1,
                    totalElements: sampleData.length,
                    numberOfElements: sampleData.length,
                    size: pagination.size,
                    isFirst: true,
                    isLast: true,
                    hasPrevious: false,
                    hasNext: false,
                  }}
                  size={pagination.size}
                  onPageChange={() => {}}
                  onSizeChange={(value) => setPagination({ size: value })}
                />
              )}
              {!isListLoading && sampleData.length === 0 && (
                <Box
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  width={'100%'}
                  height={'732px'}
                  sx={{ backgroundColor: '#F8F9FA', border: '1px solid #DEE2E6', borderRadius: '4px' }}
                >
                  <Box display={'flex'} flexDirection={'column'} height={'fit-content'} alignItems={'center'}>
                    <ErrorOutlineIcon />
                    <Typography variant="body3SB12" color="gray.60" mt={'10px'}>
                      No results found
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>

            <Stack width={286} flexShrink={0} gap="20px">
              <Box px="12px">
                <MariBadge />
              </Box>
              <Grid container direction="column" px="12px" gap="24px">
                <Typography color="gray.60" component="div" variant="body3R12">
                  This event list is based on content originally provided by the respective data provider and has been generated through
                  AI-driven analysis and reprocessing. The information contained herein is provided for reference purposes only, and users
                  are encouraged to exercise their own judgment and responsibility when utilizing it.
                </Typography>
                <Typography color="gray.60" component="div" variant="body3R12">
                  본 이벤트 목록은 해당 데이터 제공업체의 콘텐츠를 AI를 통해 분석·재가공 절차를 거쳐 생성된 것입니다. 본 이벤트 목록은
                  참고용 정보를 제공하기 위한 것으로, 내용의 정확성이나 활용 결과에 대해서는 사용자의 판단과 책임이 요구됩니다.
                </Typography>
              </Grid>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default TopicTrackerPage
