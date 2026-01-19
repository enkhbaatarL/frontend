import { Box, Stack, StackProps, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
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
        cursor: item.isViewable ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: item.isViewable ? 'contentBG.Hover' : 'transparent',
        },
      }}
      onClick={item.isViewable ? () => navigate(`/mi/market-news/${item.newsSummaryId}`) : undefined}
      {...props}
    >
      <Stack direction="row" alignItems="center" gap="4px" height="16px">
        <Typography variant="labelText" color="contentText.Normal">
          {item.provider}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap="0" sx={{ width: '100%', minWidth: 0 }}>
        <Typography
          variant="body1"
          color="contentText.Normal"
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {item.title}
        </Typography>
        {!item.isViewable && (
          <Box sx={{ flexShrink: 0, marginTop: '2px', marginLeft: '4px', display: 'inline-flex', alignItems: 'center', color: 'gray.60' }}>
            <LockOutlinedIcon width={16} height={16} style={{ marginBottom: '2px' }} />
          </Box>
        )}
      </Stack>
      <Stack direction="row" alignItems="center" gap="8px" height="16px">
        {item.categories.length > 0 && (
          <>
            <Typography variant="labelText" color="contentText.Normal">
              {item.categories.join(', ')}
            </Typography>
            <MILine length={8} direction="vertical" backgroundColor="gray.30" />
          </>
        )}
        <Typography variant="labelText" color="contentText.Normal">
          {dayjs(item.firstCreated).format('MMMM D, YYYY [at] h:mm A')}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default NewsItem
