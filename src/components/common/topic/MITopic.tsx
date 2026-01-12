import { Box, Stack, Typography, type StackProps } from '@mui/material'

import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import { ITopicTrackerTopicItem } from '@/service/mi/topicTracker'

export interface Topic extends ITopicTrackerTopicItem {
  isPending?: boolean
  disabled?: boolean
}

interface Props extends Omit<StackProps, 'onClick'> {
  selectedTopic?: number
  topics: Topic[]
  onClick?: (topic: Topic) => void
}

const MITopic = ({ topics, selectedTopic, onClick, ...props }: Props) => {
  const handleClick = (topic: Topic) => {
    if (topic.disabled) return
    onClick?.(topic)
  }

  const getBackgroundColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#F0F3F6'
    return selectedTopic === topic.newsTopicId ? '#F8F9FA' : '#FFFFFF'
  }
  const getBorderColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#CED4DA'
    return selectedTopic === topic.newsTopicId ? '#2E3F5E' : '#DEE2E6'
  }
  const getTextColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#ADB5BD'
    return selectedTopic === topic.newsTopicId ? '#2E3F5E' : '#495057'
  }
  const getHoverBackgroundColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#F0F3F6'
    return selectedTopic === topic.newsTopicId ? '#F8F9FA' : '#F0F3F6'
  }
  const getHoverBorderColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#CED4DA'
    return selectedTopic === topic.newsTopicId ? '#2E3F5E' : '#DEE2E6'
  }

  return (
    <HorizontalScrollContainer py="12px" gap="10px" scrollAmount={0.6} {...props}>
      {topics.map((topic, index) => (
        <Stack
          key={topic.newsTopicId?.toString() || `topic-${index}`}
          position="relative"
          direction="row"
          gap="6px"
          alignItems="center"
          height="36px"
          py={topic.iconImagePath ? '5px' : '8px'}
          pl={topic.iconImagePath ? '6px' : '12px'}
          pr={topic.iconImagePath ? '10px' : '12px'}
          boxSizing="border-box"
          onClick={() => handleClick(topic)}
          sx={{
            backgroundColor: getBackgroundColor(topic),
            border: `1px solid ${getBorderColor(topic)}`,
            borderRadius: '100px',
            userSelect: 'none',
            cursor: topic.disabled || topic.isPending ? 'default' : 'pointer',
            transition: 'all 0.2s ease-in-out, border-color 0.3s ease-in-out',
            flexShrink: 0,
            '&:hover': {
              backgroundColor: getHoverBackgroundColor(topic),
              border: `1px solid ${getHoverBorderColor(topic)}`,
            },
          }}
        >
          {topic.isPending && (
            <Box position="absolute" left="0" top="-7px" px="4px" sx={{ backgroundColor: '#495057', borderRadius: '100px' }}>
              <Typography color="white" fontSize={10} fontWeight={600}>
                PENDING
              </Typography>
            </Box>
          )}
          {topic.iconImagePath && (
            <Stack
              width={26}
              height={26}
              borderRadius="100px"
              border="1px solid #DEE2E6"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              boxSizing="border-box"
            >
              <img src={topic.iconImagePath} width={26} height={26} alt={topic.newsTopicId?.toString() || ''} draggable={false} />
            </Stack>
          )}
          <Typography variant="body1SB16" color={getTextColor(topic)} noWrap>
            {topic.newsTopicName}
          </Typography>
        </Stack>
      ))}
    </HorizontalScrollContainer>
  )
}

export default MITopic
