import SouthAmericaIcon from '@mui/icons-material/SouthAmerica'
import { Box, Divider, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import AiSummary, { AiSummaryHandle, AiSummaryData } from '@/pages/mi/dashboard/components/common/AiSummary'
import CategoryChip from '@/pages/mi/dashboard/components/common/CategoryChip'
import TrendIcon from '@/pages/mi/dashboard/components/newsFeed/TrendIcon'
import { INewsFeedItem, DirectionType } from '@/service/mi/dashboard'
import { getMarketIcon } from '@/utils/marketIcons'

const getFeedIcon = (type: string): string | undefined => getMarketIcon(type)

const getTrendColor = (drctnlt: DirectionType) => {
  switch (drctnlt) {
    case DirectionType.Upward:
      return '#3386C2'
    case DirectionType.Downward:
      return '#A02A74'
    default:
      return '#A8A8A8' // Neutral
  }
}

const getTrendString = (drctnlt: DirectionType): string => {
  switch (drctnlt) {
    case DirectionType.Upward:
      return 'upward'
    case DirectionType.Downward:
      return 'downward'
    default:
      return 'neutral'
  }
}

const getImpactLevel = (score: number): string => {
  if (score >= 9) return 'high'
  if (score >= 7) return 'medium'
  return 'low'
}

interface FeedItemProps {
  item: INewsFeedItem
  isHighlighted?: boolean
  onRefSet?: (ref: HTMLDivElement | null) => void
}

const FeedItem = ({ item, isHighlighted, onRefSet }: FeedItemProps) => {
  const [shouldFlash, setShouldFlash] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const aiSummaryRef = useRef<AiSummaryHandle>(null)
  const { t } = useTranslation()

  const trendColor = getTrendColor(item.drctnlt)
  const trendString = getTrendString(item.drctnlt)
  const impactLevel = getImpactLevel(item.impctScre)

  useEffect(() => {
    if (isHighlighted) {
      setShouldFlash(true)
      const timer = setTimeout(() => {
        setShouldFlash(false)
      }, 1300)
      return () => clearTimeout(timer)
    } else {
      // 하이라이트가 해제되면 즉시 애니메이션 중지
      setShouldFlash(false)
      return () => {}
    }
  }, [isHighlighted])

  const handleClick = () => {
    setIsExpanded((prev) => !prev)
    aiSummaryRef.current?.toggle()
  }

  // 임시 AI 요약 조회 함수
  const fetchFeedSummary = async (): Promise<AiSummaryData> => {
    const summaryData: AiSummaryData = {
      title: t('dashboard.sampleData.feed.summary.title'),
      summary: [
        t('dashboard.sampleData.feed.summary.summary.0'),
        t('dashboard.sampleData.feed.summary.summary.1'),
        t('dashboard.sampleData.feed.summary.summary.2'),
        t('dashboard.sampleData.feed.summary.summary.3'),
        t('dashboard.sampleData.feed.summary.summary.4'),
      ].filter(Boolean),
    }

    return new Promise<AiSummaryData>((resolve) => {
      setTimeout(() => {
        resolve(summaryData)
      }, 1000)
    })
  }

  return (
    <Stack
      ref={onRefSet}
      padding="12px 18px"
      borderRadius="10px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        backgroundColor: isExpanded ? '#F0F3F6' : 'transparent',
        border: '1px solid transparent',
        boxSizing: 'border-box',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          border: `2px solid ${trendColor}`,
          borderRadius: '10px',
          boxShadow: `0 0 0 1px ${trendColor}40, 0 2px 8px ${trendColor}30`,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: shouldFlash ? 1 : 0,
          transform: shouldFlash ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        },
        '&:hover': {
          backgroundColor: '#F0F3F6',
        },
        userSelect: 'none',
      }}
      onClick={handleClick}
    >
      <Stack direction="row" gap="8px">
        {getFeedIcon(item.nwsMrktCtgrCd) && (
          <CategoryChip>
            <Box component="img" width={22} height={22} src={getFeedIcon(item.nwsMrktCtgrCd)} alt={item.nwsMrktCtgrCd} />
          </CategoryChip>
        )}
        <CategoryChip padding="6px 8px 6px 6px">
          <Stack direction="row" alignItems="center" gap="4px">
            <SouthAmericaIcon sx={{ fontSize: 16, color: 'content.iconEnabled' }} />
            <Typography variant="labelText" color="content.textNormal">
              Global
            </Typography>
          </Stack>
        </CategoryChip>
        <CategoryChip>
          <TrendIcon sentiment={trendString} impact={impactLevel} />
        </CategoryChip>
        <CategoryChip padding="6px 8px">
          <Typography variant="body2SB14" color="content.textNormal">
            {item.impctScre}
          </Typography>
        </CategoryChip>
      </Stack>
      <Stack py="8px">
        <Typography
          py="4px"
          variant="heading4"
          fontWeight={500}
          noWrap
          sx={{
            overflow: isExpanded ? 'visible' : 'hidden',
            textOverflow: isExpanded ? 'unset' : 'ellipsis',
            whiteSpace: isExpanded ? 'normal' : 'nowrap',
            width: '100%',
          }}
        >
          {item.title}
        </Typography>
        <Stack direction="row" gap="8px">
          <Typography variant="body2SB14" color="content.textNormal">
            {item.provider}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ height: '12px', borderColor: 'contentBorder.Normal' }} />
          <Typography variant="body2SB14" color="content.textNormal">
            {dayjs(item.firstCreated).format('MMMM D, YYYY, hh:mm A')}
          </Typography>
        </Stack>
      </Stack>
      <AiSummary ref={aiSummaryRef} fetchSummary={fetchFeedSummary} />
    </Stack>
  )
}

export default FeedItem
