import { Box, BoxProps, Stack, StackProps, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useRef, useMemo, useState, useEffect } from 'react'

import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'

interface TimelineBarProps {
  data: { id: string; time: string; title: string; trend: string; score: number }[]
  onItemClick?: (id: string) => void
}

const sampleData: TimelineBarProps['data'] = [
  { id: 'a1B', time: '2025-01-15 07:00', title: 'How Russia\'s Sanctions Evasion Could Create Lasting Costs', trend: 'upward', score: 9.8 },
  { id: 'c2D', time: '2025-01-15 13:30', title: 'Oil Prices Surge Amid Supply Concerns', trend: 'upward', score: 9.5 },
  { id: 'e3F', time: '2025-01-16 09:15', title: 'Oil Markets Weigh Russia\'s Oil-For-Food Trade Plan', trend: 'downward', score: 9.3 },
  { id: 'g4H', time: '2025-01-16 18:45', title: 'US Shale Production Update', trend: 'neutral', score: 9.1 },
  { id: 'i5J', time: '2025-01-17 08:00', title: 'US Production and Consumption Trends', trend: 'neutral', score: 8.9 },
  { id: 'k6L', time: '2025-01-17 20:10', title: 'OPEC+ Meeting Results and Market Impact', trend: 'upward', score: 8.7 },
  { id: 'm7N', time: '2025-01-18 07:30', title: 'China\'s Oil Demand Recovery', trend: 'upward', score: 8.5 },
  { id: 'o8P', time: '2025-01-18 15:00', title: 'Middle East Geopolitical Tensions', trend: 'downward', score: 8.3 },
  { id: 'q9R', time: '2025-01-19 10:20', title: 'European Gas Storage Status', trend: 'upward', score: 8.1 },
  { id: 's0T', time: '2025-01-19 22:00', title: 'Global Oil Price Fluctuations', trend: 'downward', score: 8.9 },
  { id: 'u1V', time: '2025-01-20 06:45', title: 'IEA Monthly Oil Report Highlights', trend: 'neutral', score: 8.7 },
  { id: 'w2X', time: '2025-01-20 14:30', title: 'Emerging Market Energy Demand', trend: 'upward', score: 8.5 },
  { id: 'y3Z', time: '2025-01-21 11:00', title: 'US Dollar Strength and Oil Prices', trend: 'downward', score: 8.3 },
  { id: 'b4C', time: '2025-01-21 19:40', title: 'Refinery Maintenance Schedules', trend: 'neutral', score: 8.1 },
  { id: 'd5E', time: '2025-01-22 08:10', title: 'Renewable Energy Integration', trend: 'upward', score: 7.9 },
  { id: 'f6G', time: '2025-01-22 16:50', title: 'Oil Export Policy Changes', trend: 'downward', score: 7.7 },
  { id: 'h7I', time: '2025-01-23 09:00', title: 'Natural Gas Market Update', trend: 'neutral', score: 6.5 },
  { id: 'j8K', time: '2025-01-23 21:15', title: 'Fossil Fuel Subsidy Reforms', trend: 'upward', score: 6.3 },
  { id: 'l9M', time: '2025-01-24 07:20', title: 'Global Energy Transition News', trend: 'downward', score: 6.1 },
  { id: 'n0O', time: '2025-01-24 18:30', title: 'Major Pipeline Project Announced', trend: 'upward', score: 5.9 },
  { id: 'p1Q', time: '2025-01-25 06:30', title: 'Federal Reserve Interest Rate Decision Impact', trend: 'downward', score: 5.7 },
  { id: 'r2S', time: '2025-01-25 12:15', title: 'Tech Sector Earnings Beat Expectations', trend: 'upward', score: 5.5 },
  { id: 't3U', time: '2025-01-25 18:00', title: 'Cryptocurrency Market Volatility', trend: 'neutral', score: 5.3 },
  { id: 'v4W', time: '2025-01-26 09:45', title: 'Climate Change Policy Updates', trend: 'upward', score: 5.1 },
  { id: 'x5Y', time: '2025-01-26 15:20', title: 'Supply Chain Disruptions Continue', trend: 'downward', score: 4.9 },
  { id: 'z6A', time: '2025-01-27 08:30', title: 'Inflation Data Shows Mixed Signals', trend: 'neutral', score: 4.7 },
  { id: 'B7D', time: '2025-01-27 16:10', title: 'Green Energy Investment Surges', trend: 'upward', score: 4.5 },
  { id: 'F8H', time: '2025-01-28 07:15', title: 'Trade War Escalation Concerns', trend: 'downward', score: 4.3 },
  { id: 'J9L', time: '2025-01-28 14:45', title: 'AI Technology Breakthroughs', trend: 'upward', score: 4.1 },
  { id: 'N0P', time: '2025-01-29 10:00', title: 'Housing Market Correction Begins', trend: 'downward', score: 3.9 },
  { id: 'R1T', time: '2025-01-29 17:30', title: 'Manufacturing Sector Recovery', trend: 'upward', score: 3.7 },
  { id: 'V2X', time: '2025-01-30 06:00', title: 'Global Economic Growth Forecasts', trend: 'neutral', score: 3.5 },
  { id: 'Z3B', time: '2025-01-30 13:20', title: 'Healthcare Innovation Advances', trend: 'upward', score: 3.3 },
  { id: 'C4E', time: '2025-01-31 09:30', title: 'Consumer Spending Patterns Shift', trend: 'neutral', score: 3.1 },
  { id: 'G5I', time: '2025-01-31 20:15', title: 'Infrastructure Investment Plans', trend: 'upward', score: 2.9 },
]

interface TimelineItemProps extends StackProps {
  item: TimelineBarProps['data'][number]
  isHovered?: boolean
  hoverColor?: string
}

const TimelineItem = ({ item, isHovered = false, hoverColor = '#F0F8FF', ...props }: TimelineItemProps) => {
  const titleRef = useRef<HTMLDivElement>(null)

  const [waitDelay, setWaitDelay] = useState(false)

  useEffect(() => {
    const handleHoverStart = () => {
      setWaitDelay(true)
      setTimeout(() => {
        setWaitDelay(false)
      }, 300)
    }

    const handleHoverEnd = () => {
      setWaitDelay(false)
    }

    if (isHovered) {
      handleHoverStart()
    } else {
      handleHoverEnd()
    }
  }, [isHovered])

  return (
    <Stack
      width={isHovered ? '216px' : '108px'}
      height={isHovered ? `${Math.max((titleRef.current?.clientHeight ?? 40) + 23, 44)}px` : '44px'}
      borderRadius="4px"
      border={isHovered ? 'none' : '1px solid #DEE2E6'}
      bgcolor={isHovered ? hoverColor : 'white'}
      padding="4px"
      boxSizing="border-box"
      overflow="hidden"
      sx={{
        userSelect: 'none',
        cursor: 'pointer',
        transition: `
          all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          height 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          background-color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
        `,
        boxShadow: isHovered
          ? '0 8px 32px rgba(51, 134, 194, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)',
        zIndex: isHovered ? 5 : 1,
      }}
      {...props}
    >
      <Stack direction="row" gap="4px">
        <Typography
          variant="labelText"
          color={isHovered ? 'white' : 'gray.60'}
          py="2px"
          sx={{
            transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {dayjs(item.time).format('HH:mm')}
        </Typography>
        <Stack
          height="16px"
          padding="2px 4px"
          borderRadius="4px"
          boxSizing="border-box"
          alignItems="center"
          justifyContent="center"
          sx={{
            backgroundColor: isHovered ? 'rgba(233, 236, 239, 0.2)' : 'rgba(233, 236, 239, 1)',
            transition: `background-color ${isHovered ? '0.05s' : '0.25s'} cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: 'background-color',
          }}
        >
          <Typography
            variant="labelText"
            color={isHovered ? 'white' : 'gray.60'}
            sx={{
              transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {item.score}
          </Typography>
        </Stack>
      </Stack>
      <Typography
        variant="body4"
        width={waitDelay ? '208px' : 'auto'}
        color={isHovered ? 'white' : 'gray.70'}
        overflow="hidden"
        sx={{
          textOverflow: 'ellipsis',
          whiteSpace: waitDelay ? 'normal' : 'nowrap',
          ...(isHovered && {
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'normal',
            textOverflow: 'unset',
          }),
          transition: 'color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {item.title}
      </Typography>
      <Typography
        ref={titleRef}
        position="fixed"
        top="-9999px"
        left="-9999px"
        width="206px"
        variant="body4"
        sx={{
          textOverflow: 'ellipsis',
          whiteSpace: 'normal',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          opacity: 0,
        }}
      >
        {item.title}
      </Typography>
    </Stack>
  )
}

const TimelineBar = ({ data, onItemClick }: TimelineBarProps) => {
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timelineItemRefsContainer = useRef<HTMLElement>(null)

  const items = useMemo(
    () =>
      [...data]
        .filter((item) => item.score > 8) // 8점 이상의
        .sort((a, b) => b.score - a.score)
        .slice(0, 11) // 상위 11개를
        .sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf()), // 시간순 정렬
    [data],
  )

  const { barStartTime, barEndTime } = useMemo(() => {
    const start = Math.min(...items.map((item) => dayjs(item.time).valueOf()))
    const end = Math.max(...items.map((item) => dayjs(item.time).valueOf()))
    const barPadding = (end - start) * 0.06

    // 가까운 정각시간으로 확장 (14:13 -> 14:00, 16:45 -> 17:00)
    const startTime = dayjs(start - barPadding)
      .startOf('hour')
      .valueOf()
    const endTime = dayjs(end + barPadding)
      .add(1, 'hour')
      .startOf('hour')
      .valueOf()

    return { barStartTime: startTime, barEndTime: endTime }
  }, [items])

  const itemHeights = useMemo(() => {
    const heights: number[] = []

    const getRandomHeight = (index: number): number => {
      if (index === 0) return 42
      if (index === 1) return 62

      const minHeight = 30
      const maxHeight = 96
      const minDifference = 50

      let newHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight

      for (let attempts = 0; attempts < 50; attempts++) {
        if (!(index >= 2 && heights[index - 2] !== undefined && Math.abs(newHeight - heights[index - 2]) < minDifference)) {
          break
        }
        newHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight
      }

      heights[index] = newHeight
      return newHeight
    }

    return items.map((_, index) => getRandomHeight(index))
  }, [items])

  const timelineItems = useMemo(() => {
    if (!containerWidth) return []

    return items.map((item, index) => {
      const evenNumber = index % 2 === 0
      const itemLineHeight = itemHeights[index]
      const timeRatio = dayjs(item.time).diff(barStartTime, 'ms') / (barEndTime - barStartTime)
      const leftPosition = containerWidth * timeRatio - 9
      const left = `${Math.floor(leftPosition)}px`
      const isRightSide = leftPosition > containerWidth * 0.7

      return {
        item,
        index,
        evenNumber,
        itemLineHeight,
        leftPosition,
        left,
        isRightSide,
      }
    })
  }, [items, containerWidth, barStartTime, barEndTime, itemHeights])

  const getColor = (trend: string) => {
    if (trend === 'upward') return '#3386C2'
    if (trend === 'downward') return '#A02A74'
    return '#868E96'
  }

  const handleMouseEnter = (index: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredItemIndex(index)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItemIndex(null)
    }, 100)
  }

  useEffect(() => {
    const updateContainerWidth = () => {
      if (timelineItemRefsContainer.current) {
        const width = timelineItemRefsContainer.current.clientWidth
        setContainerWidth(width)
      }
    }

    updateContainerWidth()

    window.addEventListener('resize', updateContainerWidth)

    const timeoutId = setTimeout(updateContainerWidth, 100)

    return () => {
      window.removeEventListener('resize', updateContainerWidth)
      clearTimeout(timeoutId)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (timelineItemRefsContainer.current && !containerWidth) {
      const width = timelineItemRefsContainer.current.clientWidth
      if (width > 0) {
        setContainerWidth(width)
      }
    }
  }, [containerWidth])

  return (
    <Stack gap="10px" px="10px">
      <Box ref={timelineItemRefsContainer} position="relative">
        <Box height="6px" borderRadius="100px" sx={{ backgroundColor: '#DEE2E6' }} />
        {timelineItems.map(({ item, index, evenNumber, itemLineHeight, left, isRightSide }) => {
          const isHovered = hoveredItemIndex === index

          return (
            <Box key={`${item.id}`} position="absolute" top="-6px" left={left}>
              <Box
                position="absolute"
                width="18px"
                height="18px"
                borderRadius="50%"
                border={`4px solid ${getColor(item.trend)}`}
                boxSizing="border-box"
                sx={{
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-6px',
                    left: '-6px',
                    right: '-6px',
                    bottom: '-6px',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    zIndex: 1,
                  },
                  transition: `
                    all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                    box-shadow 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)
                  `,
                  backgroundColor: isHovered ? getColor(item.trend) : 'white',
                  zIndex: isHovered ? 5 : 1,
                }}
              />
              <Stack
                position="absolute"
                height={46 + itemLineHeight}
                left={isRightSide ? undefined : '0'}
                right={isRightSide ? '-17px' : undefined}
                top={evenNumber ? undefined : '17px'}
                bottom={evenNumber ? '0' : undefined}
                flexDirection={evenNumber ? 'column' : 'column-reverse'}
              >
                <TimelineItem
                  item={item}
                  isHovered={isHovered}
                  hoverColor={isHovered ? getColor(item.trend) : undefined}
                  onMouseEnter={(e) => {
                    e.stopPropagation()
                    handleMouseEnter(index)
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation()
                    handleMouseLeave()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemClick?.(item.id)
                  }}
                />
                <Stack
                  direction="row"
                  className="line"
                  padding="4px 8px"
                  boxSizing="border-box"
                  justifyContent={isRightSide ? 'flex-end' : 'flex-start'}
                  flex={1}
                  zIndex={isHovered ? 5 : 1}
                  sx={{
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    width="1px"
                    height="100%"
                    sx={{
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      background: isHovered ? getColor(item.trend) : '#DEE2E6',
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          )
        })}
      </Box>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2M14" color="gray.60">
          {dayjs(barStartTime).format('MMM D HH:mm')}
        </Typography>
        <Typography variant="body2M14" color="gray.60">
          {dayjs(barEndTime).format('MMM D HH:mm')}
        </Typography>
      </Stack>
    </Stack>
  )
}

interface TimelineProps extends BoxProps {
  onItemClick?: (id: string) => void
}

const Timeline = ({ onItemClick, ...props }: TimelineProps) => (
  <Box
    borderRadius="10px"
    padding="6px 12px"
    sx={{
      backgroundColor: '#F8F9FA',
    }}
    {...props}
  >
    <Box padding="12px 6px 0">
      <SectionHeader title="Timeline" tooltipTitle="" />
    </Box>
    <Stack alignContent="center" justifyContent="center" height="280px">
      <TimelineBar data={sampleData} onItemClick={onItemClick} />
    </Stack>
  </Box>
)

export default Timeline
