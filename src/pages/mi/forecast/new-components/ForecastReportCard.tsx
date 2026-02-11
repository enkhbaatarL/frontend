import { Box, Divider, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo, useRef, useState } from 'react'

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
}

const ForecastReportCard = ({ data, isLoading = false, onPopupClose }: ForecastReportCardProps) => {
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

  const diffDisplay = useMemo(() => {
    const val = data?.predictionResultDiffVal
    const num = val !== undefined && val !== null ? Number(val) : null
    if (num === null || num === 0) return null
    const rate =
      data?.predictionResultDiffRate !== undefined && data?.predictionResultDiffRate !== null
        ? `(${formatValue(data.predictionResultDiffRate)}%)`
        : '-'
    const text = `${num}${rate}`
    return {
      text,
      color: num < 0 ? 'decrease.main' : 'increase.main',
    }
  }, [data?.predictionResultDiffVal, data?.predictionResultDiffRate])

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
        minWidth="280px"
        minHeight="130px"
        bgcolor="commonColor.White"
        borderRadius="10px"
        border="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
        sx={{
          cursor: showSkeleton ? 'default' : 'pointer',
          ...(showSkeleton
            ? {}
            : {
              '&:hover': {
                backgroundColor: 'contentBG.Hover',
                borderColor: 'contentBorder.Hover',
              },
            }),
        }}
        onClick={() => !showSkeleton && handleOpen()}
      >
        {showSkeleton ? (
          <Stack gap="4px" minHeight="115px">
            <Stack direction="row" height="20px" alignItems="center" justifyContent="space-between" gap="10px" padding="6px 8px">
              <MIBaseSkeleton.TextLine width="120px" height="16px" />
            </Stack>
            <Stack alignItems="start" gap="4px" padding="4px 8px" flex={1}>
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Box flexShrink={0}>
                  <MIBaseSkeleton.TextLine width="70px" height="16px" />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px" gap="2px">
                  <MIBaseSkeleton.TextLine width="140px" height="19px" />
                  <MIBaseSkeleton.TextLine width="60px" height="14px" />
                </Stack>
              </Stack>
              <Stack direction="row" alignItems="start" gap="8px" py="4px">
                <Box flexShrink={0}>
                  <MIBaseSkeleton.TextLine width="70px" height="16px" />
                </Box>
                <Divider orientation="vertical" flexItem />
                <Stack px="4px" gap="2px">
                  <Stack direction="row" alignItems="baseline" gap="4px">
                    <MIBaseSkeleton.TextLine width="60px" height="19px" />
                    <MIBaseSkeleton.TextLine width="50px" height="19px" />
                  </Stack>
                  <MIBaseSkeleton.TextLine width="150px" height="14px" />
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack gap="4px">
            <Stack direction="row" height="20px" alignItems="center" justifyContent="space-between" gap="10px" padding="6px 8px">
              <Stack direction="row" alignItems="baseline" gap="6px">
                <Typography variant="body1M16" color="commonColor.Black">
                  {data?.predictChartDetailExpn}
                </Typography>
                {!data?.isScheduled && (
                  <Typography
                    sx={{
                      fontFamily: 'Pretendard',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '12px',
                      lineHeight: '140%',
                      letterSpacing: '0%',
                      color: '#868E96',
                    }}
                  >
                    Ad hoc
                  </Typography>
                )}
              </Stack>
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
                    {diffDisplay && (
                      <Typography variant="body2SB14" color={diffDisplay.color} noWrap>
                        {diffDisplay.text}
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
