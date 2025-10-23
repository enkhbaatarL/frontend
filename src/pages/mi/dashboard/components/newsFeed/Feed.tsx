import { Box, Divider, Stack, Typography } from '@mui/material'
import { Fragment, useState, useEffect, useRef } from 'react'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import FeedItem from '@/pages/mi/dashboard/components/newsFeed/FeedItem'
import { INewsFeedItem } from '@/service/mi/dashboard'

const filter2Options = [{ label: 'Filters', value: 'filters' }]

const filter3Options = [
  { label: 'Highest', value: 'highest' },
  { label: 'Lowest', value: 'lowest' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
]

interface FeedProps {
  newsFeedList?: INewsFeedItem[]
  selectedItemId?: string | null
  onItemHighlighted?: () => void
}

const Feed = ({ newsFeedList, selectedItemId, onItemHighlighted }: FeedProps) => {
  const [filter2, setFilter2] = useState(filter2Options[0].value)
  const [filter3, setFilter3] = useState(filter3Options[0].value)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 선택된 아이템으로 스크롤
  useEffect(() => {
    if (selectedItemId && itemRefs.current[selectedItemId]) {
      const element = itemRefs.current[selectedItemId]
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 하이라이트가 끝난 후 상태 초기화
      const timer = setTimeout(() => {
        onItemHighlighted?.()
      }, 1500)

      return () => clearTimeout(timer)
    } else {
      // selectedItemId가 null이면 즉시 상태 초기화
      onItemHighlighted?.()
      return () => {}
    }
  }, [selectedItemId, onItemHighlighted])

  return (
    <Stack px="12px">
      <Stack direction="row" padding="6px" justifyContent="space-between" alignItems="center">
        <Stack direction="row" gap="8px" height="32px" alignItems="center">
          <Typography variant="sectionTitleTXL" color="black" height="32px">
            Feed
          </Typography>
          <Box padding="6px 8px" borderRadius="100px" boxSizing="border-box" sx={{ backgroundColor: 'gray.30', userSelect: 'none' }}>
            <Typography component="div" variant="body2SB14" color="content.textBlack" textAlign="center">
              {newsFeedList?.length ?? 0}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" gap="8px">
          <MISelectMenu
            variant="outlined"
            selectType="none"
            selected={filter2}
            onSelected={setFilter2}
            items={filter2Options}
            sx={{ minWidth: 100 }}
          />
          <MISelectMenu variant="outlined" selected={filter3} onSelected={setFilter3} items={filter3Options} sx={{ minWidth: 110 }} />
        </Stack>
      </Stack>
      <Stack mt="12px">
        {newsFeedList?.map((item, index) => (
          <Fragment key={item.nwsSigId}>
            {index !== 0 && <Divider color="#DEE2E6" sx={{ my: '10px' }} />}
            <FeedItem
              item={item}
              isHighlighted={selectedItemId === item.nwsSigId.toString()}
              onRefSet={(ref) => {
                itemRefs.current[item.nwsSigId.toString()] = ref
              }}
            />
          </Fragment>
        ))}
        {!newsFeedList || newsFeedList.length === 0 ? (
          <Stack height={452} justifyContent="center" alignItems="center">
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
