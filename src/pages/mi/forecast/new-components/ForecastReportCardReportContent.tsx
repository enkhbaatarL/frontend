import { Box, Divider, Stack, Typography, useTheme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import aiIcon from '@/assets/ai.svg'
import crudeOilIcon from '@/assets/icons/crude-oil.png'
import defaultIcon from '@/assets/icons/default.png'
import evBatteryIcon from '@/assets/icons/ev-battery.png'
import lngIcon from '@/assets/icons/lng.png'
import semiconductorIcon from '@/assets/icons/semiconductor.png'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import forecastDataService from '@/service/mi/forecast'
import { downloadFile } from '@/utils/file'
import { formatValue } from '@/utils/number'

interface InfoLabelProps {
  label: string
  value: ReactNode
  description?: string
}

const InfoLabel = ({ label, value, description }: InfoLabelProps) => (
  <Stack>
    <Typography variant="body2SB14" color="contentText.Subtext" noWrap>
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="messageText1" color="contentText.Black" noWrap>
        {value}
      </Typography>
    ) : (
      value
    )}
    <Typography variant="body2M14" color="contentText.Subtext" noWrap>
      {description}
    </Typography>
  </Stack>
)

interface ForecastReportCardReportContentProps {
  companyNo: number
  marketIndexAnalysisTargetCd: string
  predictionFulfillDt: string
  mnemonicCd: string
  predictionCriteriaDt: string
  isOpen?: boolean
}

const ForecastReportCardReportContent = ({
  companyNo,
  marketIndexAnalysisTargetCd,
  predictionFulfillDt,
  mnemonicCd,
  predictionCriteriaDt,
  isOpen = false,
}: ForecastReportCardReportContentProps) => {
  const theme = useTheme()

  // marketIndexAnalysisTargetCd에 따라 아이콘 선택
  const getMarketIcon = (code: string): string => {
    if (code === 'EN_CROIL') {
      return crudeOilIcon
    } else if (code === 'EN_LNG') {
      return lngIcon
    } else if (code === 'BTRY_DMD') {
      return evBatteryIcon
    } else if (code === 'SCDT_DMD' || code === 'SCDT_PRC') {
      return semiconductorIcon
    } else {
      return defaultIcon
    }
  }

  const marketIcon = getMarketIcon(marketIndexAnalysisTargetCd)

  const { data, isLoading } = useQuery({
    queryKey: ['getForecastReportsDetail', companyNo, marketIndexAnalysisTargetCd, predictionFulfillDt, mnemonicCd, predictionCriteriaDt],
    queryFn: () =>
      forecastDataService.getForecastReportsDetail(companyNo, {
        marketIndexAnalysisTargetCd,
        predictionFulfillDt,
        mnemonicCd,
        predictionCriteriaDt,
      }),
    enabled: isOpen && !!companyNo && !!marketIndexAnalysisTargetCd && !!predictionFulfillDt && !!mnemonicCd && !!predictionCriteriaDt,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  if (isLoading || !data) {
    return (
      <Stack>
        {/* 상단 정보 영역 스켈레톤 */}
        <Stack
          padding="20px 38px"
          direction="row"
          justifyContent="space-between"
          gap="24px"
          borderBottom="1px solid"
          borderColor="contentBorder.Normal"
        >
          <Stack direction="row" alignItems="start" gap="24px" flex={1}>
            <Stack direction="row" gap="12px">
              <MIBaseSkeleton.Avatar width={52} height={52} sx={{ borderRadius: '10px' }} />
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={80} height={12} />
                <MIBaseSkeleton.TextLine width={120} height={16} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={180} height={16} />
                <MIBaseSkeleton.TextLine width={120} height={12} />
              </Stack>
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={150} height={16} />
                <MIBaseSkeleton.TextLine width={120} height={12} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <Stack direction="row" gap="4px" alignItems="baseline">
                  <MIBaseSkeleton.TextLine width={80} height={16} />
                  <MIBaseSkeleton.TextLine width={100} height={16} />
                </Stack>
                <MIBaseSkeleton.TextLine width={150} height={12} />
              </Stack>
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={100} height={16} />
                <MIBaseSkeleton.TextLine width={150} height={12} />
              </Stack>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
            <Stack gap="20px">
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width={100} height={12} />
                <MIBaseSkeleton.TextLine width={100} height={16} />
                <MIBaseSkeleton.TextLine width={150} height={12} />
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {/* Summary 영역 스켈레톤 */}
        <Stack
          padding="24px 38px"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap="24px"
          borderBottom="1px solid"
          borderColor="contentBorder.Active"
        >
          <Stack direction="row" alignItems="center" gap="4px">
            <MIBaseSkeleton.Avatar width={20} height={20} />
            <MIBaseSkeleton.TextLine width={80} height={18} />
          </Stack>
          <MIBaseSkeleton.Button width={180} height={36} />
        </Stack>

        <Box padding="24px 38px">
          <Stack gap="16px">
            <MIBaseSkeleton.Title width="60%" height={22} />
            <Stack gap="12px">
              <MIBaseSkeleton.TextLine width="100%" height={18} />
              <MIBaseSkeleton.TextLine width="100%" height={18} />
              <MIBaseSkeleton.TextLine width="95%" height={18} />
              <MIBaseSkeleton.TextLine width="100%" height={18} />
              <MIBaseSkeleton.TextLine width="90%" height={18} />
            </Stack>
          </Stack>
        </Box>
      </Stack>
    )
  }

  // 날짜 포맷팅
  const targetDateRange = `${dayjs(data.startPredictionResultDt).format('YYYY/MM/DD')} - ${dayjs(data.endPredictionResultDt).format('YYYY/MM/DD')}`
  const daysDiff = dayjs(data.endPredictionResultDt).diff(dayjs(data.startPredictionResultDt), 'day') + 1
  const runDate = dayjs(predictionFulfillDt).format('YYYY/MM/DD')

  // explanatorySummaryContent의 줄바꿈 처리: \\n, \r\n, \r을 실제 줄바꿈으로 변환
  // \r (캐리지 리턴)은 Windows/Mac에서 사용하는 줄바꿈 문자입니다
  const processedSummaryContent = data.explanatorySummaryContent
    ? data.explanatorySummaryContent
      .replace(/\r\n/g, '\n') // 실제 \r\n (Windows 줄바꿈) 처리
      .replace(/\\\\r\\\\n/g, '\n') // 문자열로 된 \\r\\n 처리
      .replace(/\\r\\n/g, '\n') // 문자열로 된 \r\n 처리
      .replace(/\r/g, '\n') // 실제 \r (캐리지 리턴) 처리
      .replace(/\\\\r/g, '\n') // 문자열로 된 \\r 처리
      .replace(/\\r/g, '\n') // 문자열로 된 \r 처리
      .replace(/\\\\n/g, '\n') // 문자열로 된 \\n 처리 (백슬래시 2개 + n)
      .replace(/\\n/g, '\n') // 문자열로 된 \n 처리
      .replace(/·/g, '\n') // · 기호를 줄바꿈으로 변환
    : ''

  const label = data.predictChartDetailExpn ?? ''
  const priceRange =
    data.minPredictionResultVal && data.maxPredictionResultVal
      ? `${formatValue(data.minPredictionResultVal)} - ${formatValue(data.maxPredictionResultVal)}`
      : '-'

  return (
    <Stack
      sx={{
        height: 'auto',
      }}
    >
      <Stack
        padding="20px 38px"
        direction="row"
        justifyContent="space-between"
        gap="24px"
        borderBottom="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
      >
        <Stack direction="row" alignItems="start" gap="24px">
          <Stack direction="row" gap="12px">
            <Box
              width="52px"
              height="52px"
              bgcolor="contentBG.Active"
              borderRadius="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                component="img"
                src={marketIcon}
                alt="Market Icon"
                sx={{
                  width: '43px',
                  height: '43px',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            </Box>
            <InfoLabel label="TARGET" value={label} />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel label="TARGET DATE" value={targetDateRange} description={`${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`} />
            <InfoLabel label="RUN DATE" value={runDate} description="Model execution date" />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel
              label="AVG. PRICE EXP."
              value={
                <Stack direction="row" alignItems="baseline" gap="4px">
                  <Typography variant="messageText1" color="contentText.Black">
                    {formatValue(data.avgPredictionResultVal) || '-'}
                  </Typography>
                  {data.predictionResultDiffVal !== null && data.predictionResultDiffVal !== 0 && (
                    <Typography variant="messageText1" color={data.predictionResultDiffVal < 0 ? 'decrease.main' : 'increase.main'}>
                      {data.predictionResultDiffVal > 0 ? '+' : ''}
                      {data.predictionResultDiffVal}
                      {data.predictionResultDiffRate !== null && ` (${formatValue(data.predictionResultDiffRate)}%)`}
                    </Typography>
                  )}
                </Stack>
              }
              description="Compare to reference price"
            />
            {data.predictionCriteriaDt && <InfoLabel label="PRICE RANGE" value={priceRange} description="Lowest to highest" />}
          </Stack>
          {data.predictionCriteriaDt && (
            <>
              <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
              <Stack gap="20px">
                <InfoLabel
                  label="REFERENCE PRICE"
                  value={formatValue(data.predictionCriteriaVal) || '-'}
                  description={`${dayjs(data.predictionCriteriaDt).format('YY/MM/DD')} · ${data.predictChartDetailExpn}`}
                />
              </Stack>
            </>
          )}
        </Stack>
        <Stack minWidth="136px" alignItems="start" gap="8px">
          {/* <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Date Forecasted
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              {predictionFulfillDate}
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Model
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              Standard v2.0.1
            </Typography>
          </Stack> */}
        </Stack>
      </Stack>
      <Stack
        padding="24px 38px"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap="24px"
        borderBottom="1px solid"
        borderColor="contentBorder.Active"
        boxSizing="border-box"
      >
        <Stack direction="row" alignItems="center" gap="4px" sx={{ userSelect: 'none' }}>
          <Box component="img" src={aiIcon} alt="AI" draggable={false} />
          <Typography fontSize="18px" fontWeight={600} color="commonColor.Black">
            Summary
          </Typography>
        </Stack>
        {data.explanatoryFilePath && (
          <MIBaseButton
            variant="outlined"
            prefix={<ChartDownloadIcon fill={theme.palette.gray[70]} />}
            enableHoverBackground
            disableRipple={false}
            sx={{
              color: 'contentText.Normal',
            }}
            onClick={async () => {
              try {
                // predictDate를 YYYYMMDD 형식으로 변환
                const predictDate = dayjs(predictionFulfillDt).format('YYYYMMDD')
                const response = await forecastDataService.getForecastReportFileDownload(companyNo, {
                  predictDate,
                })

                const cd = response.headers?.['content-disposition'] ?? ''

                if (cd.includes('.zip')) {
                  const fileName = `Report_${predictDate}.zip`
                  downloadFile(response.data, fileName)
                } else {
                  // prettier-ignore
                  const fileName = cd.split('\'\'').pop().trim()
                  downloadFile(response.data, fileName)
                }
              } catch (error) {
                console.error('Download failed:', error)
              }
            }}
          >
            Download Full Report
          </MIBaseButton>
        )}
      </Stack>
      <Box padding="24px 38px">
        {/* explanatoryTitleContent 표시 */}
        {data.explanatoryTitleContent && (
          <Typography
            sx={{
              fontFamily: 'Pretendard',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: '140%',
              letterSpacing: '0%',
              color: '#000000',
              marginBottom: '16px',
            }}
          >
            {data.explanatoryTitleContent}
          </Typography>
        )}
        {/* explanatorySummaryContent 마크다운 표시 */}
        {processedSummaryContent && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ node, children, ...props }) => {
                const isEmpty = !children || children === '\u00A0' || (typeof children === 'string' && children.trim() === '')

                return (
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '18px',
                      lineHeight: '140%',
                      letterSpacing: '0%',
                      color: 'contentText.Black',
                      mb: isEmpty ? '8px' : '16px',
                    }}
                    {...props}
                  >
                    {children}
                  </Typography>
                )
              },
              ol: ({ node, ...props }) => (
                <Box
                  component="ol"
                  sx={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    counterReset: 'item',
                  }}
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <Box
                  component="li"
                  sx={{
                    margin: 0,
                    padding: 0,
                    fontFamily: 'Pretendard',
                    fontWeight: 500,
                    fontSize: '18px',
                    lineHeight: '140%',
                    letterSpacing: '0%',
                    color: 'contentText.Black',
                    mb: '16px',
                    counterIncrement: 'item',
                    display: 'block',
                    '&::before': {
                      content: 'counter(item) ". "',
                      fontFamily: 'Pretendard',
                      fontWeight: 500,
                      fontSize: '18px',
                      lineHeight: '140%',
                      letterSpacing: '0%',
                      color: 'contentText.Black',
                      display: 'inline',
                    },
                    '& > p': {
                      display: 'inline',
                      mb: 0,
                    },
                  }}
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <Typography
                  component="span"
                  sx={{
                    fontFamily: 'Pretendard',
                    fontWeight: 700,
                    fontSize: '18px',
                    lineHeight: '140%',
                    letterSpacing: '0%',
                    color: 'contentText.Black',
                  }}
                  {...props}
                />
              ),
            }}
          >
            {processedSummaryContent}
          </ReactMarkdown>
        )}
        {!data.explanatoryTitleContent && !processedSummaryContent && (
          <Typography
            sx={{
              fontFamily: 'Pretendard',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '140%',
              letterSpacing: '0%',
              color: 'contentText.Black',
            }}
          >
            No content available
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

export default ForecastReportCardReportContent
