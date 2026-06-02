import { EventNote, MonitorHeart, Notes, Summarize, Timeline } from '@mui/icons-material'
import TokenIcon from '@mui/icons-material/Token'
import { Box, Skeleton, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIChip from '@/components/common/chip/MIChip'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type NextGenMIDetailHeaderSection,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import RelatedEventsAndScenariosSection from '@/pages/mi/nextGenMI/components/common/RelatedEventsAndScenariosSection'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import ScenarioKeyPredictionsSection from '@/pages/mi/nextGenMI/components/scenario/ScenarioKeyPredictionsSection'
import ScenarioModelExecutionPopupContent from '@/pages/mi/nextGenMI/components/scenario/ScenarioModelExecutionPopupContent'
import ScenarioSummarySection from '@/pages/mi/nextGenMI/components/scenario/ScenarioSummarySection'
import SignpostDefinitionSection from '@/pages/mi/nextGenMI/components/scenario/SignpostDefinitionSection'
import SignpostMonitoringSection from '@/pages/mi/nextGenMI/components/scenario/SignpostMonitoringSection'
import { getNextGenMITabPath, NEXT_GEN_MI_BASE_PATH } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { scrollNextGenMILayoutToTop } from '@/pages/mi/nextGenMI/nextGenMIScroll'
import nextGenMIScenarioService, {
  type IModelExecutionAcceptRes,
  type IModelExecutionStatusRes,
  type IModelExecutionSubmitReq,
  IRelatedEvent,
  IRelatedScenario,
} from '@/service/mi/nextGenMI/scenario'

type ScenarioDetailSection = NextGenMIDetailHeaderSection & {
  Icon: typeof Summarize
}

const SCENARIO_DETAIL_SECTIONS: ScenarioDetailSection[] = [
  { id: 'scenario-detail-section-summary', label: '시나리오 요약', Icon: Summarize },
  { id: 'scenario-detail-section-key-predictions', label: '시나리오 주요 가정', Icon: Timeline },
  { id: 'scenario-detail-section-signpost-definition', label: 'Signpost 정의', Icon: Notes },
  { id: 'scenario-detail-section-signpost', label: '상세 내역 (Signpost 매칭 근거)', Icon: MonitorHeart },
  { id: 'scenario-detail-section-related', label: '관련 이벤트 및 시나리오', Icon: EventNote },
]

const SectionHeading = ({ sectionId }: { sectionId: NextGenMIDetailHeaderSection['id'] }) => {
  const section = SCENARIO_DETAIL_SECTIONS.find((item) => item.id === sectionId)
  if (!section) return null
  const { Icon } = section

  return (
    <Stack direction="row" alignItems="center" gap="8px">
      <Icon sx={{ fontSize: 30, color: 'contentText.Black' }} />
      <Typography fontSize={20} fontWeight={600} color="contentText.Black">
        {section.label}
      </Typography>
      <InfoTooltip title="" iconSize={16} iconColor="contentText.Normal" />
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

const normalizeModelExecutionStatus = (status?: string | null) => status?.toLowerCase()

const isModelExecutionGeneratingStatus = (status?: string | null) => {
  const normalized = normalizeModelExecutionStatus(status)
  return normalized === 'queued' || normalized === 'running'
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
    <NextGenMIDetailHeader
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
  const location = useLocation()
  const queryClient = useQueryClient()
  const { setStickyHeader } = useStickyHeader()
  const { showSnackbar } = useSnackbar()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const modelExecutionPopupRef = useRef<MIMorphingPopupRef>(null)
  const handledModelExecutionIdsRef = useRef<Set<string>>(new Set())
  const [hasOpenedModelExecutionPopup, setHasOpenedModelExecutionPopup] = useState(false)
  const [modelExecution, setModelExecution] = useState<IModelExecutionAcceptRes | IModelExecutionStatusRes | null>(null)

  const {
    data,
    isLoading,
    refetch: refetchScenarioDetail,
  } = useQuery({
    queryKey: ['nextGenMIScenarioDetail', scenarioId],
    queryFn: () => nextGenMIScenarioService.getScenarioDetail(scenarioId ?? ''),
    enabled: Boolean(scenarioId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const { mutateAsync: submitModelExecution, isPending: isSubmitModelExecutionPending } = useMutation({
    mutationFn: ({ targetScenarioId, payload }: { targetScenarioId: string; payload: IModelExecutionSubmitReq }) =>
      nextGenMIScenarioService.submitModelExecution(targetScenarioId, payload),
    onError: () => {
      showSnackbar('MI 수급모델 실행 요청에 실패했습니다.', { variant: 'error' })
    },
  })

  const activeModelExecutionId = modelExecution?.executionId
  const shouldPollModelExecution = Boolean(scenarioId && activeModelExecutionId) && isModelExecutionGeneratingStatus(modelExecution?.status)

  const { data: modelExecutionStatus } = useQuery({
    queryKey: ['nextGenMIScenarioModelExecutionStatus', scenarioId, activeModelExecutionId],
    queryFn: () => nextGenMIScenarioService.getModelExecutionStatus(scenarioId ?? '', activeModelExecutionId ?? ''),
    enabled: shouldPollModelExecution,
    refetchInterval: shouldPollModelExecution ? 3000 : false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (!modelExecutionStatus) return

    setModelExecution(modelExecutionStatus)

    const normalized = normalizeModelExecutionStatus(modelExecutionStatus.status)
    if (normalized !== 'succeeded' && normalized !== 'failed') return

    const executionId = modelExecutionStatus.executionId
    if (handledModelExecutionIdsRef.current.has(executionId)) return
    handledModelExecutionIdsRef.current.add(executionId)

    if (normalized === 'succeeded') {
      showSnackbar('MI 수급모델 결과 생성이 완료되었습니다.', { variant: 'success' })
      void refetchScenarioDetail()
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioDetail', scenarioId] })
      return
    }

    showSnackbar(modelExecutionStatus.errorMessage || 'MI 수급모델 결과 생성에 실패했습니다.', { variant: 'error' })
    void refetchScenarioDetail()
  }, [modelExecutionStatus, queryClient, refetchScenarioDetail, scenarioId, showSnackbar])

  useEffect(() => {
    setModelExecution(null)
    handledModelExecutionIdsRef.current.clear()
    setHasOpenedModelExecutionPopup(false)
  }, [scenarioId])

  const handleSubmitModelExecution = useCallback(
    async (payload: IModelExecutionSubmitReq) => {
      if (!scenarioId) return

      const accepted = await submitModelExecution({ targetScenarioId: scenarioId, payload })
      setModelExecution(accepted)
      void refetchScenarioDetail()
      modelExecutionPopupRef.current?.close()
    },
    [refetchScenarioDetail, scenarioId, submitModelExecution],
  )

  const scenarioName = useMemo(() => data?.scenarioName ?? '', [data?.scenarioName])
  const tags = useMemo(() => data?.tags ?? [], [data?.tags])
  const isModelExecutionGenerating = isSubmitModelExecutionPending || isModelExecutionGeneratingStatus(modelExecution?.status)

  const scenarioHeaderTitleSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
        <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
          <Typography variant="body1B16" color="contentText.Black">
            Scenario
          </Typography>
          {isLoading ? (
            <>
              <Skeleton variant="rounded" width="min(560px, 90%)" height={36} sx={{ borderRadius: '6px' }} />
              <Stack direction="row" gap="8px" flexWrap="wrap">
                <Skeleton variant="rounded" width={72} height={28} sx={{ borderRadius: '100px' }} />
                <Skeleton variant="rounded" width={88} height={28} sx={{ borderRadius: '100px' }} />
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="titleLarge" fontSize="26px" fontWeight={600} display="block" lineHeight={1.4}>
                {scenarioName}
              </Typography>
              {tags.length > 0 && (
                <Stack direction="row" gap="8px" flexWrap="wrap">
                  {tags.map((tag) => (
                    <MIChip
                      key={tag}
                      label={tag}
                      fontType="body2M14"
                      sx={{
                        height: '28px',
                        padding: '4px 8px',
                        backgroundColor: '#E9ECEF',
                        color: '#212529',
                        borderRadius: '100px',
                        border: 'none',
                      }}
                      disableHover
                    />
                  ))}
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Stack>
    ),
    [isLoading, scenarioName, tags],
  )

  const handleEventDetailClick = (row: IRelatedEvent) => {
    navigate(`${NEXT_GEN_MI_BASE_PATH}/events/${encodeURIComponent(String(row.eventId))}`, {
      state: { eventName: row.eventName },
    })
  }
  const handleScenarioDetailClick = (row: IRelatedScenario) => {
    if (scenarioId && String(row.scenarioId) === String(scenarioId)) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        {
          replace: false,
          state: {
            ...(typeof location.state === 'object' && location.state !== null ? (location.state as Record<string, unknown>) : {}),
            nextGenMISelfEntityBump: Date.now(),
          },
        },
      )
      void refetchScenarioDetail()
      scrollNextGenMILayoutToTop()
      return
    }
    navigate(`${NEXT_GEN_MI_BASE_PATH}/scenarios/${encodeURIComponent(String(row.scenarioId))}`)
  }

  const scenarioDetailHeaderRightAction = useMemo(
    () => (
      <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="8px" flexShrink={0} minHeight="62px">
        <NextGenMIUserFeedback pageName="Next-Gen MI" sectionName="Scenario Group List / Scenario Detail" />
        <MIMorphingPopup
          ref={modelExecutionPopupRef}
          display="inline-flex"
          popup={{
            title: 'Scenario',
            content: (
              <ScenarioModelExecutionPopupContent
                scenarioId={scenarioId}
                shouldFetch={hasOpenedModelExecutionPopup}
                disabled={isModelExecutionGenerating}
                onSubmit={handleSubmitModelExecution}
              />
            ),
            useInternalScroll: true,
            hideHeaderLine: true,
            minWidth: 1280,
            maxWidth: 1280,
            measureContent: <Box height={788} />,
            onOpen: () => setHasOpenedModelExecutionPopup(true),
          }}
        >
          <MIBaseButton
            variant="contained"
            prefix={<TokenIcon sx={{ fontSize: 20 }} />}
            disabled={isModelExecutionGenerating}
            disableRipple
            onClick={() => modelExecutionPopupRef.current?.open()}
            sx={{
              height: '36px',
              position: 'relative',
              zIndex: 3,
            }}
          >
            MI 수급 모델 실행
          </MIBaseButton>
        </MIMorphingPopup>
      </Stack>
    ),
    [handleSubmitModelExecution, hasOpenedModelExecutionPopup, isModelExecutionGenerating, scenarioId],
  )

  useLayoutEffect(() => {
    publishScenarioDetailHeaderContent({
      backLabel: 'Scenario Group List',
      onBack: () => navigate(getNextGenMITabPath('scenarios')),
      titleSlot: scenarioHeaderTitleSlot,
      rightAction: scenarioDetailHeaderRightAction,
    })
  }, [navigate, scenarioDetailHeaderRightAction, scenarioHeaderTitleSlot])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })
    return () => {
      setStickyHeader(null)
      scenarioDetailHeaderContent = null
    }
  }, [setStickyHeader])

  const relatedEvents: IRelatedEvent[] = data?.relatedEventScenario?.event ? [data.relatedEventScenario.event] : []
  const relatedScenarios: IRelatedScenario[] = data?.relatedEventScenario?.scenarios ?? []

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="12px" position="relative" sx={{ overflowX: 'hidden' }}>
      <Stack py="24px" gap="12px">
        <Stack id={SCENARIO_DETAIL_SECTIONS[0].id} gap="12px" py="30px">
          <SectionHeading sectionId={SCENARIO_DETAIL_SECTIONS[0].id} />
          <ScenarioSummarySection
            summary={data?.summary}
            probability={data?.probability}
            loading={isLoading}
            modelExecutionGenerating={isModelExecutionGenerating}
          />
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
