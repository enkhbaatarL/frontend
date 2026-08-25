import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Collapse, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'
import type { EventDetail } from '@/service/mi/nextGenMI/event'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ArrowDown from '@/components/common/icons/ArrowDown'
import DocumentIcon from '@/components/common/icons/DocumentIcon'
import KeyboardArrowUpIcon from '@/components/common/icons/KeyboardArrowUpIcon'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import NextGenMIHoverLinkCell from '@/pages/mi/nextGenMI/components/common/NextGenMIHoverLinkCell'
import EventDetailAiInsightsSection from '@/pages/mi/nextGenMI/components/event/EventDetailAiInsightsSection'
import EventDetailDriverTreeScoreboardSection from '@/pages/mi/nextGenMI/components/event/EventDetailDriverTreeScoreboardSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/nextGenMI/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/nextGenMI/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/nextGenMI/components/event/EventDetailMiRecordsTable'
import {
  ScenarioDesignRationalePopupContent,
  type ScenarioDesignRationaleSection,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignDialogs'
import {
  SCENARIO_DESIGN_BASE_EVENT_TABS,
  SCENARIO_DESIGN_SECTIONS,
  type ScenarioDesignBaseEventTabKey,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

export type ScenarioDesignBaseEventItem = {
  eventId: string
  detail?: EventDetail
  title: string
  /** Agent 추천 이벤트 표시용 */
  isSuggested: boolean
  createdAtLabel: string
  typeLabel: string
  onEventClick: () => void
}

export type ScenarioDesignBaseEventSectionProps = {
  events: ScenarioDesignBaseEventItem[]
  loading: boolean
  /** 선택한 이벤트 조합 설계 근거가 있을 때만 노출 */
  showRationaleButton?: boolean
  rationaleText?: string
  /** 도출 근거 팝업 섹션 (형식 미정 - 틀용) */
  rationaleSections?: ScenarioDesignRationaleSection[]
}

const ScenarioDesignBaseEventTabButton = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <MIBaseButton
    variant="outlined"
    onClick={onClick}
    labelColor={active ? 'contentText.Black' : 'contentText.Normal'}
    sx={{
      height: '32px',
      minWidth: 'auto',
      maxWidth: '260px',
      padding: '6px 10px',
      borderRadius: '100px',
      backgroundColor: active ? 'contentBG.PrimaryFade' : 'commonColor.White',
      borderColor: active ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
      '&:hover:not(:disabled)': {
        backgroundColor: active ? 'contentBG.PrimaryFade' : 'commonColor.White',
        borderColor: active ? 'contentBorder.Primaryactive' : 'contentBorder.Hover',
      },
      '& .MuiTypography-root': {
        fontWeight: active ? 600 : 500,
      },
    }}
  >
    {label}
  </MIBaseButton>
)

const ScenarioDesignBaseEventCard = ({ event, loading }: { event: ScenarioDesignBaseEventItem; loading: boolean }) => {
  const [expanded, setExpanded] = useState(false)
  const [selectedTab, setSelectedTab] = useState<ScenarioDesignBaseEventTabKey>('ai')
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 5 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEventRecords', event.eventId, recordsPagination.page, recordsPagination.size],
    queryFn: () => nextGenMIEventService.getEventRecords(event.eventId, recordsPagination),
    enabled: Boolean(event.eventId) && expanded && selectedTab === 'records',
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: outlooksData, isLoading: outlooksLoading } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEventOutlooks', event.eventId, outlooksPagination.page, outlooksPagination.size],
    queryFn: () => nextGenMIEventService.getEventOutlooks(event.eventId, outlooksPagination),
    enabled: Boolean(event.eventId) && expanded && selectedTab === 'outlook',
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const detail = event.detail
  const impactKpiPair = useMemo((): [KpiCardProps, KpiCardProps] => {
    const impactAnalysis = detail?.impactAnalysis
    return [
      {
        title: '카테고리',
        content: impactAnalysis?.eventTypeLv1Label || impactAnalysis?.eventTypeLv1 || '-',
        description: impactAnalysis?.eventTypeLv2Label || impactAnalysis?.eventTypeLv2 || '\u00a0',
      },
      {
        title: '출처',
        content: impactAnalysis?.sources?.filter(Boolean).join(', ') || '-',
        description: '\u00a0',
      },
    ]
  }, [detail?.impactAnalysis])

  const aiBullets = useMemo(() => {
    const keySummaries = detail?.aiInsights?.keySummaries ?? []
    if (keySummaries.length > 0) return keySummaries
    if (loading) return []
    return ['요약 데이터가 없습니다.']
  }, [detail?.aiInsights?.keySummaries, loading])

  const aiDetailedAnalysis = detail?.aiInsights?.detailedAnalysis ?? (loading ? '' : '상세 분석 데이터가 없습니다.')
  const impactTableRows = useMemo(() => detail?.impactAnalysis?.indexImpacts ?? [], [detail?.impactAnalysis?.indexImpacts])
  const impactNarrative = detail?.impactAnalysis?.analysisText ?? ''
  const recordRows = useMemo(() => recordsData?.detail ?? [], [recordsData?.detail])
  const outlookRows = useMemo(() => outlooksData?.detail ?? [], [outlooksData?.detail])

  const detailContent = useMemo(() => {
    if (selectedTab === 'impact') {
      return (
        <EventDetailImpactAnalysisSection
          tableRows={impactTableRows}
          kpiItems={impactKpiPair}
          narrative={impactNarrative}
          loading={loading}
          isNoiseEvent={nextGenMIIsEventNoiseSignal(detail?.signalType)}
          compact
        />
      )
    }

    if (selectedTab === 'driverTree') {
      return <EventDetailDriverTreeScoreboardSection driverTreeScoreboard={detail?.driverTreeScoreboard ?? []} loading={loading} compact />
    }

    if (selectedTab === 'outlook') {
      return (
        <EventDetailInstitutionalOutlookTable
          rows={outlookRows}
          serverPagination={outlooksData}
          onServerPageChange={(page) => setOutlooksPagination((pagination) => ({ ...pagination, page }))}
          onServerSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
          loading={outlooksLoading}
          compact
          institutionViewSynthesis={detail?.institutionViewSynthesis}
        />
      )
    }

    if (selectedTab === 'records') {
      return (
        <EventDetailMiRecordsTable
          rows={recordRows}
          serverPagination={recordsData}
          onServerPageChange={(page) => setRecordsPagination((pagination) => ({ ...pagination, page }))}
          onServerSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
          loading={recordsLoading}
          compact
        />
      )
    }

    return <EventDetailAiInsightsSection bullets={aiBullets} detailedAnalysis={aiDetailedAnalysis} loading={loading} compact />
  }, [
    aiBullets,
    aiDetailedAnalysis,
    detail?.driverTreeScoreboard,
    detail?.institutionViewSynthesis,
    detail?.signalType,
    impactKpiPair,
    impactNarrative,
    impactTableRows,
    loading,
    outlookRows,
    outlooksData,
    outlooksLoading,
    recordRows,
    recordsData,
    recordsLoading,
    selectedTab,
  ])

  const handleToggle = () => {
    setExpanded((current) => !current)
  }

  return (
    <Stack
      gap="10px"
      padding="16px"
      bgcolor={expanded ? 'gray.5' : 'commonColor.White'}
      border="1px solid"
      borderColor={expanded ? 'contentBorder.Hover' : 'contentBorder.Normal'}
      borderRadius="10px"
      sx={{
        transition: 'background-color 120ms ease, border-color 120ms ease',
        ...(!expanded && {
          '&:hover': {
            backgroundColor: 'contentBG.Hover',
            borderColor: 'contentBorder.Hover',
          },
        }),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        onClick={handleToggle}
        sx={{ cursor: 'pointer' }}
      >
        <Stack flex={1} minWidth={0} gap="6px">
          {loading ? (
            <>
              <Skeleton variant="rounded" width="min(720px, 100%)" height="20px" />
              <Skeleton variant="rounded" width="360px" height="16px" />
            </>
          ) : (
            <>
              <Stack direction="row" alignItems="center" gap="4px" minWidth={0}>
                {event.isSuggested && (
                  <StarRoundedIcon sx={{ fontSize: '18px', color: 'mari.Primary', flexShrink: 0 }} aria-label="Agent 추천 이벤트" />
                )}
                <NextGenMIHoverLinkCell
                  value={event.title}
                  variant="body1M16"
                  ariaLabel={`${event.title} 상세 보기`}
                  onClick={event.onEventClick}
                />
              </Stack>
              <Stack direction="row" alignItems="center" gap="8px" minWidth={0}>
                <Typography variant="body2R14" color="contentText.Subtext" lineHeight={1.5} noWrap>
                  {event.createdAtLabel}
                </Typography>
                <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.5} noWrap>
                  {event.typeLabel}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
        <MIBaseButton
          aria-label={expanded ? 'Base Event 접기' : 'Base Event 펼치기'}
          aria-expanded={expanded}
          aria-controls={`scenario-design-base-event-detail-${event.eventId}`}
          variant="text"
          prefix={
            expanded ? (
              <KeyboardArrowUpIcon aria-hidden focusable="false" style={{ color: '#868E96' }} />
            ) : (
              <ArrowDown aria-hidden focusable="false" />
            )
          }
          onClick={(clickEvent) => {
            clickEvent.stopPropagation()
            handleToggle()
          }}
          sx={{
            width: '28px',
            minWidth: '28px',
            height: '28px',
            padding: '4px',
            borderRadius: '10px',
            '& .MuiTypography-root': {
              display: 'none',
            },
          }}
        >
          {''}
        </MIBaseButton>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
        <Stack id={`scenario-design-base-event-detail-${event.eventId}`} gap="6px" width="100%" minWidth={0}>
          <Stack direction="row" alignItems="center" gap="5px" minHeight="48px" padding="8px 12px" flexWrap="wrap">
            {SCENARIO_DESIGN_BASE_EVENT_TABS.map((tab) => (
              <ScenarioDesignBaseEventTabButton
                key={tab.key}
                active={selectedTab === tab.key}
                label={tab.label}
                onClick={() => setSelectedTab(tab.key)}
              />
            ))}
          </Stack>
          <Stack bgcolor="commonColor.White" borderRadius="10px" padding="8px" overflow="hidden" minWidth={0}>
            {detailContent}
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  )
}

const ScenarioDesignBaseEventSection = ({
  events,
  loading,
  showRationaleButton = false,
  rationaleText = '',
  rationaleSections,
}: ScenarioDesignBaseEventSectionProps) => {
  const rationalePopupRef = useRef<MIMorphingPopupRef>(null)

  return (
    <Stack id={SCENARIO_DESIGN_SECTIONS[0].id} gap="4px">
      <Stack direction="row" alignItems="center" justifyContent="space-between" padding="4px 8px" minWidth={0}>
        <Typography fontSize="18px" fontWeight={600} color="contentText.Black" lineHeight={1.4} noWrap>
          Base Event
        </Typography>
        {showRationaleButton && (
          <MIMorphingPopup
            ref={rationalePopupRef}
            display="inline-flex"
            popup={{
              title: '도출 근거',
              content: <ScenarioDesignRationalePopupContent sections={rationaleSections} fallbackText={rationaleText} />,
              measureContent: <ScenarioDesignRationalePopupContent sections={rationaleSections} fallbackText={rationaleText} />,
              hideHeaderLine: true,
              showSkeleton: false,
            }}
          >
            <MIBaseButton
              variant="outlined"
              onClick={() => rationalePopupRef.current?.open()}
              prefix={<DocumentIcon width={20} height={20} aria-hidden focusable="false" style={{ color: '#495057' }} />}
              labelColor="contentText.Normal"
              gap="4px"
              sx={{
                height: '36px',
                padding: '8px 10px 8px 6px',
                borderRadius: '8px',
                flexShrink: 0,
                backgroundColor: 'commonColor.White',
                borderColor: 'contentBorder.Normal',
                '&:hover:not(:disabled)': {
                  backgroundColor: 'commonColor.White',
                  borderColor: 'contentBorder.Hover',
                },
                '& .MuiTypography-root': {
                  fontWeight: 600,
                },
              }}
            >
              근거 보기
            </MIBaseButton>
          </MIMorphingPopup>
        )}
      </Stack>

      <Stack gap="4px" width="100%" minWidth={0}>
        {loading && events.length === 0 ? (
          <ScenarioDesignBaseEventCard
            event={{
              eventId: 'loading',
              title: '',
              isSuggested: false,
              createdAtLabel: '',
              typeLabel: '',
              onEventClick: () => undefined,
            }}
            loading
          />
        ) : (
          events.map((event) => <ScenarioDesignBaseEventCard key={event.eventId} event={event} loading={loading} />)
        )}
      </Stack>
    </Stack>
  )
}

export default ScenarioDesignBaseEventSection
