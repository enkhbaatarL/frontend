import { Box, Divider, Stack, Typography } from '@mui/material'
import { Fragment, useState } from 'react'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import FeedItem from '@/pages/mi/dashboard/components/newsFeed/FeedItem'
import { INewsFeedItem } from '@/service/mi/dashboard'

const filterOptions = [{ label: 'Filters', value: 'filters' }]

const orderOptions = [
  { label: 'Highest', value: 'HIGHEST' },
  { label: 'Lowest', value: 'LOWEST' },
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Oldest', value: 'OLDEST' },
]

interface FeedProps {
  newsFeedItems?: INewsFeedItem[]
}

const Feed = ({ newsFeedItems }: FeedProps) => {
  const [filter, setFilter] = useState(filterOptions[0].value)
  const [order, setOrder] = useState(orderOptions[0].value)

  return (
    <Stack>
      <Stack direction="row" pl="6px" justifyContent="space-between" alignItems="center">
        <Stack direction="row" gap="8px" height="32px" alignItems="center">
          <Typography variant="sectionTitleTXL" color="black" height="32px">
            Feed
          </Typography>
          <Box padding="6px 8px" borderRadius="100px" boxSizing="border-box" sx={{ backgroundColor: 'gray.30', userSelect: 'none' }}>
            <Typography component="div" variant="body2SB14" color="content.textBlack" textAlign="center">
              {newsFeedItems?.length ?? 0}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap="8px">
          <MISelectMenu
            variant="outlined"
            selectType="none"
            selected={filter}
            onSelected={setFilter}
            items={filterOptions}
            sx={{ minWidth: 100 }}
          />
          <MISelectMenu variant="outlined" selected={order} onSelected={setOrder} items={orderOptions} sx={{ minWidth: 110 }} />
        </Stack>
      </Stack>
      <Stack mt="12px">
        {newsFeedItems?.map((item, index) => (
          <Fragment key={item.nwsSigId}>
            {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
            <FeedItem item={item} />
          </Fragment>
        ))}
        {!newsFeedItems || newsFeedItems.length === 0 ? (
          <Stack height={452} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
            <Typography variant="body2SB14" color="content.textNormal">
              No data available to display.
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  )
}

export default Feed
