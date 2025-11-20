import { Box, Typography } from '@mui/material'
import { Fragment } from 'react'

import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import NewsItem from '@/pages/mi/news/NewsItem'
import { INewsListItem } from '@/service/mi/marketNews'

interface Props {
  newsList: INewsListItem[]
  isLoading?: boolean
  skeletonCount?: number
}

const NewsItemsListView = ({ newsList, isLoading = false, skeletonCount = 10 }: Props) => {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <Fragment key={`news-list-skeleton-${i}`}>
            <NewsItem isSkeleton sx={{ minHeight: '90px' }} />
            <MILine backgroundColor="gray.30" />
          </Fragment>
        ))}
      </>
    )
  }

  if (newsList.length === 0) {
    return (
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
    )
  }

  return (
    <>
      {newsList.map((item) => (
        <Fragment key={item.newsSummaryId}>
          <NewsItem item={item} />
          <MILine backgroundColor="gray.30" />
        </Fragment>
      ))}
    </>
  )
}

export default NewsItemsListView
