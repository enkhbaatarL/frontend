import { Box, Stack, Typography, keyframes, Collapse, Tooltip } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { DirectionType, IMarketRecapItem } from '@/service/mi/dashboard'

interface Props {
  sentiments?: IMarketRecapItem['sentiments']
}

const BAR_HEIGHT = 18
const BAR_MIN_WIDTH = 25
const ANIMATION_DELAY = '0.5s'
const STAGGER_DELAY = 50
const BAR_TRANSITION_DURATION = 150

const BAR_COLORS: Record<DirectionType, string> = {
  [DirectionType.Upward]: 'linear-gradient(180deg, #3386C2 0%, #1366A2 100%)',
  [DirectionType.Neutral]: 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)',
  [DirectionType.Downward]: 'linear-gradient(180deg, #A02A74 0%, #881C60 100%)',
  [DirectionType.OutOfRange]: 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)',
}

const SHIMMER_GRADIENT = `linear-gradient(90deg, 
  transparent 20%, 
  rgba(255, 255, 255, 0.1) 30%, 
  rgba(255, 255, 255, 0.3) 50%, 
  rgba(255, 255, 255, 0.1) 70%, 
  transparent 80%
)`

// ==================== 애니메이션 ====================
const shimmerAnimation = keyframes`
  0% { transform: translateX(-120%); }
  70% { transform: translateX(120%); }
  100% { transform: translateX(120%); }
`

const textFadeInAnimation = keyframes`
  0% { opacity: 0; transform: scale(0.8); }
  30% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`

const getSentimentType = (index: number, totalLength: number): DirectionType => {
  if (index === 0) return DirectionType.Upward
  if (index === totalLength - 1) return DirectionType.Downward
  return DirectionType.Neutral
}

const getTooltipTranslationKey = (directionType: DirectionType): string => {
  const keyMap: Record<DirectionType, string> = {
    [DirectionType.Upward]: 'dashboard.sentiments.barTooltip.upward',
    [DirectionType.Neutral]: 'dashboard.sentiments.barTooltip.neutral',
    [DirectionType.Downward]: 'dashboard.sentiments.barTooltip.downward',
    [DirectionType.OutOfRange]: 'dashboard.sentiments.barTooltip.neutral',
  }
  return keyMap[directionType]
}

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1).replace(/\.0$/, '')}%`
}

const createBarExpandAnimation = (values: number[], currentValue: number) => {
  const total = values.reduce((sum, val) => sum + val, 0)

  if (total === 0) {
    return {
      keyframes: keyframes`
        0% { width: 0; }
        100% { width: 0; }
      `,
      duration: '0s',
    }
  }

  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)

  const minWidthPercent = `${(minValue / total) * 100}%`
  const currentWidthPercent = `${(currentValue / total) * 100}%`
  const middleFramePercent = `currentValue > 0 ? ${minValue / currentValue} * 100 : 0`

  return {
    keyframes: keyframes`
      0% { width: 0; }
      ${middleFramePercent} { width: ${minWidthPercent}; }
      100% { width: ${currentWidthPercent}; }
    `,

    duration: `${maxValue * 0.02}s`,
  }
}

interface SentimentBarProps {
  value: number
  valueIndex: number
  total: number
  counts: number[]
  itemKey: string
  isAnimated: boolean
  isVisible: boolean
}

const SentimentBar = ({ value, valueIndex, total, counts, itemKey: _itemKey, isAnimated, isVisible }: SentimentBarProps) => {
  const { t } = useTranslation()

  if (value === 0) {
    return null
  }

  const sentimentType = getSentimentType(valueIndex, counts.length)
  const percentage = formatPercentage(value, total)
  const isMaxValue = value === Math.max(...counts)
  const { keyframes: expandKeyframes, duration } = createBarExpandAnimation(counts, value)

  const shouldAnimate = isAnimated && isVisible
  const tooltipKey = getTooltipTranslationKey(sentimentType)
  const tooltipText = `${t(tooltipKey)} - ${percentage} (${value})`

  return (
    <Tooltip title={tooltipText} placement="top" disableInteractive followCursor>
      <Box
        height={BAR_HEIGHT}
        borderRadius="100px"
        padding="2px 8px"
        boxSizing="border-box"
        display="flex"
        alignItems="center"
        justifyContent="start"
        position="relative"
        overflow="hidden"
        sx={{
          background: BAR_COLORS[sentimentType],
          minWidth: `${BAR_MIN_WIDTH}px`,
          width: shouldAnimate ? '0%' : percentage,
          transition: `all ${isVisible ? 0.3 : BAR_TRANSITION_DURATION / 1000}s ease-in-out`,
          animation: shouldAnimate ? `${expandKeyframes} ${duration} linear forwards` : 'none',
          animationDelay: ANIMATION_DELAY,
        }}
      >
        {isMaxValue && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            sx={{
              background: SHIMMER_GRADIENT,
              animation: `${shimmerAnimation} 4s ease-in-out infinite`,
              zIndex: 1,
            }}
          />
        )}

        <Typography
          variant="body2SB14"
          color="contentText.White"
          sx={{
            position: 'relative',
            zIndex: 2,
            opacity: shouldAnimate ? 0 : 1,
            transform: shouldAnimate ? 'scale(0.8)' : 'scale(1)',
            animation: shouldAnimate ? `${textFadeInAnimation} ${duration} ease-out forwards` : 'none',
            animationDelay: ANIMATION_DELAY,
          }}
        >
          {percentage}
        </Typography>
      </Box>
    </Tooltip>
  )
}

interface SentimentItemProps {
  itemKey: string
  label: string
  period: string
  counts: number[]
  index: number
  isVisible: boolean
  showLabels: boolean
}

const SentimentItem = ({ itemKey, label, period, counts, index, isVisible, showLabels }: SentimentItemProps) => {
  const total = counts.reduce((sum, val) => sum + val, 0)
  const transitionDelay = `${index * STAGGER_DELAY}ms`
  const barTransitionDelay = `${index * STAGGER_DELAY + 150}ms`

  return (
    <Box
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        maxHeight: isVisible ? '200px' : '0px',
        overflow: 'hidden',
        transition: `all ${isVisible ? 0.4 : 0.3}s cubic-bezier(0.4, 0, 0.2, 1)`,
        transitionDelay: isVisible ? transitionDelay : '0ms',
        pointerEvents: isVisible ? 'auto' : 'none',
        marginBottom: isVisible ? '6px' : '0px',
      }}
    >
      <Stack>
        <Collapse
          in={showLabels && isVisible}
          timeout={showLabels && isVisible ? 400 : 200}
          sx={{
            transition: `all ${showLabels && isVisible ? 0.3 : 0.1}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <Stack padding="4px 8px" direction="row" alignItems="center" justifyContent="space-between" gap="8px">
            <Typography variant="body1" color="gray.70">
              {label}
            </Typography>
            {period && (
              <Typography variant="body3" color="gray.70">
                {period}
              </Typography>
            )}
          </Stack>
        </Collapse>

        <Box
          sx={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
            transition: `all ${isVisible ? 0.3 : 0.1}s cubic-bezier(0.4, 0, 0.2, 1)`,
            transitionDelay: isVisible ? barTransitionDelay : '0ms',
          }}
        >
          <Stack padding="8px" direction="row" alignItems="center" gap="3px" borderRadius="100px" sx={{ backgroundColor: '#E9ECEF' }}>
            {counts.map((value, valueIndex) => (
              <SentimentBar
                key={`${itemKey}-${valueIndex}-${value}`}
                value={value}
                valueIndex={valueIndex}
                total={total}
                counts={counts}
                itemKey={itemKey}
                isAnimated={index === 0}
                isVisible={isVisible}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

const Sentiment = ({ sentiments }: Props) => {
  const { t } = useTranslation()
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['current'])

  const menuOptions = useMemo(
    () =>
      Object.keys(sentiments ?? {}).map((key, index) => ({
        label: t(`dashboard.sentiments.options.${key}Label`),
        value: key,
        disabled: index === 0, // 첫 번째 항목은 기본 선택
      })),
    [sentiments, t],
  )

  const sentimentItems = useMemo(
    () =>
      Object.entries(sentiments ?? {}).map(([key, value]) => ({
        itemKey: key,
        label: t(`dashboard.sentiments.options.${key}Label`),
        period: value.period,
        counts: [value.upwardCount, value.neutralCount, value.downwardCount],
      })),
    [sentiments, t],
  )

  // 선택된 옵션들의 모든 카운트 합이 0인지 확인
  const hasNoData = useMemo(() => {
    if (sentimentItems.length === 0) return true

    const selectedItems = sentimentItems.filter((item) => selectedOptions.includes(item.itemKey))
    if (selectedItems.length === 0) return true

    // 선택된 모든 항목의 카운트 합이 0인지 확인
    const totalCount = selectedItems.reduce((sum, item) => sum + item.counts.reduce((itemSum, count) => itemSum + count, 0), 0)

    return totalCount === 0
  }, [sentimentItems, selectedOptions])

  return (
    <Stack padding="6px 12px 14px" borderRadius="10px" sx={{ backgroundColor: '#F8F9FA', userSelect: 'none' }}>
      <SectionHeader title="Sentiment" tooltipTitle={t('dashboard.sentiments.titleTooltip')} padding="7.5px 0 7.5px 6px">
        {menuOptions.length > 0 && !hasNoData && (
          <MISelectMenu
            selectType="switch"
            multiple
            items={menuOptions}
            selected={selectedOptions}
            onSelected={setSelectedOptions}
            menuPositionOffset={{ right: -78 }}
            placement="bottom-end"
            fadeIn="left"
            closeOnScroll
          />
        )}
      </SectionHeader>

      {hasNoData ? (
        <Stack height={52} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
          <Typography variant="body2SB14" color="content.textNormal">
            No data available to display.
          </Typography>
        </Stack>
      ) : (
        sentimentItems.map((item, index) => (
          <SentimentItem
            key={item.itemKey}
            {...item}
            index={index}
            isVisible={selectedOptions.includes(item.itemKey)}
            showLabels={selectedOptions.length > 1}
          />
        ))
      )}
    </Stack>
  )
}

export default Sentiment
