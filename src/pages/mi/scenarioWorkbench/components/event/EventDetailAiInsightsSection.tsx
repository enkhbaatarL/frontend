import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { Box, Stack, Typography } from '@mui/material'

import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

interface EventDetailAiInsightsSectionProps {
  bullets: string[]
  detailParagraph: string
}

const subsectionTitleSx = {
  fontSize: 16,
  fontWeight: 700,
  color: 'mari.Primary',
  lineHeight: 1.4,
} as const

const bodySx = {
  fontSize: 16,
  fontWeight: 500,
  color: 'contentText.Black',
  lineHeight: 1.4,
} as const

const EventDetailAiInsightsSection = ({ bullets, detailParagraph }: EventDetailAiInsightsSectionProps) => (
  <Stack
    width="100%"
    gap="12px"
    sx={{
      borderBottom: '1px solid #DEE2E6',
      pb: '20px',
    }}
  >
    <EventDetailSectionHeader
      icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 30, color: 'contentText.Normal' }} />}
      title="AI Insights"
      tooltipTitle=""
    />
    <Box
      borderRadius="10px"
      p="20px"
      sx={{
        backgroundImage: 'linear-gradient(102.40734deg, rgb(240, 250, 255) 24.329%, rgb(243, 244, 255) 70.711%)',
        transition: 'filter 0.15s ease-in-out',
        '&:hover': {
          filter: 'brightness(0.98)',
        },
      }}
    >
      <Stack gap={0}>
        <Stack gap="6px" p="12px">
          <Stack py="4px" direction="row" alignItems="center">
            <Typography sx={subsectionTitleSx}>핵심요약</Typography>
          </Stack>
          <Box
            component="ul"
            sx={{
              m: 0,
              pl: '24px',
              listStyleType: 'disc',
              listStylePosition: 'outside',
              '& > li': {
                display: 'list-item',
                listStyleType: 'disc',
                listStylePosition: 'outside',
                m: 0,
                pl: 0,
                ...bodySx,
                '&::marker': { color: 'contentText.Black', fontSize: 'calc(1em * 2 / 3)' },
              },
            }}
          >
            {bullets.map((b, i) => (
              <Box component="li" key={i}>
                {b}
              </Box>
            ))}
          </Box>
        </Stack>
        <Stack gap="6px" p="12px">
          <Stack py="4px" direction="row" alignItems="center">
            <Typography sx={subsectionTitleSx}>상세분석</Typography>
          </Stack>
          <Typography sx={bodySx}>{detailParagraph}</Typography>
        </Stack>
      </Stack>
    </Box>
  </Stack>
)

export default EventDetailAiInsightsSection
