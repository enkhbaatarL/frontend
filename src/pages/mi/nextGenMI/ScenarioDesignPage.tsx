import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import { Divider, Stack, Typography } from '@mui/material'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { HttpResponse } from '@/lib/axios'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import { useStickyHeader } from '@/contexts/StickyHeaderContext'
import useSnackbar from '@/hooks/useSnackbar'
import NextGenMIDetailHeader, {
  NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
} from '@/pages/mi/nextGenMI/components/common/NextGenMIDetailHeader'
import { formatNextGenMIDateTimeYmdHm } from '@/pages/mi/nextGenMI/components/common/scenarioDisplay'
import {
  EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE,
  isScenarioDesignStatusMine,
  isScenarioDesignStatusOccupiedByOther,
  normalizeEventDesignStep,
  normalizeScenarioDesignStatusCode,
} from '@/pages/mi/nextGenMI/components/event/eventDesignAvailability'
import NextGenMIUserFeedback from '@/pages/mi/nextGenMI/components/NextGenMIUserFeedback'
import ScenarioDesignCriteriaStep, {
  type ScenarioDesignReviewErrorItem,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignCriteriaStep'
import {
  ScenarioDesignConfirmDialog,
  type ScenarioDesignConfirmDialogContent,
  type ScenarioDesignRationaleSection,
  ScenarioDesignReviewFailedDialog,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignDialogs'
import {
  createScenarioDesignColumns,
  createScenarioDesignEditTable,
  createScenarioDesignRow,
  getScenarioDesignDimensionSelectedValue,
  getScenarioDesignRowId,
  hasScenarioDesignColumnDisplayLabels,
  isScenarioDesignAdditionalColumn,
  isScenarioDesignRequiredColumn,
  mapAdditionalDimensionCandidatesToColumns,
  mergeScenarioDesignAdditionalColumnOptions,
  upsertScenarioDesignAdditionalColumnSources,
  SCENARIO_DESIGN_MAX_ROW_COUNT,
  SCENARIO_DESIGN_SELECT_COMMON_ACTIONS,
  sortScenarioDesignColumns,
  updateScenarioDesignRowDimension,
  updateScenarioDesignRowScenarioName,
  type ScenarioDesignAddCriteriaRequestResult,
  type ScenarioDesignColumn,
  type ScenarioDesignConfirmType,
  type ScenarioDesignLocationState,
} from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignModel'
import ScenarioDesignOneViewStep from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignOneViewStep'
import ScenarioDesignProgressStep from '@/pages/mi/nextGenMI/components/scenarioDesign/ScenarioDesignProgressStep'
import { createScenarioDesignBackendReviewItems } from '@/pages/mi/nextGenMI/components/scenarioDesign/scenarioDesignReview'
import { getNextGenMIScenarioGroupDetailPath, getNextGenMITabPath, NEXT_GEN_MI_BASE_PATH } from '@/pages/mi/nextGenMI/nextGenMIRoutes'
import { scrollNextGenMILayoutToTop } from '@/pages/mi/nextGenMI/nextGenMIScroll'
import nextGenMIEventService, { type EventDetail } from '@/service/mi/nextGenMI/event'
import nextGenMIScenarioDesignService, {
  clearScenarioGroupCreationCursor,
  getScenarioGroupCreationCursor,
  isAdditionalDimensionGenerating,
  isAdditionalDimensionReady,
  mapDimensionValueOptionsToTemplates,
  mapScenarioDesignPresentationToState,
  saveScenarioGroupCreationCursor,
  type DesignConfirmSignpost,
  type DesignScenarioRow,
  type ScenarioDesignState,
  type ScenarioDesignStageValue,
  type ScenarioDesignStreamEventData,
  type ScenarioDesignStreamEventType,
  type ScenarioGroupCreationStreamData,
} from '@/service/mi/nextGenMI/scenarioDesign'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'

type ScenarioDesignHeaderContent = {
  backLabel: string
  backIcon?: ReactNode
  onBack: () => void
  titleSlot: ReactNode
  sectionSlot?: ReactNode
  rightAction?: ReactNode
}

let scenarioDesignHeaderContent: ScenarioDesignHeaderContent | null = null
const scenarioDesignHeaderListeners = new Set<() => void>()

const subscribeScenarioDesignHeaderContent = (listener: () => void) => {
  scenarioDesignHeaderListeners.add(listener)
  return () => scenarioDesignHeaderListeners.delete(listener)
}

const getScenarioDesignHeaderContentSnapshot = () => scenarioDesignHeaderContent

const publishScenarioDesignHeaderContent = (next: ScenarioDesignHeaderContent) => {
  scenarioDesignHeaderContent = next
  scenarioDesignHeaderListeners.forEach((listener) => listener())
}

const ScenarioDesignHeaderView = () => {
  const content = useSyncExternalStore(
    subscribeScenarioDesignHeaderContent,
    getScenarioDesignHeaderContentSnapshot,
    getScenarioDesignHeaderContentSnapshot,
  )
  if (!content) return null

  return (
    <NextGenMIDetailHeader
      sections={[]}
      backLabel={content.backLabel}
      backIcon={content.backIcon}
      onBack={content.onBack}
      titleSlot={content.titleSlot}
      sectionSlot={content.sectionSlot}
      rightAction={content.rightAction}
    />
  )
}

const assertUnhandledScenarioDesignConfirmType = (type: never): never => {
  throw new Error(`Unhandled scenario design confirm type: ${type}`)
}

const getScenarioDesignConfirmContent = (type: ScenarioDesignConfirmType): ScenarioDesignConfirmDialogContent => {
  switch (type) {
    case 'cancel':
      return {
        title: '시나리오 설계를 취소하시겠습니까?',
        confirmLabel: '확인',
        confirmBgColor: 'contentIcon.ActivePrimary',
      }
    case 'reviewComplete':
      return {
        title: '시나리오 검토를 완료하시겠습니까?',
        description: '검토한 시나리오 기준이 반영되며, 다음 단계에서 시나리오 그룹 정보를 확인하고 생성할 수 있습니다.',
        confirmLabel: '검토 완료',
        confirmBgColor: 'contentIcon.ActivePrimary',
      }
    case 'reviewCompleteWithWarning':
      return {
        title: '확인 필요한 항목이 있습니다',
        description: '일부 검토 항목이 권장 기준을 충족하지 않습니다. 테이블 하단의 경고 내용을 확인한 후 다음 단계로 진행해 주세요.',
        confirmLabel: '계속 진행',
        confirmBgColor: 'contentIcon.ActivePrimary',
      }
  }

  return assertUnhandledScenarioDesignConfirmType(type)
}

const normalizeScenarioDesignStage = (stage?: ScenarioDesignStageValue) => stage?.toLowerCase()

const isScenarioDesignOneViewStage = (stage?: string | null) => stage === 'signpost_created' || stage === 'completed'

const getScenarioDesignActiveTable = (state?: ScenarioDesignState | null) => state?.step2?.table ?? state?.step1 ?? null

const isScenarioDesignStreamEventType = (event?: string): event is ScenarioDesignStreamEventType =>
  event === 'connected' || event === 'generation' || event === 'validation' || event === 'signposts'

const parseScenarioDesignStreamEventData = (data?: string): ScenarioDesignStreamEventData | null => {
  if (!data) return null

  try {
    const parsed = JSON.parse(data) as ScenarioDesignStreamEventData
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const parseScenarioGroupCreationStreamData = (data?: string): ScenarioGroupCreationStreamData | null => {
  if (!data || data.trim() === 'keep-alive') return null

  try {
    const parsed = JSON.parse(data) as ScenarioGroupCreationStreamData
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const normalizeScenarioGroupCreationEventType = (eventName?: string, eventType?: string | null) => {
  const normalized = (eventType || eventName || '').trim().toLowerCase()
  return normalized || undefined
}

const getScenarioGroupCreationOperationStatus = (status?: string | null) => status?.trim().toLowerCase()

const isScenarioGroupCreationEngineRunning = (status?: string | null) => {
  const normalized = getScenarioGroupCreationOperationStatus(status)
  return normalized === 'queued' || normalized === 'running'
}

const getScenarioGroupCreationProgressText = (title?: string | null, messageMarkdown?: string | null) => {
  const heading = title?.trim()
  if (heading) return heading
  return messageMarkdown?.trim() || undefined
}

const isValidScenarioGroupId = (scenarioGroupId: unknown): scenarioGroupId is number =>
  typeof scenarioGroupId === 'number' && Number.isFinite(scenarioGroupId)

const isScenarioDesignStreamFailure = (
  data: ScenarioDesignStreamEventData | null,
): data is ScenarioDesignStreamEventData & { result: 'failure' } => data?.result === 'failure'

type ScenarioDesignErrorRoute = {
  to: string
  state?: Record<string, unknown>
}

const getScenarioDesignErrorRoute = (error: unknown): ScenarioDesignErrorRoute | null => {
  if (isAxiosError<HttpResponse<unknown>>(error)) {
    const status = error.response?.status
    const code = error.response?.data?.code

    if (code === 'AUTH-001' || code === 'SYS-999' || code === 'AUTH-005' || code === 'AUTH-007' || code === 'AUTH-008') return null
    if (status === 404) return { to: '/error/404', state: { code, status } }
    if (status) return { to: '/error', state: { code, status } }
  }

  return { to: '/error/unknown' }
}

type ScenarioDesignCriteriaValidation = {
  dimensionValueErrorMessages: Map<number, Map<string, string>>
  errorItems: ScenarioDesignReviewErrorItem[]
}

type ScenarioDesignCriteriaDraft = {
  columns: ScenarioDesignColumn[]
  rows: DesignScenarioRow[]
  agentColumnKeys: Set<string>
}

type ScenarioDesignDeleteResult = 'deleted' | 'skipped' | 'failed'

const SCENARIO_DESIGN_REQUIRED_REVIEW_ITEM: ScenarioDesignReviewErrorItem = {
  label: '필수 입력값 누락',
  message: '비어 있는 필수 항목에 값을 입력해 주세요.',
  severity: 'error',
  actionLabel: '수정 필요',
}

const SCENARIO_DESIGN_NEW_BRANCH_REVIEW_ITEM: ScenarioDesignReviewErrorItem = {
  label: '신규 분기 항목 기준값',
  message: '새로 추가한 분기 항목의 기준값이 ‘Agent 자동 설정’인지 확인해 주세요.',
  severity: 'warning',
  actionLabel: '확인 후 수정 권장',
}

const createScenarioDesignReviewFallbackErrorItem = (message: string): ScenarioDesignReviewErrorItem => ({
  label: '검토 결과',
  message,
  severity: 'error',
  actionLabel: '수정 필요',
})

const createScenarioDesignReviewRetryErrorItem = (message: string): ScenarioDesignReviewErrorItem => ({
  label: '검토 요청 실패',
  message,
  severity: 'error',
  actionLabel: '재시도 필요',
})

const ScenarioDesignGenerationFailureState = ({
  reason,
  retrying,
  onRetry,
  onCancel,
}: {
  reason?: string | null
  retrying: boolean
  onRetry: () => void
  onCancel: () => void
}) => (
  <Stack minHeight="560px" alignItems="center" justifyContent="center" gap="20px" padding="48px 0">
    <Stack gap="8px" alignItems="center" maxWidth="520px">
      <Typography variant="body1" fontSize="18px" fontWeight={700} color="contentText.Black" lineHeight={1.4} textAlign="center">
        시나리오 설계를 생성하지 못했습니다.
      </Typography>
      <Typography variant="body2R14" color="contentText.Subtext" lineHeight={1.5} textAlign="center">
        {reason?.trim() || '잠시 후 다시 시도해 주세요.'}
      </Typography>
    </Stack>
    <Stack direction="row" alignItems="center" gap="8px">
      <MIBaseButton variant="outlined" onClick={onCancel} sx={{ height: '36px', borderRadius: '8px' }}>
        취소
      </MIBaseButton>
      <MIBaseButton
        variant="contained"
        prefix={<ReplayRoundedIcon sx={{ fontSize: '20px' }} />}
        isLoading={retrying}
        onClick={onRetry}
        labelColor="contentText.White"
        gap="4px"
        sx={{
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'contentIcon.ActivePrimary',
          '&:hover:not(:disabled)': {
            backgroundColor: 'contentIcon.ActivePrimary',
          },
        }}
      >
        재시도
      </MIBaseButton>
    </Stack>
  </Stack>
)

const hasScenarioDesignRequiredReviewItem = (items: ScenarioDesignReviewErrorItem[]) =>
  items.some((item) => item.label === SCENARIO_DESIGN_REQUIRED_REVIEW_ITEM.label)

const hasBlockingScenarioDesignReviewItem = (items: ScenarioDesignReviewErrorItem[]) =>
  items.some((item) => (item.severity ?? 'error') === 'error')

const hasWarningScenarioDesignReviewItem = (items: ScenarioDesignReviewErrorItem[]) => items.some((item) => item.severity === 'warning')

const validateScenarioDesignCriteriaValues = (
  columns: ScenarioDesignColumn[],
  rows: DesignScenarioRow[],
  agentColumnKeys: Set<string>,
): ScenarioDesignCriteriaValidation => {
  const dimensionValueErrorMessages = new Map<number, Map<string, string>>()
  const errorItems: ScenarioDesignReviewErrorItem[] = []
  let hasMissingRequiredValue = false
  let hasNewBranchValueWarning = false

  columns.forEach((column) => {
    rows.forEach((row, index) => {
      const selectedValue = getScenarioDesignDimensionSelectedValue(row, column.key, column)

      if (isScenarioDesignRequiredColumn(column) && selectedValue === '') {
        hasMissingRequiredValue = true
        const rowId = getScenarioDesignRowId(row, index + 1)
        const rowErrorMessages = dimensionValueErrorMessages.get(rowId) ?? new Map<string, string>()
        rowErrorMessages.set(column.key, SCENARIO_DESIGN_REQUIRED_REVIEW_ITEM.message)
        dimensionValueErrorMessages.set(rowId, rowErrorMessages)
      }

      if (agentColumnKeys.has(column.key) && selectedValue !== SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value) {
        hasNewBranchValueWarning = true
      }
    })
  })

  if (hasMissingRequiredValue) {
    errorItems.push(SCENARIO_DESIGN_REQUIRED_REVIEW_ITEM)
  }

  if (hasNewBranchValueWarning) {
    errorItems.push(SCENARIO_DESIGN_NEW_BRANCH_REVIEW_ITEM)
  }

  return { dimensionValueErrorMessages, errorItems }
}

const createScenarioDesignCriteriaSnapshotKey = (
  columns: ScenarioDesignColumn[],
  rows: DesignScenarioRow[],
  agentColumnKeys: Set<string>,
) =>
  JSON.stringify({
    table: createScenarioDesignEditTable(columns, rows),
    agentColumnKeys: Array.from(agentColumnKeys).sort(),
  })

const createScenarioDesignCriteriaDraftSnapshotKey = (draft: ScenarioDesignCriteriaDraft) =>
  createScenarioDesignCriteriaSnapshotKey(draft.columns, draft.rows, draft.agentColumnKeys)

const ScenarioDesignPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const { setStickyHeader } = useStickyHeader()
  const state = location.state as ScenarioDesignLocationState | null
  const eventIdNumber = id !== undefined && Number.isFinite(Number(id)) ? Number(id) : null
  const locationScenarioGroupId =
    state?.scenarioGroupId !== undefined && Number.isFinite(state.scenarioGroupId) ? state.scenarioGroupId : null
  const locationDesignStep = normalizeEventDesignStep(state?.designStep)
  const designEventIds = useMemo(() => {
    const fromState = (state?.eventIds ?? []).filter((eventId) => Number.isFinite(eventId))
    const uniqueIds = [...new Set(fromState)]
    if (uniqueIds.length > 0) {
      if (eventIdNumber !== null && !uniqueIds.includes(eventIdNumber)) {
        return [eventIdNumber, ...uniqueIds]
      }
      return uniqueIds
    }
    return eventIdNumber !== null ? [eventIdNumber] : []
  }, [eventIdNumber, state?.eventIds])
  const [scenarioGroupId, setScenarioGroupId] = useState<number | null>(locationScenarioGroupId)
  const [rows, setRows] = useState<DesignScenarioRow[]>([])
  const [initialRows, setInitialRows] = useState<DesignScenarioRow[]>([])
  const [visibleScenarioDesignColumns, setVisibleScenarioDesignColumns] = useState<ScenarioDesignColumn[]>([])
  const [initialScenarioDesignColumns, setInitialScenarioDesignColumns] = useState<ScenarioDesignColumn[]>([])
  const [agentScenarioDesignColumnKeys, setAgentScenarioDesignColumnKeys] = useState<Set<string>>(() => new Set())
  const [additionalDimensionColumnSources, setAdditionalDimensionColumnSources] = useState<ScenarioDesignColumn[]>([])
  const additionalDimensionLabelHydrationKeyRef = useRef('')
  const [reviewed, setReviewed] = useState(false)
  const [reviewPending, setReviewPending] = useState(false)
  const [reviewMinimumLoadingComplete, setReviewMinimumLoadingComplete] = useState(false)
  const [reviewCompletedVisible, setReviewCompletedVisible] = useState(false)
  const [signpostPending, setSignpostPending] = useState(false)
  const [scenarioGroupCreatePending, setScenarioGroupCreatePending] = useState(false)
  const [scenarioDesignGenerationFailure, setScenarioDesignGenerationFailure] = useState<{ reason?: string | null } | null>(null)
  const [scenarioDesignGenerationRetryPending, setScenarioDesignGenerationRetryPending] = useState(false)
  // 목록에서 2단계로 이어가기면 One-view부터 표시
  const [currentStep, setCurrentStep] = useState<'criteria' | 'oneView'>(locationDesignStep === 'step2' ? 'oneView' : 'criteria')
  const [oneViewDefaultKey, setOneViewDefaultKey] = useState(0)
  const [confirmType, setConfirmType] = useState<ScenarioDesignConfirmType | null>(null)
  const [reviewFailedDialogOpen, setReviewFailedDialogOpen] = useState(false)
  const [reviewErrorItems, setReviewErrorItems] = useState<ScenarioDesignReviewErrorItem[]>([])
  const confirmedScenarioDesignLeaveRef = useRef(false)
  const leaveScenarioDesignRef = useRef<() => void>(() => undefined)
  const initialScenarioDesignHistoryIndexRef = useRef<number | null>(null)
  const scenarioDesignStartRequestedRef = useRef(false)
  const scenarioGroupIdRef = useRef<number | null>(null)
  const creationOperationIdRef = useRef<string | null>(null)
  const creationLastSequenceRef = useRef<number | null>(null)
  const creationAbortControllerRef = useRef<AbortController | null>(null)
  const [scenarioDesignCreationPending, setScenarioDesignCreationPending] = useState(false)
  const [creationProgressText, setCreationProgressText] = useState<string | null>(null)
  const [creationReadyForRefinement, setCreationReadyForRefinement] = useState(false)
  const creationStreamTerminalRef = useRef(false)
  const lastAppliedSnapshotRevisionRef = useRef(0)
  const preserveScenarioDesignGroupRef = useRef(false)
  const deleteScenarioDesignGroupRequestedRef = useRef(false)
  const scenarioDesignStateRefreshInFlightRef = useRef(false)
  const scenarioDesignStateRefreshQueuedRef = useRef(false)
  const signpostStreamReceivedRef = useRef(false)
  const lastSyncedScenarioDesignStateUpdatedAtRef = useRef(0)
  const reviewStartedScenarioDesignUpdatedAtRef = useRef(0)
  const reviewValidationStreamReceivedRef = useRef(false)
  const reviewValidationStreamStageRef = useRef<string | null>(null)
  const signpostStartedScenarioDesignUpdatedAtRef = useRef(0)
  const pendingFrontendReviewItemsRef = useRef<ScenarioDesignReviewErrorItem[] | null>(null)
  const pendingScenarioDesignReviewItemsRef = useRef<ScenarioDesignReviewErrorItem[]>([])
  const submittedCriteriaDraftRef = useRef<ScenarioDesignCriteriaDraft | null>(null)
  const reviewedCriteriaSnapshotKeyRef = useRef<string | null>(null)
  const criteriaReviewSnapshotInvalidatedRef = useRef(false)
  const reviewMinimumLoadingTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const reviewCompletedVisibleTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const navigateScenarioDesignErrorPage = useCallback(
    (error: unknown) => {
      const route = getScenarioDesignErrorRoute(error)
      if (!route) return
      navigate(route.to, { state: route.state, replace: true })
    },
    [navigate],
  )

  const {
    data: detail,
    isLoading,
    isError: isDetailError,
    error: detailError,
  } = useQuery({
    queryKey: ['nextGenMIScenarioDesignEvent', id],
    queryFn: () => nextGenMIEventService.getEventDetail(id ?? ''),
    enabled: eventIdNumber !== null,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const {
    data: designStatus,
    isLoading: designStatusLoading,
    isError: isDesignStatusError,
    error: designStatusError,
  } = useQuery({
    queryKey: ['nextGenMIScenarioDesignStatus', designEventIds],
    queryFn: () => nextGenMIScenarioDesignService.getScenarioDesignStatus({ miEventIds: designEventIds }),
    enabled: eventIdNumber !== null && scenarioGroupId === null && designEventIds.length > 0,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const createScenarioSignpostsMutation = useMutation({
    mutationFn: () => {
      if (scenarioGroupId === null) throw new Error('Scenario group is not ready')
      return nextGenMIScenarioDesignService.createScenarioSignposts(scenarioGroupId, {
        table: createScenarioDesignEditTable(visibleScenarioDesignColumns, rows),
      })
    },
  })

  const validateScenarioDesignMutation = useMutation({
    mutationFn: (table: ReturnType<typeof createScenarioDesignEditTable>) => {
      if (scenarioGroupId === null) throw new Error('Scenario group is not ready')
      return nextGenMIScenarioDesignService.validateScenarioDesign(scenarioGroupId, { table })
    },
  })

  const confirmScenarioDesignMutation = useMutation({
    mutationFn: (payload: Parameters<typeof nextGenMIScenarioDesignService.confirmScenarioDesign>[1]) => {
      if (scenarioGroupId === null) throw new Error('Scenario group is not ready')
      return nextGenMIScenarioDesignService.confirmScenarioDesign(scenarioGroupId, payload)
    },
  })

  const resetScenarioDesignMutation = useMutation({
    mutationFn: () => {
      if (scenarioGroupId === null) throw new Error('Scenario group is not ready')
      return nextGenMIScenarioDesignService.resetScenarioDesign(scenarioGroupId)
    },
  })

  const {
    data: scenarioDesignPresentation,
    dataUpdatedAt: scenarioDesignStateUpdatedAt,
    error: scenarioDesignStateError,
    isFetching: scenarioDesignStateFetching,
    isError: isScenarioDesignStateError,
    isLoading: scenarioDesignStateLoading,
    refetch: refetchScenarioDesignState,
  } = useQuery({
    queryKey: ['nextGenMIScenarioDesignPresentation', scenarioGroupId],
    queryFn: () =>
      nextGenMIScenarioDesignService.getScenarioDesignPresentation(scenarioGroupId!, {
        operationId: creationOperationIdRef.current ?? getScenarioGroupCreationCursor(designEventIds)?.operationId,
      }),
    enabled: isValidScenarioGroupId(scenarioGroupId),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })
  const scenarioDesignState = useMemo(
    () => (scenarioDesignPresentation ? mapScenarioDesignPresentationToState(scenarioDesignPresentation) : undefined),
    [scenarioDesignPresentation],
  )
  const scenarioDimensionTemplates = useMemo(
    () => (scenarioDesignPresentation ? mapDimensionValueOptionsToTemplates(scenarioDesignPresentation) : []),
    [scenarioDesignPresentation],
  )

  useEffect(() => {
    const cursor = getScenarioGroupCreationCursor(designEventIds)
    if (!cursor) return
    if (cursor.operationId) creationOperationIdRef.current = cursor.operationId
    if (typeof cursor.lastSequence === 'number') creationLastSequenceRef.current = cursor.lastSequence
    if (isValidScenarioGroupId(cursor.scenarioGroupId) && scenarioGroupId === null) {
      setScenarioGroupId(cursor.scenarioGroupId)
    }
  }, [designEventIds, scenarioGroupId])

  useEffect(() => {
    const operationStatus = getScenarioGroupCreationOperationStatus(scenarioDesignPresentation?.creationState?.operationStatus)
    if (operationStatus === 'succeeded') {
      setCreationReadyForRefinement(true)
      clearScenarioGroupCreationCursor(designEventIds)
    }
  }, [designEventIds, scenarioDesignPresentation?.creationState?.operationStatus])

  const eventNameFromState = state?.eventName?.trim()

  const secondaryEventIds = useMemo(() => designEventIds.filter((eventId) => String(eventId) !== String(id)), [designEventIds, id])

  const secondaryEventQueries = useQueries({
    queries: secondaryEventIds.map((eventId) => ({
      queryKey: ['nextGenMIScenarioDesignEvent', String(eventId)],
      queryFn: () => nextGenMIEventService.getEventDetail(String(eventId)),
      enabled: Number.isFinite(eventId),
      refetchOnWindowFocus: false,
      gcTime: 0,
    })),
  })

  const secondaryEventDetailsById = useMemo(() => {
    const map = new Map<number, EventDetail>()
    secondaryEventIds.forEach((eventId, index) => {
      const eventDetail = secondaryEventQueries[index]?.data
      if (eventDetail) map.set(eventId, eventDetail)
    })
    return map
  }, [secondaryEventIds, secondaryEventQueries])

  const eventTitle = detail?.eventName ?? eventNameFromState ?? (id ? `이벤트 ${id}` : '이벤트')
  const eventDetailPath = id ? `${NEXT_GEN_MI_BASE_PATH}/events/${encodeURIComponent(id)}` : getNextGenMITabPath('events')
  const designRationaleSections = useMemo((): ScenarioDesignRationaleSection[] => {
    const evidence = scenarioDesignPresentation?.evidence
    const sections: ScenarioDesignRationaleSection[] = []
    const eventAnalysis = evidence?.eventAnalysisMarkdown?.trim()
    const roleSelection = evidence?.roleSelectionMarkdown?.trim()
    if (eventAnalysis) sections.push({ title: undefined, blocks: [{ markdown: eventAnalysis }] })
    if (roleSelection) sections.push({ title: undefined, blocks: [{ markdown: roleSelection }] })
    return sections
  }, [scenarioDesignPresentation?.evidence])
  const showDesignRationaleButton = designRationaleSections.length > 0

  const baseEventItems = useMemo(() => {
    const bundles = scenarioDesignPresentation?.eventBundles ?? []
    const eventIds = bundles.length > 0 ? bundles.map((bundle) => bundle.eventId) : designEventIds

    return eventIds.map((eventId) => {
      const isRouteEvent = String(eventId) === String(id)
      const eventDetail = isRouteEvent ? detail : secondaryEventDetailsById.get(eventId)
      const bundle = bundles.find((item) => item.eventId === eventId)
      const title =
        eventDetail?.eventName?.trim() || bundle?.eventName?.trim() || (isRouteEvent ? eventTitle : undefined) || `이벤트 ${eventId}`
      return {
        eventId: String(eventId),
        detail: eventDetail,
        title,
        isSuggested: eventDetail?.isScenarioSuggested === true || bundle?.isScenarioSuggested === true,
        createdAtLabel: formatNextGenMIDateTimeYmdHm(eventDetail?.createdAt ?? bundle?.latestRecordFirstCreated),
        typeLabel:
          eventDetail?.impactAnalysis?.eventTypeLv1Label ??
          eventDetail?.impactAnalysis?.eventTypeLv1 ??
          bundle?.eventTypeLv1Label ??
          bundle?.eventTypeLv1 ??
          '-',
        onEventClick: () => {
          navigate(`${NEXT_GEN_MI_BASE_PATH}/events/${encodeURIComponent(String(eventId))}`, {
            state: { eventName: title },
          })
        },
      }
    })
  }, [designEventIds, detail, eventTitle, id, navigate, scenarioDesignPresentation?.eventBundles, secondaryEventDetailsById])

  // 템플릿이 state 동기화보다 늦게 도착하면 valueEnums가 비어 드롭다운 옵션이 사라지므로 보강한다
  useEffect(() => {
    if (scenarioDimensionTemplates.length === 0) return

    const enrichColumns = (columns: typeof visibleScenarioDesignColumns) => {
      if (columns.length === 0) return columns
      if (
        columns.every((column) => {
          const hasEnums = (column.valueEnums?.length ?? 0) > 0
          const hasMatchingLabelCount = Object.keys(column.valueEnumLabels ?? {}).length === (column.valueEnums?.length ?? 0)
          if (!hasEnums || !hasMatchingLabelCount) return false
          if (isScenarioDesignAdditionalColumn(column) && !hasScenarioDesignColumnDisplayLabels(column)) return false
          return true
        })
      ) {
        return mergeScenarioDesignAdditionalColumnOptions(columns, additionalDimensionColumnSources)
      }
      return mergeScenarioDesignAdditionalColumnOptions(
        createScenarioDesignColumns(
          columns.map((column) => ({
            key: column.key,
            label: column.label,
            description: column.description,
          })),
          scenarioDimensionTemplates,
        ),
        [...additionalDimensionColumnSources, ...columns],
      )
    }

    setVisibleScenarioDesignColumns(enrichColumns)
    setInitialScenarioDesignColumns(enrichColumns)
  }, [additionalDimensionColumnSources, scenarioDimensionTemplates])
  useEffect(() => {
    if (scenarioGroupId === null) return undefined

    const additionalColumns = visibleScenarioDesignColumns.filter(isScenarioDesignAdditionalColumn)
    if (additionalColumns.length === 0) return undefined
    if (additionalColumns.every(hasScenarioDesignColumnDisplayLabels)) return undefined

    const hydrationKey = `${scenarioGroupId}:${additionalColumns
      .map((column) => column.key)
      .sort()
      .join(',')}`
    if (additionalDimensionLabelHydrationKeyRef.current === hydrationKey) return undefined

    let cancelled = false

    void nextGenMIScenarioDesignService.getAdditionalDimensions(scenarioGroupId).then((additionalDimensions) => {
      if (cancelled || !isAdditionalDimensionReady(additionalDimensions.generationStatus)) return

      const candidateColumns = mapAdditionalDimensionCandidatesToColumns(additionalDimensions.candidates, [])
      additionalDimensionLabelHydrationKeyRef.current = hydrationKey
      if (candidateColumns.length === 0) return

      setAdditionalDimensionColumnSources((currentColumns) => upsertScenarioDesignAdditionalColumnSources(currentColumns, candidateColumns))
      setVisibleScenarioDesignColumns((currentColumns) => mergeScenarioDesignAdditionalColumnOptions(currentColumns, candidateColumns))
      setInitialScenarioDesignColumns((currentColumns) => mergeScenarioDesignAdditionalColumnOptions(currentColumns, candidateColumns))
    })

    return () => {
      cancelled = true
    }
  }, [scenarioGroupId, visibleScenarioDesignColumns])
  useEffect(() => {
    if (eventIdNumber === null) {
      navigate('/error/404', { replace: true })
      return
    }
    if (isDetailError) {
      navigateScenarioDesignErrorPage(detailError)
      return
    }
    if (isDesignStatusError) {
      navigateScenarioDesignErrorPage(designStatusError)
      return
    }
    if (isScenarioDesignStateError) {
      navigateScenarioDesignErrorPage(scenarioDesignStateError)
    }
  }, [
    designStatusError,
    detailError,
    eventIdNumber,
    isDesignStatusError,
    isDetailError,
    isScenarioDesignStateError,
    navigate,
    navigateScenarioDesignErrorPage,
    scenarioDesignStateError,
  ])
  const scenarioDesignActiveTable = useMemo(() => getScenarioDesignActiveTable(scenarioDesignState), [scenarioDesignState])
  const scenarioDesignActiveTableRowCount = scenarioDesignActiveTable?.scenarios?.length ?? 0
  const scenarioDesignStage = normalizeScenarioDesignStage(scenarioDesignState?.stage)
  const scenarioDesignGenerationFailed = scenarioDesignGenerationFailure !== null
  const scenarioDesignWaitingForInitialTable =
    scenarioGroupId !== null && currentStep === 'criteria' && scenarioDesignActiveTable === null && !scenarioDesignGenerationFailed
  const scenarioDesignWaitingForInitialRows =
    scenarioGroupId !== null &&
    currentStep === 'criteria' &&
    rows.length === 0 &&
    !scenarioDesignGenerationFailed &&
    (scenarioDesignStateFetching || scenarioDesignStage === 'ready' || scenarioDesignActiveTableRowCount > 0)
  const scenarioDesignLoading =
    isLoading ||
    designStatusLoading ||
    (scenarioDesignCreationPending && scenarioDesignActiveTable === null) ||
    scenarioDesignGenerationRetryPending ||
    scenarioDesignStateLoading ||
    resetScenarioDesignMutation.isPending ||
    scenarioDesignWaitingForInitialTable ||
    scenarioDesignWaitingForInitialRows ||
    signpostPending
  const scenarioDesignLoadingMessage = signpostPending
    ? '시나리오 One-view를 생성하고 있습니다.'
    : creationProgressText?.trim() ||
      (scenarioDesignCreationPending ? '시나리오 그룹 생성을 진행 중입니다.' : '시나리오 설계를 불러오는 중입니다.')
  const scenarioNameErrorMessages = useMemo(() => {
    const scenarioNameSet = new Set<string>()
    const errorMessages = new Map<number, string>()

    rows.forEach((row, index) => {
      const rowId = getScenarioDesignRowId(row, index + 1)
      const scenarioName = (row.scenarioName ?? '').trim()
      if (!scenarioName) {
        errorMessages.set(rowId, '시나리오명을 입력해 주세요.')
        return
      }

      if (scenarioNameSet.has(scenarioName)) {
        errorMessages.set(rowId, '중복된 시나리오명은 사용할 수 없습니다.')
        return
      }

      scenarioNameSet.add(scenarioName)
    })

    return errorMessages
  }, [rows])
  const criteriaValidation = useMemo(
    () => validateScenarioDesignCriteriaValues(visibleScenarioDesignColumns, rows, agentScenarioDesignColumnKeys),
    [agentScenarioDesignColumnKeys, rows, visibleScenarioDesignColumns],
  )
  const currentCriteriaSnapshotKey = useMemo(
    () => createScenarioDesignCriteriaSnapshotKey(visibleScenarioDesignColumns, rows, agentScenarioDesignColumnKeys),
    [agentScenarioDesignColumnKeys, rows, visibleScenarioDesignColumns],
  )
  const isCurrentCriteriaReviewed = reviewed && reviewedCriteriaSnapshotKeyRef.current === currentCriteriaSnapshotKey
  const requestDeleteScenarioDesignGroup = useCallback(async (): Promise<ScenarioDesignDeleteResult> => {
    const targetScenarioGroupId = scenarioGroupIdRef.current
    if (targetScenarioGroupId === null || preserveScenarioDesignGroupRef.current || deleteScenarioDesignGroupRequestedRef.current)
      return 'skipped'

    deleteScenarioDesignGroupRequestedRef.current = true
    try {
      await nextGenMIScenarioGroupService.deleteScenarioGroup(targetScenarioGroupId)
      return 'deleted'
    } catch {
      deleteScenarioDesignGroupRequestedRef.current = false
      return 'failed'
    }
  }, [])
  useEffect(() => {
    scenarioGroupIdRef.current = scenarioGroupId
  }, [scenarioGroupId])
  const pushScenarioDesignHistoryGuard = useCallback(() => {
    if (confirmedScenarioDesignLeaveRef.current) return

    const currentState = globalThis.history.state as Record<string, unknown> | null
    if (currentState?.scenarioDesignLeaveGuard === true) return

    globalThis.history.pushState({ ...(currentState ?? {}), scenarioDesignLeaveGuard: true }, '', globalThis.location.href)
  }, [])
  const handleLeaveScenarioDesign = useCallback(() => {
    confirmedScenarioDesignLeaveRef.current = true

    const currentState = globalThis.history.state as { scenarioDesignLeaveGuard?: unknown } | null
    if (initialScenarioDesignHistoryIndexRef.current !== null && initialScenarioDesignHistoryIndexRef.current > 0) {
      navigate(currentState?.scenarioDesignLeaveGuard === true ? -2 : -1)
      return
    }

    navigate(eventDetailPath, { state: { eventName: eventTitle } })
  }, [eventDetailPath, eventTitle, navigate])
  useEffect(() => {
    leaveScenarioDesignRef.current = handleLeaveScenarioDesign
  }, [handleLeaveScenarioDesign])
  const handleCancelScenarioDesignRequest = useCallback(() => {
    setConfirmType('cancel')
  }, [])
  const handleCancelScenarioDesign = useCallback(async () => {
    const deleteResult = await requestDeleteScenarioDesignGroup()
    if (deleteResult === 'failed') {
      showSnackbar('시나리오 설계 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
      return
    }

    handleLeaveScenarioDesign()
  }, [handleLeaveScenarioDesign, requestDeleteScenarioDesignGroup, showSnackbar])
  const clearScenarioDesignReviewCompletedTimeout = useCallback(() => {
    if (reviewCompletedVisibleTimeoutRef.current) {
      globalThis.clearTimeout(reviewCompletedVisibleTimeoutRef.current)
      reviewCompletedVisibleTimeoutRef.current = null
    }
  }, [])
  const clearScenarioDesignReviewMinimumLoadingTimeout = useCallback(() => {
    if (reviewMinimumLoadingTimeoutRef.current) {
      globalThis.clearTimeout(reviewMinimumLoadingTimeoutRef.current)
      reviewMinimumLoadingTimeoutRef.current = null
    }
  }, [])
  const startScenarioDesignReviewMinimumLoading = useCallback(() => {
    clearScenarioDesignReviewMinimumLoadingTimeout()
    setReviewMinimumLoadingComplete(false)
    reviewMinimumLoadingTimeoutRef.current = globalThis.setTimeout(() => {
      reviewMinimumLoadingTimeoutRef.current = null
      setReviewMinimumLoadingComplete(true)
    }, 1000)
  }, [clearScenarioDesignReviewMinimumLoadingTimeout])
  const resetScenarioDesignReviewState = useCallback(
    (options?: { keepErrorItems?: boolean }) => {
      clearScenarioDesignReviewCompletedTimeout()
      clearScenarioDesignReviewMinimumLoadingTimeout()
      setReviewPending(false)
      setReviewMinimumLoadingComplete(false)
      setReviewCompletedVisible(false)
      setReviewFailedDialogOpen(false)
      submittedCriteriaDraftRef.current = null
      reviewedCriteriaSnapshotKeyRef.current = null
      criteriaReviewSnapshotInvalidatedRef.current = true
      reviewStartedScenarioDesignUpdatedAtRef.current = 0
      reviewValidationStreamReceivedRef.current = false
      reviewValidationStreamStageRef.current = null
      signpostStreamReceivedRef.current = false
      signpostStartedScenarioDesignUpdatedAtRef.current = 0
      pendingFrontendReviewItemsRef.current = null
      pendingScenarioDesignReviewItemsRef.current = []
      if (!options?.keepErrorItems) setReviewErrorItems([])
      setReviewed(false)
      setCurrentStep('criteria')
    },
    [clearScenarioDesignReviewCompletedTimeout, clearScenarioDesignReviewMinimumLoadingTimeout],
  )
  useEffect(() => {
    if (!reviewed || reviewedCriteriaSnapshotKeyRef.current === currentCriteriaSnapshotKey) return

    resetScenarioDesignReviewState({ keepErrorItems: true })
  }, [currentCriteriaSnapshotKey, resetScenarioDesignReviewState, reviewed])
  const refreshScenarioDesignStateFromStream = useCallback(() => {
    if (!isValidScenarioGroupId(scenarioGroupIdRef.current)) return

    const refetchOnce = () => {
      if (scenarioDesignStateRefreshInFlightRef.current) {
        scenarioDesignStateRefreshQueuedRef.current = true
        return
      }

      scenarioDesignStateRefreshInFlightRef.current = true
      void refetchScenarioDesignState().finally(() => {
        scenarioDesignStateRefreshInFlightRef.current = false
        if (!scenarioDesignStateRefreshQueuedRef.current) return

        scenarioDesignStateRefreshQueuedRef.current = false
        refetchOnce()
      })
    }

    refetchOnce()
  }, [refetchScenarioDesignState])
  const handleScenarioDesignStreamFailure = useCallback(
    (event: Exclude<ScenarioDesignStreamEventType, 'connected'>, reason?: string | null) => {
      const failureReason = reason?.trim() || null

      if (event === 'generation') {
        clearScenarioDesignReviewMinimumLoadingTimeout()
        setScenarioDesignGenerationFailure({ reason: failureReason })
        setReviewPending(false)
        setReviewMinimumLoadingComplete(false)
        setSignpostPending(false)
        setScenarioGroupCreatePending(false)
        showSnackbar('시나리오 설계 생성에 실패했습니다.', {
          variant: 'error',
          body: failureReason ?? '잠시 후 다시 시도해 주세요.',
        })
        return
      }

      if (event === 'validation') {
        clearScenarioDesignReviewMinimumLoadingTimeout()
        submittedCriteriaDraftRef.current = null
        reviewedCriteriaSnapshotKeyRef.current = null
        criteriaReviewSnapshotInvalidatedRef.current = true
        pendingFrontendReviewItemsRef.current = null
        reviewStartedScenarioDesignUpdatedAtRef.current = 0
        reviewValidationStreamReceivedRef.current = false
        reviewValidationStreamStageRef.current = null
        setReviewPending(false)
        setReviewMinimumLoadingComplete(false)
        setReviewed(false)
        setReviewErrorItems([
          ...pendingScenarioDesignReviewItemsRef.current,
          createScenarioDesignReviewRetryErrorItem(failureReason ?? '변경사항 검토를 다시 시도해 주세요.'),
        ])
        pendingScenarioDesignReviewItemsRef.current = []
        showSnackbar('변경사항 검토에 실패했습니다.', {
          variant: 'error',
          body: failureReason ?? '잠시 후 다시 시도해 주세요.',
        })
        return
      }

      signpostStreamReceivedRef.current = false
      signpostStartedScenarioDesignUpdatedAtRef.current = 0
      setSignpostPending(false)
      setCurrentStep('criteria')
      showSnackbar('시나리오 One-view 생성에 실패했습니다.', {
        variant: 'error',
        body: failureReason ?? '잠시 후 다시 시도해 주세요.',
      })
    },
    [clearScenarioDesignReviewMinimumLoadingTimeout, showSnackbar],
  )
  const runScenarioGroupCreationStream = useCallback(
    async (signal: AbortSignal) => {
      if (designEventIds.length === 0) throw new Error('No events selected')

      creationStreamTerminalRef.current = false
      setScenarioDesignCreationPending(true)
      setScenarioDesignGenerationFailure(null)
      setCreationReadyForRefinement(false)

      const handleCreationStreamMessage = ({ event, data, id: eventId }: { event?: string; data?: string; id?: string }) => {
        const parsed = parseScenarioGroupCreationStreamData(data)
        if (!parsed) return

        const eventType = normalizeScenarioGroupCreationEventType(event, parsed.eventType)
        const sequence = parsed.sequence ?? (eventId !== undefined && Number.isFinite(Number(eventId)) ? Number(eventId) : undefined)
        if (parsed.operationId) creationOperationIdRef.current = parsed.operationId
        if (typeof sequence === 'number') creationLastSequenceRef.current = sequence
        if (isValidScenarioGroupId(parsed.scenarioGroupId)) setScenarioGroupId(parsed.scenarioGroupId)

        const progressText = getScenarioGroupCreationProgressText(parsed.title, parsed.messageMarkdown)
        if (progressText) setCreationProgressText(progressText)

        if (eventType !== 'completed' && eventType !== 'failed' && eventType !== 'interrupted') {
          saveScenarioGroupCreationCursor(designEventIds, {
            operationId: creationOperationIdRef.current ?? parsed.operationId,
            lastSequence: creationLastSequenceRef.current ?? sequence,
            scenarioGroupId: isValidScenarioGroupId(parsed.scenarioGroupId)
              ? parsed.scenarioGroupId
              : (scenarioGroupIdRef.current ?? undefined),
          })
        }

        if (eventType === 'section_ready') {
          const snapshotRevision = parsed.snapshotRevision
          if (typeof snapshotRevision === 'number' && snapshotRevision > lastAppliedSnapshotRevisionRef.current) {
            lastAppliedSnapshotRevisionRef.current = snapshotRevision
            refreshScenarioDesignStateFromStream()
          }
        }

        if (eventType === 'completed') {
          creationStreamTerminalRef.current = true
          lastAppliedSnapshotRevisionRef.current = Math.max(lastAppliedSnapshotRevisionRef.current, parsed.snapshotRevision ?? 0)
          clearScenarioGroupCreationCursor(designEventIds)
          setCreationReadyForRefinement(true)
          refreshScenarioDesignStateFromStream()
          creationAbortControllerRef.current?.abort()
          return
        }

        if (eventType === 'failed' || eventType === 'interrupted' || eventType === 'failure' || eventType === 'error') {
          creationStreamTerminalRef.current = true
          clearScenarioGroupCreationCursor(designEventIds)
          setCreationReadyForRefinement(false)
          setScenarioDesignGenerationFailure({
            reason: getScenarioGroupCreationProgressText(parsed.title, parsed.messageMarkdown) ?? null,
          })
          refreshScenarioDesignStateFromStream()
          creationAbortControllerRef.current?.abort()
        }
      }

      try {
        while (!signal.aborted && !creationStreamTerminalRef.current) {
          try {
            await nextGenMIScenarioDesignService.createScenarioGroupStream(
              {
                miEventIds: designEventIds,
                operationId: creationOperationIdRef.current ?? undefined,
                lastSequence: creationLastSequenceRef.current ?? undefined,
              },
              handleCreationStreamMessage,
              signal,
            )
            if (creationStreamTerminalRef.current || signal.aborted) break
            if (!creationOperationIdRef.current) break
          } catch (error) {
            if (signal.aborted || creationStreamTerminalRef.current) break
            if (!creationOperationIdRef.current) throw error
          }
        }
      } finally {
        setScenarioDesignCreationPending(false)
      }
    },
    [designEventIds, refreshScenarioDesignStateFromStream],
  )
  const retryScenarioDesignGeneration = useCallback(async () => {
    if (designEventIds.length === 0 || scenarioDesignGenerationRetryPending) return

    setScenarioDesignGenerationRetryPending(true)
    setScenarioDesignGenerationFailure(null)
    setCreationProgressText(null)
    setCreationReadyForRefinement(false)
    creationStreamTerminalRef.current = false
    lastAppliedSnapshotRevisionRef.current = 0
    creationOperationIdRef.current = null
    creationLastSequenceRef.current = null
    clearScenarioGroupCreationCursor(designEventIds)

    creationAbortControllerRef.current?.abort()
    const controller = new AbortController()
    creationAbortControllerRef.current = controller

    try {
      await runScenarioGroupCreationStream(controller.signal)
    } catch {
      if (controller.signal.aborted) return
      setScenarioDesignGenerationFailure({ reason: null })
      showSnackbar('시나리오 설계 생성을 다시 요청하지 못했습니다.', { variant: 'error', body: '잠시 후 다시 시도해 주세요.' })
    } finally {
      setScenarioDesignGenerationRetryPending(false)
    }
  }, [designEventIds, runScenarioGroupCreationStream, scenarioDesignGenerationRetryPending, showSnackbar])
  const startScenarioDesignReview = useCallback(async () => {
    if (scenarioGroupId === null) return

    const nextReviewErrorItems = [...criteriaValidation.errorItems]
    const scenarioNameErrors = Array.from(scenarioNameErrorMessages.values())
    const hasMissingScenarioName = scenarioNameErrors.some((message) => message.includes('입력'))
    const hasDuplicateScenarioName = scenarioNameErrors.some((message) => message.includes('중복'))

    if (hasMissingScenarioName && !hasScenarioDesignRequiredReviewItem(nextReviewErrorItems)) {
      nextReviewErrorItems.unshift({
        ...SCENARIO_DESIGN_REQUIRED_REVIEW_ITEM,
      })
    }
    if (hasDuplicateScenarioName) {
      nextReviewErrorItems.push(createScenarioDesignReviewFallbackErrorItem('중복된 시나리오명은 사용할 수 없습니다.'))
    }
    clearScenarioDesignReviewCompletedTimeout()
    clearScenarioDesignReviewMinimumLoadingTimeout()
    setReviewPending(false)
    setReviewMinimumLoadingComplete(false)
    setReviewCompletedVisible(false)
    setReviewFailedDialogOpen(false)
    reviewStartedScenarioDesignUpdatedAtRef.current = scenarioDesignStateUpdatedAt
    reviewValidationStreamReceivedRef.current = false
    reviewValidationStreamStageRef.current = null
    const frontendBlockingReviewItems = nextReviewErrorItems.filter((item) => (item.severity ?? 'error') === 'error')
    const frontendWarningReviewItems = nextReviewErrorItems.filter((item) => item.severity === 'warning')

    pendingFrontendReviewItemsRef.current = null
    pendingScenarioDesignReviewItemsRef.current = frontendWarningReviewItems

    setReviewErrorItems([])
    setReviewed(false)
    reviewedCriteriaSnapshotKeyRef.current = null
    submittedCriteriaDraftRef.current = {
      columns: visibleScenarioDesignColumns,
      rows,
      agentColumnKeys: new Set(agentScenarioDesignColumnKeys),
    }

    setReviewPending(true)
    startScenarioDesignReviewMinimumLoading()

    if (frontendBlockingReviewItems.length > 0) {
      pendingFrontendReviewItemsRef.current = nextReviewErrorItems
      return
    }

    try {
      await validateScenarioDesignMutation.mutateAsync(createScenarioDesignEditTable(visibleScenarioDesignColumns, rows))
    } catch {
      clearScenarioDesignReviewMinimumLoadingTimeout()
      submittedCriteriaDraftRef.current = null
      reviewedCriteriaSnapshotKeyRef.current = null
      criteriaReviewSnapshotInvalidatedRef.current = true
      reviewStartedScenarioDesignUpdatedAtRef.current = 0
      reviewValidationStreamReceivedRef.current = false
      reviewValidationStreamStageRef.current = null
      pendingFrontendReviewItemsRef.current = null
      setReviewPending(false)
      setReviewMinimumLoadingComplete(false)
      setReviewed(false)
      showSnackbar('변경사항 검토를 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
    }
  }, [
    clearScenarioDesignReviewMinimumLoadingTimeout,
    clearScenarioDesignReviewCompletedTimeout,
    agentScenarioDesignColumnKeys,
    criteriaValidation.errorItems,
    rows,
    scenarioGroupId,
    scenarioDesignStateUpdatedAt,
    scenarioNameErrorMessages,
    showSnackbar,
    startScenarioDesignReviewMinimumLoading,
    validateScenarioDesignMutation,
    visibleScenarioDesignColumns,
  ])

  useEffect(
    () => () => {
      clearScenarioDesignReviewCompletedTimeout()
      clearScenarioDesignReviewMinimumLoadingTimeout()
    },
    [clearScenarioDesignReviewCompletedTimeout, clearScenarioDesignReviewMinimumLoadingTimeout],
  )

  useEffect(() => {
    if (
      eventIdNumber === null ||
      scenarioDesignStartRequestedRef.current ||
      designStatusLoading ||
      (designEventIds.length > 0 && designStatus === undefined && !isDesignStatusError && scenarioGroupId === null)
    ) {
      return
    }

    if (designStatus) {
      const status = normalizeScenarioDesignStatusCode(designStatus.designStatus)
      if (status === 'created' && designStatus.scenarioGroupId !== undefined && designStatus.scenarioGroupId !== null) {
        confirmedScenarioDesignLeaveRef.current = true
        navigate(getNextGenMIScenarioGroupDetailPath(designStatus.scenarioGroupId), { replace: true })
        return
      }

      if (status === 'unavailable') {
        confirmedScenarioDesignLeaveRef.current = true
        showSnackbar(EVENT_SCENARIO_DESIGN_UNAVAILABLE_TOOLTIP_TITLE, { variant: 'error' })
        navigate(eventDetailPath, { replace: true, state: { eventName: eventTitle } })
        return
      }

      if (isScenarioDesignStatusOccupiedByOther(designStatus)) {
        confirmedScenarioDesignLeaveRef.current = true
        showSnackbar('다른 사용자가 현재 시나리오 설계를 진행 중입니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
        navigate(eventDetailPath, { replace: true, state: { eventName: eventTitle } })
        return
      }

      if (
        status === 'creating' &&
        designStatus.scenarioGroupId !== undefined &&
        designStatus.scenarioGroupId !== null &&
        isScenarioDesignStatusMine(designStatus) &&
        scenarioGroupId === null
      ) {
        setScenarioGroupId(designStatus.scenarioGroupId)
        return
      }
    }

    const resolvedGroupId = scenarioGroupId ?? designStatus?.scenarioGroupId ?? null
    if (resolvedGroupId !== null && scenarioDesignPresentation === undefined && scenarioDesignStateLoading) {
      return
    }

    const operationStatus = getScenarioGroupCreationOperationStatus(scenarioDesignPresentation?.creationState?.operationStatus)
    const engineRunning = isScenarioGroupCreationEngineRunning(operationStatus)
    const engineSucceeded = operationStatus === 'succeeded'
    const engineFailed = operationStatus === 'failed' || operationStatus === 'interrupted'
    const hasTable = (scenarioDesignPresentation?.table?.scenarios?.length ?? 0) > 0

    if (engineFailed) {
      scenarioDesignStartRequestedRef.current = true
      setScenarioDesignGenerationFailure({
        reason: scenarioDesignPresentation?.creationState?.lastError?.message?.trim() || null,
      })
      return
    }

    if (engineSucceeded || (hasTable && !engineRunning)) {
      scenarioDesignStartRequestedRef.current = true
      setCreationReadyForRefinement(true)
      clearScenarioGroupCreationCursor(designEventIds)
      return
    }

    scenarioDesignStartRequestedRef.current = true
    const controller = new AbortController()
    creationAbortControllerRef.current = controller
    void runScenarioGroupCreationStream(controller.signal).catch((error) => {
      if (controller.signal.aborted) return
      navigateScenarioDesignErrorPage(error)
    })
  }, [
    designEventIds,
    designStatus,
    designStatusLoading,
    eventDetailPath,
    eventIdNumber,
    eventTitle,
    isDesignStatusError,
    navigate,
    navigateScenarioDesignErrorPage,
    runScenarioGroupCreationStream,
    scenarioDesignPresentation,
    scenarioDesignStateLoading,
    scenarioGroupId,
    showSnackbar,
  ])

  useEffect(
    () => () => {
      creationAbortControllerRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    if (scenarioGroupId === null || !creationReadyForRefinement) {
      return undefined
    }

    const controller = new AbortController()

    void nextGenMIScenarioDesignService
      .streamScenarioRefinement(
        scenarioGroupId,
        ({ event, data }) => {
          if (!isScenarioDesignStreamEventType(event) || event === 'connected') return

          const streamData = parseScenarioDesignStreamEventData(data)
          if (streamData?.scenarioGroupId !== undefined && streamData.scenarioGroupId !== scenarioGroupId) return
          if (isScenarioDesignStreamFailure(streamData)) {
            handleScenarioDesignStreamFailure(event, streamData.reason)
            return
          }

          if (event === 'generation') setScenarioDesignGenerationFailure(null)
          if (event === 'validation') {
            reviewValidationStreamReceivedRef.current = true
            reviewValidationStreamStageRef.current = normalizeScenarioDesignStage(streamData?.stage) ?? null
          }
          if (event === 'signposts') signpostStreamReceivedRef.current = true
          refreshScenarioDesignStateFromStream()
        },
        controller.signal,
      )
      .catch((error) => {
        if (controller.signal.aborted) return
        navigateScenarioDesignErrorPage(error)
      })

    return () => {
      controller.abort()
    }
  }, [
    creationReadyForRefinement,
    handleScenarioDesignStreamFailure,
    navigateScenarioDesignErrorPage,
    refreshScenarioDesignStateFromStream,
    scenarioGroupId,
  ])

  useEffect(() => {
    const activeTable = scenarioDesignActiveTable
    if (!activeTable) return

    const stage = normalizeScenarioDesignStage(scenarioDesignState?.stage)
    const validationResult = scenarioDesignState?.validation?.isValid
    const hasValidationResult = validationResult === true || validationResult === false
    const receivedCurrentReviewValidation = reviewValidationStreamReceivedRef.current
    const backendValidationResultReady =
      reviewPending &&
      reviewMinimumLoadingComplete &&
      pendingFrontendReviewItemsRef.current === null &&
      receivedCurrentReviewValidation &&
      scenarioDesignStateUpdatedAt > reviewStartedScenarioDesignUpdatedAtRef.current &&
      (hasValidationResult || reviewValidationStreamStageRef.current === 'scenario_validated')
    const reviewValidationResultReady = !reviewPending || backendValidationResultReady
    const validationPassed =
      reviewValidationResultReady &&
      (validationResult === true || (!hasValidationResult && reviewValidationStreamStageRef.current === 'scenario_validated'))
    const validationFailed = reviewValidationResultReady && validationResult === false
    const submittedCriteriaDraft = submittedCriteriaDraftRef.current
    const hasOneViewTable = scenarioDesignState?.step2?.table !== undefined && scenarioDesignState.step2.table !== null
    const shouldUseSubmittedCriteriaDraft =
      !hasOneViewTable &&
      submittedCriteriaDraft !== null &&
      (reviewPending || reviewedCriteriaSnapshotKeyRef.current !== null) &&
      !backendValidationResultReady
    const shouldSyncScenarioDesignTable =
      shouldUseSubmittedCriteriaDraft || scenarioDesignStateUpdatedAt > lastSyncedScenarioDesignStateUpdatedAtRef.current
    const serverColumns = mergeScenarioDesignAdditionalColumnOptions(
      createScenarioDesignColumns(activeTable.dimensionColumns, scenarioDimensionTemplates),
      [...additionalDimensionColumnSources, ...(submittedCriteriaDraft?.columns ?? [])],
    )
    const serverRows = activeTable.scenarios ?? []
    const nextColumns = shouldUseSubmittedCriteriaDraft ? submittedCriteriaDraft.columns : serverColumns
    const nextRows = shouldUseSubmittedCriteriaDraft ? submittedCriteriaDraft.rows : serverRows
    const nextAgentColumnKeys = shouldUseSubmittedCriteriaDraft ? submittedCriteriaDraft.agentColumnKeys : new Set<string>()
    const nextCriteriaSnapshotKey = createScenarioDesignCriteriaSnapshotKey(nextColumns, nextRows, nextAgentColumnKeys)
    const canUseValidatedCriteriaSnapshot =
      reviewPending ||
      (!criteriaReviewSnapshotInvalidatedRef.current &&
        (shouldSyncScenarioDesignTable || currentCriteriaSnapshotKey === nextCriteriaSnapshotKey))

    if (shouldSyncScenarioDesignTable) {
      setVisibleScenarioDesignColumns(nextColumns)
      setRows(nextRows)
      setAgentScenarioDesignColumnKeys(new Set(nextAgentColumnKeys))
      if (!shouldUseSubmittedCriteriaDraft || validationPassed) {
        setInitialScenarioDesignColumns(nextColumns)
        setInitialRows(nextRows)
      }
      if (scenarioDesignStateUpdatedAt > lastSyncedScenarioDesignStateUpdatedAtRef.current) {
        lastSyncedScenarioDesignStateUpdatedAtRef.current = scenarioDesignStateUpdatedAt
      }
    }
    if ((validationPassed || isScenarioDesignOneViewStage(stage)) && canUseValidatedCriteriaSnapshot) {
      reviewedCriteriaSnapshotKeyRef.current = nextCriteriaSnapshotKey
      criteriaReviewSnapshotInvalidatedRef.current = false
      setReviewed(true)
    }

    if (!signpostPending && isScenarioDesignOneViewStage(stage)) {
      submittedCriteriaDraftRef.current = null
      setCurrentStep('oneView')
    }

    if (reviewPending && (validationPassed || validationFailed)) {
      submittedCriteriaDraftRef.current = null
      setReviewPending(false)
      setReviewMinimumLoadingComplete(false)
      reviewStartedScenarioDesignUpdatedAtRef.current = 0
      reviewValidationStreamReceivedRef.current = false
      reviewValidationStreamStageRef.current = null

      if (validationPassed) {
        reviewedCriteriaSnapshotKeyRef.current = nextCriteriaSnapshotKey
        criteriaReviewSnapshotInvalidatedRef.current = false
        setReviewed(true)
        setReviewErrorItems(pendingScenarioDesignReviewItemsRef.current.filter((item) => item.severity === 'warning'))
        pendingScenarioDesignReviewItemsRef.current = []
        setReviewCompletedVisible(true)
        showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
        reviewCompletedVisibleTimeoutRef.current = globalThis.setTimeout(() => {
          reviewCompletedVisibleTimeoutRef.current = null
          setReviewCompletedVisible(false)
        }, 1000)
      } else {
        const scenarioDesignReviewItems = [
          ...pendingScenarioDesignReviewItemsRef.current,
          ...createScenarioDesignBackendReviewItems(
            scenarioDesignState?.validation?.reason?.trim() || '검토 기준을 충족하지 않는 항목이 있습니다.',
          ),
        ]

        reviewedCriteriaSnapshotKeyRef.current = nextCriteriaSnapshotKey
        criteriaReviewSnapshotInvalidatedRef.current = false
        setReviewed(true)
        setReviewErrorItems(scenarioDesignReviewItems)
        pendingScenarioDesignReviewItemsRef.current = []

        if (hasBlockingScenarioDesignReviewItem(scenarioDesignReviewItems)) {
          setReviewFailedDialogOpen(true)
        } else {
          setReviewCompletedVisible(true)
          showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
          reviewCompletedVisibleTimeoutRef.current = globalThis.setTimeout(() => {
            reviewCompletedVisibleTimeoutRef.current = null
            setReviewCompletedVisible(false)
          }, 1000)
        }
      }
    }

    const signpostResultReady =
      signpostPending &&
      scenarioDesignStateUpdatedAt > signpostStartedScenarioDesignUpdatedAtRef.current &&
      (signpostStreamReceivedRef.current || isScenarioDesignOneViewStage(stage))

    if (signpostResultReady) {
      if (signpostStreamReceivedRef.current) {
        signpostStreamReceivedRef.current = false
        setOneViewDefaultKey((currentKey) => currentKey + 1)
      }
      signpostStartedScenarioDesignUpdatedAtRef.current = 0
      setSignpostPending(false)
      setCurrentStep('oneView')
      scrollNextGenMILayoutToTop()
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIScenarioDesignStatus'] })
      void queryClient.invalidateQueries({ queryKey: ['nextGenMIEventScenarioGroups'] })
    }
  }, [
    additionalDimensionColumnSources,
    currentCriteriaSnapshotKey,
    reviewPending,
    scenarioDesignActiveTable,
    scenarioDesignState,
    scenarioDesignStateUpdatedAt,
    scenarioDimensionTemplates,
    reviewMinimumLoadingComplete,
    showSnackbar,
    signpostPending,
    queryClient,
  ])

  useEffect(() => {
    const frontendReviewItems = pendingFrontendReviewItemsRef.current
    if (!reviewPending || !reviewMinimumLoadingComplete || frontendReviewItems === null) return

    const hasBlockingReviewItem = hasBlockingScenarioDesignReviewItem(frontendReviewItems)

    pendingFrontendReviewItemsRef.current = null
    reviewStartedScenarioDesignUpdatedAtRef.current = 0
    reviewValidationStreamReceivedRef.current = false
    reviewValidationStreamStageRef.current = null
    setReviewPending(false)
    setReviewMinimumLoadingComplete(false)
    reviewedCriteriaSnapshotKeyRef.current =
      submittedCriteriaDraftRef.current === null
        ? currentCriteriaSnapshotKey
        : createScenarioDesignCriteriaDraftSnapshotKey(submittedCriteriaDraftRef.current)
    criteriaReviewSnapshotInvalidatedRef.current = false
    setReviewed(true)
    setReviewErrorItems(frontendReviewItems)

    if (!hasBlockingReviewItem) {
      setReviewCompletedVisible(true)
      showSnackbar('변경사항 검토가 완료되었습니다.', { variant: 'success' })
      reviewCompletedVisibleTimeoutRef.current = globalThis.setTimeout(() => {
        reviewCompletedVisibleTimeoutRef.current = null
        setReviewCompletedVisible(false)
      }, 1000)
    }
  }, [currentCriteriaSnapshotKey, reviewMinimumLoadingComplete, reviewPending, showSnackbar])

  useEffect(() => {
    const currentState = globalThis.history.state as { idx?: unknown; scenarioDesignLeaveGuard?: unknown } | null
    const currentHistoryIndex = typeof currentState?.idx === 'number' ? currentState.idx : null
    initialScenarioDesignHistoryIndexRef.current =
      currentState?.scenarioDesignLeaveGuard === true && currentHistoryIndex !== null ? currentHistoryIndex - 1 : currentHistoryIndex

    pushScenarioDesignHistoryGuard()

    const handlePopState = () => {
      if (confirmedScenarioDesignLeaveRef.current) return
      leaveScenarioDesignRef.current()
    }

    globalThis.addEventListener('popstate', handlePopState)
    return () => globalThis.removeEventListener('popstate', handlePopState)
  }, [pushScenarioDesignHistoryGuard])

  const criteriaResetDisabled = useMemo(
    () =>
      JSON.stringify(rows) === JSON.stringify(initialRows) &&
      JSON.stringify(visibleScenarioDesignColumns) === JSON.stringify(initialScenarioDesignColumns),
    [initialRows, initialScenarioDesignColumns, rows, visibleScenarioDesignColumns],
  )
  const canCompleteScenarioDesignReview = useMemo(
    () => !hasBlockingScenarioDesignReviewItem(reviewErrorItems) && scenarioNameErrorMessages.size === 0 && isCurrentCriteriaReviewed,
    [isCurrentCriteriaReviewed, reviewErrorItems, scenarioNameErrorMessages.size],
  )
  const handleRowValueChange = useCallback(
    (rowId: number, key: string, value: string) => {
      setRows((currentRows) => {
        let changed = false
        const nextRows = currentRows.map((row, index) => {
          if (getScenarioDesignRowId(row, index + 1) !== rowId) return row
          if (key === 'scenarioName') {
            if ((row.scenarioName ?? '') === value) return row
            changed = true
            return updateScenarioDesignRowScenarioName(row, value)
          }

          const column = visibleScenarioDesignColumns.find((item) => item.key === key)
          if (!column || getScenarioDesignDimensionSelectedValue(row, column.key, column) === value) return row

          changed = true
          return updateScenarioDesignRowDimension(row, column, value)
        })

        return changed ? nextRows : currentRows
      })
    },
    [visibleScenarioDesignColumns],
  )

  const handleAddRow = useCallback(() => {
    setRows((currentRows) => {
      if (currentRows.length >= SCENARIO_DESIGN_MAX_ROW_COUNT) return currentRows

      return [
        ...currentRows,
        createScenarioDesignRow(
          Math.max(0, ...currentRows.map((row) => row.displayOrder ?? 0)) + 1,
          visibleScenarioDesignColumns,
          agentScenarioDesignColumnKeys,
        ),
      ]
    })
  }, [agentScenarioDesignColumnKeys, visibleScenarioDesignColumns])

  const handleDeleteCriteriaColumn = useCallback(
    (key: string) => {
      const column = visibleScenarioDesignColumns.find((item) => item.key === key)
      if (!column || isScenarioDesignRequiredColumn(column)) return

      setVisibleScenarioDesignColumns((currentColumns) => currentColumns.filter((item) => item.key !== key))
      setAdditionalDimensionColumnSources((currentColumns) => currentColumns.filter((item) => item.key !== key))
      setAgentScenarioDesignColumnKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys)
        nextKeys.delete(key)
        return nextKeys
      })
      setRows((currentRows) =>
        currentRows.map((row) => ({
          ...row,
          dimensions: row.dimensions?.filter((dimension) => dimension.key !== key) ?? [],
        })),
      )
    },
    [visibleScenarioDesignColumns],
  )

  const handleRequestAddCriteriaColumns = useCallback(async (): Promise<ScenarioDesignAddCriteriaRequestResult> => {
    if (scenarioGroupId === null) return 'empty'

    const additionalDimensions = await nextGenMIScenarioDesignService.getAdditionalDimensions(scenarioGroupId)
    if (isAdditionalDimensionGenerating(additionalDimensions.generationStatus)) return 'generating'
    if (!isAdditionalDimensionReady(additionalDimensions.generationStatus)) return 'empty'

    const columns = mapAdditionalDimensionCandidatesToColumns(additionalDimensions.candidates, visibleScenarioDesignColumns)
    return columns.length > 0 ? columns : 'empty'
  }, [scenarioGroupId, visibleScenarioDesignColumns])

  const handleAddCriteriaColumns = useCallback((selectedColumns: ScenarioDesignColumn[]) => {
    if (selectedColumns.length === 0) return

    const selectedColumnKeys = selectedColumns.map((column) => column.key)

    setVisibleScenarioDesignColumns((currentColumns) =>
      sortScenarioDesignColumns([
        ...currentColumns,
        ...selectedColumns.filter((column) => !currentColumns.some((currentColumn) => currentColumn.key === column.key)),
      ]),
    )
    setAdditionalDimensionColumnSources((currentColumns) => upsertScenarioDesignAdditionalColumnSources(currentColumns, selectedColumns))
    setAgentScenarioDesignColumnKeys((currentKeys) => new Set([...currentKeys, ...selectedColumnKeys]))
    setRows((currentRows) =>
      currentRows.map((row) =>
        selectedColumns.reduce(
          (nextRow, column) => updateScenarioDesignRowDimension(nextRow, column, SCENARIO_DESIGN_SELECT_COMMON_ACTIONS.agent.value),
          row,
        ),
      ),
    )
  }, [])

  const handleDeleteRow = useCallback((rowId: number) => {
    setRows((currentRows) =>
      currentRows.length <= 1 ? currentRows : currentRows.filter((row, index) => getScenarioDesignRowId(row, index + 1) !== rowId),
    )
  }, [])

  const handleResetCriteriaStep = useCallback(() => {
    if (scenarioGroupId === null) return

    resetScenarioDesignReviewState()
    resetScenarioDesignMutation.mutate(undefined, {
      onSuccess: async () => {
        const presentationResult = await refetchScenarioDesignState()
        const resetState = presentationResult.data ? mapScenarioDesignPresentationToState(presentationResult.data) : undefined
        const resetTable = getScenarioDesignActiveTable(resetState)
        if (resetTable) {
          const nextColumns = createScenarioDesignColumns(resetTable.dimensionColumns, scenarioDimensionTemplates)
          const nextRows = resetTable.scenarios ?? []

          setVisibleScenarioDesignColumns(nextColumns)
          setInitialScenarioDesignColumns(nextColumns)
          setRows(nextRows)
          setInitialRows(nextRows)
          setAgentScenarioDesignColumnKeys(new Set())
          setAdditionalDimensionColumnSources([])
          additionalDimensionLabelHydrationKeyRef.current = ''
        } else {
          setRows(initialRows)
          setVisibleScenarioDesignColumns(initialScenarioDesignColumns)
          setAgentScenarioDesignColumnKeys(new Set())
          setAdditionalDimensionColumnSources([])
          additionalDimensionLabelHydrationKeyRef.current = ''
        }

        await refetchScenarioDesignState()
        showSnackbar('모든 항목이 기본값으로 초기화되었습니다.', { variant: 'success' })
      },
    })
  }, [
    initialRows,
    initialScenarioDesignColumns,
    refetchScenarioDesignState,
    resetScenarioDesignMutation,
    resetScenarioDesignReviewState,
    scenarioGroupId,
    scenarioDimensionTemplates,
    showSnackbar,
  ])

  const handleConfirmClose = useCallback(() => {
    setConfirmType(null)
  }, [])

  const handleCreateScenarioSignposts = useCallback(async () => {
    if (scenarioGroupId === null) return

    signpostStreamReceivedRef.current = false
    signpostStartedScenarioDesignUpdatedAtRef.current = scenarioDesignStateUpdatedAt
    setSignpostPending(true)

    try {
      await createScenarioSignpostsMutation.mutateAsync()
    } catch {
      signpostStartedScenarioDesignUpdatedAtRef.current = 0
      setSignpostPending(false)
      showSnackbar('시나리오 One-view 생성을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
    }
  }, [createScenarioSignpostsMutation, scenarioDesignStateUpdatedAt, scenarioGroupId, showSnackbar])

  const handleConfirm = useCallback(
    (type: ScenarioDesignConfirmType) => {
      setConfirmType(null)

      if (type === 'cancel') {
        void handleCancelScenarioDesign()
        return
      }

      if (type === 'reviewComplete' || type === 'reviewCompleteWithWarning') {
        if (!isCurrentCriteriaReviewed || !canCompleteScenarioDesignReview) return
        void handleCreateScenarioSignposts()
      }
    },
    [canCompleteScenarioDesignReview, handleCancelScenarioDesign, handleCreateScenarioSignposts, isCurrentCriteriaReviewed],
  )

  const handleComplete = useCallback(() => {
    if (!isCurrentCriteriaReviewed || !canCompleteScenarioDesignReview) return
    setConfirmType(hasWarningScenarioDesignReviewItem(reviewErrorItems) ? 'reviewCompleteWithWarning' : 'reviewComplete')
  }, [canCompleteScenarioDesignReview, isCurrentCriteriaReviewed, reviewErrorItems])

  const handleCreateScenarioGroup = useCallback(
    async (value: {
      scenarioGroupName: string
      scenarioGroupSummary: string
      scenarioGroupDescription: string
      scenarioNarratives: Array<{ rowId: number; narrative: string }>
      scenarioPossibilities: Array<{ rowId: number; possibility: number }>
      scenarioSignposts: Array<{ rowId: number; signposts: DesignConfirmSignpost[] }>
    }) => {
      const editTable = createScenarioDesignEditTable(visibleScenarioDesignColumns, rows)
      const narrativeMap = new Map(value.scenarioNarratives.map((item) => [item.rowId, item.narrative]))
      const possibilityMap = new Map(value.scenarioPossibilities.map((item) => [item.rowId, item.possibility]))
      const signpostMap = new Map(value.scenarioSignposts.map((item) => [item.rowId, item.signposts]))
      const minimumLoadingPromise = new Promise<void>((resolve) => {
        globalThis.setTimeout(resolve, 1000)
      })

      setScenarioGroupCreatePending(true)
      try {
        const response = await confirmScenarioDesignMutation.mutateAsync({
          scenarioGroup: {
            title: value.scenarioGroupName,
            summary: value.scenarioGroupSummary,
            description: value.scenarioGroupDescription,
          },
          table: {
            dimensionColumns: editTable.dimensionColumns,
            scenarios: rows.map((row, index) => {
              const rowId = getScenarioDesignRowId(row, index + 1)
              const editRow = editTable.scenarios?.[index]

              return {
                scenarioId: row.scenarioId ?? null,
                displayOrder: row.displayOrder ?? index + 1,
                scenarioName: row.scenarioName ?? '',
                baseCase: row.baseCase ?? false,
                dimensions: editRow?.dimensions ?? [],
                probability: possibilityMap.get(rowId) ?? 0,
                narrative: narrativeMap.get(rowId) ?? '',
                signposts: signpostMap.get(rowId) ?? [],
              }
            }),
          },
        })

        await minimumLoadingPromise
        setScenarioGroupCreatePending(false)
        preserveScenarioDesignGroupRef.current = true
        confirmedScenarioDesignLeaveRef.current = true
        showSnackbar('시나리오 그룹이 생성되었습니다.', { variant: 'success' })
        navigate(getNextGenMIScenarioGroupDetailPath(response.scenarioGroupId ?? scenarioGroupId ?? ''), { replace: true })
      } catch {
        await minimumLoadingPromise
        setScenarioGroupCreatePending(false)
        showSnackbar('시나리오 그룹 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.', { variant: 'error' })
      }
    },
    [confirmScenarioDesignMutation, navigate, rows, scenarioGroupId, showSnackbar, visibleScenarioDesignColumns],
  )

  const headerTitleSlot = useMemo(
    () => (
      <Stack width="100%" paddingTop="20px">
        <Typography variant="titleLarge" fontSize="26px" fontWeight={700} color="contentText.Black" lineHeight={1.4}>
          Scenario Design
        </Typography>
      </Stack>
    ),
    [],
  )

  const headerSectionSlot = useMemo(
    () => (
      <Stack direction="row" alignItems="center" gap="4px" minWidth={0} minHeight="62px" flex={1} position="relative" zIndex={3}>
        <ScenarioDesignProgressStep
          active={currentStep === 'criteria'}
          completed={currentStep === 'oneView'}
          number={1}
          label="시나리오 분기항목 및 분기기준 검토"
          inProgress={currentStep === 'criteria'}
        />
        <Divider sx={{ width: '40px', borderColor: 'gray.20', flexShrink: 0 }} />
        <ScenarioDesignProgressStep
          active={currentStep === 'oneView'}
          number={2}
          label="시나리오 One-view 검토"
          inProgress={currentStep === 'oneView'}
        />
      </Stack>
    ),
    [currentStep],
  )

  const headerRightAction = useMemo(() => <NextGenMIUserFeedback pageTitle="Scenario Design" />, [])

  const criteriaStepProps = useMemo(
    () => ({
      criteria: {
        rows,
        initialRows,
        initialScenarioDesignColumns,
        visibleScenarioDesignColumns,
        agentScenarioDesignColumnKeys,
        scenarioNameErrorMessages,
        dimensionValueErrorMessages: criteriaValidation.dimensionValueErrorMessages,
        onRowValueChange: handleRowValueChange,
        onDeleteRow: handleDeleteRow,
        onDeleteCriteriaColumn: handleDeleteCriteriaColumn,
        onRequestAddCriteriaColumns: handleRequestAddCriteriaColumns,
        onAddCriteriaColumns: handleAddCriteriaColumns,
        onAddRow: handleAddRow,
      },
      baseEvent: {
        events: baseEventItems,
        showRationaleButton: showDesignRationaleButton,
        rationaleText: '',
        rationaleSections: designRationaleSections,
      },
      isLoading: scenarioDesignLoading,
      loadingMessage: scenarioDesignLoadingMessage,
      review: {
        reviewed: isCurrentCriteriaReviewed,
        pending: reviewPending || validateScenarioDesignMutation.isPending,
        completedVisible: reviewCompletedVisible,
        canComplete: canCompleteScenarioDesignReview,
        errorItems: reviewErrorItems,
        onConfirm: startScenarioDesignReview,
        onComplete: handleComplete,
      },
      actions: {
        onCancel: handleCancelScenarioDesignRequest,
        onReset: handleResetCriteriaStep,
        resetDisabled: criteriaResetDisabled || resetScenarioDesignMutation.isPending,
      },
    }),
    [
      agentScenarioDesignColumnKeys,
      baseEventItems,
      canCompleteScenarioDesignReview,
      criteriaValidation.dimensionValueErrorMessages,
      criteriaResetDisabled,
      designRationaleSections,
      handleAddCriteriaColumns,
      handleRequestAddCriteriaColumns,
      handleAddRow,
      handleCancelScenarioDesignRequest,
      handleComplete,
      handleDeleteCriteriaColumn,
      handleDeleteRow,
      handleResetCriteriaStep,
      handleRowValueChange,
      initialRows,
      initialScenarioDesignColumns,
      isCurrentCriteriaReviewed,
      resetScenarioDesignMutation.isPending,
      reviewCompletedVisible,
      reviewErrorItems,
      reviewPending,
      rows,
      scenarioDesignLoading,
      scenarioDesignLoadingMessage,
      scenarioNameErrorMessages,
      showDesignRationaleButton,
      startScenarioDesignReview,
      validateScenarioDesignMutation.isPending,
      visibleScenarioDesignColumns,
    ],
  )

  const confirmContent = useMemo(() => (confirmType ? getScenarioDesignConfirmContent(confirmType) : null), [confirmType])
  const handleConfirmSubmit = useCallback(() => {
    if (!confirmType) return
    handleConfirm(confirmType)
  }, [confirmType, handleConfirm])

  useLayoutEffect(() => {
    publishScenarioDesignHeaderContent({
      backLabel: 'Back',
      backIcon: <ArrowBackRoundedIcon sx={{ fontSize: '20px' }} />,
      onBack: handleLeaveScenarioDesign,
      titleSlot: headerTitleSlot,
      sectionSlot: headerSectionSlot,
      rightAction: headerRightAction,
    })
  }, [handleLeaveScenarioDesign, headerRightAction, headerSectionSlot, headerTitleSlot])

  useLayoutEffect(() => {
    setStickyHeader(<ScenarioDesignHeaderView />, {
      pinMariPosition: true,
      stickyHeightsPx: NEXT_GEN_MI_DETAIL_INITIAL_STICKY_HEIGHTS_PX,
    })

    return () => {
      setStickyHeader(null)
      scenarioDesignHeaderContent = null
    }
  }, [setStickyHeader])

  return (
    <>
      <Stack maxWidth="1380px" margin="auto" padding="12px 12px 0px" position="relative" sx={{ overflowX: 'clip' }}>
        {scenarioDesignGenerationFailure ? (
          <ScenarioDesignGenerationFailureState
            reason={scenarioDesignGenerationFailure.reason}
            retrying={scenarioDesignGenerationRetryPending || scenarioDesignCreationPending}
            onRetry={retryScenarioDesignGeneration}
            onCancel={handleCancelScenarioDesignRequest}
          />
        ) : currentStep === 'oneView' ? (
          <ScenarioDesignOneViewStep
            key={oneViewDefaultKey}
            rows={rows}
            columns={visibleScenarioDesignColumns}
            groupName={scenarioDesignState?.step2?.groupName ?? ''}
            groupSummary={scenarioDesignState?.step2?.summary ?? ''}
            groupDescription={scenarioDesignState?.step2?.description ?? ''}
            loading={scenarioDesignLoading}
            creatingScenarioGroup={scenarioGroupCreatePending || confirmScenarioDesignMutation.isPending}
            onCancel={handleCancelScenarioDesignRequest}
            onCreate={handleCreateScenarioGroup}
          />
        ) : (
          <ScenarioDesignCriteriaStep {...criteriaStepProps} />
        )}
      </Stack>
      <ScenarioDesignConfirmDialog
        open={confirmType !== null}
        content={confirmContent}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmSubmit}
      />
      <ScenarioDesignReviewFailedDialog open={reviewFailedDialogOpen} onClose={() => setReviewFailedDialogOpen(false)} />
    </>
  )
}

export default ScenarioDesignPage
