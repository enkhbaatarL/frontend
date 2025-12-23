import { LabelImportantRounded, InfoOutlined } from '@mui/icons-material'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { ReactNode } from 'react'

import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import theme from '@/theming'

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

const ContentTab = () => (
  <HorizontalScrollContainer py="12px" gap="10px" scrollAmount={0.6}>
    <div style={{ flexShrink: 0 }}>Tab Test</div>
  </HorizontalScrollContainer>
)

const ForecastChartTooltipReportContent = () => {
  console.info('test')

  return (
    <Stack>
      <Stack
        padding="20px 24px"
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
            <InfoLabel label="TARGET" value="DUBAI CRUDE" />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel label="TARGET DATE" value="2026/01/02" description="7 days" />
            <InfoLabel label="RUN DATE" value="2025/12/30" description="Model execution date" />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel
              label="PRICE EXP."
              value={
                <Stack direction="row" alignItems="baseline" gap="4px">
                  <Typography variant="messageText1" color="contentText.Black">
                    76.98
                  </Typography>
                  <Typography variant="messageText1" color="increase.main">
                    +1.23(2.94%)
                  </Typography>
                </Stack>
              }
              description="Compare to reference price"
            />
            <InfoLabel label="REFERENCE PRICE" value="75.23" description="25/12/30 · S&P Global Platts" />
          </Stack>
        </Stack>
        <Stack minWidth="136px" alignItems="start" gap="8px">
          <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Date Forecasted
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              2026/01/02
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
      <Stack padding="20px 24px" gap="24px">
        <Stack direction="row" alignItems="center" gap="6px">
          <LabelImportantRounded sx={{ color: theme.palette.contentIcon.Activeb }} />
          <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
            MAIN FACTORS
          </Typography>
          <InfoOutlined fontSize="small" sx={{ color: theme.palette.contentIcon.Enabled }} />
        </Stack>
      </Stack>
      <ContentTab />
    </Stack>
  )
}

export default ForecastChartTooltipReportContent
