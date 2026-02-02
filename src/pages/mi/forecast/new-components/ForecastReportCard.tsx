import { Box, Divider, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'

import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MIMorphingPopup, { MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import ForecastReportCardReportContent from '@/pages/mi/forecast/new-components/ForecastReportCardReportContent'
import { IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import { formatValue } from '@/utils/number'

interface ForecastReportCardProps {
  data?: IForecastReport
  isLoading?: boolean
  onPopupClose?: () => void
  isFixedMode?: boolean
}

const ForecastReportCard = ({ data, isLoading = false, onPopupClose, isFixedMode = false }: ForecastReportCardProps) => {
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // 로딩 중이거나 데이터가 없으면 스켈레톤 표시
  const showSkeleton = isLoading || !data

  const startDate = data?.startPredictionResultDt ? dayjs(data.startPredictionResultDt) : null
  const endDate = data?.endPredictionResultDt ? dayjs(data.endPredictionResultDt) : null

  const targetDateRange = startDate && endDate ? `${startDate.format('YY/MM/DD')} - ${endDate.format('YY/MM/DD')}` : ''

  // 날짜 범위 계산 (일 수)
  const daysDiff = startDate && endDate ? endDate.diff(startDate, 'day') + 1 : 0

  const diffValue = data?.predictionResultDiffVal ?? 0
  const diffValueColor = diffValue < 0 ? 'decrease.main' : 'increase.main'
  const diffRate = data?.predictionResultDiffRate ? `(${formatValue(data.predictionResultDiffRate)}%)` : '-'

  const isNew = data?.isNew ?? false

  // ForecastReportCardReportContent에 전달할 파라미터
  const reportContentParams = {
    companyNo,
    marketIndexAnalysisTargetCd: data?.marketIndexAnalysisTargetCd || '',
    predictionFulfillDt: data?.predictionFulfillDt || '',
    mnemonicCd: data?.mnemonicCd || '',
    predictionCriteriaDt: data?.predictionCriteriaDt || '',
  }

  const handleOpen = () => {
    setIsPopupOpen(true)
    popupRef.current?.open()
  }

  const handleClose = () => {
    setIsPopupOpen(false)
    onPopupClose?.()
  }

  return (
    <MIMorphingPopup
      ref={popupRef}
      popup={{
        title: 'AI Forecast Report',
        content: <ForecastReportCardReportContent {...reportContentParams} isOpen={isPopupOpen} />,
        onOpen: () => setIsPopupOpen(true),
        onClose: handleClose,
      }}
    >
      <Box
        padding="8px"
        minWidth="260px"
        minHeight="118px"
        bgcolor="commonColor.White"
        borderRadius="10px"
        border="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
        sx={{
          cursor: isFixedMode ? 'not-allowed' : 'pointer',
          '&:hover': {
            backgroundColor: isFixedMode ? undefined : 'contentBG.Hover',
            borderColor: isFixedMode ? undefined : 'contentBorder.Hover',
          },
        }}
        onClick={() => !isFixedMode && !showSkeleton && handleOpen()}
      >
        {showSkeleton ? (
          <Stack gap="4px">
            <Stack direction="row" height="20px" alignItems="center" justifyContent="space-between" gap="10px" padding="6px 8px">
              <MIBaseSkeleton.TextLine width="120px" height="16px" />
            </Stack>
            <Stack alignItems="start" gap="4px" padding="4px 8px">
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Box flexShrink={0}>
                  <MIBaseSkeleton.TextLine width="70px" height="12px" />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px" gap="4px">
                  <MIBaseSkeleton.TextLine width="140px" height="14px" />
                  <MIBaseSkeleton.TextLine width="60px" height="11px" />
                </Stack>
              </Stack>
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Box flexShrink={0}>
                  <MIBaseSkeleton.TextLine width="70px" height="12px" />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px" gap="4px">
                  <Stack direction="row" alignItems="baseline" gap="4px">
                    <MIBaseSkeleton.TextLine width="60px" height="14px" />
                    <MIBaseSkeleton.TextLine width="50px" height="14px" />
                  </Stack>
                  <MIBaseSkeleton.TextLine width="150px" height="11px" />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack gap="4px">
            <Stack direction="row" height="20px" alignItems="center" justifyContent="space-between" gap="10px" padding="6px 8px">
              <Typography variant="body1M16" color="commonColor.Black">
                {data?.predictChartDetailExpn}
              </Typography>
              {isNew && (
                <Stack
                  width="36px"
                  height="20px"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="mari.Primary"
                  borderRadius="100px"
                  padding="6px"
                  boxSizing="border-box"
                >
                  <Typography fontSize="11px" fontWeight={700} color="commonColor.White">
                    New
                  </Typography>
                </Stack>
              )}
            </Stack>
            <Stack alignItems="start" gap="4px" padding="4px 8px">
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Typography width="70px" variant="body3M12" color="contentText.Subtext" flexShrink={0}>
                  Target Date
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px">
                  <Typography variant="body2SB14" color="commonColor.Black">
                    {targetDateRange}
                  </Typography>
                  <Typography variant="body3" color="contentText.Subtext" fontSize="11px">
                    {daysDiff} {daysDiff === 1 ? 'day' : 'days'}
                  </Typography>
                </Stack>
              </Stack>
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Typography width="70px" variant="body3M12" color="contentText.Subtext" flexShrink={0}>
                  Avg. Price
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px">
                  <Stack direction="row" alignItems="baseline" gap="4px">
                    <Typography variant="body2SB14" color="commonColor.Black">
                      {formatValue(data?.predictionResultVal) ?? '-'}
                    </Typography>
                    {diffValue && diffValue !== 0 && (
                      <Typography variant="body2SB14" color={diffValueColor} noWrap>
                        {diffValue}
                        {diffRate}
                      </Typography>
                    )}
                  </Stack>
                  {data?.predictionCriteriaDt && data?.predictionCriteriaVal !== null && (
                    <Typography variant="body3" color="contentText.Subtext" fontSize="11px" noWrap>
                      Compare to {formatValue(data.predictionCriteriaVal)} ({dayjs(data.predictionCriteriaDt).format('YY/MM/DD')})
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        )}
      </Box>
    </MIMorphingPopup>
  )
}

export default ForecastReportCard
