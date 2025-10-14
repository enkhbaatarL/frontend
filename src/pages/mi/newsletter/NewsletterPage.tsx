import { Box, Typography, Grid2 as Grid } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import MariBadge from '@/components/common/bage/MariBadge'
import MIButtonArrow from '@/components/common/button/MIButtonArrow'
import MISearchInput from '@/components/common/input/MISearchInput'
import MISelect from '@/components/common/select/MISelect'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import { MIPageSkeletons } from '@/components/mi/MIPageSkeletons'
import MISkeleton from '@/components/mi/MISkeleton'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import NewsletterCard from '@/pages/mi/newsletter/components/NewsletterCard'
import newsletterService, {
  IFeaturedNewsletterItem,
  INewsletterItem,
  INewsletterListRequest,
  NewsletterStatus,
} from '@/service/mi/newsletter'
import { IPaginationRequest, IPaginationResponse } from '@/types/api'

const NewsLettersPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showSnackbar } = useSnackbar()

  const [loadingNewsletterIds, setLoadingNewsletterIds] = useState<Set<string>>(new Set())
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [previousPageInfo, setPreviousPageInfo] = useState<{ currentPage: number; totalPages: number } | null>(null)

  // Featured Newsletter List
  const {
    data: featuredNewsletterList,
    updatePage: updateFeaturedPage,
    isLoading: featuredNewsletterListIsLoading,
    optimisticUpdate: optimisticUpdateFeatured,
  } = useSearchFilter<IPaginationRequest, IPaginationResponse<IFeaturedNewsletterItem>>(
    (params) => newsletterService.getFeaturedNewsletters(params),
    {},
    {
      page: 1,
      size: 6,
    },
    {
      initialFetch: true,
    },
  )

  // Newsletter List
  const {
    data: newsletterList,
    filter,
    updateFilter,
    updateFilterWithSearch,
    pagination,
    updatePage,
    updateSize,
    isLoading: newsletterListIsLoading,
  } = useSearchFilter<INewsletterListRequest, IPaginationResponse<INewsletterItem>>(
    (params) => newsletterService.getNewsletterList(params),
    {
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: true,
    },
  )

  const isActuallyLoading = useMemo(
    () => isInitialLoading || (newsletterListIsLoading && !hasInitialData),
    [isInitialLoading, newsletterListIsLoading, hasInitialData],
  )

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 0.7,
      minWidth: 110,
      align: 'center',
      renderCell: ({ row }) => (
        <MITableCell
          value={dayjs(row.date).format('YYYY-MM-DD')}
          typography={{
            color: 'gray.60',
          }}
        />
      ),
    },
    {
      field: 'issueNo',
      headerName: 'Issue',
      flex: 0.5,
      align: 'center',
      minWidth: 60,
    },
    {
      field: 'name',
      headerName: 'Newsletter',
      flex: 1.2,
      minWidth: 200,
      align: 'left',
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 2.5,
      minWidth: 400,
      align: 'left',
    },
  ]

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter('keyword', value)
    },
    [updateFilter],
  )

  const handleSearch = useCallback(
    (searchTerm: string) => {
      updateFilterWithSearch('keyword', searchTerm)
    },
    [updateFilterWithSearch],
  )

  const handleSearchClear = useCallback(() => {
    updateFilterWithSearch('keyword', '')
  }, [updateFilterWithSearch])

  const handleDateFilterChange = useCallback(
    (e: { target: { value: string | number | boolean | (string | number | boolean)[] } }) => {
      updateFilter('dateFilter', e.target.value as string)
    },
    [updateFilter],
  )

  const handleSubscribe = useCallback(
    async (newsletterId: string) => {
      const target = featuredNewsletterList?.detail.find((item) => item.newsletterId === newsletterId)

      if (!target) return

      const newSubscribedState = !target.subscribed
      const newsletterName = target.name

      setLoadingNewsletterIds((prev) => new Set(prev).add(newsletterId))

      try {
        await optimisticUpdateFeatured(
          async () => {
            await newsletterService.updateNewsletterSubscribed(newsletterId, newSubscribedState)

            return null
          },
          {
            optimisticData: {
              ...featuredNewsletterList!,
              detail: featuredNewsletterList!.detail.map((item) =>
                item.newsletterId === newsletterId ? { ...item, subscribed: newSubscribedState } : item,
              ),
            },
            rollbackOnError: true,
          },
        )

        showSnackbar(`${newsletterName} 이메일 구독이 ${newSubscribedState ? '완료' : '해제'}되었습니다`, {
          variant: 'success',
        })
      } catch (error) {
        console.error('구독/해제 실패:', error)
        showSnackbar(`${newsletterName} 구독 처리 중 오류가 발생했습니다`, {
          variant: 'error',
        })
      } finally {
        setLoadingNewsletterIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(newsletterId)
          return newSet
        })
      }
    },
    [featuredNewsletterList, optimisticUpdateFeatured, showSnackbar],
  )

  const handleNewsletterClick = useCallback(
    (newsletterId: string, issueNo: string) => {
      navigate(`/mi/newsletters/${newsletterId}/${issueNo}`)
    },
    [navigate],
  )

  useEffect(() => {
    const shouldMarkAsInitialized = (featuredNewsletterList?.detail?.length ?? 0) > 0 || (newsletterList?.detail?.length ?? 0) > 0
    if (shouldMarkAsInitialized) {
      setHasInitialData(true)
      setIsInitialLoading(false)
    }
  }, [featuredNewsletterList, newsletterList])

  useEffect(() => {
    if (newsletterList?.detail?.length) setHasInitialData(true)
  }, [newsletterList])

  useEffect(() => {
    if (featuredNewsletterList?.currentPage && featuredNewsletterList?.totalPages) {
      setPreviousPageInfo({
        currentPage: featuredNewsletterList.currentPage,
        totalPages: featuredNewsletterList.totalPages,
      })
    }
  }, [featuredNewsletterList?.currentPage, featuredNewsletterList?.totalPages])

  return (
    <MISkeleton variant={'newsletter'} loading={isActuallyLoading}>
      <MIPageHeadline title="Newsletters" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={5} px={7.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
          <Typography color="gray.90" variant="titleBox">
            Featured Newsletters
          </Typography>

          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="body3SB12">
              <Box component="span" color="content.textNormal">
                {featuredNewsletterList?.currentPage ?? previousPageInfo?.currentPage ?? 0}
              </Box>
              <Box component="span" color="gray.60">
                /{featuredNewsletterList?.totalPages ?? previousPageInfo?.totalPages ?? 0}
              </Box>
            </Typography>
            <Box display="flex" alignItems="center" gap="4px">
              <MIButtonArrow
                type="square"
                direction="left"
                onClick={() => {
                  const currentPage = featuredNewsletterList?.currentPage ?? previousPageInfo?.currentPage ?? 1
                  updateFeaturedPage(currentPage - 1)
                }}
                disabled={!(featuredNewsletterList?.hasPrevious ?? (previousPageInfo?.currentPage ?? 1) > 1)}
              />
              <MIButtonArrow
                type="square"
                direction="right"
                onClick={() => {
                  const currentPage = featuredNewsletterList?.currentPage ?? previousPageInfo?.currentPage ?? 1
                  updateFeaturedPage(currentPage + 1)
                }}
                disabled={!(featuredNewsletterList?.hasNext ?? (previousPageInfo?.currentPage ?? 1) < (previousPageInfo?.totalPages ?? 1))}
              />
            </Box>
          </Box>
        </Box>

        <Grid pb="46px" mb="26px " container spacing={3} borderBottom="1px solid" borderColor="gray.50">
          {featuredNewsletterListIsLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <Grid key={i} size={2}>
                <MIPageSkeletons.NewsletterCardSkeleton />
              </Grid>
            ))
          ) : (
            <>
              {featuredNewsletterList?.detail.map((item) => (
                <Grid key={`${item.newsletterId}`} size={2}>
                  <NewsletterCard
                    featuredNewsletterItem={item}
                    onSubscribe={handleSubscribe}
                    onClick={handleNewsletterClick}
                    disabled={!item.enabled}
                    updating={loadingNewsletterIds.has(item.newsletterId)}
                  />
                </Grid>
              ))}
              {featuredNewsletterList?.detail.length === 0 && (
                <Grid size={2}>
                  <Typography>No results found</Typography>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Box>

      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={5} px={7.5}>
        <Box display="flex" pt="38px" gap={7.5} boxSizing={'border-box'} width={'100%'}>
          <Box display="flex" flexDirection="column" flex={1}>
            <Box pb="24px" mb="30px" borderBottom={'1px solid'} borderColor={'gray.30'}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={3}>
                <MISearchInput
                  width={360}
                  storageKey={'newsletter'}
                  value={filter?.keyword ?? ''}
                  onChange={handleSearchChange}
                  placeholder={'Search for newsletters'}
                  onSearch={handleSearch}
                  onClear={handleSearchClear}
                />
                <Box width="160px">
                  <MISelect
                    value={''}
                    sizeSelect="h40"
                    onChange={handleDateFilterChange}
                    options={[
                      { label: 'Last 7 days', value: '7days' },
                      { label: 'Last 30 days', value: '30days' },
                      { label: 'Last 90 days', value: '90days' },
                    ]}
                    placeholder="All dates"
                    darkPlaceholder
                    disabled
                  />
                </Box>
              </Box>
            </Box>

            <Box width={'100%'}>
              <MITableUser
                hidePagination={newsletterList?.totalElements === 0 || !newsletterList?.totalElements}
                tableProps={{
                  disableHover: false,
                  loading: newsletterListIsLoading,
                  noRowMessage: 'No results found',
                  columns,
                  rowId: 'newsletterId',
                  getRowId: (row) => `${row.newsletterId}-${row.issueNo}`,
                  rows: newsletterList?.detail.map((item) => ({
                    ...item,
                    disabled: item.status !== NewsletterStatus.PUBLISHED,
                  })),
                  onRowClick: ({ row }) => {
                    handleNewsletterClick(row.newsletterId, row.issueNo)
                  },
                }}
                paginationProps={{
                  data: newsletterList,
                  size: pagination?.size,
                  onPageChange: updatePage,
                  onSizeChange: updateSize,
                }}
              />
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap="20px" width="286px">
            <Box px="12px">
              <MariBadge />
            </Box>
            <Grid
              container
              gap={6}
              direction="column"
              flexShrink={0}
              px="12px"
              sx={{
                width: '286px',
              }}
            >
              <Typography color="gray.60" component="div" variant="body3R12">
                This newsletter is based on articles originally provided by market news data providers and has been generated through
                AI-driven analysis and reprocessing. By comprehensively analyzing market news data, the newsletter highlights major events,
                evaluates their potential market impact, and organizes the news flow in a clear and concise manner to support quick market
                understanding. The information contained herein is provided for reference purposes only, and users are encouraged to
                exercise their own judgment and responsibility when utilizing it.
              </Typography>
              <Typography color="gray.60" component="div" variant="body3R12">
                {t('newsletter.disclaimer')}
              </Typography>
            </Grid>
          </Box>
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default NewsLettersPage
