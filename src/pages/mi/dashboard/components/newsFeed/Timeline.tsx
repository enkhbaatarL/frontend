import { Box, BoxProps, Stack, StackProps, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useRef, useMemo, useState, useEffect } from 'react'

import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import FeedItem from '@/pages/mi/dashboard/components/newsFeed/FeedItem'
import { INewsFeedItem, DirectionType } from '@/service/mi/dashboard'

interface TimelineBarProps {
  data: INewsFeedItem[]
  onItemClick?: (id: string) => void
  selectedItemId?: string | null
}

interface TimelineItemProps extends StackProps {
  item: INewsFeedItem
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
          {dayjs(item.firstCreated).format('HH:mm')}
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
            {item.impctScre}
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

const TimelineBar = ({ data, onItemClick, selectedItemId }: TimelineBarProps) => {
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timelineItemRefsContainer = useRef<HTMLElement>(null)

  const items = useMemo(
    () =>
      [...data]
        .filter((item) => item.impctScre > 8) // 8점 이상의
        .sort((a, b) => b.impctScre - a.impctScre)
        .slice(0, 11) // 상위 11개를
        .sort((a, b) => dayjs(a.firstCreated).valueOf() - dayjs(b.firstCreated).valueOf()), // 시간순 정렬
    [data],
  )

  const { barStartTime, barEndTime } = useMemo(() => {
    const start = Math.min(...items.map((item) => dayjs(item.firstCreated).valueOf()))
    const end = Math.max(...items.map((item) => dayjs(item.firstCreated).valueOf()))
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
      const timeRatio = dayjs(item.firstCreated).diff(barStartTime, 'ms') / (barEndTime - barStartTime)
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

  const getColor = (trend: DirectionType) => {
    if (trend === DirectionType.Upward) return '#3386C2'
    if (trend === DirectionType.Downward) return '#A02A74'
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
          const isSelected = selectedItemId === item.nwsSigId.toString()
          const shouldHighlight = isHovered || isSelected

          return (
            <Box key={`${item.nwsSigId}`} position="absolute" top="-6px" left={left}>
              <Box
                position="absolute"
                width="18px"
                height="18px"
                borderRadius="50%"
                border={`4px solid ${getColor(item.drctnlt)}`}
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
                  backgroundColor: shouldHighlight ? getColor(item.drctnlt) : 'white',
                  zIndex: shouldHighlight ? 5 : 1,
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
                  isHovered={shouldHighlight}
                  hoverColor={shouldHighlight ? getColor(item.drctnlt) : undefined}
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
                    onItemClick?.(item.nwsSigId.toString())
                  }}
                />
                <Stack
                  direction="row"
                  className="line"
                  padding="4px 8px"
                  boxSizing="border-box"
                  justifyContent={isRightSide ? 'flex-end' : 'flex-start'}
                  flex={1}
                  zIndex={shouldHighlight ? 5 : 1}
                  sx={{
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    width="1px"
                    height="100%"
                    sx={{
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      background: shouldHighlight ? getColor(item.drctnlt) : '#DEE2E6',
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
  timeLineData?: INewsFeedItem[]
}

const Timeline = ({ onItemClick, timeLineData, ...props }: TimelineProps) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isHighlighted, setIsHighlighted] = useState(false)

  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    setIsHighlighted(false)
    setTimeout(() => {
      setIsHighlighted(true)
      animationTimeoutRef.current = setTimeout(() => {
        setIsHighlighted(false)
      }, 1500)
    }, 50)
  }

  const handleItemClick = (id: string) => {
    setSelectedItemId(id)
  }

  const selectedItem = useMemo(
    () => timeLineData?.find((item) => item.nwsSigId.toString() === selectedItemId),
    [timeLineData, selectedItemId],
  )

  const handleItemClose = () => {
    setSelectedItemId(null)
  }

  useEffect(() => {
    if (selectedItemId) {
      startAnimation()
    }
  }, [selectedItemId])

  useEffect(
    () => () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    },
    [],
  )

  return (
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
        {!timeLineData || timeLineData.length === 0 ? (
          <Stack height={280} justifyContent="center" alignItems="center">
            <Typography variant="body2SB14" color="content.textNormal" mt="-24px">
              No data available to display.
            </Typography>
          </Stack>
        ) : (
          <TimelineBar data={timeLineData} onItemClick={handleItemClick} selectedItemId={selectedItemId} />
        )}
      </Stack>
      {selectedItem && (
        <FeedItem
          key={selectedItem.nwsSigId}
          item={selectedItem}
          onClose={handleItemClose}
          isHighlighted={isHighlighted}
          mb="6px"
          focusMode
        />
      )}
    </Box>
  )
}

export default Timeline
