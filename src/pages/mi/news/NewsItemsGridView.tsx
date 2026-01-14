import { Box, Stack, Typography, Grid2 as Grid } from '@mui/material'

import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import NewsItem from '@/pages/mi/news/NewsItem'
import { INewsListItem } from '@/service/mi/marketNews'

interface Props {
  newsList: INewsListItem[]
  isLoading?: boolean
  skeletonCount?: number
}

const GRID_CARD_MIN_HEIGHT = 112

const NewsItemsGridView = ({ newsList, isLoading = false, skeletonCount = 10 }: Props) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          {Array.from({ length: Math.max(skeletonCount, 0) }, (_, i) => (
            <Grid component="div" key={`news-grid-skeleton-${i}`}>
              <Stack gap="6px">
                <NewsItem isSkeleton sx={{ minHeight: GRID_CARD_MIN_HEIGHT }} />
                <MILine backgroundColor="gray.30" />
              </Stack>
            </Grid>
          ))}
        </>
      )
    }

    if (newsList.length === 0) {
      return (
        <Grid component="div" sx={{ gridColumn: '1 / span 3', gridRow: '1 / span 4' }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="100%"
            height="100%"
            minHeight={GRID_CARD_MIN_HEIGHT * 4}
            boxSizing="border-box"
            sx={{ backgroundColor: '#F8F9FA', border: '1px solid #DEE2E6', borderRadius: '10px' }}
          >
            <Box display="flex" flexDirection="column" height="fit-content" alignItems="center">
              <ErrorOutlineIcon />
              <Typography variant="body3SB12" color="gray.60" mt="10px">
                No results found
              </Typography>
            </Box>
          </Box>
        </Grid>
      )
    }

    return (
      <>
        {newsList.map((item) => (
          <Grid component="div" key={item.newsSummaryId}>
            <Stack gap="6px">
              <NewsItem item={item} minHeight={GRID_CARD_MIN_HEIGHT} />
              <MILine backgroundColor="gray.30" />
            </Stack>
          </Grid>
        ))}
      </>
    )
  }

  return (
    <Grid
      container
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        columnGap: '21px',
        rowGap: '6px',
        gridAutoFlow: 'row dense',
      }}
    >
      {renderContent()}
    </Grid>
  )
}

export default NewsItemsGridView
