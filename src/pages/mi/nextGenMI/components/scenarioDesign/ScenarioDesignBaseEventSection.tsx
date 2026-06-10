import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Box, Collapse, Skeleton, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'
import type {
  EventDriverTreeIndex,
  EventDetailImpactIndex,
  EventInstitutionOutlook,
  EventRelatedRecord,
} from '@/service/mi/nextGenMI/event'
import type { IPaginationResponse } from '@/types/api'

import EventDetailDriverTreeScoreboardSection from '@/pages/mi/nextGenMI/components/event/EventDetailDriverTreeScoreboardSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/nextGenMI/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/nextGenMI/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/nextGenMI/components/event/EventDetailMiRecordsTable'

const SCENARIO_DESIGN_EVENT_CHIP_TABS = ['AI Insights', '영향도 분석', 'Index Driver별 영향도 분석', '기관 전망', 'MI Records'] as const

type ScenarioDesignEventChipTab = (typeof SCENARIO_DESIGN_EVENT_CHIP_TABS)[number]

interface ScenarioDesignBaseEventSectionProps {
  eventName?: string
  createdAt?: string
  categoryLabel?: string
  detailLoading?: boolean
  isNoiseEvent?: boolean
  aiBullets: string[]
  aiDetailedAnalysis: string
  impactTableRows: EventDetailImpactIndex[]
  impactKpiItems: [KpiCardProps, KpiCardProps]
  impactNarrative: string
  driverTreeScoreboard?: EventDriverTreeIndex[]
  outlookRows: EventInstitutionOutlook[]
  outlooksPagination?: IPaginationResponse<EventInstitutionOutlook>
  onOutlooksPageChange?: (page: number) => void
  onOutlooksSizeChange?: (size: number) => void
  outlooksLoading?: boolean
  recordRows: EventRelatedRecord[]
  recordsPagination?: IPaginationResponse<EventRelatedRecord>
  onRecordsPageChange?: (page: number) => void
  onRecordsSizeChange?: (size: number) => void
  recordsLoading?: boolean
}

interface ScenarioDesignEventChipMenuProps {
  activeTab: ScenarioDesignEventChipTab
  onTabChange: (tab: ScenarioDesignEventChipTab) => void
}

interface ScenarioDesignEventChipContentProps {
  activeTab: ScenarioDesignEventChipTab
  detailLoading?: boolean
  aiBullets: string[]
  aiDetailedAnalysis: string
  impactTableRows: EventDetailImpactIndex[]
  impactKpiItems: [KpiCardProps, KpiCardProps]
  impactNarrative: string
  isNoiseEvent?: boolean
  driverTreeScoreboard?: EventDriverTreeIndex[]
  outlookRows: EventInstitutionOutlook[]
  outlooksPagination?: IPaginationResponse<EventInstitutionOutlook>
  onOutlooksPageChange?: (page: number) => void
  onOutlooksSizeChange?: (size: number) => void
  outlooksLoading?: boolean
  recordRows: EventRelatedRecord[]
  recordsPagination?: IPaginationResponse<EventRelatedRecord>
  onRecordsPageChange?: (page: number) => void
  onRecordsSizeChange?: (size: number) => void
  recordsLoading?: boolean
}

const formatTimestamp = (iso?: string) => {
  if (!iso) return '-'
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '-'
}

const cardSubsectionTitleSx = {
  fontSize: 18,
  fontWeight: 700,
  color: 'mari.Primary',
  lineHeight: 1.4,
} as const

const bulletBodySx = {
  fontSize: 16,
  fontWeight: 500,
  color: 'contentText.Black',
  lineHeight: 1.6,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
} as const

const bodySx = {
  fontSize: 16,
  fontWeight: 500,
  color: 'contentText.Black',
  lineHeight: 1.5,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
} as const

const gradientCardBaseSx = {
  borderRadius: '10px',
  padding: '24px',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
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

const embeddedSectionSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  '& > div': { py: 0 },
} as const

const ScenarioDesignEventChipMenu = ({ activeTab, onTabChange }: ScenarioDesignEventChipMenuProps) => {
  const handleSelectTab = useCallback(
    (tab: ScenarioDesignEventChipTab) => {
      onTabChange(tab)
    },
    [onTabChange],
  )

  return (
    <Stack direction="row" alignItems="center" height="48px" px="12px" py="8px" gap="5px" flexWrap="wrap" width="100%" minWidth={0}>
      {SCENARIO_DESIGN_EVENT_CHIP_TABS.map((tab) => {
        const selected = activeTab === tab
        return (
          <Stack
            key={tab}
            role="button"
            tabIndex={0}
            direction="row"
            alignItems="center"
            justifyContent="center"
            maxWidth="260px"
            px="10px"
            py="6px"
            borderRadius="100px"
            border="1px solid"
            borderColor={selected ? 'contentBorder.Primaryactive' : 'contentBorder.Normal'}
            bgcolor={selected ? 'contentBG.PrimaryFade' : 'commonColor.White'}
            onClick={() => handleSelectTab(tab)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleSelectTab(tab)
              }
            }}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: selected ? 'contentBG.PrimaryFade' : 'gray.5' } }}
          >
            <Typography
              variant="body2M14"
              fontWeight={selected ? 600 : 500}
              color={selected ? 'contentText.Black' : 'contentText.Normal'}
              lineHeight={1.4}
              noWrap
            >
              {tab}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

const ScenarioDesignAiInsightsContent = ({
  bullets,
  detailedAnalysis,
  loading = false,
}: {
  bullets: string[]
  detailedAnalysis: string
  loading?: boolean
}) => {
  if (loading) {
    return (
      <Stack gap="12px" sx={constrainedStackSx}>
        <Box sx={summaryGradientCardSx}>
          <Skeleton variant="rounded" width={112} height={24} sx={{ borderRadius: '4px' }} />
          <Stack gap="6px" mt="8px" sx={constrainedStackSx}>
            {[0, 1, 2].map((idx) => (
              <Skeleton key={idx} variant="rounded" height={20} width={idx === 2 ? '72%' : '100%'} sx={{ borderRadius: '4px' }} />
            ))}
          </Stack>
        </Box>
        <Box sx={detailGradientCardSx}>
          <Skeleton variant="rounded" width={96} height={24} sx={{ borderRadius: '4px' }} />
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: '8px', mt: '8px' }} />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack gap="12px" sx={constrainedStackSx}>
      <Box sx={summaryGradientCardSx}>
        <Stack gap="8px" sx={constrainedStackSx}>
          <Typography sx={cardSubsectionTitleSx}>핵심요약</Typography>
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
                ...bulletBodySx,
                '&::marker': { color: 'contentText.Black', fontSize: 'calc(1em * 2 / 3)' },
              },
            }}
          >
            {bullets.map((bullet, index) => (
              <Box component="li" key={index}>
                {bullet}
              </Box>
            ))}
          </Box>
        </Stack>
      </Box>
      <Box sx={detailGradientCardSx}>
        <Stack gap="8px" sx={constrainedStackSx}>
          <Typography sx={cardSubsectionTitleSx}>상세분석</Typography>
          <Typography component="div" sx={{ ...bodySx, whiteSpace: 'pre-line' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {detailedAnalysis}
            </ReactMarkdown>
          </Typography>
        </Stack>
      </Box>
    </Stack>
  )
}

const ScenarioDesignEventChipContent = ({
  activeTab,
  detailLoading = false,
  aiBullets,
  aiDetailedAnalysis,
  impactTableRows,
  impactKpiItems,
  impactNarrative,
  isNoiseEvent = false,
  driverTreeScoreboard,
  outlookRows,
  outlooksPagination,
  onOutlooksPageChange,
  onOutlooksSizeChange,
  outlooksLoading = false,
  recordRows,
  recordsPagination,
  onRecordsPageChange,
  onRecordsSizeChange,
  recordsLoading = false,
}: ScenarioDesignEventChipContentProps) => {
  switch (activeTab) {
    case 'AI Insights':
      return <ScenarioDesignAiInsightsContent bullets={aiBullets} detailedAnalysis={aiDetailedAnalysis} loading={detailLoading} />
    case '영향도 분석':
      return (
        <Stack sx={embeddedSectionSx}>
          <EventDetailImpactAnalysisSection
            tableRows={impactTableRows}
            kpiItems={impactKpiItems}
            narrative={impactNarrative}
            isNoiseEvent={isNoiseEvent}
            loading={detailLoading}
          />
        </Stack>
      )
    case 'Index Driver별 영향도 분석':
      return (
        <Stack sx={embeddedSectionSx}>
          <EventDetailDriverTreeScoreboardSection driverTreeScoreboard={driverTreeScoreboard} loading={detailLoading} />
        </Stack>
      )
    case '기관 전망':
      return (
        <Stack sx={embeddedSectionSx}>
          <EventDetailInstitutionalOutlookTable
            rows={outlookRows}
            serverPagination={outlooksPagination}
            onServerPageChange={onOutlooksPageChange}
            onServerSizeChange={onOutlooksSizeChange}
            loading={outlooksLoading}
          />
        </Stack>
      )
    case 'MI Records':
      return (
        <Stack sx={embeddedSectionSx}>
          <EventDetailMiRecordsTable
            rows={recordRows}
            serverPagination={recordsPagination}
            onServerPageChange={onRecordsPageChange}
            onServerSizeChange={onRecordsSizeChange}
            loading={recordsLoading}
          />
        </Stack>
      )
    default:
      return null
  }
}

const ScenarioDesignBaseEventSection = ({
  eventName,
  createdAt,
  categoryLabel,
  detailLoading = false,
  isNoiseEvent = false,
  aiBullets,
  aiDetailedAnalysis,
  impactTableRows,
  impactKpiItems,
  impactNarrative,
  driverTreeScoreboard,
  outlookRows,
  outlooksPagination,
  onOutlooksPageChange,
  onOutlooksSizeChange,
  outlooksLoading = false,
  recordRows,
  recordsPagination,
  onRecordsPageChange,
  onRecordsSizeChange,
  recordsLoading = false,
}: ScenarioDesignBaseEventSectionProps) => {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<ScenarioDesignEventChipTab>('AI Insights')

  const handleToggle = useCallback(() => {
    if (detailLoading) return
    setExpanded((prev) => !prev)
  }, [detailLoading])

  const handleTabChange = useCallback((tab: ScenarioDesignEventChipTab) => {
    setActiveTab(tab)
  }, [])

  return (
    <Stack gap="4px" width="100%" minWidth={0} sx={{ maxWidth: '100%' }}>
      <Typography fontSize={18} fontWeight={600} color="contentText.Black" px="8px" py="4px" lineHeight={1.4}>
        Base Event
      </Typography>
      <Stack
        border="1px solid"
        borderColor={expanded ? 'contentBorder.Hover' : 'contentBorder.Normal'}
        borderRadius="10px"
        padding="16px"
        gap={expanded ? '10px' : 0}
        bgcolor={expanded ? 'gray.5' : 'commonColor.White'}
        width="100%"
        minWidth={0}
        sx={{
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          transition: 'background-color 150ms ease, border-color 150ms ease',
          ...(!detailLoading && !expanded
            ? {
              '&:hover': {
                bgcolor: 'gray.10',
                borderColor: 'contentBorder.Hover',
              },
            }
            : {}),
        }}
      >
        <Stack
          role="button"
          tabIndex={detailLoading ? -1 : 0}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (detailLoading) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleToggle()
            }
          }}
          sx={{ cursor: detailLoading ? 'default' : 'pointer' }}
        >
          {detailLoading ? (
            <Stack gap="8px" flex={1}>
              <Skeleton variant="rounded" width="min(640px, 90%)" height="22px" />
              <Skeleton variant="rounded" width="280px" height="18px" />
            </Stack>
          ) : (
            <Stack gap="6px" flex={1} minWidth={0}>
              <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
                <StarRoundedIcon sx={{ fontSize: 18, color: 'contentIcon.Enabled', flexShrink: 0 }} />
                <Typography variant="body1M16" color="contentText.Black" lineHeight={1.4} noWrap>
                  {eventName ?? '-'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
                <Typography variant="body2R14" color="contentText.Subtext" lineHeight={1.5}>
                  {formatTimestamp(createdAt)}
                </Typography>
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.5}>
                  {categoryLabel ?? '-'}
                </Typography>
              </Stack>
            </Stack>
          )}
          {!detailLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              padding="4px"
              borderRadius="10px"
              flexShrink={0}
              sx={{ '&:hover': { bgcolor: 'gray.10' } }}
            >
              <KeyboardArrowDownRoundedIcon
                sx={{
                  fontSize: 20,
                  color: expanded ? 'contentIcon.Activeb' : 'contentIcon.Enabled',
                  transition: 'transform 150ms ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Stack>
          ) : null}
        </Stack>
        <Collapse in={expanded} timeout={200} sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
          <Stack gap="6px" width="100%" minWidth={0} sx={{ maxWidth: '100%' }}>
            <ScenarioDesignEventChipMenu activeTab={activeTab} onTabChange={handleTabChange} />
            <Stack
              bgcolor="commonColor.White"
              borderRadius="10px"
              padding="8px"
              width="100%"
              minWidth={0}
              sx={{ maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}
            >
              <ScenarioDesignEventChipContent
                activeTab={activeTab}
                detailLoading={detailLoading}
                aiBullets={aiBullets}
                aiDetailedAnalysis={aiDetailedAnalysis}
                impactTableRows={impactTableRows}
                impactKpiItems={impactKpiItems}
                impactNarrative={impactNarrative}
                isNoiseEvent={isNoiseEvent}
                driverTreeScoreboard={driverTreeScoreboard}
                outlookRows={outlookRows}
                outlooksPagination={outlooksPagination}
                onOutlooksPageChange={onOutlooksPageChange}
                onOutlooksSizeChange={onOutlooksSizeChange}
                outlooksLoading={outlooksLoading}
                recordRows={recordRows}
                recordsPagination={recordsPagination}
                onRecordsPageChange={onRecordsPageChange}
                onRecordsSizeChange={onRecordsSizeChange}
                recordsLoading={recordsLoading}
              />
            </Stack>
          </Stack>
        </Collapse>
      </Stack>
    </Stack>
  )
}

export default ScenarioDesignBaseEventSection
