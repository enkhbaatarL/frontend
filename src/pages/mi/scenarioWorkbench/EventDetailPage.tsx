import { ArrowBack } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import EventDetailAiInsightsSection from './components/event/EventDetailAiInsightsSection.tsx'
import EventDetailFundamentalSection from './components/event/EventDetailFundamentalSection.tsx'
import EventDetailImpactAnalysisSection from './components/event/EventDetailImpactAnalysisSection.tsx'
import EventDetailInstitutionalOutlookTable from './components/event/EventDetailInstitutionalOutlookTable.tsx'
import EventDetailMiRecordsTable from './components/event/EventDetailMiRecordsTable.tsx'

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
import scenarioWorkbenchEventService, {
  SCENARIO_WORKBENCH_EVENT_CATEGORY_LV1_KO,
  type ScenarioWorkbenchImpactLevel,
  type ScenarioWorkbenchPriceDirection,
} from '@/service/mi/scenarioWorkbench/event.ts'
import { IPaginationResponse } from '@/types/api.ts'

const STICKY_TOP_WHEN_SCROLLED = -14

/** 이벤트 상세 탭 키 */
export type EventDetailTabKey = 'impact' | 'ai' | 'records' | 'outlook' | 'fundamental'

/** 이벤트 상세 탭 라벨 정의 */
const EVENT_DETAIL_TABS: { key: EventDetailTabKey; label: string }[] = [
  { key: 'impact', label: '영향도 분석' },
  { key: 'ai', label: 'AI Insights' },
  { key: 'records', label: 'MI Records' },
  { key: 'outlook', label: '기관 전망' },
  { key: 'fundamental', label: 'Fundamental Deep-dive' },
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

  const [activeTab, setActiveTab] = useState<EventDetailTabKey>('impact')
  const [recordsPagination, setRecordsPagination] = useState({ page: 1, size: 10 })
  const [outlooksPagination, setOutlooksPagination] = useState({ page: 1, size: 10 })
  const [isScrolled, setIsScrolled] = useState(false)
  const stickyHeaderWrapperRef = useRef<HTMLDivElement | null>(null)
  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  /** 상단으로 smooth 스냅 중에는 scrollTop > 0이어도 헤더/탭을 펼친 상태로 유지 */
  const expandHeaderDuringSnapRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (scrollEl) scrollEl.scrollTop = 0
  }, [])

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    let scrollStartTop = scrollEl.scrollTop
    lastScrollTopRef.current = scrollEl.scrollTop

    const handleScrollImmediate = () => {
      const t = scrollEl.scrollTop
      const prev = lastScrollTopRef.current
      if (expandHeaderDuringSnapRef.current && t > prev + 2) {
        expandHeaderDuringSnapRef.current = false
      }
      lastScrollTopRef.current = t

      if (t === 0) {
        expandHeaderDuringSnapRef.current = false
        setIsScrolled(false)
        return
      }
      if (!expandHeaderDuringSnapRef.current) {
        setIsScrolled(true)
      }
    }

    const handleScrollDebounced = debounce(() => {
      const currentScrollTop = scrollEl.scrollTop
      const isScrollingUp = currentScrollTop < scrollStartTop
      const isScrollingDown = currentScrollTop > scrollStartTop
      const contentEl = contentWrapperRef.current
      const stickyEl = stickyHeaderWrapperRef.current

      if (contentEl && stickyEl) {
        const containerRect = scrollEl.getBoundingClientRect()
        const contentRect = contentEl.getBoundingClientRect()
        const stickyHeight = stickyEl.getBoundingClientRect().height
        const stickyBottomWhenStuck = stickyHeight + STICKY_TOP_WHEN_SCROLLED
        const firstContentTop = scrollEl.scrollTop + contentRect.top - containerRect.top - stickyBottomWhenStuck

        if (isScrollingDown && currentScrollTop < firstContentTop) {
          scrollEl.scrollTo({ top: firstContentTop, behavior: 'smooth' })
        } else if (isScrollingUp && currentScrollTop + 1 < firstContentTop && currentScrollTop > 0) {
          expandHeaderDuringSnapRef.current = true
          setIsScrolled(false)
          scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }

      scrollStartTop = scrollEl.scrollTop
    }, 150)

    const handleScroll = () => {
      handleScrollImmediate()
      handleScrollDebounced()
    }

    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
      handleScrollDebounced.cancel()
    }
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

  /** sticky 헤더 높이를 반영해 섹션 앵커로 스크롤 */
  const handleTabChange = useCallback(
    (tab: EventDetailTabKey) => {
      setActiveTab(tab)
      const sectionEl = document.getElementById(SECTION_SCROLL_IDS[tab])
      if (!sectionEl) return

      const scrollEl = document.getElementById('main-scroll-wrapper')
      const stickyHeight = stickyHeaderWrapperRef.current?.getBoundingClientRect().height ?? 0
      const stickyOffset = stickyHeight + (isScrolled ? STICKY_TOP_WHEN_SCROLLED : 0)

      if (scrollEl) {
        const containerRect = scrollEl.getBoundingClientRect()
        const elRect = sectionEl.getBoundingClientRect()
        const targetTop = scrollEl.scrollTop + elRect.top - containerRect.top - stickyOffset
        scrollEl.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
        return
      }

      const scrollingElement = document.scrollingElement as HTMLElement | null
      if (!scrollingElement) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      const elRect = sectionEl.getBoundingClientRect()
      const targetTop = scrollingElement.scrollTop + elRect.top - stickyOffset
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    },
    [isScrolled],
  )

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
        <Box>
          <Button
            variant="contained"
            startIcon={<ArrowBack sx={{ fontSize: 20, color: '#343A40' }} />}
            sx={{
              height: '36px',
              fontSize: 14,
              fontWeight: 600,
              color: '#495057',
              bgcolor: '#FFFFFF',
              border: '1px solid #DEE2E6',
              borderRadius: '10px',
              padding: '8px',
              textTransform: 'none',
              marginTop: '8px',
              marginBottom: '8px',
            }}
            onClick={() => navigate('/mi/scenario-workbench')}
          >
            Event
          </Button>
        </Box>

        <Box
          ref={stickyHeaderWrapperRef}
          position="sticky"
          top={isScrolled ? `${STICKY_TOP_WHEN_SCROLLED}px` : 0}
          left="0"
          bgcolor="commonColor.White"
          zIndex={200}
          sx={{ userSelect: 'none' }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap="4px"
            position="absolute"
            top="12px"
            left="0"
            sx={{
              transform: `translateY(${isScrolled ? -6 : 0}px)`,
              opacity: isScrolled ? 0 : 1,
              transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
              transitionDelay: isScrolled ? '0s' : '0.2s',
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#212529' }}>Event</Typography>
          </Stack>

          <Box
            position="absolute"
            top="32px"
            left="0"
            right={0}
            sx={{
              transform: `translateY(${isScrolled ? -6 : 0}px)`,
              opacity: isScrolled ? 0 : 1,
              transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
              transitionDelay: isScrolled ? '0s' : '0.2s',
            }}
          >
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
          </Box>

          <Box mt="116px">
            <Stack width="100%" borderBottom="1px solid" borderColor="contentBorder.Normal" alignItems="stretch">
              <Stack direction="row" alignItems="flex-end" flex={1} minWidth={0}>
                {EVENT_DETAIL_TABS.map((tab) => {
                  const isActive = activeTab === tab.key
                  return (
                    <Box
                      key={tab.key}
                      component="button"
                      type="button"
                      onClick={() => handleTabChange(tab.key)}
                      sx={{
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        minHeight: 62,
                        px: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        borderBottom: isActive ? '2px solid' : '2px solid transparent',
                        borderBottomColor: isActive ? 'common.black' : 'transparent',
                        mb: '-1px',
                      }}
                    >
                      <Typography
                        fontSize={16}
                        fontWeight={isActive ? 700 : 600}
                        color="contentText.Black"
                        lineHeight={1.4}
                        whiteSpace="nowrap"
                      >
                        {tab.label}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            </Stack>
          </Box>
        </Box>
        <MISkeleton variant="table" rows={14} columns={4} loading={detailLoading && !detail}>
          {detailError && (
            <Typography px={2} py={1} color="error.main" variant="body2">
              이벤트 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </Typography>
          )}
          <Stack ref={contentWrapperRef} py={3} gap={1.5} width="100%" alignItems="flex-start">
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
          </Stack>
        </MISkeleton>
      </Box>
    </Box>
  )
}

export default ScenarioWorkbenchEventDetailPage
