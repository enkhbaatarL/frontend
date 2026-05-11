import { EventNote } from '@mui/icons-material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type {
  // EventDetailFundamentalIndicatorRow,
  // EventDetailFundamentalMetricRow,
  EventDetailImpactKpiItem,
  EventDetailImpactTableRow,
  EventDetailMiRecordRow,
  EventDetailOutlookRow,
} from '@/pages/mi/scenarioWorkbench/components/event/types'
import type { IRelatedEvent, IRelatedScenario } from '@/service/mi/scenarioWorkbench/scenario'

import { useMIMorphingPopupContext } from '@/components/mi/MIMorphingPopupContext'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import ClassificationTag from '@/pages/mi/scenarioWorkbench/components/common/ClassificationTag'
import RelatedEventsAndScenariosSection from '@/pages/mi/scenarioWorkbench/components/common/RelatedEventsAndScenariosSection'
import ScenarioWorkbenchDetailHeader, {
  WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type WorkbenchDetailHeaderSection,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'
import EventDetailAiInsightsSection from '@/pages/mi/scenarioWorkbench/components/event/EventDetailAiInsightsSection'
import EventDetailDriverTreeScoreboardSection, {
  type EventDetailDriverTreeRow,
} from '@/pages/mi/scenarioWorkbench/components/event/EventDetailDriverTreeScoreboardSection'
// import EventDetailFundamentalSection from '@/pages/mi/scenarioWorkbench/components/event/EventDetailFundamentalSection'
import EventDetailImpactAnalysisSection from '@/pages/mi/scenarioWorkbench/components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '@/pages/mi/scenarioWorkbench/components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '@/pages/mi/scenarioWorkbench/components/event/EventDetailMiRecordsTable'
import { getScenarioWorkbenchTabPath, SCENARIO_WORKBENCH_BASE_PATH } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchRoutes'
import { EventCategoryLv1, MarketDirection, MarketImpactLevel } from '@/service/mi/scenarioWorkbench/common'
import scenarioWorkbenchEventService, { SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO } from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

/** 이벤트 상세 탭 키 */
export type EventDetailTabKey = 'impact' | 'ai' | 'records' | 'outlook' | /* 'fundamental' |*/ 'driverTree' | 'related'

/** 이벤트 상세 탭 라벨 정의 */
const EVENT_DETAIL_TABS: { key: EventDetailTabKey; label: string }[] = [
  { key: 'impact', label: '영향도 분석' },
  { key: 'ai', label: 'AI Insights' },
  { key: 'records', label: 'MI Records' },
  { key: 'outlook', label: '기관 전망' },
  // { key: 'fundamental', label: 'Fundamental Deep-dive' }, // 미확정으로 인한 임시 비활성화 26.05.07
  { key: 'driverTree', label: 'Driver Tree Scoreboard' },
  { key: 'related', label: '관련 이벤트 및 시나리오' },
]

/** 이벤트 상세에서 라우트 state로 넘어오는 값 타입 */
interface ScenarioWorkbenchEventDetailLocationState {
  eventName?: string
}

interface ScenarioWorkbenchEventDetailPageProps {
  eventId?: string
  /** 임베디드(모핑 팝업 등) 모드: 페이지 sticky header 등록을 건너뛰고 본문 내부에 헤더를 렌더 */
  embedded?: boolean
}

const SECTION_SCROLL_IDS: Record<EventDetailTabKey, string> = {
  impact: 'event-detail-section-impact',
  ai: 'event-detail-section-ai',
  records: 'event-detail-section-records',
  outlook: 'event-detail-section-outlook',
  // fundamental: 'event-detail-section-fundamental', // 미확정으로 인한 임시 비활성화 26.05.07
  driverTree: 'event-detail-section-driver-tree',
  related: 'event-detail-section-related',
}

/** 시나리오 워크벤치 상세 헤더의 섹션 탭 정의 */
const EVENT_DETAIL_HEADER_SECTIONS: WorkbenchDetailHeaderSection[] = EVENT_DETAIL_TABS.map((tab) => ({
  id: SECTION_SCROLL_IDS[tab.key],
  label: tab.label,
}))

/** 이벤트 상세 헤더에 필요한 동적 콘텐츠 */
interface EventDetailHeaderContent {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
}

let eventDetailHeaderContent: EventDetailHeaderContent | null = null
const eventDetailHeaderListeners = new Set<() => void>()

/** 외부 스토어 구독 등록 (헤더 콘텐츠 변경 시 리렌더 트리거) */
const subscribeEventDetailHeaderContent = (listener: () => void) => {
  eventDetailHeaderListeners.add(listener)
  return () => eventDetailHeaderListeners.delete(listener)
}

/** 외부 스토어 스냅샷 읽기 (동기 렌더링에 사용) */
const getEventDetailHeaderContentSnapshot = () => eventDetailHeaderContent

/** 외부 스토어 게시 (헤더 콘텐츠 변경 전파) */
const publishEventDetailHeaderContent = (next: EventDetailHeaderContent) => {
  eventDetailHeaderContent = next
  eventDetailHeaderListeners.forEach((l) => l())
}

/** `ScenarioWorkbenchDetailHeader` 래퍼 — 외부 스토어 기반으로 titleSlot을 갱신 */
const EventDetailHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeEventDetailHeaderContent,
    getEventDetailHeaderContentSnapshot,
    getEventDetailHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <ScenarioWorkbenchDetailHeader
      sections={EVENT_DETAIL_HEADER_SECTIONS}
      backLabel={content.backLabel}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      rightAction={content.rightAction}
    />
  )
}

const DEFAULT_IMPACT_KPI_PAIR: [EventDetailImpactKpiItem, EventDetailImpactKpiItem] = [
  { title: '카테고리', content: '수급 밸런스', description: '재고 / 저장 수준' },
  { title: '출처', content: 'Reuters, Platts', description: '\u00a0' },
]

/** 시나리오 워크벤치 이벤트 상세 */
const ScenarioWorkbenchEventDetailPage = ({ eventId: eventIdProp, embedded = false }: ScenarioWorkbenchEventDetailPageProps = {}) => {
  const params = useParams()
  const eventId = eventIdProp ?? params.eventId
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ScenarioWorkbenchEventDetailLocationState | null

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

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery({
    queryKey: ['scenarioWorkbenchEventDetail', eventId],
    queryFn: () => scenarioWorkbenchEventService.getEventDetail(eventId!),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['scenarioWorkbenchEventRecords', eventId, recordsPagination.page, recordsPagination.size],
    queryFn: () => scenarioWorkbenchEventService.getEventRecords(eventId!, recordsPagination),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { data: outlooksData, isLoading: outlooksLoading } = useQuery({
    queryKey: ['scenarioWorkbenchEventOutlooks', eventId, outlooksPagination.page, outlooksPagination.size],
    queryFn: () => scenarioWorkbenchEventService.getEventOutlooks(eventId!, outlooksPagination),
    enabled: !!eventId,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const title = useMemo(() => {
    const fromState = state?.eventName?.trim()
    if (fromState) return fromState
    const fromApi = detail?.eventName?.trim() || detail?.title?.trim()
    if (fromApi) return fromApi
    return eventId ? `이벤트 ${eventId}` : '이벤트'
  }, [detail?.eventName, detail?.title, eventId, state?.eventName])

  const { generatedAtLabel, updatedAtLabel } = useMemo(() => {
    const created = detail?.createdAt ? dayjs(detail.createdAt) : null
    const updated = detail?.updatedAt ? dayjs(detail.updatedAt) : null
    return {
      generatedAtLabel: created?.isValid() ? created.format('YYYY-MM-DD HH:mm') : '-',
      updatedAtLabel: updated?.isValid() ? updated.format('YYYY-MM-DD HH:mm') : '-',
    }
  }, [detail?.createdAt, detail?.updatedAt])

  const impactKpiPair = useMemo((): [EventDetailImpactKpiItem, EventDetailImpactKpiItem] => {
    const ia = detail?.impactAnalysis
    const [a, b] = DEFAULT_IMPACT_KPI_PAIR
    if (!ia) {
      return [{ ...a }, { ...b }]
    }
    const lv1 = ia.eventCategoryLv1 ?? ia.categoryLv1
    const lv1Key = lv1 ? (String(lv1).toUpperCase() as keyof typeof SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO) : undefined
    const categoryContent = lv1Key ? (SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[lv1Key] ?? lv1) : a.content
    const categoryDesc =
      (ia.eventCategoryLv2 ?? ia.categoryLv2) ? (ia.eventCategoryLv2 ?? ia.categoryLv2)!.replaceAll('_', ' ') : a.description
    const sourcesContent = ia.sources?.filter(Boolean).length ? ia.sources!.filter(Boolean).join(', ') : b.content
    return [
      { ...a, content: categoryContent, description: categoryDesc },
      { ...b, content: sourcesContent },
    ]
  }, [detail?.impactAnalysis])

  const impactTableRows = useMemo((): EventDetailImpactTableRow[] => {
    const list = detail?.impactAnalysis?.indexImpacts ?? []
    const prefix = detail?.eventId ?? eventId ?? 'evt'
    return list.map((row, i) => ({
      id: `${prefix}-impact-${i}`,
      target: row.indexName,
      marketImpact: row.marketImpactLevel,
      direction: row.direction,
    }))
  }, [detail?.eventId, detail?.impactAnalysis?.indexImpacts, eventId])

  const impactNarrative = detail?.impactAnalysis?.analysisText?.trim() ?? ''

  const aiBullets = useMemo(() => {
    const list = detail?.aiInsights?.keySummaries ?? []
    if (list.length > 0) return list
    if (detailLoading) return []
    return ['요약 데이터가 없습니다.']
  }, [detail?.aiInsights?.keySummaries, detailLoading])

  const aiDetailParagraph = useMemo(() => {
    const text = detail?.aiInsights?.detailedAnalysis?.trim()
    if (text) return text
    if (detailLoading) return ''
    return '상세 분석 데이터가 없습니다.'
  }, [detail?.aiInsights?.detailedAnalysis, detailLoading])

  // const fundamentalMetricRows = useMemo((): EventDetailFundamentalMetricRow[] => {
  //   const metrics = detail?.fundamentalDeepdive && 'metrics' in detail.fundamentalDeepdive ? (detail.fundamentalDeepdive.metrics ?? []) : []
  //   const prefix = detail?.eventId ?? eventId ?? 'evt'
  //   return metrics.map((m, i) => ({
  //     id: `${prefix}-fm-${i}`,
  //     item: m.metricName,
  //     currentValue: m.currentValue,
  //     criteria: m.interpretation,
  //     source: m.source,
  //   }))
  // }, [detail?.eventId, detail?.fundamentalDeepdive, eventId])
  //
  // const fundamentalIndicatorRows = useMemo((): EventDetailFundamentalIndicatorRow[] => {
  //   const indicators =
  //     detail?.fundamentalDeepdive && 'indicators' in detail.fundamentalDeepdive ? (detail.fundamentalDeepdive.indicators ?? []) : []
  //   const prefix = detail?.eventId ?? eventId ?? 'evt'
  //   return indicators.map((m, i) => ({
  //     id: `${prefix}-fi-${i}`,
  //     indicator: m.indicatorName,
  //     currentValue: m.currentValue,
  //     implication: m.implication,
  //     source: m.source,
  //   }))
  // }, [detail?.eventId, detail?.fundamentalDeepdive, eventId])

  /** 관련 이벤트/시나리오 테이블 행 데이터 (API: relatedEventScenario) */
  const { relatedEvents, relatedScenarios } = useMemo((): { relatedEvents: IRelatedEvent[]; relatedScenarios: IRelatedScenario[] } => {
    const related = detail?.relatedEventScenario
    const relatedEvent = related?.event
    const relatedEventIndexImpacts = relatedEvent?.indexImpacts ?? []

    const eventRows: IRelatedEvent[] = relatedEvent
      ? [
        {
          eventId: relatedEvent.eventId,
          eventName: relatedEvent.eventName,
          createdAt: relatedEvent.createdAt,
          updatedAt: relatedEvent.updatedAt,
          eventCategoryLv1: relatedEvent.eventCategoryLv1 as EventCategoryLv1,
          indexImpacts: relatedEventIndexImpacts.map((i) => ({
            indexName: i.indexName,
            marketImpactLevel: i.marketImpactLevel as MarketImpactLevel,
            direction: i.direction as MarketDirection,
          })),
        },
      ]
      : []

    const scenarioRows: IRelatedScenario[] = (related?.scenarios ?? []).map((s) => {
      const impacts = s.indexImpacts ?? []
      return {
        scenarioId: s.scenarioId,
        scenarioName: s.scenarioName,
        baseCase: s.baseCase,
        probability: s.probability ?? 0,
        indexImpacts: impacts.map((i) => ({
          indexName: i.indexName,
          marketImpactLevel: i.marketImpactLevel as MarketImpactLevel,
        })),
      }
    })

    return { relatedEvents: eventRows, relatedScenarios: scenarioRows }
  }, [detail?.relatedEventScenario])

  /** Driver Tree Scoreboard — API 연동 전까지 퍼블리싱용 목 데이터 */
  const driverTreeRows = useMemo((): EventDetailDriverTreeRow[] => {
    const prefix = detail?.eventId ?? eventId ?? 'evt'
    return [
      {
        id: `${prefix}-dt-1`,
        category: '공급',
        driver: '가스 생산 capa/가동률',
        strengthLevel: MarketImpactLevel.EXTREME,
        strengthDirection: MarketDirection.BULLISH,
        rationale: 'Ras Laffan 등 중동 공급 차질 리스크 반영',
      },
      {
        id: `${prefix}-dt-2`,
        category: '공급',
        driver: 'Liquefaction/Spot',
        strengthLevel: MarketImpactLevel.HIGH,
        strengthDirection: MarketDirection.BULLISH,
        rationale: '현물 cargo 경쟁 심화 가능',
      },
      {
        id: `${prefix}-dt-3`,
        category: '수요',
        driver: '발전/산업 수요',
        strengthLevel: MarketImpactLevel.MEDIUM,
        strengthDirection: MarketDirection.NEGLIGIBLE,
        rationale: '단기 수요는 계절·정책 영향이 더 큼',
      },
      {
        id: `${prefix}-dt-4`,
        category: '물류',
        driver: '항로/보험료',
        strengthLevel: MarketImpactLevel.HIGH,
        strengthDirection: MarketDirection.BULLISH,
        rationale: '호르무즈 리스크로 비용·리드타임 증가',
      },
      {
        id: `${prefix}-dt-5`,
        category: '정책',
        driver: '전략비축/긴급조치',
        strengthLevel: MarketImpactLevel.LOW,
        strengthDirection: MarketDirection.NEGLIGIBLE,
        rationale: '현재 시점에 즉각 조치 시그널 제한적',
      },
    ]
  }, [detail?.eventId, eventId])

  const recordRows = useMemo((): EventDetailMiRecordRow[] => {
    const list = recordsData?.detail ?? []
    const page = recordsData?.currentPage ?? 1
    return list.map((r, i) => ({
      id: `${eventId ?? 'evt'}-rec-${page}-${i}-${r.publishedAt}`,
      atLabel: dayjs(r.publishedAt).isValid() ? dayjs(r.publishedAt).format('YYYY-MM-DD HH:mm') : '-',
      kind: r.source?.trim() ? r.source : 'MI',
      title: r.title,
      summary: r.summary,
    }))
  }, [eventId, recordsData?.currentPage, recordsData?.detail])

  const recordsServerPagination = useMemo((): IPaginationResponse<EventDetailMiRecordRow> | undefined => {
    if (!recordsData) return undefined
    return {
      ...recordsData,
      detail: recordRows,
    }
  }, [recordRows, recordsData])

  const outlookRows = useMemo((): EventDetailOutlookRow[] => {
    const list = outlooksData?.detail ?? []
    const page = outlooksData?.currentPage ?? 1
    return list.map((r, i) => ({
      id: `${eventId ?? 'evt'}-out-${page}-${i}-${r.publishedAt}`,
      dateLabel: dayjs(r.publishedAt).isValid() ? dayjs(r.publishedAt).format('YYYY-MM-DD HH:mm') : '-',
      institution: r.institutionName,
      summary: r.outlookSummary,
    }))
  }, [eventId, outlooksData?.currentPage, outlooksData?.detail])

  const outlooksServerPagination = useMemo((): IPaginationResponse<EventDetailOutlookRow> | undefined => {
    if (!outlooksData) return undefined
    return {
      ...outlooksData,
      detail: outlookRows,
    }
  }, [outlookRows, outlooksData])

  const headerTitleSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
        <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
          <Stack direction="row" alignItems="center" gap="10px" flexWrap="wrap">
            <Typography variant="body1B16" color="contentText.Black">
              Event
            </Typography>
            {detail?.signalType === 'noise' ? <ClassificationTag classification="소음" /> : null}
          </Stack>
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
            <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
              생성일시 {generatedAtLabel}
            </Typography>
            <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
              |
            </Typography>
            <Typography variant="body3M12" color="contentText.Subtext" lineHeight={1.4}>
              업데이트 {updatedAtLabel}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    ),
    [detail?.signalType, generatedAtLabel, title, updatedAtLabel],
  )

  useLayoutEffect(() => {
    if (embedded) return
    publishEventDetailHeaderContent({
      backLabel: 'Events',
      onBack: () => navigate(getScenarioWorkbenchTabPath('events')),
      titleSlot: headerTitleSlot,
    })
  }, [embedded, headerTitleSlot, navigate])

  useLayoutEffect(() => {
    if (embedded) return undefined
    setStickyHeader(<EventDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
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
      px={embedded ? 0 : '12px'}
      pt={embedded ? 0 : '20px'}
      position="relative"
      sx={{
        userSelect: 'none',
        overflowX: embedded ? 'visible' : 'hidden',
      }}
    >
      {embedded && (
        <ScenarioWorkbenchDetailHeader
          sections={EVENT_DETAIL_HEADER_SECTIONS}
          backLabel="Events"
          onBack={() => popupContext?.close()}
          titleSlot={headerTitleSlot}
          scrollContainer={popupScrollContainer}
          embeddedStickyTop={0}
          hideBackButton
        />
      )}
      <Stack py="24px" gap="12px" px={embedded ? '12px' : 0}>
        {detailError && (
          <Typography px={2} py={1} color="error.main" variant="body2">
            이벤트 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </Typography>
        )}
        <Stack id={SECTION_SCROLL_IDS.impact} gap="12px" py="20px" sx={{ borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}>
          <EventDetailImpactAnalysisSection
            tableRows={impactTableRows}
            kpiItems={impactKpiPair}
            narrative={impactNarrative}
            isNoiseEvent={detail?.signalType === 'noise'}
          />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.ai} gap="12px" py="30px">
          <EventDetailAiInsightsSection bullets={aiBullets} detailParagraph={aiDetailParagraph} />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.records} gap="12px" py="30px">
          <EventDetailMiRecordsTable
            rows={recordRows}
            serverPagination={recordsServerPagination}
            onServerPageChange={(page) => setRecordsPagination((p) => ({ ...p, page }))}
            onServerSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
            loading={recordsLoading}
          />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.outlook} gap="12px" py="30px">
          <EventDetailInstitutionalOutlookTable
            rows={outlookRows}
            serverPagination={outlooksServerPagination}
            onServerPageChange={(page) => setOutlooksPagination((p) => ({ ...p, page }))}
            onServerSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
            loading={outlooksLoading}
          />
        </Stack>
        {/* <Stack id={SECTION_SCROLL_IDS.fundamental} gap="12px" py="30px">
          <EventDetailFundamentalSection metricRows={fundamentalMetricRows} indicatorRows={fundamentalIndicatorRows} />
        </Stack> */}
        <Stack
          id={SECTION_SCROLL_IDS.driverTree}
          gap="12px"
          py="30px"
          sx={{ borderBottom: '1px solid', borderColor: 'contentBorder.Normal' }}
        >
          <EventDetailDriverTreeScoreboardSection rows={driverTreeRows} />
        </Stack>
        <Stack id={SECTION_SCROLL_IDS.related} gap="12px" py="30px">
          <Stack direction="row" alignItems="center" gap="8px">
            <EventNote sx={{ fontSize: 30, color: 'contentText.Black' }} />
            <Typography sx={{ fontSize: 20, fontWeight: 600, color: 'contentText.Black' }}>관련 이벤트 및 시나리오</Typography>
            <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
          </Stack>
          <RelatedEventsAndScenariosSection
            events={relatedEvents}
            scenarios={relatedScenarios}
            onEventRowClick={(row) =>
              navigate(`${SCENARIO_WORKBENCH_BASE_PATH}/events/${encodeURIComponent(String(row.eventId))}`, {
                state: { eventName: row.eventName },
              })
            }
            onScenarioRowClick={(row) =>
              navigate(`${SCENARIO_WORKBENCH_BASE_PATH}/scenarios/${encodeURIComponent(String(row.scenarioId))}`)
            }
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioWorkbenchEventDetailPage
