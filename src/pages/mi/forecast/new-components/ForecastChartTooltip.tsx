import { Box, Stack, Typography } from '@mui/material'
import { forwardRef, useRef, useMemo, useState } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import DashLineIcon from '@/components/common/forecast-chart/icons/DashLineIcon'
import SolidLineIcon from '@/components/common/forecast-chart/icons/SolidLineIcon'
import CloseIcon from '@/components/common/icons/CloseIcon'
import MIMorphingPopup, { MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import ForecastChartTooltipReportContent from '@/pages/mi/forecast/new-components/ForecastChartTooltipReportContent'
import { formatValue } from '@/utils/number'

export interface TooltipContent {
  label?: string
  value?: number
  color?: string
  date: string
  predictDate?: string | null
  startDate?: string
  toFixed?: number
  isForecast?: boolean
  isFixedMode?: boolean
  goodsDataSourceNo?: number
}

const ChartToolTipItem = (props: {
  label: string
  value?: number
  color?: string
  toFixed?: number
  isForecast?: boolean
  isFixedMode?: boolean
  monthSelect?: string
  goodsDataSourceNo?: number
  date?: string
  predictDate?: string | null
  startDate?: string
  companyNo?: number
  interval?: string
}) => {
  const {
    label,
    value,
    color,
    toFixed,
    isForecast = false,
    isFixedMode = false,
    goodsDataSourceNo,
    date,
    predictDate,
    startDate,
    companyNo,
    interval,
  } = props
  const LineIcon = isForecast ? DashLineIcon : SolidLineIcon
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const hasValue = value !== undefined
  const isInteractionDisabled = companyNo === 2015 && interval === '1Y' && isFixedMode
  const canClick = isForecast && hasValue && !isInteractionDisabled
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // ForecastChartTooltipReportContent를 메모이제이션하여 불필요한 리렌더링 방지
  const reportContent = useMemo(
    () => (
      <ForecastChartTooltipReportContent
        goodsDataSourceNo={goodsDataSourceNo}
        date={predictDate || date}
        startDate={startDate}
        isVisible={isPopupOpen}
      />
    ),
    [goodsDataSourceNo, date, predictDate, isPopupOpen, startDate],
  )

  const content = (
    <Stack
      minWidth="340px"
      maxWidth="340px"
      height="40px"
      direction="row"
      alignItems="center"
      gap="14px"
      px="6px"
      borderRadius="6px"
      sx={{
        cursor: canClick ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: canClick ? 'contentBG.Hover' : undefined,
          // hover 시 값 텍스트 숨기고 버튼 표시 (고정 모드이고 forecast인 경우만, 인터랙션 비활성화 시 제외)
          ...(!isInteractionDisabled &&
            isFixedMode &&
            isForecast &&
            hasValue && {
            '& .value-text': {
              opacity: 0,
            },
            '& .drill-down-button': {
              opacity: 1,
              pointerEvents: 'auto',
            },
          }),
        },
        // 기본 상태에서 버튼 숨김 (고정 모드이고 forecast인 경우만, 인터랙션 비활성화 시 제외)
        ...(!isInteractionDisabled &&
          isFixedMode &&
          isForecast &&
          hasValue && {
          '& .drill-down-button': {
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease-out',
          },
          '& .value-text': {
            transition: 'opacity 0.2s ease-out',
          },
        }),
      }}
      onClick={() => (canClick ? popupRef.current?.open() : undefined)}
    >
      <Stack direction="row" alignItems="center" gap="8px" flex={1} sx={{ minWidth: 0, overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0 }}>
          <LineIcon color={color} />
        </Box>
        <Typography
          component="span"
          variant="body1M16"
          color={isFixedMode && !isForecast ? 'contentText.Subtext' : 'commonColor.Black'}
          sx={{
            transition: 'color 0.3s ease-out',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minHeight: '30px',
          flexShrink: 0,
          width: 'auto',
        }}
      >
        {/* 값 텍스트 - 고정 모드이고 forecast이고 값이 있는 경우 absolute로 배치하여 버튼과 같은 위치에 겹침 */}
        <Typography
          className="value-text"
          variant="body1M16"
          color={isFixedMode && !isForecast ? 'contentText.Subtext' : 'commonColor.Black'}
          sx={{
            transition: 'color 0.3s ease-out, opacity 0.2s ease-out',
            whiteSpace: 'nowrap',
            ...(isFixedMode &&
              isForecast &&
              hasValue && {
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
            }),
          }}
        >
          {value === undefined ? '-' : formatValue(value, '', 'en-US', toFixed)}
        </Typography>
        {/* Drill-down 버튼 - 고정 모드이고 forecast이고 값이 있는 경우만 렌더링, 인터랙션 비활성화 시 제외, 값 텍스트와 같은 위치에 겹쳐서 배치 */}
        {!isInteractionDisabled && isFixedMode && isForecast && hasValue && (
          <MIBaseButton
            className="drill-down-button"
            sx={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              height: '30px',
              padding: '4px 6px',
              backgroundColor: 'mari.Primary',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography variant="body2M14" color="commonColor.White">
              Drill-down
            </Typography>
          </MIBaseButton>
        )}
      </Box>
    </Stack>
  )

  return canClick ? (
    <MIMorphingPopup
      ref={popupRef}
      popup={{
        title: 'Forecast Drill-down & Key Drivers',
        content: reportContent,
        onOpen: () => setIsPopupOpen(true),
        onClose: () => setIsPopupOpen(false),
      }}
    >
      {content}
    </MIMorphingPopup>
  ) : (
    content
  )
}

interface ForecastChartTooltipProps {
  visible?: boolean
  top?: number
  left?: number
  content: Record<string, TooltipContent>
  visibility?: 'visible' | 'hidden'
  isFixedMode?: boolean
  monthSelect?: string
  companyNo?: number
  interval?: string
  onClose?: () => void
}

const ForecastChartTooltip = forwardRef<HTMLDivElement, Readonly<ForecastChartTooltipProps>>(
  ({ visible, top, left, content, visibility = 'visible', isFixedMode = false, monthSelect, companyNo, interval, onClose }, ref) => {
    if (!visible) return null

    const items: Array<TooltipContent> = []

    Object.entries(content).forEach(([, value]) => {
      items.push(value)
    })

    // Forecast 항목 상단 정렬
    items.sort((a, b) => {
      const aIsForecast = a.isForecast ?? false
      const bIsForecast = b.isForecast ?? false
      if (aIsForecast && !bIsForecast) return -1
      if (!aIsForecast && bIsForecast) return 1
      return 0
    })

    if (items.length === 0) return null

    return (
      <Stack
        ref={ref}
        sx={{
          position: 'absolute',
          top,
          left,
          pointerEvents: isFixedMode ? 'auto' : 'none',
          zIndex: 30,
          borderRadius: '4px',
          border: '1px solid',
          borderColor: 'contentBorder.Normal',
          backgroundColor: 'commonColor.White',
          visibility,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="14px" pr="6px">
          <Typography variant="body1" color="contentText.Black" padding="10px 12px">
            {items[0]?.date || '-'}
          </Typography>
          {isFixedMode && onClose && (
            <MIBaseButton
              onClick={onClose}
              sx={{
                height: '32px',
                width: '32px',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                animation: 'fadeInButton 0.3s ease-out 0.3s forwards',
                '@keyframes fadeInButton': {
                  '0%': {
                    opacity: 0,
                  },
                  '100%': {
                    opacity: 1,
                  },
                },
              }}
              buttonHoverBgColor="transparent"
              disableRipple
            >
              <CloseIcon />
            </MIBaseButton>
          )}
        </Stack>
        <Stack px="6px" gap="4px">
          {items.map((item, idx) => (
            <ChartToolTipItem
              key={idx}
              label={item.label || ''}
              value={item.value}
              color={item.color}
              toFixed={item.toFixed}
              isForecast={item.isForecast}
              isFixedMode={isFixedMode}
              monthSelect={monthSelect}
              goodsDataSourceNo={item.goodsDataSourceNo}
              date={item.date}
              predictDate={item.predictDate}
              startDate={companyNo === 2015 ? item.startDate : undefined}
              companyNo={companyNo}
              interval={interval}
            />
          ))}
        </Stack>
      </Stack>
    )
  },
)

ForecastChartTooltip.displayName = 'ForecastChartTooltip'

export default ForecastChartTooltip
