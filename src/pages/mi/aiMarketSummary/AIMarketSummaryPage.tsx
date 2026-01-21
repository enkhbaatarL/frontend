import { Box, Collapse, Grid2 as Grid, Stack, Typography, TypographyProps, Tooltip } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useState, useRef, useEffect, ReactNode, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import MariBadge from '@/components/common/bage/MariBadge'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import ShakeableLockIcon from '@/components/common/icons/ShakeableLockIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIFilterMenu, { FilterValues } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton'
import useSearchFilter from '@/hooks/useSearchFilter'
import Summarizing from '@/pages/mi/dashboard/components/common/Summarizing'
import { IMarketRecapCheckpointItem, IMarketRecapHighlightItem } from '@/service/mi/dashboard'
import marketNewsService, { INewsRecapsRequest, INewsRecapItem, DateRangeOption, RecapCategory } from '@/service/mi/marketNews'
import { IPaginationResponse } from '@/types/api'

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25%, 75% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
`

interface SummaryDetailItem {
  text: string
  newsId?: number
  isViewable?: boolean
}

interface SummaryDetail {
  title: string
  summary: SummaryDetailItem[]
}

interface SummaryItem {
  id: number
  date: string
  category: RecapCategory
  summary: string
  summaryDetail?: SummaryDetail[]
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

const AIMarketSummaryPage = () => {
  const navigate = useNavigate()
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set())
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null)
  const [loadedRowIds, setLoadedRowIds] = useState<Set<number>>(new Set())
  const [shakingItemKeys, setShakingItemKeys] = useState<Set<string>>(new Set())

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    data: recapsData,
    pagination,
    updatePage,
    updateSize,
    isLoading: recapsIsLoading,
  } = useSearchFilter<INewsRecapsRequest, IPaginationResponse<INewsRecapItem>>(
    (params) => marketNewsService.getNewsRecaps(params),
    {
      sort: 'NEWEST',
      dateRangeOption: 'LAST_30_DAYS',
      recapCategory: undefined,
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: true,
      useAbortController: true,
    },
  )

  const convertRecapToSummaryItem = (recap: INewsRecapItem, index: number): SummaryItem | null => {
    if (recap.recapCategory === 'HIGHLIGHT') {
      const items = recap.items as IMarketRecapHighlightItem[]

      if (!items || items.length === 0) return null

      return {
        id: index,
        date: recap.criteriaDate,
        category: recap.recapCategory,
        summary: items[0]?.nameEnglish || '',
        summaryDetail: items.map((item) => ({
          title: item?.nameEnglish || '',
          summary: (item?.relatedEventRepresentativeNewsResNews || [])
            .filter((news) => news && news.title !== null && news.title !== undefined)
            .map((news) => ({
              text: news.title,
              newsId: news.newsSummaryId,
              isViewable: news.isViewable,
            })),
        })),
      }
    }

    if (recap.recapCategory === 'CHECKPOINT') {
      const items = recap.items as IMarketRecapCheckpointItem[]

      if (!items || items.length === 0) return null

      return {
        id: index,
        date: recap.criteriaDate,
        category: recap.recapCategory,
        summary: items[0]?.title || '',
        summaryDetail: items.map((item) => ({
          title: item?.title || '',
          summary: (item?.content || [])
            .filter((content) => content !== null && content !== undefined)
            .map((content) => ({
              text: content,
            })),
        })),
      }
    }

    return null
  }

  const summaryItems: SummaryItem[] = useMemo(() => {
    if (!recapsData?.detail) return []
    return recapsData.detail.map((recap, index) => convertRecapToSummaryItem(recap, index)).filter((item) => item !== null)
  }, [recapsData])

  useEffect(() => {
    setExpandedRowIds(new Set())
    setLoadedRowIds(new Set())
    setLoadingRowId(null)
  }, [summaryItems])

  const isListLoading = recapsIsLoading

  const handleApplyFilters = (filterValues: FilterValues, _save?: boolean) => {
    updateFilterWithSearch('recapCategory', (filterValues.category ?? []) as RecapCategory[])
  }

  const handleSearch = (keyword: string) => {
    updateFilterWithSearch('keyword', keyword)
  }

  const handleDateRangeChange = (value: string) => {
    updateFilterWithSearch('dateRangeOption', value as DateRangeOption)
  }

  const handleSortChange = (value: string) => {
    updateFilterWithSearch('sort', value)
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
      setExpandedRowIds((prev) => {
        const newSet = new Set(prev)
        newSet.add(item.id)
        return newSet
      })

      if (!isLoaded) {
        setLoadingRowId(item.id)

        await new Promise((resolve) => setTimeout(resolve, 800))

        setLoadingRowId(null)
        setLoadedRowIds((prev) => {
          const newSet = new Set(prev)
          newSet.add(item.id)
          return newSet
        })
      }
    }
  }

  const handleLockedClick = (itemKey: string) => {
    setShakingItemKeys((prev) => new Set(prev).add(itemKey))
    setTimeout(() => {
      setShakingItemKeys((prev) => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }, 400)
  }

  return (
    <MISkeleton variant={'aiMarketSummary'}>
      <MIPageHeadline title="AI Market Summary" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Stack maxWidth={1440} width="100%" padding="50px 30px" margin="auto" gap="24px" boxSizing="border-box" overflow="hidden">
        <Stack gap="24px">
          <Stack direction="row" gap="24px">
            <Stack flexGrow={1} gap="24px" sx={{ minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap="12px">
                  <MISearchInput
                    storageKey="ai-market-summary"
                    value={filter.keyword ?? ''}
                    placeholder="Search for summaries"
                    onChange={(value) => updateFilter('keyword', value)}
                    onSearch={handleSearch}
                    onClear={() => updateFilterWithSearch('keyword', '')}
                  />
                  <MIFilterMenu
                    filterGroups={[
                      [
                        {
                          key: 'category',
                          title: 'Category',
                          filters: [
                            { label: 'Highlight', value: 'HIGHLIGHT' },
                            { label: 'Checkpoint', value: 'CHECKPOINT' },
                          ],
                          width: 200,
                        },
                      ],
                    ]}
                    initialValues={{
                      category: [],
                    }}
                    appliedFiltersCount={filter.recapCategory?.length ?? 0}
                    onApply={handleApplyFilters}
                    showSaveOption={false}
                    sx={{ minWidth: 105 }}
                  />
                </Stack>
                <Stack direction="row" gap="12px">
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={[
                      { label: 'Last 30 days', value: 'LAST_30_DAYS' },
                      { label: 'Last 60 days', value: 'LAST_60_DAYS' },
                      { label: 'Last 12 months', value: 'LAST_12_MONTHS' },
                      { label: 'All time', value: 'ALL_TIME' },
                    ]}
                    selected={filter.dateRangeOption ?? 'LAST_30_DAYS'}
                    onSelected={handleDateRangeChange}
                  />
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={[
                      { label: 'Newest', value: 'NEWEST' },
                      { label: 'Oldest', value: 'OLDEST' },
                    ]}
                    selected={filter.sort ?? 'NEWEST'}
                    onSelected={handleSortChange}
                  />
                </Stack>
              </Stack>
              {!isListLoading && summaryItems.length === 0 ? (
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
              ) : (
                <>
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
                          <Box width="115px" flexShrink={0}>
                            <HeaderCell width="100%" textAlign="left">
                              Category
                            </HeaderCell>
                          </Box>
                          <Box flex={1} minWidth={0}>
                            <HeaderCell width="100%" textAlign="left">
                              Summary
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
                                <Box width="110px" flexShrink={0} display="flex" alignItems="center">
                                  <MIBaseSkeleton.TextLine width="120px" height={14} />
                                </Box>
                                <Box width="115px" flexShrink={0} display="flex" alignItems="center">
                                  <MIBaseSkeleton.TextLine width="80px" height={14} />
                                </Box>
                                <Box flex={1} minWidth={0} display="flex" alignItems="center">
                                  <MIBaseSkeleton.TextLine width="100%" height={14} />
                                </Box>
                              </Stack>
                            ))}
                          </>
                        ) : (
                          <>
                            {summaryItems.map((item, index) => {
                              const isExpanded = expandedRowIds.has(item.id)
                              const isLoading = loadingRowId === item.id
                              const hasDetail = !!item.summaryDetail

                              return (
                                <Box key={`summary-item-${item.id}-${index}`}>
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
                                        {dayjs(item.date).format('YYYY-MM-DD')}
                                      </BodyCell>
                                    </Box>
                                    <Box width="115px" flexShrink={0} display="flex" alignItems="flex-start">
                                      <BodyCell width="100%" textAlign="left" color={isExpanded ? 'content.textNormal' : 'gray.70'}>
                                        {item.category === 'HIGHLIGHT' ? 'Highlights' : 'Checkpoints'}
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
                                        timeout={500}
                                        sx={{
                                          position: 'absolute',
                                          width: '100%',
                                          maxWidth: '100%',
                                          opacity: isExpanded ? 0 : 1,
                                          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1) -150ms',
                                          pointerEvents: isExpanded ? 'none' : 'auto',
                                          willChange: 'opacity',
                                          '& .MuiCollapse-wrapper': {
                                            transition: 'height 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
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
                                            {item.summary}
                                          </BodyCell>
                                        </Box>
                                      </Collapse>
                                      <Collapse
                                        in={isExpanded}
                                        timeout={500}
                                        sx={{
                                          width: '100%',
                                          maxWidth: '100%',
                                          opacity: isExpanded ? 1 : 0,
                                          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1) -150ms',
                                          pointerEvents: isExpanded ? 'auto' : 'none',
                                          willChange: 'opacity',
                                          '& .MuiCollapse-root': {
                                            width: '100%',
                                            maxWidth: '100%',
                                          },
                                          '& .MuiCollapse-wrapper': {
                                            transition: 'height 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
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
                                            <Stack
                                              gap="12px"
                                              sx={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                                            >
                                              {item.summaryDetail?.map((detail, detailIndex) => (
                                                <Stack
                                                  key={`${item.id}-detail-${detailIndex}`}
                                                  gap="4px"
                                                  sx={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                                                >
                                                  <Typography
                                                    variant="body1B16"
                                                    color="content.textNormal"
                                                    sx={{
                                                      fontSize: '14px',
                                                      fontWeight: 700,
                                                      lineHeight: 1.4,
                                                      color: '#000000',
                                                      wordBreak: 'break-word',
                                                      overflowWrap: 'break-word',
                                                      width: '100%',
                                                      maxWidth: '100%',
                                                      boxSizing: 'border-box',
                                                    }}
                                                  >
                                                    {detail.title}
                                                  </Typography>
                                                  <Stack
                                                    pl="22px"
                                                    sx={{ minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                                                  >
                                                    {(detail.summary || []).map((summaryItem, summaryIndex) => {
                                                      const itemKey = `${item.id}-${detailIndex}-${summaryIndex}`
                                                      return (
                                                        <Box
                                                          key={itemKey}
                                                          onClick={
                                                            summaryItem.newsId && summaryItem.isViewable !== false
                                                              ? (e) => {
                                                                e.stopPropagation()
                                                                navigate(`/mi/market-news/${summaryItem.newsId}`)
                                                              }
                                                              : summaryItem.newsId && summaryItem.isViewable === false
                                                                ? (e) => {
                                                                  e.stopPropagation()
                                                                  handleLockedClick(itemKey)
                                                                }
                                                                : undefined
                                                          }
                                                          sx={{
                                                            cursor:
                                                              summaryItem.newsId && summaryItem.isViewable !== false
                                                                ? 'pointer'
                                                                : 'default',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            ml: '-14px',
                                                          }}
                                                        >
                                                          <Typography
                                                            component="span"
                                                            variant="body1M16"
                                                            color="gray.70"
                                                            sx={{
                                                              mr: '6px',
                                                              flexShrink: 0,
                                                              alignSelf: 'flex-start',
                                                              pt: '2px',
                                                              fontSize: '14px',
                                                              fontWeight: 400,
                                                            }}
                                                          >
                                                            •
                                                          </Typography>
                                                          <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            gap="4px"
                                                            sx={{
                                                              width: '100%',
                                                              minWidth: 0,
                                                              animation: shakingItemKeys.has(itemKey)
                                                                ? `${shakeAnimation} 0.4s ease-in-out`
                                                                : 'none',
                                                            }}
                                                          >
                                                            <Typography
                                                              component="span"
                                                              variant="body1M16"
                                                              color="content.textNormal"
                                                              sx={{
                                                                fontSize: '14px',
                                                                fontWeight: 400,
                                                                color: '#000000',
                                                                wordBreak: 'break-word',
                                                                overflowWrap: 'break-word',
                                                                '&:hover':
                                                                  summaryItem.newsId && summaryItem.isViewable !== false
                                                                    ? {
                                                                      textDecoration: 'underline',
                                                                    }
                                                                    : undefined,
                                                              }}
                                                            >
                                                              {summaryItem.text}
                                                            </Typography>
                                                            {summaryItem.isViewable === false && (
                                                              <ShakeableLockIcon width={16} height={16} sx={{ animation: 'none' }} />
                                                            )}
                                                          </Stack>
                                                        </Box>
                                                      )
                                                    })}
                                                  </Stack>
                                                </Stack>
                                              ))}
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
                  {recapsData && summaryItems.length > 0 && (
                    <MIPagination
                      data={recapsData}
                      size={pagination.size}
                      onPageChange={(page) => updatePage(page)}
                      onSizeChange={(value) => updateSize(value)}
                    />
                  )}
                </>
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

export default AIMarketSummaryPage
