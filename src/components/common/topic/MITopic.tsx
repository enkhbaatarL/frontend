import { Box, Stack, Typography, type StackProps } from '@mui/material'
import { ReactNode } from 'react'

export interface Topic {
  image?: string
  label: ReactNode
  value: string
  isPending?: boolean
  disabled?: boolean
}

interface Props extends Omit<StackProps, 'onClick'> {
  selectedTopic?: string
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
    return selectedTopic === topic.value ? '#F8F9FA' : '#FFFFFF'
  }
  const getBorderColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#CED4DA'
    return selectedTopic === topic.value ? '#2E3F5E' : '#DEE2E6'
  }
  const getTextColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#ADB5BD'
    return selectedTopic === topic.value ? '#2E3F5E' : '#495057'
  }
  const getHoverBackgroundColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#F0F3F6'
    return selectedTopic === topic.value ? '#F8F9FA' : '#F0F3F6'
  }
  const getHoverBorderColor = (topic: Topic) => {
    if (topic.isPending || topic.disabled) return '#CED4DA'
    return selectedTopic === topic.value ? '#2E3F5E' : '#DEE2E6'
  }

  return (
    <Stack direction="row" py="12px" gap="10px" {...props}>
      {topics.map((topic, index) => (
        <Stack
          key={topic.value ?? `topic-${index}`}
          position="relative"
          direction="row"
          gap="6px"
          alignItems="center"
          height="36px"
          py={topic.image ? '5px' : '8px'}
          pl={topic.image ? '6px' : '12px'}
          pr={topic.image ? '10px' : '12px'}
          boxSizing="border-box"
          onClick={() => handleClick(topic)}
          sx={{
            backgroundColor: getBackgroundColor(topic),
            border: `1px solid ${getBorderColor(topic)}`,
            borderRadius: '100px',
            userSelect: 'none',
            cursor: topic.disabled || topic.isPending ? 'default' : 'pointer',
            transition: 'all 0.2s ease-in-out, border-color 0.3s ease-in-out',
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
          {topic.image && (
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
              <img src={topic.image} width={26} height={26} alt={topic.value} draggable={false} />
            </Stack>
          )}
          <Typography variant="body1SB16" color={getTextColor(topic)}>
            {topic.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}

export default MITopic
