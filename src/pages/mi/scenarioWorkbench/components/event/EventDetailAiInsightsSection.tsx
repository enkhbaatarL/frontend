import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { Box, Skeleton, Stack, Typography } from '@mui/material'

import type { IScenarioWorkbenchEventAiInsightDetailBlock } from '@/service/mi/scenarioWorkbench/event'
import type { ReactNode } from 'react'

import EventDetailSectionHeader from '@/pages/mi/scenarioWorkbench/components/event/EventDetailSectionHeader'

interface EventDetailAiInsightsSectionProps {
  bullets: string[]
  detailBlocks: IScenarioWorkbenchEventAiInsightDetailBlock[]
  loading?: boolean
}

const cardSubsectionTitleSx = {
  fontSize: 18,
  fontWeight: 700,
  color: 'mari.Primary',
  lineHeight: 1.4,
} as const

const wrapTextSx = {
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
} as const

const bulletBodySx = {
  fontSize: 16,
  fontWeight: 500,
  color: 'contentText.Black',
  lineHeight: 1.6,
  ...wrapTextSx,
} as const

const bodySx = {
  fontSize: 16,
  fontWeight: 500,
  color: 'contentText.Black',
  lineHeight: 1.5,
  ...wrapTextSx,
} as const

const detailBlockTitleSx = {
  fontSize: 16,
  fontWeight: 600,
  color: 'contentText.Black',
  lineHeight: 1.5,
  ...wrapTextSx,
} as const

const gradientCardBaseSx = {
  borderRadius: '10px',
  p: '24px',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
  transition: 'filter 0.15s ease-in-out',
  '&:hover': {
    filter: 'brightness(0.98)',
  },
} as const

const summaryGradientCardSx = {
  ...gradientCardBaseSx,
  backgroundImage: 'linear-gradient(115.89deg, rgb(240, 250, 255) 24.329%, rgb(243, 244, 255) 70.711%)',
} as const

const detailGradientCardSx = {
  ...gradientCardBaseSx,
  backgroundImage: 'linear-gradient(108.44deg, rgb(240, 250, 255) 24.329%, rgb(243, 244, 255) 70.711%)',
} as const

const constrainedStackSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
} as const

const AiInsightsSummaryCard = ({ children }: { children: ReactNode }) => <Box sx={summaryGradientCardSx}>{children}</Box>

const AiInsightsDetailCard = ({ children }: { children: ReactNode }) => <Box sx={detailGradientCardSx}>{children}</Box>

const EventDetailAiInsightsSection = ({ bullets, detailBlocks, loading = false }: EventDetailAiInsightsSectionProps) =>
  loading ? (
    <Stack width="100%" gap="12px" py="20px" sx={constrainedStackSx}>
      <EventDetailSectionHeader
        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 30, color: 'contentText.Normal' }} />}
        title="AI Insights"
        titleGradient
        tooltipTitle=""
      />
      <Stack gap="20px" sx={constrainedStackSx}>
        <AiInsightsSummaryCard>
          <Skeleton variant="rounded" width={112} height={24} sx={{ borderRadius: '4px' }} />
          <Stack gap="6px" mt="8px" sx={constrainedStackSx}>
            {[0, 1, 2].map((idx) => (
              <Skeleton key={idx} variant="rounded" height={20} width={idx === 2 ? '72%' : '100%'} sx={{ borderRadius: '4px' }} />
            ))}
          </Stack>
        </AiInsightsSummaryCard>
        <AiInsightsDetailCard>
          <Skeleton variant="rounded" width={96} height={24} sx={{ borderRadius: '4px' }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: '8px', mt: '8px' }} />
        </AiInsightsDetailCard>
      </Stack>
    </Stack>
  ) : (
    <Stack width="100%" gap="12px" py="20px" sx={constrainedStackSx}>
      <EventDetailSectionHeader
        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 30, color: 'contentText.Normal' }} />}
        title="AI Insights"
        titleGradient
        tooltipTitle=""
      />
      <Stack gap="20px" sx={constrainedStackSx}>
        <AiInsightsSummaryCard>
          <Stack gap="8px" sx={constrainedStackSx}>
            <Stack py="4px" direction="row" alignItems="center">
              <Typography sx={cardSubsectionTitleSx}>핵심요약</Typography>
            </Stack>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: '24px',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                listStyleType: 'disc',
                listStylePosition: 'outside',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                '& > li': {
                  display: 'list-item',
                  listStyleType: 'disc',
                  listStylePosition: 'outside',
                  m: 0,
                  pl: 0,
                  ...bulletBodySx,
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
        </AiInsightsSummaryCard>
        <AiInsightsDetailCard>
          <Stack gap="8px" sx={constrainedStackSx}>
            <Stack py="4px" direction="row" alignItems="center">
              <Typography sx={cardSubsectionTitleSx}>상세분석</Typography>
            </Stack>
            <Stack gap="20px" sx={constrainedStackSx}>
              {detailBlocks.map((block) => (
                <Stack key={block.title} gap="4px" sx={constrainedStackSx}>
                  <Typography sx={detailBlockTitleSx}>{block.title}</Typography>
                  <Typography component="p" sx={{ ...bodySx, m: 0 }}>
                    {block.body}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </AiInsightsDetailCard>
      </Stack>
    </Stack>
  )

export default EventDetailAiInsightsSection
