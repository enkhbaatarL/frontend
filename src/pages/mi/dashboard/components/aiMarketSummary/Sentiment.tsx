import { Box, Stack, Typography, keyframes, Collapse, Tooltip } from '@mui/material'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import MISelectMenu from '@/components/common/menu/MISelectMenu'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'
import { DirectionType, IMarketRecapItem } from '@/service/mi/dashboard'
import useAuthStore from '@/store/useAuthStore'

interface Props {
  sentiments?: IMarketRecapItem['sentiments']
}

const BAR_HEIGHT = 18
const ANIMATION_DELAY = '0.5s'
const STAGGER_DELAY = 50
const BAR_TRANSITION_DURATION = 150
const BAR_ANIMATION_DURATION = '1s'

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

const legendFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`

const createTextSyncAnimation = (contentWidth: number) => keyframes`
  0% { opacity: 0; transform: scale(0.8); max-width: 0; }
  100% { opacity: 1; transform: scale(1); max-width: ${contentWidth}px; }
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

    duration: BAR_ANIMATION_DURATION,
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
  containerWidth: number
}

const SentimentBar = ({
  value,
  valueIndex,
  total,
  counts,
  itemKey: _itemKey,
  isAnimated,
  isVisible,
  containerWidth,
}: SentimentBarProps) => {
  const { t } = useTranslation()
  const textRef = useRef<HTMLSpanElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [contentWidth, setContentWidth] = useState<number>(0)

  useEffect(() => {
    if (textRef.current) {
      const originalVisibility = textRef.current.style.visibility
      const originalOpacity = textRef.current.style.opacity
      const originalPosition = textRef.current.style.position

      textRef.current.style.visibility = 'hidden'
      textRef.current.style.opacity = '1'
      textRef.current.style.position = 'absolute'
      textRef.current.style.width = 'auto'

      const width = textRef.current.scrollWidth
      setContentWidth(width)

      textRef.current.style.visibility = originalVisibility
      textRef.current.style.opacity = originalOpacity
      textRef.current.style.position = originalPosition
    }
  }, [value, total])

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

  // 부모 컨테이너 너비를 기반으로 바의 최종 너비를 미리 계산
  const percentageValue = Number.parseFloat(percentage.replace('%', ''))
  const finalBarWidth = containerWidth > 0 ? (containerWidth * percentageValue) / 100 : 0
  const availableWidth = finalBarWidth > 0 ? finalBarWidth - 16 : 0 // 패딩 16px 제외
  const shouldShowText = availableWidth >= contentWidth - 2 && contentWidth > 0 && finalBarWidth > 16
  const textSyncAnimation = shouldShowText && contentWidth > 0 ? createTextSyncAnimation(contentWidth) : null

  return (
    <Tooltip title={tooltipText} placement="top" disableInteractive followCursor>
      <Box
        ref={boxRef}
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
          ref={textRef}
          variant="body2SB14"
          color="contentText.White"
          sx={{
            position: 'relative',
            zIndex: 2,
            width: 'fit-content',
            opacity: shouldShowText ? (shouldAnimate ? 0 : 1) : 0,
            transform: shouldAnimate ? 'scale(0.8)' : 'scale(1)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            visibility: shouldShowText ? 'visible' : 'hidden',
            animation: shouldShowText && shouldAnimate && textSyncAnimation ? `${textSyncAnimation} ${duration} ease-out forwards` : 'none',
            animationDelay: shouldShowText ? ANIMATION_DELAY : '0s',
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
  isInitialItem: boolean
}

const SentimentItem = ({ itemKey, label, period, counts, index, isVisible, showLabels, isInitialItem }: SentimentItemProps) => {
  const total = counts.reduce((sum, val) => sum + val, 0)
  const transitionDelay = `${index * STAGGER_DELAY}ms`
  const barTransitionDelay = `${index * STAGGER_DELAY + 150}ms`
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current) {
      return undefined
    }

    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 16) // padding 16px 제외
      }
    }

    updateContainerWidth()

    const resizeObserver = new ResizeObserver(updateContainerWidth)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isVisible])

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
          <Stack
            ref={containerRef}
            padding="8px"
            direction="row"
            alignItems="center"
            gap="3px"
            borderRadius="100px"
            sx={{ backgroundColor: '#E9ECEF' }}
          >
            {counts.map((value, valueIndex) => (
              <SentimentBar
                key={`${itemKey}-${valueIndex}-${value}`}
                value={value}
                valueIndex={valueIndex}
                total={total}
                counts={counts}
                itemKey={itemKey}
                isAnimated={isInitialItem}
                isVisible={isVisible}
                containerWidth={containerWidth}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

const DEFAULT_INDEX = 0
const COMPANY_2015_DEFAULT_INDEX = 2

const Sentiment = ({ sentiments }: Props) => {
  const { t } = useTranslation()
  const { accessCompanyInfo } = useAuthStore()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])
  const defaultIndex = companyNo === 2015 ? COMPANY_2015_DEFAULT_INDEX : DEFAULT_INDEX

  const sentimentKeys = useMemo(() => Object.keys(sentiments ?? {}), [sentiments])

  const [userSelectedOptions, setUserSelectedOptions] = useState<string[] | null>(null)

  const selectedOptions = useMemo(() => {
    if (userSelectedOptions !== null) return userSelectedOptions
    if (sentimentKeys.length === 0) return []
    const defaultKey = sentimentKeys[defaultIndex] ?? sentimentKeys[0]
    return defaultKey ? [defaultKey] : []
  }, [userSelectedOptions, sentimentKeys, defaultIndex])

  const menuOptions = useMemo(
    () =>
      sentimentKeys.map((key, index) => ({
        label: t(`dashboard.sentiments.options.${key}Label`),
        value: key,
        disabled: index === defaultIndex, // 기본 선택 항목은 비활성화
      })),
    [sentimentKeys, t, defaultIndex],
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
            onSelected={setUserSelectedOptions}
            menuPositionOffset={{ right: -78 }}
            placement="bottom-end"
            fadeIn="left"
            closeOnScroll
          />
        )}
      </SectionHeader>

      {hasNoData ? (
        <Stack height={52} justifyContent="center" alignItems="center" sx={{ userSelect: 'none' }}>
          <Typography variant="body2SB14" color="gray.50">
            No data available to display.
          </Typography>
        </Stack>
      ) : (
        <>
          {sentimentItems.map((item, index) => (
            <SentimentItem
              key={item.itemKey}
              {...item}
              index={index}
              isVisible={selectedOptions.includes(item.itemKey)}
              showLabels={selectedOptions.length > 1}
              isInitialItem={index === defaultIndex}
            />
          ))}

          <Stack
            pt="8px"
            pb="2px"
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap="10px"
            sx={{
              opacity: 0,
              animation: `${legendFadeIn} 0.4s ease-out 0.6s forwards`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" gap="4px">
              <Box
                width={10}
                height={10}
                borderRadius="50%"
                sx={{
                  background: 'linear-gradient(180deg, #3386C2 0%, #1366A2 100%)',
                }}
              />
              <Typography variant="body3R12" color="gray.70">
                Upward: 상승 영향
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="center" gap="4px">
              <Box
                width={10}
                height={10}
                borderRadius="50%"
                sx={{
                  background: 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)',
                }}
              />
              <Typography variant="body3R12" color="gray.70">
                Neutral: 중립
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="center" gap="4px">
              <Box
                width={10}
                height={10}
                borderRadius="50%"
                sx={{
                  background: 'linear-gradient(180deg, #B82E72 0%, #8E1F59 100%)',
                }}
              />
              <Typography variant="body3R12" color="gray.70">
                Downward: 하락 영향
              </Typography>
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default Sentiment
