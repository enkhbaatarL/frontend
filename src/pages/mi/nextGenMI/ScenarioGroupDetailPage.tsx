import { Summarize } from '@mui/icons-material'
import { Skeleton, Stack, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import DocumentIcon from '@/components/common/icons/DocumentIcon'
import LineChartIcon from '@/components/common/icons/LineChartIcon'
import RadarIcon from '@/components/common/icons/RadarIcon'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
  type NextGenMIDetailHeaderSection,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import ScenarioGroupInnerTable, {
  isLastRemainingScenarioDiscard,
  ScenarioJudgementConfirmDialog,
  ScenarioLastDiscardConfirmDialog,
} from '@/pages/mi/nextGenMI/components/common/ScenarioGroupInnerTable'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import ScenarioGroupDeleteMenu from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupDeleteMenu'
import ScenarioGroupDetailSection from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupDetailSection'
import ScenarioGroupGraphView from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupGraphView'
import ScenarioGroupSummarySection from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioGroupSummarySection'
import { getNextGenMITabPath } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import nextGenMIScenarioGroupService, {
  type IScenarioGroupDetailRow,
  type ScenarioJudgementStatus,
} from '@/service/mi/nextGenMI/scenarioGroup'

type ScenarioGroupDetailSectionItem = NextGenMIDetailHeaderSection & {
  icon: ReactNode
}

const JUDGEMENT_SUCCESS_MESSAGE: Record<ScenarioJudgementStatus, string> = {
  pending: '시나리오가 대기 상태로 변경되었습니다.',
  realized: '시나리오가 실현 처리되었습니다.',
  discarded: '시나리오가 폐기되었습니다.',
}

const SCENARIO_GROUP_DETAIL_SECTIONS: ScenarioGroupDetailSectionItem[] = [
  { id: 'scenario-group-detail-section-summary', label: '요약', icon: <DocumentIcon /> },
  { id: 'scenario-group-detail-section-assumption', label: '가정 및 실현 가능성', icon: <RadarIcon /> },
  { id: 'scenario-group-detail-section-price-forecast', label: '가격 전망', icon: <LineChartIcon width="30" height="30" /> },
  { id: 'scenario-group-detail-section-detail', label: '시나리오 상세', icon: <Summarize sx={{ fontSize: 30 }} /> },
]

const SectionHeading = ({ sectionId }: { sectionId: NextGenMIDetailHeaderSection['id'] }) => {
  const section = SCENARIO_GROUP_DETAIL_SECTIONS.find((item) => item.id === sectionId)
  if (!section) return null

  return (
    <Stack direction="row" alignItems="center" gap="8px" sx={{ color: 'contentText.Black' }}>
      {section.icon}
      <Typography fontSize={20} fontWeight={600} color="contentText.Black">
        {section.label}
      </Typography>
      <InfoTooltip title="" iconSize={16} iconColor="contentText.Normal" />
    </Stack>
  )
}

interface ScenarioGroupDetailHeaderContent {
  backLabel: string
  onBack: () => void
  titleSlot: ReactNode
  rightAction?: ReactNode
  pendingScrollSectionId?: string
}

let scenarioGroupDetailHeaderContent: ScenarioGroupDetailHeaderContent | null = null
const scenarioGroupDetailHeaderListeners = new Set<() => void>()

const subscribeScenarioGroupDetailHeaderContent = (listener: () => void) => {
  scenarioGroupDetailHeaderListeners.add(listener)
  return () => scenarioGroupDetailHeaderListeners.delete(listener)
}

const getScenarioGroupDetailHeaderContentSnapshot = () => scenarioGroupDetailHeaderContent

const publishScenarioGroupDetailHeaderContent = (next: ScenarioGroupDetailHeaderContent) => {
  scenarioGroupDetailHeaderContent = next
  scenarioGroupDetailHeaderListeners.forEach((listener) => listener())
}

/** setStickyHeader 한 번만 호출하고 콘텐츠 변경 시 이 컴포넌트만 리렌더 — 스크롤·스파이 시 본문 패딩 흔들림 방지 */
const ScenarioGroupDetailHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioGroupDetailHeaderContent,
    getScenarioGroupDetailHeaderContentSnapshot,
    getScenarioGroupDetailHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <NextGenMIDetailHeader
      sections={SCENARIO_GROUP_DETAIL_SECTIONS.map(({ id, label }) => ({ id, label }))}
      backLabel={content.backLabel}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      rightAction={content.rightAction}
      pendingScrollSectionId={content.pendingScrollSectionId}
    />
  )
}

const resolveSelectedScenarioId = (scenarios: IScenarioGroupDetailRow[]): number | undefined => {
  if (scenarios.length === 0) return undefined
  return (scenarios.find((scenario) => scenario.baseCase) ?? scenarios[0]).scenarioId
}

const ScenarioGroupDetailPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setStickyHeader } = useStickyHeader()
  const { showSnackbar } = useSnackbar()
  const { scenarioGroupId } = useParams<{ scenarioGroupId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [judgementTarget, setJudgementTarget] = useState<{
    scenario: IScenarioGroupDetailRow
    status: ScenarioJudgementStatus
    isLastDiscard: boolean
  } | null>(null)

  // 시나리오를 직접 눌러 진입(초기 URL에 scenarioId)했는지 — 진입 시 '시나리오 상세' 섹션으로 포커스
  const [arrivedWithScenarioId] = useState(() => searchParams.get('scenarioId') !== null)

  const groupDetailQueryKey = useMemo(() => ['nextGenMIScenarioGroupDetail', scenarioGroupId], [scenarioGroupId])

  const { data, isLoading } = useQuery({
    queryKey: groupDetailQueryKey,
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupDetail(scenarioGroupId ?? ''),
    enabled: Boolean(scenarioGroupId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const scenarios = useMemo(() => data?.scenarios ?? [], [data?.scenarios])

  const queryScenarioId = searchParams.get('scenarioId')
  const selectedScenarioId = useMemo(() => {
    const parsed = queryScenarioId ? Number(queryScenarioId) : NaN
    if (Number.isFinite(parsed) && scenarios.some((scenario) => scenario.scenarioId === parsed)) {
      return parsed
    }
    return resolveSelectedScenarioId(scenarios)
  }, [queryScenarioId, scenarios])

  // 쿼리스트링이 비었거나 잘못된 경우 폴백 선택값으로 URL 보정
  useEffect(() => {
    if (scenarios.length === 0 || selectedScenarioId === undefined) return
    if (queryScenarioId && Number(queryScenarioId) === selectedScenarioId) return
    setSearchParams({ scenarioId: String(selectedScenarioId) }, { replace: true })
  }, [queryScenarioId, scenarios.length, selectedScenarioId, setSearchParams])

  const handleSelectScenario = useCallback(
    (scenarioId: number) => {
      setSearchParams({ scenarioId: String(scenarioId) }, { replace: false })
    },
    [setSearchParams],
  )

  const { mutate: mutateScenarioStatus, isPending: isStatusUpdating } = useMutation({
    mutationFn: ({ scenarioId, status }: { scenarioId: number; status: ScenarioJudgementStatus }) =>
      nextGenMIScenarioGroupService.updateScenarioStatus(scenarioGroupId ?? '', scenarioId, { status }),
    onSuccess: (_, { status }) => {
      void queryClient.invalidateQueries({ queryKey: groupDetailQueryKey })
      showSnackbar(JUDGEMENT_SUCCESS_MESSAGE[status], { variant: 'success' })
      setJudgementTarget(null)
    },
    onError: () => {
      showSnackbar('판정 변경에 실패했습니다.', { variant: 'error' })
    },
  })

  const { mutate: discardLastScenarioAndDeleteGroup, isPending: isLastDiscardDeleting } = useMutation({
    mutationFn: (scenarioId: number) => nextGenMIScenarioGroupService.discardLastScenarioAndDeleteGroup(scenarioGroupId ?? '', scenarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioGroups'] })
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioGroupScenarios'] })
      setJudgementTarget(null)
      navigate(getNextGenMITabPath('scenarios'), {
        state: { successMessage: '시나리오 그룹이 삭제되었습니다.' },
      })
    },
    onError: () => {
      showSnackbar('시나리오 그룹 삭제에 실패했습니다.', { variant: 'error' })
    },
  })

  const isJudgementPending = isStatusUpdating || isLastDiscardDeleting

  const handleJudgementChange = useCallback(
    (scenario: IScenarioGroupDetailRow, status: ScenarioJudgementStatus) => {
      if (scenario.status === 'discarded' || scenario.status === 'realized') return

      setJudgementTarget({
        scenario,
        status,
        isLastDiscard: status === 'discarded' && isLastRemainingScenarioDiscard(scenarios, scenario.scenarioId),
      })
    },
    [scenarios],
  )

  const handleJudgementConfirm = useCallback(() => {
    if (!judgementTarget || judgementTarget.isLastDiscard) return
    mutateScenarioStatus({ scenarioId: judgementTarget.scenario.scenarioId, status: judgementTarget.status })
  }, [judgementTarget, mutateScenarioStatus])

  const handleLastDiscardConfirm = useCallback(() => {
    if (!judgementTarget?.isLastDiscard) return
    discardLastScenarioAndDeleteGroup(judgementTarget.scenario.scenarioId)
  }, [discardLastScenarioAndDeleteGroup, judgementTarget])

  const groupName = data?.groupName ?? ''

  const headerTitleSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" width="100%">
        <Stack flex={1} minWidth={0} gap="10px" alignItems="flex-start" pt="20px">
          <Typography variant="body1B16" color="contentText.Black">
            Scenario Group
          </Typography>
          {isLoading ? (
            <Skeleton variant="rounded" width="min(560px, 90%)" height={36} sx={{ borderRadius: '6px' }} />
          ) : (
            <Typography variant="titleLarge" fontSize="26px" fontWeight={600} display="block" lineHeight={1.4}>
              {groupName}
            </Typography>
          )}
        </Stack>
      </Stack>
    ),
    [groupName, isLoading],
  )

  const headerRightAction = useMemo(
    () => (
      <Stack direction="row" alignItems="center" justifyContent="flex-end" gap="8px" flexShrink={0} minHeight="62px">
        <NextGenMIUserFeedback
          pageName="Next-Gen MI"
          sectionName="Scenario Group List / Scenario Group Detail"
          targetLabel={groupName ? `시나리오 그룹 상세/ ${groupName}` : '시나리오 그룹 상세'}
        />
        <ScenarioGroupDeleteMenu scenarioGroupId={scenarioGroupId ?? ''} />
      </Stack>
    ),
    [groupName, scenarioGroupId],
  )

  const focusDetailSectionId = arrivedWithScenarioId && !isLoading && Boolean(data) ? SCENARIO_GROUP_DETAIL_SECTIONS[3].id : undefined

  useLayoutEffect(() => {
    publishScenarioGroupDetailHeaderContent({
      backLabel: 'Scenario Group List',
      onBack: () => navigate(getNextGenMITabPath('scenarios')),
      titleSlot: headerTitleSlot,
      rightAction: headerRightAction,
      pendingScrollSectionId: focusDetailSectionId,
    })
  }, [focusDetailSectionId, headerRightAction, headerTitleSlot, navigate])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioGroupDetailHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })
    return () => {
      setStickyHeader(null)
      scenarioGroupDetailHeaderContent = null
    }
  }, [setStickyHeader])

  return (
    <Stack maxWidth="1380px" margin="auto" px="12px" pt="20px" position="relative" sx={{ overflowX: 'clip' }}>
      <Stack gap="30px">
        <Stack id={SCENARIO_GROUP_DETAIL_SECTIONS[0].id} gap="12px" py="20px">
          <SectionHeading sectionId={SCENARIO_GROUP_DETAIL_SECTIONS[0].id} />
          <ScenarioGroupSummarySection baseEvent={data?.baseEvent} summary={data?.summary} loading={isLoading} />
        </Stack>

        <Stack id={SCENARIO_GROUP_DETAIL_SECTIONS[1].id} gap="12px" py="20px">
          <SectionHeading sectionId={SCENARIO_GROUP_DETAIL_SECTIONS[1].id} />
          <ScenarioGroupInnerTable<IScenarioGroupDetailRow>
            scenarioGroupId={scenarioGroupId}
            dimensionColumns={data?.dimensionColumns ?? []}
            scenarios={scenarios}
            backgroundColor="commonColor.White"
            showStatusColumn
            judgementPendingScenarioId={isJudgementPending ? judgementTarget?.scenario.scenarioId : undefined}
            loading={isLoading}
            skeletonRowCount={4}
            onJudgementChange={handleJudgementChange}
          />
        </Stack>

        <Stack id={SCENARIO_GROUP_DETAIL_SECTIONS[2].id} gap="12px" py="20px">
          <SectionHeading sectionId={SCENARIO_GROUP_DETAIL_SECTIONS[2].id} />
          <ScenarioGroupGraphView scenarioGroupId={Number(scenarioGroupId)} enabled={Boolean(scenarioGroupId)} />
        </Stack>

        <Stack id={SCENARIO_GROUP_DETAIL_SECTIONS[3].id} py="20px">
          <ScenarioGroupDetailSection
            scenarioGroupId={scenarioGroupId ?? ''}
            scenarios={scenarios}
            selectedScenarioId={selectedScenarioId}
            headingSlot={<SectionHeading sectionId={SCENARIO_GROUP_DETAIL_SECTIONS[3].id} />}
            listLoading={isLoading}
            onSelectScenario={handleSelectScenario}
          />
        </Stack>
      </Stack>

      {judgementTarget?.isLastDiscard ? (
        <ScenarioLastDiscardConfirmDialog
          open={Boolean(judgementTarget)}
          pending={isLastDiscardDeleting}
          onConfirm={handleLastDiscardConfirm}
          onCancel={() => {
            if (isLastDiscardDeleting) return
            setJudgementTarget(null)
          }}
        />
      ) : (
        <ScenarioJudgementConfirmDialog
          open={Boolean(judgementTarget)}
          targetStatus={judgementTarget?.status ?? null}
          pending={isStatusUpdating}
          onConfirm={handleJudgementConfirm}
          onCancel={() => {
            if (isStatusUpdating) return
            setJudgementTarget(null)
          }}
        />
      )}
    </Stack>
  )
}

export default ScenarioGroupDetailPage
