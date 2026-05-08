import { EventNote, MonitorHeart, Notes, Summarize, Timeline } from '@mui/icons-material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TokenIcon from '@mui/icons-material/Token'
import { Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { type ReactNode, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import RelatedEventsAndScenariosSection from '@/pages/mi/scenarioWorkbench/components/common/RelatedEventsAndScenariosSection'
import ScenarioWorkbenchDetailHeader, {
  WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type WorkbenchDetailHeaderSection,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioWorkbenchDetailHeader'
import ScenarioKeyPredictionsSection from '@/pages/mi/scenarioWorkbench/components/scenario/ScenarioKeyPredictionsSection'
import ScenarioSummarySection from '@/pages/mi/scenarioWorkbench/components/scenario/ScenarioSummarySection'
import SignpostDefinitionSection from '@/pages/mi/scenarioWorkbench/components/scenario/SignpostDefinitionSection'
import SignpostMonitoringSection from '@/pages/mi/scenarioWorkbench/components/scenario/SignpostMonitoringSection'
import { getScenarioWorkbenchTabPath, SCENARIO_WORKBENCH_BASE_PATH } from '@/pages/mi/scenarioWorkbench/scenarioWorkbenchRoutes'
import scenarioWorkbenchScenarioService, { IRelatedEvent, IRelatedScenario } from '@/service/mi/scenarioWorkbench/scenario'

type ScenarioDetailSection = WorkbenchDetailHeaderSection & {
  Icon: typeof Summarize
}

const SCENARIO_DETAIL_SECTIONS: ScenarioDetailSection[] = [
  { id: 'scenario-detail-section-summary', label: '시나리오 요약', Icon: Summarize },
  { id: 'scenario-detail-section-key-predictions', label: '시나리오 주요 가정', Icon: Timeline },
  { id: 'scenario-detail-section-signpost-definition', label: 'Signpost 정의', Icon: Notes },
  { id: 'scenario-detail-section-signpost', label: 'Signpost 모니터링 현황', Icon: MonitorHeart },
  { id: 'scenario-detail-section-related', label: '관련 이벤트 및 시나리오', Icon: EventNote },
]

const SectionHeading = ({ sectionId }: { sectionId: WorkbenchDetailHeaderSection['id'] }) => {
  const section = SCENARIO_DETAIL_SECTIONS.find((item) => item.id === sectionId)
  if (!section) return null
  const { Icon } = section

  return (
    <Stack direction="row" alignItems="center" gap="8px">
      <Icon sx={{ fontSize: 30, color: 'contentText.Black' }} />
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: 'contentText.Black' }}>{section.label}</Typography>
      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'contentText.Normal' }} />
    </Stack>
  )
}

interface ScenarioDetailHeaderContent {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
}

let scenarioDetailHeaderContent: ScenarioDetailHeaderContent | null = null
const scenarioDetailHeaderListeners = new Set<() => void>()

const subscribeScenarioDetailHeaderContent = (listener: () => void) => {
  scenarioDetailHeaderListeners.add(listener)
  return () => scenarioDetailHeaderListeners.delete(listener)
}

const getScenarioDetailHeaderContentSnapshot = () => scenarioDetailHeaderContent

const publishScenarioDetailHeaderContent = (next: ScenarioDetailHeaderContent) => {
  scenarioDetailHeaderContent = next
  scenarioDetailHeaderListeners.forEach((l) => l())
}

/** `setStickyHeader` 한 번만 호출하고 콘텐츠 변경 시 이 컴포넌트만 리렌더 — 스크롤·스파이 시 본문 패딩 흔들림 방지 */
const ScenarioDetailHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioDetailHeaderContent,
    getScenarioDetailHeaderContentSnapshot,
    getScenarioDetailHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <ScenarioWorkbenchDetailHeader
      sections={SCENARIO_DETAIL_SECTIONS.map(({ id, label }) => ({ id, label }))}
      backLabel={content.backLabel}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      rightAction={content.rightAction}
    />
  )
}

const ScenarioDetailPage = () => {
  const navigate = useNavigate()
  const { setStickyHeader } = useStickyHeader()
  const { scenarioId } = useParams<{ scenarioId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['scenarioWorkbenchScenarioDetail', scenarioId],
    queryFn: () => scenarioWorkbenchScenarioService.getScenarioDetail(scenarioId ?? ''),
    enabled: Boolean(scenarioId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const scenarioName = useMemo(() => data?.scenarioName ?? '', [data?.scenarioName])
  const tags = useMemo(() => data?.tags ?? [], [data?.tags])

  const handleEventDetailClick = (row: IRelatedEvent) => {
    navigate(`${SCENARIO_WORKBENCH_BASE_PATH}/events/${encodeURIComponent(String(row.eventId))}`, {
      state: { eventName: row.eventName },
    })
  }
  const handleScenarioDetailClick = (row: IRelatedScenario) => {
    navigate(`${SCENARIO_WORKBENCH_BASE_PATH}/scenarios/${encodeURIComponent(String(row.scenarioId))}`)
  }

  useLayoutEffect(() => {
    publishScenarioDetailHeaderContent({
      backLabel: 'Scenarios',
      onBack: () => navigate(getScenarioWorkbenchTabPath('scenarios')),
      titleSlot: (
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
          <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
            <Typography variant="body1B16" color="contentText.Black">
              Scenario
            </Typography>
            <Typography variant="titleLarge" fontSize="26px" fontWeight={600} display="block" sx={{ lineHeight: 1.4 }}>
              {scenarioName}
            </Typography>
            {tags.length > 0 && (
              <Stack direction="row" gap="8px" flexWrap="wrap">
                {tags.map((tag) => (
                  <MIChip
                    key={tag}
                    label={tag}
                    fontType="body2M14"
                    sx={{ height: '28px', padding: '4px 8px', backgroundColor: '#E9ECEF', color: '#212529', borderRadius: '100px' }}
                    disableHover
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      ),
      rightAction: (
        <MIBaseButton
          variant="contained"
          prefix={<TokenIcon sx={{ fontSize: 20 }} />}
          disableRipple
          sx={{
            height: '36px',
            position: 'relative',
            zIndex: 3,
          }}
        >
          모델 시뮬레이션
        </MIBaseButton>
      ),
    })
  }, [scenarioName, tags, navigate])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: WORKBENCH_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })
    return () => {
      setStickyHeader(null)
      scenarioDetailHeaderContent = null
    }
  }, [setStickyHeader])

  const relatedEvents: IRelatedEvent[] = data?.relatedEventScenario?.event ? [data.relatedEventScenario.event] : []
  const relatedScenarios: IRelatedScenario[] = data?.relatedEventScenario?.scenarios ?? []

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="12px" position="relative" sx={{ userSelect: 'none', overflowX: 'hidden' }}>
      <Stack py="24px" gap="12px">
        <Stack id={SCENARIO_DETAIL_SECTIONS[0].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[0].id} />
          <ScenarioSummarySection summary={data?.summary} loading={isLoading} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[1].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[1].id} />
          <ScenarioKeyPredictionsSection assumptions={data?.assumptions ?? []} loading={isLoading} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[2].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[2].id} />
          <SignpostDefinitionSection definitions={data?.signpostDefinitions ?? []} loading={isLoading} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[3].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[3].id} />
          <SignpostMonitoringSection signposts={data?.signposts ?? []} loading={isLoading} />
        </Stack>
        <Stack id={SCENARIO_DETAIL_SECTIONS[4].id} gap="12px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[4].id} />
          <RelatedEventsAndScenariosSection
            events={relatedEvents}
            scenarios={relatedScenarios}
            onEventRowClick={handleEventDetailClick}
            onScenarioRowClick={handleScenarioDetailClick}
            loading={isLoading}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}

export default ScenarioDetailPage
