import { Box, Stack, Typography, keyframes, Collapse, Tooltip } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ButtonSelect from '@/components/common/select/ButtonSelect'
import SectionHeader from '@/pages/mi/dashboard/components/common/SectionHeader'

const shimmer = keyframes`
  0% {
    transform: translateX(-120%);
  }
  70% {
    transform: translateX(120%);
  }
  100% {
    transform: translateX(120%);
  }
`

const createBarExpandKeyframes = (minValue: number, maxValue: number, currentValue: number) => {
  const minWidth = `${(minValue / (minValue + maxValue)) * 100}%`
  const currentWidth = `${(currentValue / (minValue + maxValue)) * 100}%`
  const middleFrame = `${(minValue / currentValue) * 100}%`

  return keyframes`
    0% {
      width: 0;
    }
    ${middleFrame} {
      width: ${minWidth};
    }
    100% {
      width: ${currentWidth};
    }
  `
}

const textFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  30% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

const sampleItems = [
  { label: 'Current', key: 'current', value: [53, 27, 20], date: 'Sep 13 07:00 - Sep 14 07:00', disabled: true },
  { label: 'Previous', key: 'previous', value: [32, 28, 40], date: 'Sep 12 07:00 - Sep 13 07:00' },
  { label: 'Last 7 Days', key: 'last7days', value: [45, 27, 38], date: 'Sep 13 07:00 - Sep 20 07:00' },
  { label: 'Last 30 Days', key: 'last30days', value: [10, 62, 34], date: 'Sep 13 07:00 - Oct 12 07:00' },
]

const getColor = (type: 'positive' | 'neutral' | 'negative') => {
  if (type === 'positive') return 'linear-gradient(180deg, #3386C2 0%, #1366A2 100%)'
  if (type === 'negative') return 'linear-gradient(180deg, #A02A74 0%, #881C60 100%)'
  return 'linear-gradient(180deg, #A8A8A8 0%, #777777 100%)'
}

const getSentimentType = (index: number, length: number) => {
  if (index === 0) return 'positive'
  if (index === length - 1) return 'negative'
  return 'neutral'
}

interface SentimentBarProps {
  value: number
  valueIndex: number
  item: {
    key: string
    value: number[]
  }
  shimmerAnimation: string
  isFirstItem: boolean
  isVisible: boolean
}

const SentimentBar = ({ value, valueIndex, item, shimmerAnimation, isFirstItem, isVisible }: SentimentBarProps) => {
  const { t } = useTranslation()

  const total = item.value.reduce((acc: number, curr: number) => acc + curr, 0)
  const maxIndex = item.value.indexOf(Math.max(...item.value))
  const sentimentType = getSentimentType(valueIndex, item.value.length)
  const percentage = `${((value / total) * 100).toFixed(1).replace(/\.0$/, '')}%`

  const maxValue = Math.max(...item.value)
  const minValue = Math.min(...item.value)
  const animationDuration = `${maxValue * 0.02}s`

  const dynamicKeyframes = createBarExpandKeyframes(minValue, maxValue, value)

  const getTooltipTitle = () => {
    if (sentimentType === 'positive') return t('dashboard.sentiments.barTooltip.positive')
    if (sentimentType === 'negative') return t('dashboard.sentiments.barTooltip.negative')
    return t('dashboard.sentiments.barTooltip.neutral')
  }

  return (
    <Tooltip title={`${getTooltipTitle()} - ${percentage} (${value})`} placement="top" disableInteractive followCursor>
      <Box
        key={`${item.key}-${valueIndex}-${value}`}
        height={18}
        borderRadius="100px"
        padding="2px 8px"
        boxSizing="border-box"
        display="flex"
        alignItems="center"
        justifyContent="start"
        position="relative"
        overflow="hidden"
        sx={{
          background: getColor(sentimentType),
          transition: isVisible ? 'all 0.3s ease-in-out' : 'all 0.15s ease-in-out',
          minWidth: '25px',
          width: isFirstItem && isVisible ? '0%' : percentage,
          '--target-width': percentage,
          animation: isFirstItem && isVisible ? `${dynamicKeyframes} ${animationDuration} linear forwards` : 'none',
          animationDelay: '0.5s',
        }}
      >
        {valueIndex === maxIndex && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            sx={{
              background: `linear-gradient(90deg, 
            transparent 20%, 
            rgba(255, 255, 255, 0.1) 30%, 
            rgba(255, 255, 255, 0.3) 50%, 
            rgba(255, 255, 255, 0.1) 70%, 
            transparent 80%
          )`,
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
            opacity: isFirstItem && isVisible ? 0 : 1,
            transform: isFirstItem && isVisible ? 'scale(0.8)' : 'scale(1)',
            animation: isFirstItem && isVisible ? `${textFadeIn} ${animationDuration} ease-out forwards` : 'none',
            animationDelay: '0.5s',
          }}
        >
          {percentage}
        </Typography>
      </Box>
    </Tooltip>
  )
}

interface SentimentItemProps {
  item: {
    key: string
    label: string
    date: string
    value: number[]
  }
  index: number
  isVisible: boolean
  showLabels: boolean
  shimmerAnimation: string
}

const SentimentItem = ({ item, index, isVisible, showLabels, shimmerAnimation }: SentimentItemProps) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        maxHeight: isVisible ? '200px' : '0px',
        overflow: 'hidden',
        transition: isVisible ? 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: isVisible ? `${index * 50}ms` : '0ms',
        pointerEvents: isVisible ? 'auto' : 'none',
        marginBottom: isVisible ? '6px' : '0px',
      }}
    >
      <Stack>
        <Collapse
          in={showLabels && isVisible}
          timeout={showLabels && isVisible ? 400 : 200}
          sx={{
            transition: showLabels && isVisible ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Stack padding="4px 8px" direction="row" alignItems="center" justifyContent="space-between" gap="8px">
            <Typography variant="body1" color="gray.70">
              {t(`dashboard.sentiments.options.${item.key}Label`)}
            </Typography>
            <Typography variant="body3" color="gray.70">
              {item.date}
            </Typography>
          </Stack>
        </Collapse>
        <Box
          sx={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
            transition: isVisible ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: isVisible ? `${index * 50 + 150}ms` : '0ms',
          }}
        >
          <Stack padding="8px" direction="row" alignItems="center" gap="3px" borderRadius="100px" sx={{ backgroundColor: '#E9ECEF' }}>
            {item.value.map((value, valueIndex) => (
              <SentimentBar
                key={`${item.key}-${valueIndex}-${value}`}
                value={value}
                valueIndex={valueIndex}
                item={item}
                shimmerAnimation={shimmerAnimation}
                isFirstItem={index === 0}
                isVisible={isVisible}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

const Sentiment = () => {
  const { t } = useTranslation()
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['current'])

  const options = useMemo(
    () =>
      sampleItems.map((item) => ({
        label: t(`dashboard.sentiments.options.${item.key}Label`),
        value: item.key,
        disabled: item.disabled,
      })),
    [t],
  )

  return (
    <Stack padding="6px 12px 14px" borderRadius="10px" sx={{ backgroundColor: '#F8F9FA' }}>
      <SectionHeader title="Sentiment" tooltipTitle={t('dashboard.sentiments.titleTooltip')} padding="7.5px 0 7.5px 6px">
        <ButtonSelect
          selectType="switch"
          multiple
          items={options}
          selected={selectedOptions}
          onSelected={setSelectedOptions}
          menuPositionOffset={-32}
          fitMenuWidth={false}
        />
      </SectionHeader>
      {sampleItems.map((item, index) => {
        const isVisible = selectedOptions.includes(item.key)
        const showLabels = selectedOptions.length > 1

        return (
          <SentimentItem
            key={item.key}
            item={item}
            index={index}
            isVisible={isVisible}
            showLabels={showLabels}
            shimmerAnimation={shimmer}
          />
        )
      })}
    </Stack>
  )
}

export default Sentiment
