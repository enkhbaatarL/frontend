import { Box, Divider, Stack, Typography } from '@mui/material'
import { Fragment, useEffect, useMemo, useState } from 'react'

import MIFilterMenu, { FilterGroupConfig } from '@/components/common/menu/MIFilterMenu'
import MISelectMenu, { SelectMenuItem } from '@/components/common/menu/MISelectMenu'
import MISkeleton from '@/components/mi/MISkeleton'
import useCodeData from '@/hooks/useCodeData'
import FeedItem from '@/pages/mi/dashboard/components/newsFeed/FeedItem'
import { DirectionType, INewsFeedItem } from '@/service/mi/dashboard'

const sentimentOptions = [
  { label: 'Upward', value: DirectionType.Upward },
  { label: 'Downward', value: DirectionType.Downward },
  { label: 'Neutral', value: DirectionType.Neutral },
]

const impactOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

interface FeedProps {
  newsFeedItems?: INewsFeedItem[]
  onApplyFilters: (sentiments: DirectionType[], impactScores: string[], regions: string[], save?: boolean) => void
  appliedFiltersCount: number
  initialFilters?: {
    sentiments: DirectionType[]
    impactScores: string[]
    regions: string[]
  }
  order: string
  orderOptions: SelectMenuItem[]
  onOrderChange: (order: string) => void
  isLoading?: boolean
}

const Feed = ({
  newsFeedItems,
  onApplyFilters,
  appliedFiltersCount,
  initialFilters,
  order,
  orderOptions,
  onOrderChange,
  isLoading,
}: FeedProps) => {
  const { regionCategoryCodeList } = useCodeData()
  const [previousItemsLength, setPreviousItemsLength] = useState(4)

  const filterGroups: FilterGroupConfig[][] = useMemo(
    () => [
      [
        {
          key: 'sentiments',
          title: 'Sentiments',
          filters: sentimentOptions,
          width: '146px',
        },
        {
          key: 'impactScores',
          title: 'Impacts',
          filters: impactOptions,
          width: '146px',
        },
      ],
      [
        {
          key: 'regions',
          title: 'Regions',
          filters: regionCategoryCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? [],
          width: '186px',
        },
      ],
    ],
    [regionCategoryCodeList],
  )

  const initialFilterValues = useMemo(
    () => ({
      sentiments: initialFilters?.sentiments ?? [],
      impactScores: initialFilters?.impactScores ?? [],
      regions: initialFilters?.regions ?? [],
    }),
    [initialFilters],
  )

  const handleApplyFilters = (filterValues: { [key: string]: string[] }, save?: boolean) => {
    onApplyFilters((filterValues.sentiments ?? []) as DirectionType[], filterValues.impactScores ?? [], filterValues.regions ?? [], save)
  }

  useEffect(() => {
    if (newsFeedItems && newsFeedItems.length > 0) {
      setPreviousItemsLength(newsFeedItems.length)
    }
  }, [newsFeedItems])

  return (
    <Stack>
      <Stack direction="row" pl="6px" justifyContent="space-between" alignItems="center">
        <Stack direction="row" gap="8px" height="32px" alignItems="center">
          <Typography variant="sectionTitleTXL" color="black" height="32px" sx={{ userSelect: 'none' }}>
            Feed
          </Typography>
          <Box
            minWidth="32px"
            padding="4px 8px"
            borderRadius="100px"
            boxSizing="border-box"
            sx={{ backgroundColor: 'gray.30', userSelect: 'none' }}
          >
            <Typography component="div" variant="body2SB14" color="content.textBlack" textAlign="center">
              {newsFeedItems?.length ?? 0}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap="8px">
          <MIFilterMenu
            filterGroups={filterGroups}
            initialValues={initialFilterValues}
            appliedFiltersCount={appliedFiltersCount}
            onApply={handleApplyFilters}
            showSaveOption={true}
            initialSaveOn={Boolean(localStorage.getItem('newsFeedFilters'))}
            enableHoverBackground
          />
          <MISelectMenu
            variant="outlined"
            selected={order}
            onSelected={onOrderChange}
            items={orderOptions}
            sx={{ minWidth: 110 }}
            enableHoverBackground
          />
        </Stack>
      </Stack>
      <Stack mt="12px">
        {isLoading ? (
          <Stack gap="10px">
            {Array.from({ length: previousItemsLength }, (_, index) => {
              const uniqueId = `skeleton-${Date.now()}-${index}`

              return (
                <Fragment key={uniqueId}>
                  {index !== 0 && <Divider color="#DEE2E6" />}
                  <MISkeleton
                    loading={true}
                    custom={
                      <Stack
                        padding="12px 18px"
                        borderRadius="10px"
                        gap="8px"
                        sx={{
                          backgroundColor: 'commonColor.White',
                          border: '1px solid transparent',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between">
                          <Box width="300px" height="26px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                        </Stack>

                        <Stack py="8px">
                          <Box width="90%" height="22px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} mb="8px" />
                          <Stack direction="row" gap="8px" alignItems="center">
                            <Box width="50px" height="14px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                            <Box width="1px" height="12px" sx={{ backgroundColor: 'gray.20' }} />
                            <Box width="140px" height="14px" borderRadius="4px" sx={{ backgroundColor: 'gray.20' }} />
                          </Stack>
                        </Stack>
                      </Stack>
                    }
                  />
                </Fragment>
              )
            })}
          </Stack>
        ) : (
          <>
            {newsFeedItems?.map((item, index) => (
              <Fragment key={item.newsSignificanceId}>
                {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
                <FeedItem item={item} showSimilarNews />
              </Fragment>
            ))}
            {!newsFeedItems || newsFeedItems.length === 0 ? (
              <Stack height={452} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
                <Typography variant="body2SB14" color="gray.50">
                  No data available to display.
                </Typography>
              </Stack>
            ) : null}
          </>
        )}
      </Stack>
    </Stack>
  )
}

export default Feed
