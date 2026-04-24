import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import EventDetailAiInsightsSection from '../../components/event/EventDetailAiInsightsSection'
import EventDetailFundamentalSection from '../../components/event/EventDetailFundamentalSection'
import EventDetailImpactAnalysisSection from '../../components/event/EventDetailImpactAnalysisSection'
import EventDetailInstitutionalOutlookTable from '../../components/event/EventDetailInstitutionalOutlookTable'
import EventDetailMiRecordsTable from '../../components/event/EventDetailMiRecordsTable'
import {
  EVENT_DETAIL_AI_DETAIL_PARAGRAPH,
  EVENT_DETAIL_AI_SUMMARY_BULLETS,
  EVENT_DETAIL_FUNDAMENTAL_INDICATORS,
  EVENT_DETAIL_FUNDAMENTAL_METRICS,
  EVENT_DETAIL_IMPACT_NARRATIVE,
  EVENT_DETAIL_IMPACT_TABLE_ROWS,
  EVENT_DETAIL_MI_RECORD_ROWS,
  EVENT_DETAIL_OUTLOOK_ROWS,
} from '../../components/event/eventDetailPageMockData'
import EventDetailStickyHeader, { type EventDetailTabKey } from '../../components/event/EventDetailStickyHeader'
import { SCENARIO_WORKBENCH_EVENT_MOCK_ROWS } from '../../components/event/eventMockData'

import type { EventDetailImpactKpiItem } from '../../components/event/types'

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

  const eventRow = useMemo(
    () => SCENARIO_WORKBENCH_EVENT_MOCK_ROWS.find((row) => row.id === eventId),
    [eventId],
  )

  const title = state?.eventName?.trim() || eventRow?.eventName || `이벤트 ${eventId ?? ''}`

  const impactKpiPair = useMemo((): [EventDetailImpactKpiItem, EventDetailImpactKpiItem] => {
    const [a, b] = DEFAULT_IMPACT_KPI_PAIR
    return [
      { ...a, content: eventRow?.category?.trim() ? eventRow.category : a.content },
      b,
    ]
  }, [eventRow?.category])

  const { generatedAtLabel, updatedAtLabel } = useMemo(() => {
    const parseOccurred = (label: string) => {
      const [datePart, timePart = '09:00'] = label.split(' ')
      const [mm, dd] = (datePart ?? '').split('-').map((v) => parseInt(v, 10))
      if (!mm || !dd) return dayjs('2026-03-01 09:00')
      return dayjs()
        .year(2026)
        .month(mm - 1)
        .date(dd)
        .hour(parseInt(timePart.split(':')[0] ?? '9', 10))
        .minute(parseInt(timePart.split(':')[1] ?? '0', 10))
    }
    const base = eventRow?.occurredAtLabel ? parseOccurred(eventRow.occurredAtLabel) : dayjs('2026-03-01 09:00')
    return {
      generatedAtLabel: base.format('YYYY-MM-DD HH:mm'),
      updatedAtLabel: base.add(30, 'minute').format('YYYY-MM-DD HH:mm'),
    }
  }, [eventRow?.occurredAtLabel])

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
          <Stack py={3} gap={1.5} width="100%" alignItems="flex-start">
            <EventDetailImpactAnalysisSection
              tableRows={EVENT_DETAIL_IMPACT_TABLE_ROWS}
              kpiItems={impactKpiPair}
              narrative={EVENT_DETAIL_IMPACT_NARRATIVE}
            />
            <EventDetailAiInsightsSection bullets={EVENT_DETAIL_AI_SUMMARY_BULLETS} detailParagraph={EVENT_DETAIL_AI_DETAIL_PARAGRAPH} />
            <EventDetailMiRecordsTable rows={EVENT_DETAIL_MI_RECORD_ROWS} />
            <EventDetailInstitutionalOutlookTable rows={EVENT_DETAIL_OUTLOOK_ROWS} />
            <EventDetailFundamentalSection
              metricRows={EVENT_DETAIL_FUNDAMENTAL_METRICS}
              indicatorRows={EVENT_DETAIL_FUNDAMENTAL_INDICATORS}
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

export default ScenarioWorkbenchEventDetailPage
