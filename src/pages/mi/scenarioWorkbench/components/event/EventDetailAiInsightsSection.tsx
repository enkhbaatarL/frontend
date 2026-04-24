import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { Box, Stack, Typography } from '@mui/material'

import EventDetailSectionHeader from './EventDetailSectionHeader'

interface EventDetailAiInsightsSectionProps {
  bullets: string[]
  detailParagraph: string
}

/** Figma 2128:31396 — AI Insights (그라데이션 박스 + 핵심요약/상세분석) */
const EventDetailAiInsightsSection = ({ bullets, detailParagraph }: EventDetailAiInsightsSectionProps) => (
  <Stack
    width="100%"
    maxWidth={1280}
    borderBottom="1px solid"
    borderColor="contentBorder.Normal"
    py={5}
    gap={1.5}
    id="event-detail-section-ai"
  >
    <EventDetailSectionHeader
      icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 26, color: 'contentText.Normal' }} />}
      title="AI Insights"
      tooltipTitle="AI가 생성한 이벤트 인사이트입니다."
    />
    <Box
      borderRadius="10px"
      p={2.5}
      sx={{
        background: 'linear-gradient(102.41deg, rgb(240, 250, 255) 24.33%, rgb(243, 244, 255) 70.71%)',
      }}
    >
      <Stack gap={1.5} p={1.5}>
        <Typography fontSize={16} fontWeight={700} color="mari.Primary" lineHeight={1.4}>
          핵심요약
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3, color: 'contentText.Black', fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
          {bullets.map((b, i) => (
            <Box component="li" key={i} sx={{ mb: 0 }}>
              {b}
            </Box>
          ))}
        </Box>
      </Stack>
      <Stack gap={1.5} p={1.5}>
        <Typography fontSize={16} fontWeight={700} color="mari.Primary" lineHeight={1.4}>
          상세분석
        </Typography>
        <Typography fontSize={16} fontWeight={500} color="contentText.Black" lineHeight={1.4}>
          {detailParagraph}
        </Typography>
      </Stack>
    </Box>
  </Stack>
)

export default EventDetailAiInsightsSection
