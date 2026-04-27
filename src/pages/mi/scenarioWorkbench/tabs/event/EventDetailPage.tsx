import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import EventDetailAiInsightsSection from '../../components/event/EventDetailAiInsightsSection'
import EventDetailFundamentalSection from '../../components/event/EventDetailFundamentalSection'
import EventDetailImpactAnalysisSection from '../../components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '../../components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '../../components/event/EventDetailMiRecordsTable'
import EventDetailStickyHeader, { type EventDetailTabKey } from '../../components/event/EventDetailStickyHeader'

import type {
  EventDetailFundamentalIndicatorRow,
  EventDetailFundamentalMetricRow,
  EventDetailImpactKpiItem,
  EventDetailImpactTableRow,
  EventDetailMiRecordRow,
  EventDetailOutlookRow,
  EventMarketDirection,
  EventMarketImpactLevel,
} from '../../components/event/types'

import MISkeleton from '@/components/mi/MISkeleton'
import scenarioWorkbenchEventService, {
  SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event'
import { IPaginationResponse } from '@/types/api'

interface ScenarioWorkbenchEventDetailLocationState {
  eventName?: string
}

const SECTION_SCROLL_IDS: Record<EventDetailTabKey, string> = {
  impact: 'event-detail-section-impact',
  ai: 'event-detail-section-ai',
  records: 'event-detail-section-records',
  outlook: 'event-detail-section-outlook',
  fundamental: 'event-detail-section-fundamental',
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

const TypographyNav = ({ onBack }: { onBack: () => void }) => (
  <Box component="nav" sx={{ pb: 2 }}>
    <Box
      component="button"
      type="button"
      onClick={onBack}
      sx={{
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        color: 'contentText.Normal',
        fontFamily: 'inherit',
        lineHeight: 1.4,
      }}
    >
      Scenario Workbench
    </Box>
  </Box>
)

/** Figma node 2128:31396 — 시나리오 워크벤치 이벤트 상세 (Canvas) */
const ScenarioWorkbenchEventDetailPage = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as ScenarioWorkbenchEventDetailLocationState | null

  const [activeTab, setActiveTab] = useState<EventDetailTabKey>('impact')
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })

  const { data: detail, isLoading: detailLoading, isError: detailError } = useQuery({
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
    const categoryContent = lv1 ? SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO[lv1] ?? lv1 : a.content
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

  const handleTabChange = useCallback((tab: EventDetailTabKey) => {
    setActiveTab(tab)
    const el = document.getElementById(SECTION_SCROLL_IDS[tab])
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <Box paddingTop="56px" paddingBottom="30px" bgcolor="gray.5">
      <Box boxSizing="border-box" maxWidth={1404} width="100%" margin="auto" paddingX={7.5}>
        <TypographyNav onBack={() => navigate('/mi/scenario-workbench')} />
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
          <EventDetailStickyHeader
            title={title}
            generatedAtLabel={generatedAtLabel}
            updatedAtLabel={updatedAtLabel}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <MISkeleton variant="table" rows={14} columns={4} loading={detailLoading && !detail}>
            {detailError && (
              <Typography px={2} py={1} color="error.main" variant="body2">
                이벤트 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </Typography>
            )}
            <Stack py={3} gap={1.5} width="100%" alignItems="flex-start">
              <EventDetailImpactAnalysisSection
                tableRows={impactTableRows}
                kpiItems={impactKpiPair}
                narrative={impactNarrative}
              />
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
            </Stack>
          </MISkeleton>
        </Box>
      </Box>
    </Box>
  )
}

export default ScenarioWorkbenchEventDetailPage
