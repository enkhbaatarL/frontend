import { Stack, StackProps, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import MILine from '@/components/common/divider/MILine'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import { INewsListItem } from '@/service/mi/marketNews'

export interface NewsItemProps extends StackProps {
  item?: INewsListItem
  isSkeleton?: boolean
}

const NewsItem = ({ item, isSkeleton = false, ...props }: NewsItemProps) => {
  const navigate = useNavigate()

  if (isSkeleton) {
    return (
      <Stack padding="12px" borderRadius="10px" gap="6px" boxSizing="border-box" {...props}>
        <MIBaseSkeleton.TextLine width="80px" height="16px" />
        <MIBaseSkeleton.TextLine width="70%" height="20px" />
        <MIBaseSkeleton.TextLine width="200px" height="16px" />
      </Stack>
    )
  }

  if (!item) {
    return null
  }

  return (
    <Stack
      padding="12px"
      borderRadius="10px"
      gap="6px"
      boxSizing="border-box"
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'contentBG.Hover',
        },
      }}
      onClick={() => navigate(`/mi/market-news/${item.newsSummaryId}`)}
      {...props}
    >
      <Stack direction="row" alignItems="center" gap="4px" height="16px">
        <Typography variant="labelText" color="contentText.Normal">
          {item.provider}
        </Typography>
      </Stack>
      <Typography
        variant="body1"
        color="contentText.Normal"
        sx={{
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis',
        }}
      >
        {item.title}
      </Typography>
      <Stack direction="row" alignItems="center" gap="8px" height="16px">
        {item.categories.length > 0 && (
          <>
            <Typography variant="labelText" color="contentText.Normal">
              {item.categories.join(', ')}
            </Typography>
            <MILine length={8} direction="vertical" backgroundColor="gray.30" />
          </>
        )}
        {/* {item.regions.length > 0 && (
          <>
            <Typography variant="labelText" color="contentText.Normal">
              {item.regions.join(', ')}
            </Typography>
            <MILine length={8} direction="vertical" backgroundColor="gray.30" />
          </>
        )}
        {item.industries.length > 0 && (
          <>
            <Typography variant="labelText" color="contentText.Normal">
              {item.industries.join(', ')}
            </Typography>
            <MILine length={8} direction="vertical" backgroundColor="gray.30" />
          </>
        )} */}
        <Typography variant="labelText" color="contentText.Normal">
          {dayjs(item.firstCreated).format('MMMM D, YYYY [at] h:mm A')}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default NewsItem
