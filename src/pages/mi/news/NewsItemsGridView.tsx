import { Box, Stack, Typography, Grid2 as Grid } from '@mui/material'
import dayjs from 'dayjs'
import { useState, useMemo } from 'react'

import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MISentimentsChart, { SentimentData } from '@/pages/mi/news/components/MISentimentsChart'
import NewsItem from '@/pages/mi/news/NewsItem'
import { INewsListItem } from '@/service/mi/marketNews'

interface Props {
  newsList: INewsListItem[]
  isLoading?: boolean
  skeletonCount?: number
  showSentimentsGraph?: boolean
}

const GRID_CARD_MIN_HEIGHT = 112

const generateSampleSentimentData = (days: number = 7): SentimentData[] => {
  const data: SentimentData[] = []
  const today = dayjs()

  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, 'day')
    // 랜덤 샘플 데이터 생성 (합이 100이 되도록)
    const upward = Math.floor(Math.random() * 40) + 20 // 20-60%
    const neutral = Math.floor(Math.random() * 30) + 15 // 15-45%
    const downward = 100 - upward - neutral

    data.push({
      date: date.format('MM/DD'),
      upward,
      neutral,
      downward,
    })
  }

  return data
}

const SentimentsGraphCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days')

  const sentimentData = useMemo(() => {
    const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90
    return generateSampleSentimentData(days)
  }, [selectedPeriod])

  return (
    <Stack
      key="news-grid-fixed-graph-card"
      padding="12px"
      border="1px solid"
      borderColor="contentBorder.Normal"
      borderRadius="10px"
      boxSizing="border-box"
      sx={{
        minHeight: (GRID_CARD_MIN_HEIGHT + 12) * 4,
      }}
    >
      <Stack direction="row" padding="6px 10px" alignItems="center" justifyContent="space-between">
        <Typography variant="body1" color="contentText.Normal">
          Sentiments
        </Typography>
        <MISelectMenu
          sx={{ height: 36 }}
          items={[
            { label: 'Last 7 days', value: '7days' },
            { label: 'Last 30 days', value: '30days' },
            { label: 'Last 90 days', value: '90days' },
          ]}
          selected={selectedPeriod}
          onSelected={(selected: string) => setSelectedPeriod(selected)}
        />
      </Stack>
      <Stack py="24px" borderRadius="10px" overflow="hidden" gap="12px" boxSizing="border-box">
        <Stack direction="row" height={30} justifyContent="center" alignItems="center" gap="8px">
          <Stack direction="row" alignItems="center" gap="2px">
            <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#3386C2" />
            <Typography variant="body2SB14" color="contentText.Normal">
              Upward
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap="2px">
            <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#A8A8A8" />
            <Typography variant="body2SB14" color="contentText.Normal">
              Neutral
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap="2px">
            <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#A02A74" />
            <Typography variant="body2SB14" color="contentText.Normal">
              Downward
            </Typography>
          </Stack>
        </Stack>
        <Box height={230} px="10px" boxSizing="border-box">
          <MISentimentsChart data={sentimentData} />
        </Box>
        <Typography
          px="24px"
          variant="labelText"
          color="contentText.Subtext"
          lineHeight={1.1}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem
          ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum
          Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum
        </Typography>
      </Stack>
    </Stack>
  )
}

const NewsItemsGridView = ({ newsList, isLoading = false, skeletonCount = 10, showSentimentsGraph = true }: Props) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          {showSentimentsGraph && (
            <Grid component="div" sx={{ gridColumn: '3 / span 1', gridRow: '1 / span 4' }}>
              <SentimentsGraphCard />
            </Grid>
          )}
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
        <>
          <Grid component="div" sx={{ gridColumn: '1 / span 2', gridRow: '1 / span 4' }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
              height="100%"
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
          <Grid component="div" sx={{ gridColumn: '3 / span 1', gridRow: '1 / span 4' }}>
            <SentimentsGraphCard />
          </Grid>
        </>
      )
    }

    return (
      <>
        {showSentimentsGraph && (
          <Grid component="div" sx={{ gridColumn: '3 / span 1', gridRow: '1 / span 4' }}>
            <SentimentsGraphCard />
          </Grid>
        )}
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
