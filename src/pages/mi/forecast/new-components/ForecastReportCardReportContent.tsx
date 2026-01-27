import { Box, Divider, Stack, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import aiIcon from '@/assets/ai.svg'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import { IForecastSummary } from '@/service/mi/forecast'

interface InfoLabelProps {
  label: string
  value: ReactNode
  description?: string
}

const InfoLabel = ({ label, value, description }: InfoLabelProps) => (
  <Stack>
    <Typography variant="body2SB14" color="contentText.Subtext">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="messageText1" color="contentText.Black">
        {value}
      </Typography>
    ) : (
      value
    )}
    <Typography variant="body2M14" color="contentText.Subtext">
      {description}
    </Typography>
  </Stack>
)

interface ForecastReportCardReportContentProps {
  data: IForecastSummary
}

const ForecastReportCardReportContent = ({ data }: ForecastReportCardReportContentProps) => {
  const theme = useTheme()

  const content = data.explanatorySummaryContent || ''

  // 날짜 포맷팅
  const targetDateRange = `${dayjs(data.startPredictionResultDt).format('YYYY/MM/DD')} - ${dayjs(data.endPredictionResultDt).format('YYYY/MM/DD')}`
  const daysDiff = dayjs(data.endPredictionResultDt).diff(dayjs(data.startPredictionResultDt), 'day') + 1
  const runDate = dayjs(data.date).format('YYYY/MM/DD')
  const predictionFulfillDate = dayjs(data.predictionFulfillDt).format('YYYY/MM/DD')

  // label은 mnemonicCd 또는 marketIndexAnalysisTargetCd 사용
  const label = data.mnemonicCd || data.marketIndexAnalysisTargetCd || ''

  return (
    <Stack>
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
            <Box width="52px" height="52px" bgcolor="contentBG.Active" borderRadius="10px" />
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
                    {data.predictionResultVal || '-'}
                  </Typography>
                  {data.predictionCriteriaVal && (
                    <Typography variant="messageText1" color="increase.main">
                      {data.predictionCriteriaVal}
                    </Typography>
                  )}
                </Stack>
              }
              description="Compare to reference price"
            />
            {data.predictionCriteriaDt && (
              <InfoLabel
                label="PRICE RANGE"
                value={data.predictionCriteriaVal || '-'}
                description={`${dayjs(data.predictionCriteriaDt).format('YY/MM/DD')} · S&P Global Platts`}
              />
            )}
          </Stack>
          {data.predictionCriteriaDt && (
            <>
              <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
              <Stack gap="20px">
                <InfoLabel
                  label="REFERENCE PRICE"
                  value={data.predictionCriteriaVal || '-'}
                  description={`${dayjs(data.predictionCriteriaDt).format('YY/MM/DD')} · S&P Global Platts`}
                />
              </Stack>
            </>
          )}
        </Stack>
        <Stack minWidth="136px" alignItems="start" gap="8px">
          <Stack>
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
          </Stack>
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
            Report Summary
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
            onClick={() => {
              if (data.explanatoryFilePath) {
                window.open(data.explanatoryFilePath, '_blank')
              }
            }}
          >
            Download Full Report
          </MIBaseButton>
        )}
      </Stack>
      <Box padding="24px 38px">
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
                    fontSize: '18px',
                    fontWeight: 500,
                    lineHeight: '1.4',
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
                  fontSize: '18px',
                  fontWeight: 500,
                  lineHeight: '1.4',
                  color: 'contentText.Black',
                  mb: '16px',
                  counterIncrement: 'item',
                  display: 'block',
                  '&::before': {
                    content: 'counter(item) ". "',
                    fontSize: '18px',
                    fontWeight: 500,
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
                  fontSize: '18px',
                  fontWeight: 700,
                  lineHeight: '1.4',
                  color: 'contentText.Black',
                }}
                {...props}
              />
            ),
          }}
        >
          {content || data.explanatoryTitleContent || 'No content available'}
        </ReactMarkdown>
      </Box>
    </Stack>
  )
}

export default ForecastReportCardReportContent
