import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import EventDetailAiInsightsSection from './components/event/EventDetailAiInsightsSection.tsx'
import EventDetailDriverTreeScoreboardSection, {
  type EventDetailDriverTreeRow,
} from './components/event/EventDetailDriverTreeScoreboardSection.tsx'
import EventDetailFundamentalSection from './components/event/EventDetailFundamentalSection.tsx'
import EventDetailImpactAnalysisSection from './components/event/EventDetailImpactAnalysisSection.tsx'
import EventDetailInstitutionalOutlookTable from './components/event/EventDetailInstitutionalOutlookTable.tsx'
import EventDetailMiRecordsTable from './components/event/EventDetailMiRecordsTable.tsx'
// import EventDetailRelatedEventsAndScenariosSection, {
//   type EventDetailRelatedScenarioRow,
// } from './components/event/EventDetailRelatedEventsAndScenariosSection.tsx'
import ScenarioWorkbenchDetailHeader, {
  WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type WorkbenchDetailHeaderSection,
} from './components/ScenarioWorkbenchDetailHeader'

// import { SCENARIO_WORKBENCH_EVENT_MOCK_ROWS } from './components/event/eventMockData.ts'

import type {
  EventDetailFundamentalIndicatorRow,
  EventDetailFundamentalMetricRow,
  EventDetailImpactKpiItem,
  EventDetailImpactTableRow,
  EventDetailMiRecordRow,
  EventDetailOutlookRow,
  EventMarketDirection,
  EventMarketImpactLevel,
} from './components/event/types.ts'

import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import scenarioWorkbenchEventService, {
  SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event.ts'
import { IPaginationResponse } from '@/types/api.ts'

/** 이벤트 상세 탭 키 */
export type EventDetailTabKey = 'impact' | 'ai' | 'records' | 'outlook' | 'fundamental' | 'driverTree' | 'related'

/** 이벤트 상세 탭 라벨 정의 */
const EVENT_DETAIL_TABS: { key: EventDetailTabKey; label: string }[] = [
  { key: 'impact', label: '영향도 분석' },
  { key: 'ai', label: 'AI Insights' },
  { key: 'records', label: 'MI Records' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'fundamental', label: 'Fundamental Deep-dive' },
  { key: 'driverTree', label: 'Driver Tree Scoreboard' },
  { key: 'related', label: '관련 이벤트 및 시나리오' },
]

/** 이벤트 상세에서 라우트 state로 넘어오는 값 타입 */
interface ScenarioWorkbenchEventDetailLocationState {
  eventName?: string
}

const SECTION_SCROLL_IDS: Record<EventDetailTabKey, string> = {
  impact: 'event-detail-section-impact',
  ai: 'event-detail-section-ai',
  records: 'event-detail-section-records',
  outlook: 'event-detail-section-outlook',
  fundamental: 'event-detail-section-fundamental',
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

const IMPACT_LEVEL_TO_UI: Record<ScenarioWorkbenchImpactLevel, EventMarketImpactLevel> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
}

const PRICE_TO_UI: Record<ScenarioWorkbenchPriceDirection, EventMarketDirection> = {
  UP: '상승',
  DOWN: '하락',
  FLAT: '보합',
  NONE: '보합',
}

/** Figma node 2128:31396 — 시나리오 워크벤치 이벤트 상세 (Canvas) */
const ScenarioWorkbenchEventDetailPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ScenarioWorkbenchEventDetailLocationState | null

  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })
  const { setStickyHeader } = useStickyHeader()

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

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
    const fromApi = detail?.title?.trim()
    if (fromApi) return fromApi
    return eventId ? `이벤트 ${eventId}` : '이벤트'
  }, [detail?.title, eventId, state?.eventName])

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
    const lv1 = ia.categoryLv1
    const categoryContent = lv1 ? (SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[lv1] ?? lv1) : a.content
    const categoryDesc = ia.categoryLv2 ? ia.categoryLv2.replace(/_/g, ' ') : a.description
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
      marketImpact: IMPACT_LEVEL_TO_UI[row.impactLevel] ?? 0,
      direction: PRICE_TO_UI[row.priceDirection] ?? '보합',
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

  const fundamentalMetricRows = useMemo((): EventDetailFundamentalMetricRow[] => {
    const metrics = detail?.fundamentalDeepdive?.metrics ?? []
    const prefix = detail?.eventId ?? eventId ?? 'evt'
    return metrics.map((m, i) => ({
      id: `${prefix}-fm-${i}`,
      item: m.metricName,
      currentValue: m.currentValue,
      criteria: m.interpretation,
      source: m.source,
    }))
  }, [detail?.eventId, detail?.fundamentalDeepdive?.metrics, eventId])

  const fundamentalIndicatorRows = useMemo((): EventDetailFundamentalIndicatorRow[] => {
    const indicators = detail?.fundamentalDeepdive?.indicators ?? []
    const prefix = detail?.eventId ?? eventId ?? 'evt'
    return indicators.map((m, i) => ({
      id: `${prefix}-fi-${i}`,
      indicator: m.indicatorName,
      currentValue: m.currentValue,
      implication: m.implication,
      source: m.source,
    }))
  }, [detail?.eventId, detail?.fundamentalDeepdive?.indicators, eventId])

  /** Driver Tree Scoreboard — API 연동 전까지 퍼블리싱용 목 데이터 */
  const driverTreeRows = useMemo((): EventDetailDriverTreeRow[] => {
    const prefix = detail?.eventId ?? eventId ?? 'evt'
    return [
      {
        id: `${prefix}-dt-1`,
        category: '공급',
        driver: '가스 생산 capa/가동률',
        strengthLevel: 3,
        strengthDirection: '상승',
        rationale: 'Ras Laffan 등 중동 공급 차질 리스크 반영',
      },
      {
        id: `${prefix}-dt-2`,
        category: '공급',
        driver: 'Liquefaction/Spot',
        strengthLevel: 2,
        strengthDirection: '상승',
        rationale: '현물 cargo 경쟁 심화 가능',
      },
      {
        id: `${prefix}-dt-3`,
        category: '수요',
        driver: '발전/산업 수요',
        strengthLevel: 1,
        strengthDirection: '보합',
        rationale: '단기 수요는 계절·정책 영향이 더 큼',
      },
      {
        id: `${prefix}-dt-4`,
        category: '물류',
        driver: '항로/보험료',
        strengthLevel: 2,
        strengthDirection: '상승',
        rationale: '호르무즈 리스크로 비용·리드타임 증가',
      },
      {
        id: `${prefix}-dt-5`,
        category: '정책',
        driver: '전략비축/긴급조치',
        strengthLevel: 0,
        strengthDirection: '보합',
        rationale: '현재 시점에 즉각 조치 시그널 제한적',
      },
    ]
  }, [detail?.eventId, eventId])

  // /** 관련 이벤트 — 워크벤치 Events 탭 목 데이터를 일부 재사용 (추후 API 연동 예정) */
  // const relatedEventRows = useMemo(() => {
  //   if (detailLoading) return []
  //   return SCENARIO_WORKBENCH_EVENT_MOCK_ROWS.slice(0, 5)
  // }, [detailLoading])

  // /** 관련 시나리오 — 퍼블리싱용 목 데이터 */
  // const relatedScenarioRows = useMemo((): EventDetailRelatedScenarioRow[] => {
  //   if (detailLoading) return []
  //   const prefix = detail?.eventId ?? eventId ?? 'evt'
  //   return [
  //     {
  //       id: `${prefix}-sc-1`,
  //       scenarioName: '1~2주 내 협상 완료 상황 해소',
  //       jkmImpact: 1,
  //       ttfImpact: 1,
  //       hhImpact: 0,
  //       probabilityLevel: 4,
  //     },
  //     {
  //       id: `${prefix}-sc-2`,
  //       scenarioName: '수주 내 호르무즈 정상화',
  //       jkmImpact: 2,
  //       ttfImpact: 1,
  //       hhImpact: 1,
  //       probabilityLevel: 3,
  //     },
  //     {
  //       id: `${prefix}-sc-3`,
  //       scenarioName: '호르무즈 봉쇄 3개월+ 유지',
  //       jkmImpact: 3,
  //       ttfImpact: 2,
  //       hhImpact: 1,
  //       probabilityLevel: 2,
  //     },
  //     {
  //       id: `${prefix}-sc-4`,
  //       scenarioName: '걸프 LNG 인프라 타격, 복구',
  //       jkmImpact: 3,
  //       ttfImpact: 3,
  //       hhImpact: 2,
  //       probabilityLevel: 1,
  //     },
  //   ]
  // }, [detail?.eventId, detailLoading, eventId])

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

  useLayoutEffect(() => {
    publishEventDetailHeaderContent({
      backLabel: 'Event',
      onBack: () => navigate('/mi/scenario-workbench'),
      titleSlot: (
        <Stack width="100%">
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#212529' }}>Event</Typography>
          <Typography fontSize={26} fontWeight={600} color="contentText.Black" lineHeight={1.4} sx={{ wordBreak: 'break-word' }}>
            {title}
          </Typography>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mt={1}>
            <Stack direction="row" alignItems="center" gap={0.75} px={1} py={0.5} borderRadius="999px">
              <Typography fontSize={12} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                생성일시
              </Typography>
              <Typography fontSize={14} fontWeight={500} color="contentText.Black" lineHeight={1.4}>
                {generatedAtLabel}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.75} px={1} py={0.5} borderRadius="999px">
              <Typography fontSize={12} fontWeight={600} color="contentText.Normal" lineHeight={1.4}>
                업데이트
              </Typography>
              <Typography fontSize={14} fontWeight={500} color="contentText.Black" lineHeight={1.4}>
                {updatedAtLabel}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      ),
    })
  }, [generatedAtLabel, navigate, title, updatedAtLabel])

  useLayoutEffect(() => {
    setStickyHeader(<EventDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })
    return () => {
      setStickyHeader(null)
      eventDetailHeaderContent = null
    }
  }, [setStickyHeader])

  return (
    <Box boxSizing="border-box" maxWidth={1404} width="100%" margin="auto" paddingX={7.5}>
      <Box
        bgcolor="common.white"
        borderRadius="10px"
        px={1.5}
        pb={12.5}
        pt={0}
        display="flex"
        flexDirection="column"
        gap={1.5}
        boxSizing="border-box"
      >
        <MISkeleton variant="table" rows={14} columns={4} loading={detailLoading && !detail}>
          {detailError && (
            <Typography px={2} py={1} color="error.main" variant="body2">
              이벤트 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </Typography>
          )}
          <Stack py={3} gap={1.5} width="100%" alignItems="flex-start">
            <EventDetailImpactAnalysisSection tableRows={impactTableRows} kpiItems={impactKpiPair} narrative={impactNarrative} />
            <EventDetailAiInsightsSection bullets={aiBullets} detailParagraph={aiDetailParagraph} />
            <EventDetailMiRecordsTable
              rows={recordRows}
              serverPagination={recordsServerPagination}
              onServerPageChange={(page) => setRecordsPagination((p) => ({ ...p, page }))}
              onServerSizeChange={(size) => setRecordsPagination({ size, page: 1 })}
              loading={recordsLoading}
            />
            <EventDetailInstitutionalOutlookTable
              rows={outlookRows}
              serverPagination={outlooksServerPagination}
              onServerPageChange={(page) => setOutlooksPagination((p) => ({ ...p, page }))}
              onServerSizeChange={(size) => setOutlooksPagination({ size, page: 1 })}
              loading={outlooksLoading}
            />
            <EventDetailFundamentalSection metricRows={fundamentalMetricRows} indicatorRows={fundamentalIndicatorRows} />
            <EventDetailDriverTreeScoreboardSection rows={driverTreeRows} />
            {/*
            <EventDetailRelatedEventsAndScenariosSection
              relatedEvents={relatedEventRows}
              relatedScenarios={relatedScenarioRows}
              onEventDetailClick={(id) => {
                const found = relatedEventRows.find((r) => r.id === id)
                navigate(`/mi/scenario-workbench/events/${id}`, {
                  state: found ? { eventName: found.eventName } : undefined,
                })
              }}
              onScenarioDetailClick={(id) => navigate(`/mi/scenario-workbench/scenarios/${id}`)}
            />
            */}
          </Stack>
        </MISkeleton>
      </Box>
    </Box>
  )
}

export default ScenarioWorkbenchEventDetailPage
