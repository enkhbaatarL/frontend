import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { KpiCardProps } from '@/pages/mi/nextGenMI/components/common/KpiCard'

import MIMenu from '@/components/common/menu/MIMenu'
import { useMIMorphingPopupContext } from '@/components/mi/MIMorphingPopupContext'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMINoiseSignalBadge } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import { nextGenMIIsEventNoiseSignal } from '@/pages/mi/nextGenMI/components/common/nextGenMIClassificationChip'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type NextGenMIDetailHeaderSection,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import EventDetailAiInsightsSection from '@/pages/mi/nextGenMI/components/event/EventDetailAiInsightsSection'
import EventDetailDriverTreeScoreboardSection from '@/pages/mi/nextGenMI/components/event/EventDetailDriverTreeScoreboardSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/nextGenMI/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/nextGenMI/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/nextGenMI/components/event/EventDetailMiRecordsTable'
import EventDetailRelatedScenariosSection from '@/pages/mi/nextGenMI/components/event/EventDetailRelatedScenariosSection'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import { getNextGenMIEventDesignPath, getNextGenMIScenarioGroupDetailPath, getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import nextGenMIEventService from '@/service/mi/nextGenMI/event'

export type EventDetailTabKey = 'impact' | 'ai' | 'records' | 'outlook' | 'driverTree' | 'related'

const EVENT_DETAIL_TABS: { key: EventDetailTabKey; label: string }[] = [
  { key: 'ai', label: 'AI Insights' },
  { key: 'impact', label: '영향도 분석' },
  // { key: 'fundamental', label: 'Fundamental Deep-dive' }, // 미확정으로 인한 임시 비활성화 26.05.07
  { key: 'driverTree', label: 'Index Driver별 영향도 분석' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'records', label: 'MI Records' },
  { key: 'related', label: '관련 시나리오' },
]

interface NextGenMIEventDetailLocationState {
  eventName?: string
  nextGenMISelfEntityBump?: number
}

interface NextGenMIEventDetailPageProps {
  eventId?: string
  embedded?: boolean
}

const SECTION_SCROLL_IDS: Record<EventDetailTabKey, string> = {
  impact: 'event-detail-section-impact',
  ai: 'event-detail-section-ai',
  records: 'event-detail-section-records',
  outlook: 'event-detail-section-outlook',
  driverTree: 'event-detail-section-driver-tree',
  related: 'event-detail-section-related',
}

const EVENT_DETAIL_HEADER_SECTIONS: NextGenMIDetailHeaderSection[] = EVENT_DETAIL_TABS.map((tab) => ({
  id: SECTION_SCROLL_IDS[tab.key],
  label: tab.label,
}))

const renderEventDetailHeaderTabActions = (targetLabel?: string, onScenarioDesignClick?: () => void) => (
  <Stack direction="row" alignItems="center" gap="12px">
    <NextGenMIUserFeedback pageName="Next-Gen MI" sectionName="Event List / Event Detail" targetLabel={targetLabel} />
    <MIMenu
      variant="contained"
      label="시나리오 생성"
      prefix={<AutoAwesomeRoundedIcon aria-hidden focusable="false" />}
      onClick={onScenarioDesignClick}
      sx={{
        height: '36px',
      }}
    />
  </Stack>
)

interface EventDetailHeaderContent {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
}

let eventDetailHeaderContent: EventDetailHeaderContent | null = null
const eventDetailHeaderListeners = new Set<() => void>()

const subscribeEventDetailHeaderContent = (listener: () => void) => {
  eventDetailHeaderListeners.add(listener)
  return () => eventDetailHeaderListeners.delete(listener)
}

const getEventDetailHeaderContentSnapshot = () => eventDetailHeaderContent

const publishEventDetailHeaderContent = (next: EventDetailHeaderContent) => {
  eventDetailHeaderContent = next
  eventDetailHeaderListeners.forEach((l) => l())
}

const EventDetailHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeEventDetailHeaderContent,
    getEventDetailHeaderContentSnapshot,
    getEventDetailHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <NextGenMIDetailHeader
      sections={EVENT_DETAIL_HEADER_SECTIONS}
      backLabel={content.backLabel}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      rightAction={content.rightAction}
    />
  )
}

const formatEventDetailTimestampLabel = (iso?: string) => {
  if (!iso) return '-'
  const parsed = dayjs(iso)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : '-'
}

const NextGenMIEventDetailPage = ({ eventId: eventIdProp, embedded = false }: NextGenMIEventDetailPageProps = {}) => {
  const params = useParams()
  const eventId = eventIdProp ?? params.eventId
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as NextGenMIEventDetailLocationState | null
  const { showSnackbar } = useSnackbar()

  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })
  const { setStickyHeader } = useStickyHeader()
  const popupContext = useMIMorphingPopupContext()
  const popupScrollContainer = embedded ? (popupContext?.scrollContainer ?? null) : null

  useEffect(() => {
    if (embedded) return
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [embedded])

  const eventNameFromState = state?.eventName?.trim()

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['nextGenMIEventDetail', eventId],
    queryFn: () => nextGenMIEventService.getEventDetail(eventId!),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['nextGenMIEventRecords', eventId, recordsPagination.page, recordsPagination.size],
    queryFn: () => nextGenMIEventService.getEventRecords(eventId!, recordsPagination),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: outlooksData, isLoading: outlooksLoading } = useQuery({
    queryKey: ['nextGenMIEventOutlooks', eventId, outlooksPagination.page, outlooksPagination.size],
    queryFn: () => nextGenMIEventService.getEventOutlooks(eventId!, outlooksPagination),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!detailError) return
    showSnackbar('이벤트 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
  }, [detailError, showSnackbar])

  const title = useMemo(() => {
    const fromApi = detail?.eventName
    if (fromApi) return fromApi
    if (eventNameFromState) return eventNameFromState
    return eventId ? `이벤트 ${eventId}` : '이벤트'
  }, [detail?.eventName, eventId, eventNameFromState])

  const generatedAtLabel = formatEventDetailTimestampLabel(detail?.createdAt)
  const updatedAtLabel = formatEventDetailTimestampLabel(detail?.updatedAt)

  const impactKpiPair = useMemo((): [KpiCardProps, KpiCardProps] => {
    const ia = detail?.impactAnalysis
    return [
      {
        title: '카테고리',
        content: ia?.eventTypeLv1Label || ia?.eventTypeLv1 || '-',
        description: ia?.eventTypeLv2Label || ia?.eventTypeLv2 || '\u00a0',
      },
      {
        title: '출처',
        content: ia?.sources?.filter(Boolean).join(', ') || '-',
        description: '\u00a0',
      },
    ]
  }, [detail?.impactAnalysis])

  const impactTableRows = detail?.impactAnalysis?.indexImpacts ?? []
  const impactNarrative = detail?.impactAnalysis?.analysisText ?? ''

  const aiBullets = useMemo(() => {
    const list = detail?.aiInsights?.keySummaries ?? []
    if (list.length > 0) return list
    if (detailLoading) return []
    return ['요약 데이터가 없습니다.']
  }, [detail?.aiInsights?.keySummaries, detailLoading])

  const aiDetailedAnalysis = detail?.aiInsights?.detailedAnalysis ?? (detailLoading ? '' : '상세 분석 데이터가 없습니다.')

  const recordRows = recordsData?.detail ?? []
  const outlookRows = outlooksData?.detail ?? []
  const relatedEventScenario = detail?.relatedEventScenario
  const handleScenarioDesignClick = useCallback(() => {
    if (!eventId) return
    navigate(getNextGenMIEventDesignPath(eventId), {
      state: { eventName: title },
    })
  }, [eventId, navigate, title])

  const eventDetailHeaderTabActions = useMemo(
    () => renderEventDetailHeaderTabActions(title ? `이벤트 상세/ ${title}` : '이벤트 상세', handleScenarioDesignClick),
    [handleScenarioDesignClick, title],
  )

  const headerTitleSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
        <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
          <Stack direction="row" alignItems="center" gap="10px" flexWrap="wrap">
            <Typography variant="body1B16" color="contentText.Black">
              Event
            </Typography>
            {!detailLoading && nextGenMIIsEventNoiseSignal(detail?.signalType) ? (
              <Stack component="span" display="inline-flex" lineHeight={0}>
                <NextGenMINoiseSignalBadge label={detail?.signalTypeLabel?.trim() ?? ''} />
              </Stack>
            ) : null}
          </Stack>
          {detailLoading ? (
            <>
              <Skeleton variant="rounded" width="min(560px, 90%)" height="36px" sx={{ borderRadius: '6px' }} />
              <Skeleton variant="rounded" width="320px" height="28px" sx={{ borderRadius: '100px' }} />
            </>
          ) : (
            <>
              <Typography
                variant="titleLarge"
                fontSize="26px"
                fontWeight={600}
                display="block"
                sx={{ lineHeight: 1.4, wordBreak: 'break-word' }}
              >
                {title}
              </Typography>
              <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap="6px" padding="4px 8px" borderRadius="100px">
                  <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4}>
                    생성
                  </Typography>
                  <Typography variant="body2M14" color="contentText.Black" lineHeight={1.4}>
                    {generatedAtLabel}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap="6px" padding="4px 8px" borderRadius="100px">
                  <Typography variant="body3SB12" color="contentText.Normal" lineHeight={1.4}>
                    갱신
                  </Typography>
                  <Typography variant="body2M14" color="contentText.Black" lineHeight={1.4}>
                    {updatedAtLabel}
                  </Typography>
                </Stack>
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
    ),
    [detail?.signalType, detail?.signalTypeLabel, detailLoading, generatedAtLabel, title, updatedAtLabel],
  )

  useLayoutEffect(() => {
    if (embedded) return
    publishEventDetailHeaderContent({
      backLabel: 'Event List',
      onBack: () => navigate(getNextGenMITabPath('events')),
      titleSlot: headerTitleSlot,
      rightAction: eventDetailHeaderTabActions,
    })
  }, [embedded, eventDetailHeaderTabActions, headerTitleSlot, navigate])

  useLayoutEffect(() => {
    if (embedded) return undefined
    setStickyHeader(<EventDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })

    return () => {
      setStickyHeader(null)
      eventDetailHeaderContent = null
    }
  }, [embedded, setStickyHeader])

  return (
    <Stack
      maxWidth={embedded ? undefined : '1380px'}
      margin={embedded ? undefined : 'auto'}
      padding={embedded ? '0' : '20px 12px 0'}
      position="relative"
      sx={{
        overflowX: embedded ? 'visible' : 'hidden',
      }}
    >
      {embedded && (
        <NextGenMIDetailHeader
          sections={EVENT_DETAIL_HEADER_SECTIONS}
          backLabel="Event List"
          onBack={() => popupContext?.close()}
          titleSlot={headerTitleSlot}
          rightAction={eventDetailHeaderTabActions}
          scrollContainer={popupScrollContainer}
          embeddedStickyTop={0}
          hideBackButton
        />
      )}
      <Stack gap="30px" padding={embedded ? '0 12px' : '0'} sx={{ minWidth: 0, maxWidth: '100%' }}>
        <Stack id={SECTION_SCROLL_IDS.ai} sx={{ minWidth: 0, maxWidth: '100%' }}>
          <EventDetailAiInsightsSection bullets={aiBullets} detailedAnalysis={aiDetailedAnalysis} loading={detailLoading} />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.impact} sx={{ borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}>
          <EventDetailImpactAnalysisSection
            tableRows={impactTableRows}
            kpiItems={impactKpiPair}
            narrative={impactNarrative}
            loading={detailLoading}
            isNoiseEvent={nextGenMIIsEventNoiseSignal(detail?.signalType)}
          />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.driverTree}>
          <EventDetailDriverTreeScoreboardSection driverTreeScoreboard={detail?.driverTreeScoreboard ?? []} loading={detailLoading} />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.outlook}>
          <EventDetailInstitutionalOutlookTable
            rows={outlookRows}
            serverPagination={outlooksData}
            onServerPageChange={(page) => setOutlooksPagination((p) => ({ ...p, page }))}
            onServerSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
            loading={outlooksLoading}
          />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.records}>
          <EventDetailMiRecordsTable
            rows={recordRows}
            serverPagination={recordsData}
            onServerPageChange={(page) => setRecordsPagination((p) => ({ ...p, page }))}
            onServerSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
            loading={recordsLoading}
          />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.related}>
          <EventDetailRelatedScenariosSection
            eventId={eventId}
            relatedEventScenario={relatedEventScenario}
            onScenarioRowClick={(row) => {
              const scenarioGroupId = relatedEventScenario?.scenarioGroupId
              if (scenarioGroupId === undefined || scenarioGroupId === null) return
              navigate(getNextGenMIScenarioGroupDetailPath(scenarioGroupId, row.scenarioId))
            }}
            loading={detailLoading}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default NextGenMIEventDetailPage
