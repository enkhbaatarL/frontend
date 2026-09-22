import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, CircularProgress, Collapse, Fade, Stack, Typography, useMediaQuery } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SwitchTransition } from 'react-transition-group'

import type {
  ModelExecutionAccept,
  ModelExecutionInputFiles,
  ModelParamProposalCurrentState,
  ScenarioGroupModelParamCompare,
  ScenarioGroupModelParamProposals,
} from '@/service/mi/nextGenMI/modelExecution'
import type { ScenarioRole } from '@/service/mi/nextGenMI/scenarioGroup'

import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText, { NEXT_GEN_MI_TABLE_CELL_PX } from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
import ScenarioModelExecutionGeneratingState from '@/pages/mi/nextGenMI/components/common/ScenarioModelExecutionGeneratingState'
import ScenarioPossibilityGauge from '@/pages/mi/nextGenMI/components/common/ScenarioPossibilityGauge'
import ScenarioRoleBadge from '@/pages/mi/nextGenMI/components/common/ScenarioRoleBadge'
import {
  buildCompareParamMatrixData,
  buildConfirmationParametersFromCompare,
  canShowVisibilityToggle,
  isDimmedStatus,
  mapProposalStateToRowStatus,
  type ModelParamProposalRowStatus,
  updateCompareProposedValue,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/scenarioModelExecutionProposalMapping'
import ScenarioModelExecutionProposalParamPanel from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionProposalParamPanel'
import fileService, { type IFileDownloadRequest } from '@/service/admin/file'
import nextGenMIModelExecutionService from '@/service/mi/nextGenMI/modelExecution'
import nextGenMIScenarioGroupService from '@/service/mi/nextGenMI/scenarioGroup'
import { downloadFile } from '@/utils/file'

const BANNER_MESSAGE = '각 시나리오의 [생성] 버튼을 눌러 추천 파라미터를 생성해 주세요.'
const GENERATING_MESSAGE = '파라미터를 생성하고 있습니다'

interface ScenarioModelExecutionProposalListProps {
  scenarioGroupId: number
  executingScenarioIds: Set<number>
  executedScenarioIds: Set<number>
  isResizing: boolean
  onContentHeightChange: (height: number) => void
  onFillsViewportHeightChange?: (fillsViewportHeight: boolean) => void
  onCancel: () => void
  onAccepted: (scenarioId: number) => void
  onCompleted: (scenarioId: number) => void
  onFailed: (scenarioId: number) => void
}

/** 이전 단건 팝업과 동일: 실행 인풋 엑셀 메타가 완전할 때만 파일 다운로드 가능 */
const getDownloadableExecutionInputFiles = (executionInputFiles?: ModelExecutionInputFiles | null): IFileDownloadRequest[] => {
  if (executionInputFiles?.complete !== true || !executionInputFiles.files?.length) return []

  const downloadableFiles = executionInputFiles.files.flatMap((file) => {
    if (
      typeof file.fileNo !== 'number' ||
      !Number.isInteger(file.fileNo) ||
      file.fileNo <= 0 ||
      typeof file.fileNm !== 'string' ||
      file.fileNm.trim().length === 0 ||
      typeof file.fileSize !== 'number' ||
      !Number.isFinite(file.fileSize) ||
      file.fileSize < 0
    ) {
      return []
    }

    return [{ fileNo: file.fileNo, fileNm: file.fileNm, fileSize: file.fileSize }]
  })

  return downloadableFiles.length === executionInputFiles.files.length ? downloadableFiles : []
}

/** 생성 중인 행은 실행 상태 패치로 덮지 않음. 서버가 PROPOSAL_READY를 유지해도 이번 세션 실행 이력을 살린다. */
const overlayProposalExecutionState = (
  proposals: ScenarioGroupModelParamProposals,
  executedIds: Set<number>,
  executingIds: Set<number>,
): ScenarioGroupModelParamProposals => {
  if (executedIds.size === 0 && executingIds.size === 0) return proposals

  let changed = false
  const scenarios = proposals.scenarios.map((scenario) => {
    if (scenario.currentState === 'GENERATING') return scenario

    let currentState: ModelParamProposalCurrentState | undefined = scenario.currentState
    if (executedIds.has(scenario.scenarioId)) currentState = 'EXECUTED_CONFIRMED'
    else if (executingIds.has(scenario.scenarioId) && currentState !== 'EXECUTED_CONFIRMED') currentState = 'EXECUTING'

    if (currentState === scenario.currentState) return scenario
    changed = true
    return { ...scenario, currentState }
  })

  return changed ? { ...proposals, scenarios } : proposals
}

interface ProposalListDimensionCell {
  value: string
  rationale?: string
}

interface ProposalListScenarioRow {
  scenarioId: number
  displayOrder: number
  scenarioName: string
  baseCase: boolean
  scenarioRole?: ScenarioRole | null
  scenarioRoleLabel?: string | null
  scenarioType?: string | null
  dimensionCells: ProposalListDimensionCell[]
  possibility: number
  status: ModelParamProposalRowStatus
  canRerun: boolean
  failureReason?: string
}

const DimensionInfoIcon = ({ title }: { title: string }) => (
  <NextGenMIFollowCursorTooltip title={title}>
    <Stack
      component="span"
      alignItems="center"
      justifyContent="center"
      width="18px"
      height="18px"
      flexShrink={0}
      color="contentIcon.Enabled"
    >
      <InfoOutlinedIcon aria-hidden sx={{ fontSize: '18px', color: 'inherit' }} />
    </Stack>
  </NextGenMIFollowCursorTooltip>
)

/** 헤더/로우 dimension 셀 공통 레이아웃 - (i) 아이콘을 셀 오른쪽에 동일 정렬 */
const DimensionCellContent = ({
  value,
  tooltipTitle,
  variant,
  color,
  lineClamp,
}: {
  value: string
  tooltipTitle?: string
  variant: 'body2SB14' | 'body2M14'
  color: string
  lineClamp?: number
}) => (
  <Stack direction="row" alignItems="center" gap="6px" flex="1 1 0" minWidth={0} padding={`0 ${NEXT_GEN_MI_TABLE_CELL_PX}px`}>
    <Box flex="1 1 0" minWidth={0}>
      <NextGenMITableBodyText value={value} variant={variant} color={color} lineClamp={lineClamp} tooltipWhenTruncated />
    </Box>
    {tooltipTitle ? <DimensionInfoIcon title={tooltipTitle} /> : <Box width="18px" height="18px" flexShrink={0} aria-hidden />}
  </Stack>
)

const isClientRequestError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  return status !== undefined && status >= 400 && status < 500
}

const isExecutionValidationError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false
  const status = error.response?.status
  const responseData = error.response?.data as { code?: string; message?: string } | undefined
  const code = responseData?.code?.toUpperCase() ?? ''
  const message = responseData?.message ?? ''
  return status === 400 || status === 422 || code.includes('VALID') || message.includes('유효성')
}

const StatusCell = ({
  status,
  canRerun,
  failureReason,
  disabled,
  onGenerate,
  onRerun,
  onRetry,
}: {
  status: ModelParamProposalRowStatus
  canRerun: boolean
  failureReason?: string
  disabled?: boolean
  onGenerate: () => void
  onRerun: () => void
  onRetry: () => void
}) => {
  if (status === 'generating') {
    return (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="4px" width="100%" minWidth={0}>
        <CircularProgress size={20} sx={{ color: 'contentText.Disabled' }} />
        <Typography variant="body2SB14" color="contentText.Disabled" noWrap>
          생성 중
        </Typography>
      </Stack>
    )
  }

  if (status === 'completed') {
    if (canRerun) {
      return (
        <Box
          position="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="32px"
          sx={{
            '& .completed-label': { opacity: 1 },
            '& .rerun-button': { opacity: 0, pointerEvents: 'none' },
            '&:hover .completed-label, &:focus-within .completed-label': { opacity: 0 },
            '&:hover .rerun-button, &:focus-within .rerun-button': { opacity: 1, pointerEvents: 'auto' },
          }}
        >
          <Typography
            className="completed-label"
            variant="body2SB14"
            color="contentText.Subtext"
            textAlign="center"
            width="100%"
            sx={{ transition: 'opacity 150ms ease' }}
          >
            완료
          </Typography>
          <MIBaseButton
            className="rerun-button"
            variant="outlined"
            disabled={disabled}
            onClick={onRerun}
            sx={{
              position: 'absolute',
              height: '32px',
              minWidth: '72px',
              borderRadius: '8px',
              padding: '0 10px',
              transition: 'opacity 150ms ease',
            }}
          >
            재실행
          </MIBaseButton>
        </Box>
      )
    }

    return (
      <NextGenMIFollowCursorTooltip title="다음 수급모델 실행 시 파라미터를 다시 생성할 수 있습니다">
        <Typography component="span" variant="body2SB14" color="contentText.Subtext" textAlign="center" width="100%">
          완료
        </Typography>
      </NextGenMIFollowCursorTooltip>
    )
  }

  if (status === 'failed' || status === 'abstained') {
    const label = (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" minWidth={0}>
        <WarningAmberRoundedIcon sx={{ fontSize: '16px', color: '#ea580c' }} />
        <Typography variant="body2SB14" color="#ea580c" noWrap>
          {status === 'abstained' ? '보류' : '실패'}
        </Typography>
      </Stack>
    )

    if (!failureReason?.trim()) return label

    return (
      <NextGenMIFollowCursorTooltip title={failureReason}>
        <Box component="span" display="inline-flex" width="100%" sx={{ cursor: 'default' }}>
          {label}
        </Box>
      </NextGenMIFollowCursorTooltip>
    )
  }

  if (status === 'retryable') {
    const button = (
      <MIBaseButton
        variant="outlined"
        disabled={disabled}
        onClick={onRetry}
        sx={{ height: '32px', minWidth: '72px', borderRadius: '8px', padding: '0 10px' }}
      >
        재시도
      </MIBaseButton>
    )

    if (!failureReason?.trim()) return button

    return (
      <NextGenMIFollowCursorTooltip title={failureReason}>
        <Box component="span" display="inline-flex">
          {button}
        </Box>
      </NextGenMIFollowCursorTooltip>
    )
  }

  return (
    <MIBaseButton
      variant="outlined"
      disabled={disabled}
      onClick={onGenerate}
      sx={{ height: '32px', minWidth: '72px', borderRadius: '8px', padding: '0 10px' }}
    >
      생성
    </MIBaseButton>
  )
}

const ScenarioModelExecutionProposalList = ({
  scenarioGroupId,
  executingScenarioIds,
  executedScenarioIds,
  isResizing,
  onContentHeightChange,
  onFillsViewportHeightChange,
  onCancel,
  onAccepted,
  onCompleted,
  onFailed,
}: ScenarioModelExecutionProposalListProps) => {
  const { showSnackbar } = useSnackbar()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(true)
  const [groupProposals, setGroupProposals] = useState<ScenarioGroupModelParamProposals | null>(null)
  const [compare, setCompare] = useState<ScenarioGroupModelParamCompare | null>(null)
  const [compareLoadFailed, setCompareLoadFailed] = useState(false)
  const [proposalsLoadFailed, setProposalsLoadFailed] = useState(false)
  const [pendingGenerateIds, setPendingGenerateIds] = useState<Set<number>>(() => new Set())
  const [generationFailureReason, setGenerationFailureReason] = useState<string | null>(null)
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<number[]>([])
  const [visibleScenarioIds, setVisibleScenarioIds] = useState<number[]>([])
  const [paramResetToken, setParamResetToken] = useState(0)
  const [hasParamEdits, setHasParamEdits] = useState(false)
  const [emptySelectionConfirmOpen, setEmptySelectionConfirmOpen] = useState(false)
  const [executionConfirmOpen, setExecutionConfirmOpen] = useState(false)
  const [isSubmittingExecution, setIsSubmittingExecution] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [runningExecutions, setRunningExecutions] = useState<ModelExecutionAccept[]>([])
  const [locallyExecutedIds, setLocallyExecutedIds] = useState<Set<number>>(() => new Set())
  const [awaitingExecutionScenarioIds, setAwaitingExecutionScenarioIds] = useState<Set<number>>(() => new Set())
  const [executedConfirmedScenarioIds, setExecutedConfirmedScenarioIds] = useState<Set<number>>(() => new Set())
  const locallyExecutedIdsRef = useRef<Set<number>>(new Set())
  const runningScenarioIdsRef = useRef<Set<number>>(new Set())
  const graphExecutedIdsRef = useRef<Set<number>>(executedScenarioIds)
  const failureKeyRef = useRef<Map<number, string>>(new Map())
  const groupStreamControllerRef = useRef<AbortController | null>(null)
  const proposalsRequestIdRef = useRef(0)
  const compareRequestIdRef = useRef(0)
  const previousColumnScenarioIdsRef = useRef<number[]>([])
  const lastLoadedCompareRef = useRef<ScenarioGroupModelParamCompare | null>(null)

  locallyExecutedIdsRef.current = locallyExecutedIds
  runningScenarioIdsRef.current = new Set(runningExecutions.map((execution) => execution.scenarioId))
  graphExecutedIdsRef.current = executedScenarioIds

  useEffect(() => {
    setGroupProposals((current) =>
      current
        ? overlayProposalExecutionState(current, new Set([...locallyExecutedIds, ...executedScenarioIds]), runningScenarioIdsRef.current)
        : current,
    )
  }, [executedScenarioIds, locallyExecutedIds])

  useLayoutEffect(() => {
    const content = contentRef.current
    const footer = footerRef.current
    if (!content || !footer) return undefined

    // 스크롤 영역의 자연 높이를 측정해야 팝업 높이 변경이 다시 측정을 유발하지 않는다.
    const measure = () => onContentHeightChange(Math.ceil(content.getBoundingClientRect().height + footer.getBoundingClientRect().height))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [onContentHeightChange])

  const groupQuery = useQuery({
    queryKey: ['nextGenMIScenarioGroupDetail', scenarioGroupId],
    queryFn: () => nextGenMIScenarioGroupService.getScenarioGroupDetail(scenarioGroupId),
    enabled: Boolean(scenarioGroupId),
    refetchOnWindowFocus: false,
  })

  const dimensionColumns = useMemo(() => groupQuery.data?.dimensionColumns ?? [], [groupQuery.data?.dimensionColumns])
  const createdAtLabel = groupQuery.data?.createdAt ? dayjs(groupQuery.data.createdAt).format('MM-DD HH:mm') : '-'
  const groupName = groupQuery.data?.groupName ?? groupProposals?.groupName ?? '-'
  const compareScenarioIds = useMemo(() => new Set((compare?.scenarios ?? []).map((scenario) => scenario.scenarioId)), [compare?.scenarios])

  const proposalByScenarioId = useMemo(() => {
    const map = new Map<number, NonNullable<ScenarioGroupModelParamProposals['scenarios']>[number]>()
    groupProposals?.scenarios.forEach((scenario) => {
      map.set(scenario.scenarioId, scenario)
    })
    return map
  }, [groupProposals?.scenarios])

  const scenarios = useMemo<ProposalListScenarioRow[]>(() => {
    const detailRows = groupQuery.data?.scenarios ?? []

    return detailRows
      .filter((row) => row.status !== 'discarded')
      .map((row) => {
        const proposal = proposalByScenarioId.get(row.scenarioId)
        const status = pendingGenerateIds.has(row.scenarioId)
          ? ('generating' as const)
          : mapProposalStateToRowStatus(proposal?.currentState, false, proposal?.failureReason)

        return {
          scenarioId: row.scenarioId,
          displayOrder: row.displayOrder,
          scenarioName: row.scenarioName,
          baseCase: row.baseCase,
          scenarioRole: row.scenarioRole,
          scenarioRoleLabel: row.scenarioRoleLabel,
          scenarioType: row.scenarioType,
          dimensionCells: dimensionColumns.map((column) => {
            const dimension = row.dimensions.find((item) => item.key === column.key)
            return {
              value: dimension?.valueLabel ?? '-',
              rationale: dimension?.rationale?.trim() || undefined,
            }
          }),
          possibility: row.adjustedProbability ?? row.probability,
          status,
          canRerun:
            status === 'completed' && !awaitingExecutionScenarioIds.has(row.scenarioId) && executedConfirmedScenarioIds.has(row.scenarioId),
          failureReason: proposal?.failureReason ?? undefined,
        }
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [
    awaitingExecutionScenarioIds,
    dimensionColumns,
    executedConfirmedScenarioIds,
    groupQuery.data?.scenarios,
    pendingGenerateIds,
    proposalByScenarioId,
  ])

  const completedScenarioIds = useMemo(
    () => scenarios.filter((scenario) => scenario.status === 'completed').map((scenario) => scenario.scenarioId),
    [scenarios],
  )
  const columnScenarioIds = useMemo(
    () =>
      scenarios
        .filter((scenario) => scenario.status === 'completed' || scenario.status === 'generating')
        .map((scenario) => scenario.scenarioId),
    [scenarios],
  )
  const selectableScenarioIds = completedScenarioIds
  const hasCompleted = completedScenarioIds.length > 0
  const isGeneratingAny = scenarios.some((scenario) => scenario.status === 'generating')
  // 최초 생성 중(완료 0건)에는 스피너 영역만, 파라미터 패널은 완료 1건 이후
  const showGeneratingPlaceholder = !hasCompleted && isGeneratingAny
  const showFailurePlaceholder = !hasCompleted && !isGeneratingAny && Boolean(generationFailureReason)
  const showTableLoading = hasCompleted && compare === null
  const showLoadingPlaceholder = showGeneratingPlaceholder || showTableLoading || showFailurePlaceholder
  const showParamPanel = hasCompleted && compare !== null

  // 완료 상태와 팝업 높이를 같은 프레임에 반영해 표가 먼저 잘렸다가 확장되는 현상을 막는다.
  useLayoutEffect(() => {
    onFillsViewportHeightChange?.(hasCompleted)
  }, [hasCompleted, onFillsViewportHeightChange])

  // 이전 단건 팝업: executionInputFiles.complete. 그룹 zip은 EXECUTED_CONFIRMED.
  // graph executed / 이번 세션 실행 완료도 실행 이력으로 본다.
  const canDownloadInputFiles = useMemo(() => {
    const proposalScenarios = groupProposals?.scenarios ?? []
    return proposalScenarios.some((scenario) => {
      if (scenario.currentState === 'EXECUTED_CONFIRMED') return true
      if (getDownloadableExecutionInputFiles(scenario.executionInputFiles).length > 0) return true
      if (executedScenarioIds.has(scenario.scenarioId)) return true
      if (locallyExecutedIds.has(scenario.scenarioId)) return true
      return false
    })
  }, [executedScenarioIds, groupProposals?.scenarios, locallyExecutedIds])

  const collectDownloadableInputFiles = useCallback(
    () => (groupProposals?.scenarios ?? []).flatMap((scenario) => getDownloadableExecutionInputFiles(scenario.executionInputFiles)),
    [groupProposals?.scenarios],
  )

  const { mutate: downloadGroupInputFiles, isPending: isDownloadingInputFiles } = useMutation({
    mutationFn: async () => {
      try {
        const response = await nextGenMIModelExecutionService.downloadGroupInputFiles(scenarioGroupId)
        return { kind: 'group' as const, response }
      } catch (error) {
        const files = collectDownloadableInputFiles()
        if (files.length === 0) throw error
        const data = await fileService.downloadFiles(`scenario-group-${scenarioGroupId}-model-input-files`, files)
        return { kind: 'files' as const, data }
      }
    },
    onSuccess: (result) => {
      if (result.kind === 'files') {
        downloadFile(result.data, `scenario-group-${scenarioGroupId}-model-input-files.zip`)
        return
      }
      const contentDisposition = result.response.headers?.['content-disposition'] ?? ''
      const fileNameFromHeader = contentDisposition.split('\'\'').pop()?.trim()
      downloadFile(result.response.data, fileNameFromHeader || `scenario-group-${scenarioGroupId}-model-input-files.zip`)
    },
    onError: () => {
      showSnackbar('인풋 파일 다운로드에 실패했습니다.', { variant: 'error' })
    },
  })

  const handleDownloadInputFiles = useCallback(() => {
    if (!canDownloadInputFiles || isDownloadingInputFiles) return
    downloadGroupInputFiles()
  }, [canDownloadInputFiles, downloadGroupInputFiles, isDownloadingInputFiles])

  const visibleScenarios = useMemo(
    () =>
      scenarios
        .filter(
          (scenario) =>
            (scenario.status === 'completed' || scenario.status === 'generating') && visibleScenarioIds.includes(scenario.scenarioId),
        )
        .map((scenario) => ({
          scenarioId: scenario.scenarioId,
          displayOrder: scenario.displayOrder,
          scenarioName: scenario.scenarioName,
          status: scenario.status === 'generating' ? ('generating' as const) : ('completed' as const),
        })),
    [scenarios, visibleScenarioIds],
  )
  const selectedCompletedCount = selectedScenarioIds.filter((scenarioId) => completedScenarioIds.includes(scenarioId)).length
  const allSelectableChecked = selectableScenarioIds.length > 0 && selectableScenarioIds.every((id) => selectedScenarioIds.includes(id))
  const someSelectableChecked = selectableScenarioIds.some((id) => selectedScenarioIds.includes(id))
  // PopupContent 대응: isSubmitting / isExecuting / isResetting
  const isExecuting = runningExecutions.length > 0
  const isExecutionBusy = isSubmittingExecution || isExecuting
  // 시나리오 선택/생성/초기화/실행 등 액션 잠금 (PopupContent 넓은 가드)
  const isActionLocked = isExecutionBusy || isResetting
  // Value 입력 잠금 - PopupContent NumericParameterValueInput: isSubmitting || isResetting
  // (실행 중에는 파라미터 영역을 GeneratingState 로 대체해 인풋 자체가 안 보임)
  const isValueInputLocked = isSubmittingExecution || isResetting

  const applyGroupProposals = useCallback(
    (nextProposals: ScenarioGroupModelParamProposals, notifyFailure = false) => {
      setExecutedConfirmedScenarioIds(
        new Set(
          nextProposals.scenarios
            .filter((scenario) => scenario.currentState === 'EXECUTED_CONFIRMED')
            .map((scenario) => scenario.scenarioId),
        ),
      )
      const executedIds = new Set<number>([...locallyExecutedIdsRef.current, ...graphExecutedIdsRef.current])
      setGroupProposals(overlayProposalExecutionState(nextProposals, executedIds, runningScenarioIdsRef.current))

      setPendingGenerateIds((current) => {
        let changed = false
        const next = new Set(current)
        nextProposals.scenarios.forEach((scenario) => {
          if (!next.has(scenario.scenarioId)) return
          if (scenario.currentState === 'GENERATING') return
          next.delete(scenario.scenarioId)
          changed = true
        })
        return changed ? next : current
      })

      nextProposals.scenarios.forEach((scenario) => {
        const scenarioId = scenario.scenarioId
        if (
          scenario.currentState !== 'PROPOSAL_FAILED' &&
          scenario.currentState !== 'PROPOSAL_NO_CHANGES' &&
          scenario.currentState !== 'PROPOSAL_RETRYABLE'
        ) {
          failureKeyRef.current.delete(scenarioId)
          return
        }

        if (!notifyFailure) return
        const failureKey = `${scenario.currentState}:${scenario.failureReason ?? ''}`
        if (failureKeyRef.current.get(scenarioId) === failureKey) return
        failureKeyRef.current.set(scenarioId, failureKey)
        showSnackbar(
          scenario.currentState === 'PROPOSAL_RETRYABLE' ? '파라미터 생성을 다시 시도해 주세요.' : '파라미터 생성에 실패했습니다.',
          {
            variant: 'error',
            body: scenario.failureReason?.trim() || '잠시 후 다시 시도해 주세요.',
          },
        )
      })
    },
    [showSnackbar],
  )

  const loadGroupProposals = useCallback(
    async (notifyFailure = false) => {
      const requestId = ++proposalsRequestIdRef.current
      setProposalsLoadFailed(false)
      try {
        const proposals = await nextGenMIModelExecutionService.getGroupModelParamProposals(scenarioGroupId)
        if (requestId !== proposalsRequestIdRef.current) return
        applyGroupProposals(proposals, notifyFailure)
      } catch (error) {
        if (requestId !== proposalsRequestIdRef.current) return
        setProposalsLoadFailed(true)
        if (isClientRequestError(error)) {
          showSnackbar('파라미터 상태 조회에 실패했습니다.', { variant: 'error' })
        }
      }
    },
    [applyGroupProposals, scenarioGroupId, showSnackbar],
  )

  const loadCompareProposals = useCallback(async () => {
    const requestId = ++compareRequestIdRef.current
    try {
      const nextCompare = await nextGenMIModelExecutionService.getGroupModelParamProposalsCompare(scenarioGroupId)
      if (requestId !== compareRequestIdRef.current) return
      lastLoadedCompareRef.current = nextCompare
      setCompare(nextCompare)
      setCompareLoadFailed(false)
    } catch (error) {
      if (requestId !== compareRequestIdRef.current) return
      setCompareLoadFailed(true)
      if (isClientRequestError(error)) {
        showSnackbar('파라미터 비교 조회에 실패했습니다.', { variant: 'error' })
      }
    }
  }, [scenarioGroupId, showSnackbar])

  const refreshProposals = useCallback(
    async (notifyFailure = false) => {
      await Promise.all([loadGroupProposals(notifyFailure), loadCompareProposals()])
    },
    [loadCompareProposals, loadGroupProposals],
  )

  const markScenariosExecuted = useCallback((scenarioIds: number[]) => {
    if (scenarioIds.length === 0) return
    setLocallyExecutedIds((current) => {
      const next = new Set(current)
      scenarioIds.forEach((scenarioId) => next.add(scenarioId))
      locallyExecutedIdsRef.current = next
      return next
    })
    setGroupProposals((current) => (current ? overlayProposalExecutionState(current, new Set(scenarioIds), new Set()) : current))
  }, [])

  const markScenariosExecuting = useCallback((scenarioIds: number[]) => {
    if (scenarioIds.length === 0) return
    setGroupProposals((current) =>
      current ? overlayProposalExecutionState(current, locallyExecutedIdsRef.current, new Set(scenarioIds)) : current,
    )
  }, [])

  const syncParamEditBaselineAfterExecution = useCallback(() => {
    // refresh 성공 시 lastLoaded가 최신. 실패해도 직전 조회본으로 복구해 주황 잔상 방지
    if (lastLoadedCompareRef.current) setCompare(lastLoadedCompareRef.current)
    setParamResetToken((token) => token + 1)
  }, [])

  const handleExecutionSettled = useCallback(
    (scenarioId: number) => {
      setAwaitingExecutionScenarioIds((current) => {
        if (!current.has(scenarioId)) return current
        const next = new Set(current)
        next.delete(scenarioId)
        return next
      })
      markScenariosExecuted([scenarioId])
      onCompleted(scenarioId)
      // 실행 중 GeneratingState 로 파라미터가 언마운트되었다가 복귀할 때,
      // 서버 조회값 기준으로 baseline/수정표시를 다시 맞춰 주황 잔상을 막음
      void refreshProposals().finally(syncParamEditBaselineAfterExecution)
    },
    [markScenariosExecuted, onCompleted, refreshProposals, syncParamEditBaselineAfterExecution],
  )

  const handleExecutionFailed = useCallback(
    (scenarioId: number) => {
      onFailed(scenarioId)
      setGroupProposals((current) => {
        if (!current) return current
        let changed = false
        const scenarios = current.scenarios.map((scenario) => {
          if (scenario.scenarioId !== scenarioId || scenario.currentState === 'GENERATING') return scenario
          if (scenario.currentState === 'EXECUTION_FAILED') return scenario
          changed = true
          return { ...scenario, currentState: 'EXECUTION_FAILED' as const }
        })
        return changed ? { ...current, scenarios } : current
      })
      void refreshProposals().finally(syncParamEditBaselineAfterExecution)
    },
    [onFailed, refreshProposals, syncParamEditBaselineAfterExecution],
  )

  useEffect(() => {
    if (!scenarioGroupId) return undefined

    void loadGroupProposals()
    void loadCompareProposals()
    return undefined
    // groupQuery.dataUpdatedAt 에 묶지 않음 - 상세 갱신마다 proposals 재조회로 중복/취소 요청이 생김
  }, [loadCompareProposals, loadGroupProposals, scenarioGroupId])

  useLayoutEffect(() => {
    setSelectedScenarioIds((prev) => {
      const next = prev.filter((scenarioId) => completedScenarioIds.includes(scenarioId))
      return next.length === prev.length ? prev : next
    })
    const previousColumnScenarioIds = previousColumnScenarioIdsRef.current
    previousColumnScenarioIdsRef.current = columnScenarioIds
    setVisibleScenarioIds((prev) => {
      const next = prev.filter((scenarioId) => columnScenarioIds.includes(scenarioId))
      const missing = columnScenarioIds.filter(
        (scenarioId) => !previousColumnScenarioIds.includes(scenarioId) && !next.includes(scenarioId),
      )
      if (missing.length > 0) next.push(...missing)
      return next.length === prev.length && next.every((scenarioId, index) => scenarioId === prev[index]) ? prev : next
    })
  }, [columnScenarioIds, completedScenarioIds])

  // 그룹 SSE - 팝업당 1연결
  useEffect(() => {
    if (!scenarioGroupId) return undefined

    const controller = new AbortController()
    groupStreamControllerRef.current = controller
    let hasConnected = false

    void nextGenMIModelExecutionService
      .streamGroupModelParamProposals(
        scenarioGroupId,
        ({ event }) => {
          if (event === 'connected') {
            if (hasConnected) void refreshProposals()
            hasConnected = true
            return
          }
          if (event !== 'model-parameter-proposal') return
          void refreshProposals(true)
        },
        controller.signal,
      )
      .catch(() => undefined)
      .finally(() => {
        if (groupStreamControllerRef.current === controller) groupStreamControllerRef.current = null
      })

    return () => {
      controller.abort()
      if (groupStreamControllerRef.current === controller) groupStreamControllerRef.current = null
    }
  }, [refreshProposals, scenarioGroupId])

  useEffect(() => {
    if (runningExecutions.length === 0) return undefined

    let isActive = true
    const timers = new Map<string, ReturnType<typeof globalThis.setTimeout>>()

    const poll = async (execution: ModelExecutionAccept) => {
      try {
        const status = await nextGenMIModelExecutionService.getModelExecutionStatus(execution.scenarioId, execution.runId)
        if (!isActive) return
        if (status.status === 'RUNNING') {
          timers.set(
            execution.runId,
            globalThis.setTimeout(() => {
              void poll(execution)
            }, 5000),
          )
          return
        }

        setRunningExecutions((current) => current.filter((item) => item.runId !== execution.runId))
        if (status.status === 'COMPLETED') {
          handleExecutionSettled(execution.scenarioId)
          return
        }

        handleExecutionFailed(execution.scenarioId)
        showSnackbar('MI 수급모델 실행에 실패했습니다.', {
          variant: 'error',
          body: status.errorMessage || status.failureReason || '잠시 후 다시 시도해 주세요.',
        })
      } catch {
        if (!isActive) return
        timers.set(
          execution.runId,
          globalThis.setTimeout(() => {
            void poll(execution)
          }, 5000),
        )
      }
    }

    runningExecutions.forEach((execution) => {
      void poll(execution)
    })

    return () => {
      isActive = false
      timers.forEach((timerId) => globalThis.clearTimeout(timerId))
    }
  }, [handleExecutionFailed, handleExecutionSettled, runningExecutions, showSnackbar])

  const { mutate: createModelParamProposal } = useMutation({
    mutationFn: (scenarioId: number) => nextGenMIModelExecutionService.createModelParamProposal(scenarioId),
    onSuccess: (accepted, scenarioId) => {
      if (accepted.status === 'FAILED') {
        setAwaitingExecutionScenarioIds((current) => {
          const next = new Set(current)
          next.delete(scenarioId)
          return next
        })
        setPendingGenerateIds((current) => {
          const next = new Set(current)
          next.delete(scenarioId)
          return next
        })
        void refreshProposals(true)
        return
      }
      void refreshProposals(true)
    },
    onError: (error, scenarioId) => {
      setAwaitingExecutionScenarioIds((current) => {
        const next = new Set(current)
        next.delete(scenarioId)
        return next
      })
      setPendingGenerateIds((current) => {
        const next = new Set(current)
        next.delete(scenarioId)
        return next
      })
      const responseData = axios.isAxiosError(error)
        ? (error.response?.data as { data?: { failureReason?: string } | null } | undefined)
        : undefined
      const failureReason =
        responseData?.data?.failureReason?.trim() || (error instanceof Error && !axios.isAxiosError(error) ? error.message : '')
      setGenerationFailureReason(failureReason || null)
      showSnackbar('파라미터 생성에 실패했습니다.', { variant: 'error', body: failureReason || undefined })
      void refreshProposals(true)
    },
  })

  const startGeneration = useCallback(
    (scenarioId: number) => {
      if (isActionLocked || executingScenarioIds.has(scenarioId) || pendingGenerateIds.has(scenarioId)) return
      setGenerationFailureReason(null)
      setAwaitingExecutionScenarioIds((current) => new Set(current).add(scenarioId))
      setPendingGenerateIds((current) => new Set(current).add(scenarioId))
      setVisibleScenarioIds((prev) => (prev.includes(scenarioId) ? prev : [...prev, scenarioId]))
      createModelParamProposal(scenarioId)
    },
    [createModelParamProposal, executingScenarioIds, isActionLocked, pendingGenerateIds],
  )

  const handleToggleVisibility = useCallback(
    (scenarioId: number) => {
      if (isActionLocked) return
      setVisibleScenarioIds((prev) => {
        if (prev.includes(scenarioId)) return prev.filter((id) => id !== scenarioId)
        return [...prev, scenarioId]
      })
    },
    [isActionLocked],
  )

  const handleToggleScenario = useCallback(
    (scenarioId: number, checked: boolean) => {
      if (isActionLocked || !selectableScenarioIds.includes(scenarioId)) return
      setSelectedScenarioIds((prev) => {
        if (checked) return prev.includes(scenarioId) ? prev : [...prev, scenarioId]
        return prev.filter((id) => id !== scenarioId)
      })
    },
    [isActionLocked, selectableScenarioIds],
  )

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (isActionLocked) return
      setSelectedScenarioIds(checked ? [...selectableScenarioIds] : [])
    },
    [isActionLocked, selectableScenarioIds],
  )

  const handleExecuteClick = () => {
    if (isActionLocked) return
    if (selectedCompletedCount === 0) {
      setEmptySelectionConfirmOpen(true)
      return
    }
    setExecutionConfirmOpen(true)
  }

  const handleExecutionConfirm = async () => {
    setExecutionConfirmOpen(false)
    const targetIds = selectedScenarioIds.filter((scenarioId) => completedScenarioIds.includes(scenarioId))
    if (targetIds.length === 0 || !compare) return

    const executions = targetIds.flatMap((scenarioId) => {
      if (executingScenarioIds.has(scenarioId)) return []

      const proposalId =
        proposalByScenarioId.get(scenarioId)?.modelParamProposalId ??
        compare.scenarios.find((scenario) => scenario.scenarioId === scenarioId)?.modelParamProposalId
      if (typeof proposalId !== 'number' || !Number.isInteger(proposalId) || proposalId <= 0) return []
      if (!compareScenarioIds.has(scenarioId)) return []

      return [
        {
          scenarioId,
          modelParamProposalId: proposalId,
          confirmationParameters: buildConfirmationParametersFromCompare(compare, scenarioId),
        },
      ]
    })

    if (executions.length === 0) return

    setIsSubmittingExecution(true)
    try {
      const accepted = await nextGenMIModelExecutionService.submitGroupModelExecutions(scenarioGroupId, { executions })
      const running: ModelExecutionAccept[] = []
      const completedIds: number[] = []

      accepted.results.forEach((result) => {
        if (!result.success || !result.execution) {
          handleExecutionFailed(result.scenarioId)
          showSnackbar('MI 수급모델 실행에 실패했습니다.', {
            variant: 'error',
            body: result.errorMessage?.trim() || '잠시 후 다시 시도해 주세요.',
          })
          return
        }

        const execution = result.execution
        if (execution.status === 'FAILED') {
          handleExecutionFailed(execution.scenarioId)
          showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
          return
        }

        onAccepted(execution.scenarioId)

        if (execution.status === 'COMPLETED') {
          completedIds.push(execution.scenarioId)
          onCompleted(execution.scenarioId)
          return
        }
        running.push(execution)
      })

      if (completedIds.length > 0) {
        setAwaitingExecutionScenarioIds((current) => {
          const next = new Set(current)
          completedIds.forEach((scenarioId) => next.delete(scenarioId))
          return next.size === current.size ? current : next
        })
        markScenariosExecuted(completedIds)
        void refreshProposals().finally(syncParamEditBaselineAfterExecution)
      }

      if (running.length > 0) {
        setRunningExecutions((current) => [...current, ...running])
        markScenariosExecuting(running.map((execution) => execution.scenarioId))
      }

      if (accepted.successCount > 0) {
        showSnackbar(`선택한 시나리오 ${accepted.successCount}개로 MI 수급모델 실행을 요청했습니다.`, { variant: 'success' })
      }
    } catch (error) {
      if (isExecutionValidationError(error)) {
        showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파라미터 내용을 확인해 주세요.' })
      } else {
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
      }
      // 제출 실패 시에도 GeneratingState 언마운트 복귀 후 수정 표시가 어긋나지 않게 동기화
      if (lastLoadedCompareRef.current) setCompare(lastLoadedCompareRef.current)
      setParamResetToken((token) => token + 1)
    } finally {
      setIsSubmittingExecution(false)
    }
  }

  const handleResetParameters = () => {
    if (isActionLocked) return
    setIsResetting(true)
    // 서버 재조회 전에 마지막 조회본으로 되돌려, baseline 스냅샷이 수정값을 집어가지 않게 함
    if (lastLoadedCompareRef.current) setCompare(lastLoadedCompareRef.current)
    setParamResetToken((token) => token + 1)
    // 편집값을 서버 제안값으로 되돌리기 위해 비교 그리드를 재조회
    void loadCompareProposals().finally(() => setIsResetting(false))
  }

  const handleChangeScenarioValue = useCallback(
    ({
      scenarioId,
      modelFileName,
      modelSheetName,
      modelTableName,
      parameterIndex,
      periodTimeKey,
      rowIndex,
      nextValue,
    }: {
      scenarioId: number
      modelFileName: string | null
      modelSheetName: string | null
      modelTableName: string | null
      parameterIndex: number
      periodTimeKey: string
      rowIndex: number
      nextValue: number
    }) => {
      // PopupContent: Value 변경은 isSubmitting || isResetting 동안 차단
      if (isValueInputLocked) return
      setCompare((current) => {
        if (!current) return current

        const matrix = buildCompareParamMatrixData({
          compare: current,
          visibleScenarioIds: [scenarioId],
          modelFileName,
          modelSheetName,
          modelTableName,
          parameterIndex,
        })
        const period = matrix?.periods.find((item) => item.timeKey === periodTimeKey)
        const sourceRowIndex = period?.sourceRowIndexesByScenarioId[scenarioId]?.[rowIndex] ?? -1
        if (sourceRowIndex < 0) return current

        return updateCompareProposedValue(
          current,
          modelFileName,
          modelSheetName,
          modelTableName,
          parameterIndex,
          scenarioId,
          sourceRowIndex,
          nextValue,
        )
      })
    },
    [isValueInputLocked],
  )

  const scenarioList = useMemo(
    () =>
      groupQuery.data ? (
        <Stack paddingBottom="10px" margin="0 4px">
          <Stack
            component="button"
            type="button"
            direction="row"
            alignItems="center"
            gap="0"
            width="100%"
            height="48px"
            padding="0"
            border="none"
            borderBottom="1px solid"
            borderColor="contentBorder.Normal"
            bgcolor="commonColor.White"
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Stack width="32px" flexShrink={0} alignItems="center" justifyContent="center">
              <KeyboardArrowDownRounded
                sx={{
                  fontSize: '20px',
                  color: expanded ? 'contentIcon.Activeb' : 'contentIcon.Enabled',
                  transition: 'transform 150ms ease',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </Stack>
            <Typography variant="body2M14" color="contentText.Black" width="110px" flexShrink={0} noWrap>
              {createdAtLabel}
            </Typography>
            <Box width="10px" flexShrink={0} />
            <Box flex="1 1 0" minWidth={0} paddingRight="12px">
              <NextGenMITableBodyText value={groupName} variant="body1SB16" color="contentText.Black" tooltipWhenTruncated />
            </Box>
          </Stack>

          <Collapse in={expanded} timeout={180} unmountOnExit={false}>
            <Box overflow="hidden">
              <Stack
                direction="row"
                alignItems="center"
                height="48px"
                bgcolor="commonColor.White"
                borderBottom="0.5px solid"
                borderColor="contentBorder.Active"
              >
                <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center">
                  <AdminCheckbox
                    size="small"
                    checked={allSelectableChecked}
                    indeterminate={!allSelectableChecked && someSelectableChecked}
                    disabled={selectableScenarioIds.length === 0 || isActionLocked}
                    onChange={(_, checked) => handleToggleAll(checked)}
                    sx={{ padding: '4px' }}
                  />
                </Stack>
                <Typography variant="body2SB14" color="contentText.Black" width="300px" flexShrink={0} padding="0 6px">
                  시나리오
                </Typography>
                <Stack direction="row" flex="1 1 0" minWidth={0}>
                  {dimensionColumns.map((column) => {
                    const headerTooltipTitle = column.description?.trim() || column.rationale?.trim()
                    return (
                      <DimensionCellContent
                        key={column.key}
                        value={column.label}
                        tooltipTitle={headerTooltipTitle || undefined}
                        variant="body2SB14"
                        color="contentText.Black"
                        lineClamp={2}
                      />
                    )
                  })}
                </Stack>
                <Typography variant="body2SB14" color="contentText.Black" width="100px" flexShrink={0} textAlign="center">
                  실행가능성
                </Typography>
                <Typography variant="body2SB14" color="contentText.Black" width="92px" flexShrink={0} textAlign="center">
                  상태
                </Typography>
              </Stack>

              {scenarios.map((scenario) => {
                const selectable = scenario.status === 'completed'
                const checked = selectedScenarioIds.includes(scenario.scenarioId)
                const dimmed = isDimmedStatus(scenario.status)
                // 완료된 시나리오가 있으면 비교 데이터 로딩과 관계없이 컬럼 표시 상태를 선택할 수 있다.
                const showEye = hasCompleted && canShowVisibilityToggle(scenario.status)
                const textColor = dimmed ? 'contentText.Disabled' : 'contentText.Black'
                const bodyColor = dimmed ? 'contentText.Disabled' : 'contentText.Normal'
                const generateDisabled = executingScenarioIds.has(scenario.scenarioId) || isActionLocked
                const hasRoleBadge = Boolean(scenario.scenarioRole || scenario.scenarioType || scenario.scenarioRoleLabel)
                const selectionDisabled = !selectable || isActionLocked
                const eyeInteractive = !isActionLocked && (scenario.status === 'completed' || scenario.status === 'generating')

                return (
                  <Stack
                    key={scenario.scenarioId}
                    direction="row"
                    alignItems="center"
                    height="48px"
                    borderBottom="1px solid"
                    borderColor="contentBorder.Normal"
                    sx={{ '&:last-of-type': { borderBottom: 'none' } }}
                  >
                    <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center">
                      {/* 생성 전/생성중/실패/재시도도 체크박스 표시 - 완료만 선택 가능, 그 외 disabled (Gray/20 fill + Gray/40 border) */}
                      <AdminCheckbox
                        size="small"
                        checked={checked}
                        disabled={selectionDisabled}
                        onChange={(_, nextChecked) => handleToggleScenario(scenario.scenarioId, nextChecked)}
                        sx={{ padding: '4px' }}
                      />
                    </Stack>
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap="6px"
                      width="300px"
                      flexShrink={0}
                      minWidth={0}
                      padding="0 6px"
                      sx={{ opacity: dimmed ? 0.5 : 1 }}
                    >
                      <NextGenMIDisplayOrderBadge value={scenario.displayOrder} disabled={dimmed} />
                      {hasRoleBadge ? (
                        <ScenarioRoleBadge role={scenario.scenarioRole} type={scenario.scenarioType} label={scenario.scenarioRoleLabel} />
                      ) : null}
                      {!hasRoleBadge && scenario.baseCase ? <NextGenMIBaseCaseChip disabled={dimmed} /> : null}
                      <Box flex="1 1 0" minWidth={0}>
                        <NextGenMITableBodyText value={scenario.scenarioName} variant="body1SB16" color={textColor} tooltipWhenTruncated />
                      </Box>
                      {showEye && (
                        <Box
                          component="button"
                          type="button"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          width="18px"
                          height="18px"
                          flexShrink={0}
                          padding={0}
                          border="none"
                          bgcolor="transparent"
                          color={visibleScenarioIds.includes(scenario.scenarioId) ? 'contentIcon.Enabled' : 'contentIcon.Disabled'}
                          sx={{
                            cursor: eyeInteractive ? 'pointer' : 'default',
                            opacity: eyeInteractive ? 1 : 0.5,
                          }}
                          aria-label={visibleScenarioIds.includes(scenario.scenarioId) ? '파라미터 컬럼 숨기기' : '파라미터 컬럼 표시'}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (!eyeInteractive) return
                            handleToggleVisibility(scenario.scenarioId)
                          }}
                        >
                          {visibleScenarioIds.includes(scenario.scenarioId) ? (
                            <VisibilityIcon width="16px" height="16px" />
                          ) : (
                            <VisibilityOffIcon width="16px" height="16px" />
                          )}
                        </Box>
                      )}
                    </Stack>
                    <Stack direction="row" flex="1 1 0" minWidth={0} sx={{ opacity: dimmed ? 0.5 : 1 }}>
                      {scenario.dimensionCells.map((cell, index) => (
                        <DimensionCellContent
                          key={`${scenario.scenarioId}-${dimensionColumns[index]?.key ?? index}`}
                          value={cell.value}
                          tooltipTitle={cell.rationale || undefined}
                          variant="body2M14"
                          color={bodyColor}
                        />
                      ))}
                    </Stack>
                    <Stack width="100px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                      <ScenarioPossibilityGauge probability={scenario.possibility} disabled={dimmed} hideHoverBackground />
                    </Stack>
                    <Stack
                      width="92px"
                      flexShrink={0}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ padding: '0 6px', boxSizing: 'border-box' }}
                    >
                      <StatusCell
                        status={scenario.status}
                        canRerun={scenario.canRerun}
                        failureReason={scenario.failureReason}
                        disabled={generateDisabled}
                        onGenerate={() => startGeneration(scenario.scenarioId)}
                        onRerun={() => startGeneration(scenario.scenarioId)}
                        onRetry={() => startGeneration(scenario.scenarioId)}
                      />
                    </Stack>
                  </Stack>
                )
              })}
            </Box>
          </Collapse>
        </Stack>
      ) : null,
    [
      allSelectableChecked,
      createdAtLabel,
      dimensionColumns,
      executingScenarioIds,
      expanded,
      groupName,
      groupQuery.data,
      handleToggleAll,
      handleToggleScenario,
      handleToggleVisibility,
      hasCompleted,
      isActionLocked,
      scenarios,
      selectableScenarioIds.length,
      selectedScenarioIds,
      someSelectableChecked,
      startGeneration,
      visibleScenarioIds,
    ],
  )

  return (
    <Stack width="100%" flex="1 1 auto" minHeight={0} overflow="hidden">
      <Stack flex="1 1 auto" minHeight={0} overflow={isResizing ? 'hidden' : 'auto'}>
        <Stack ref={contentRef} flexGrow={showParamPanel ? 1 : 0} flexShrink={0}>
          <Stack flexShrink={0} padding="10px 20px 0">
            <Stack
              direction="row"
              alignItems="flex-start"
              gap="8px"
              padding="10px 16px"
              borderRadius="8px"
              bgcolor="gray.5"
              marginBottom="10px"
            >
              <InfoOutlineIcon width="18px" height="18px" aria-hidden />
              <Typography fontSize="13px" fontWeight={500} color="contentText.Normal" lineHeight={1.4}>
                {BANNER_MESSAGE}
              </Typography>
            </Stack>

            <SwitchTransition mode="out-in">
              <Fade
                key={groupQuery.data && groupProposals ? 'scenarios' : 'loading'}
                timeout={reduceMotion ? 0 : { exit: 120, enter: 220 }}
              >
                <Stack>
                  {!groupQuery.data || !groupProposals ? (
                    <Stack height="120px" alignItems="center" justifyContent="center" gap="8px">
                      {groupQuery.isError || proposalsLoadFailed ? (
                        <>
                          <Typography variant="body3SB12" color="contentText.Subtext">
                            시나리오 목록과 파라미터 상태를 불러오지 못했습니다.
                          </Typography>
                          <MIBaseButton
                            variant="outlined"
                            onClick={() => {
                              void groupQuery.refetch()
                              void refreshProposals()
                            }}
                          >
                            다시 시도
                          </MIBaseButton>
                        </>
                      ) : (
                        <>
                          <MIAgentSpinner size={24} tone="gray" />
                          <Typography variant="body3SB12" color="contentText.Subtext">
                            시나리오 목록과 파라미터 상태를 불러오는 중입니다.
                          </Typography>
                        </>
                      )}
                    </Stack>
                  ) : (
                    scenarioList
                  )}
                </Stack>
              </Fade>
            </SwitchTransition>
          </Stack>

          {(showLoadingPlaceholder || showParamPanel || isExecutionBusy) && (
            <SwitchTransition mode="out-in">
              <Fade
                key={isExecutionBusy ? 'execution' : showParamPanel ? 'parameters' : showFailurePlaceholder ? 'failed' : 'generating'}
                timeout={reduceMotion ? 0 : { exit: 120, enter: 220 }}
              >
                <Stack
                  minHeight={showParamPanel && !isExecutionBusy ? 0 : '400px'}
                  flexGrow={showParamPanel || isExecutionBusy ? 1 : 0}
                  flexShrink={0}
                >
                  {isExecutionBusy ? (
                    // PopupContent: isSubmitting || isExecuting 이면 파라미터 UI 대신 실행 중 상태
                    <ScenarioModelExecutionGeneratingState />
                  ) : showParamPanel && compare ? (
                    <ScenarioModelExecutionProposalParamPanel
                      visibleScenarios={visibleScenarios}
                      compare={compare}
                      resetToken={paramResetToken}
                      disabled={isValueInputLocked}
                      canDownloadInputFiles={canDownloadInputFiles}
                      isDownloadingInputFiles={isDownloadingInputFiles}
                      onDownloadInputFiles={handleDownloadInputFiles}
                      onHasEditsChange={setHasParamEdits}
                      onChangeScenarioValue={handleChangeScenarioValue}
                    />
                  ) : (
                    <Stack minHeight="400px" flexGrow={1} alignItems="center" justifyContent="center" gap="10px" padding="0 20px">
                      {showFailurePlaceholder ? (
                        <>
                          <ErrorOutlineIcon width={24} height={24} />
                          <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
                            {generationFailureReason}
                          </Typography>
                        </>
                      ) : showTableLoading && compareLoadFailed ? (
                        <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
                          테이블 데이터를 불러오지 못했습니다.
                        </Typography>
                      ) : (
                        <>
                          <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
                          <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
                            {showTableLoading ? '테이블 데이터를 불러오는 중입니다.' : GENERATING_MESSAGE}
                          </Typography>
                        </>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Fade>
            </SwitchTransition>
          )}
        </Stack>
      </Stack>

      <Stack
        ref={footerRef}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        flexShrink={0}
        height="76px"
        padding="20px"
        boxSizing="border-box"
      >
        <MIBaseButton
          variant="outlined"
          disabled={!hasCompleted || !hasParamEdits || isActionLocked}
          isLoading={isResetting}
          prefix={<ReplayIcon width={20} height={20} />}
          onClick={handleResetParameters}
          sx={{ height: '36px', borderRadius: '8px', padding: '8px 10px 8px 6px' }}
        >
          초기화
        </MIBaseButton>
        <Stack direction="row" alignItems="center" gap="8px">
          <MIBaseButton
            variant="outlined"
            disabled={isSubmittingExecution}
            onClick={onCancel}
            sx={{ height: '36px', borderRadius: '8px', padding: '0 10px' }}
          >
            취소
          </MIBaseButton>
          <MIBaseButton
            variant="contained"
            disabled={!hasCompleted || isActionLocked}
            isLoading={isSubmittingExecution}
            onClick={handleExecuteClick}
            labelColor="contentText.White"
            sx={{
              height: '36px',
              borderRadius: '8px',
              padding: '8px 10px',
              backgroundColor: 'mari.Primary',
              '&:hover:not(:disabled)': {
                backgroundColor: 'mari.Primary',
              },
              // 완료 시나리오 0건이면 비활성 - 스펙 disabled 색
              '&.Mui-disabled': {
                backgroundColor: '#C3CAEE',
                color: 'contentText.White',
              },
              '&.Mui-disabled .MuiTypography-root, &.Mui-disabled svg': {
                color: 'contentText.White',
              },
            }}
          >
            {selectedCompletedCount > 0 ? `MI 수급모델 실행 (${selectedCompletedCount})` : 'MI 수급모델 실행'}
          </MIBaseButton>
        </Stack>
      </Stack>

      <MIConfirm
        open={emptySelectionConfirmOpen}
        title="실행할 시나리오를 선택해 주세요"
        handleClose={() => setEmptySelectionConfirmOpen(false)}
        width="450px"
        zIndex={1400}
        actions={[
          {
            label: '확인',
            variant: 'filled',
            color: 'primary',
            onClick: () => setEmptySelectionConfirmOpen(false),
          },
        ]}
      >
        수급모델을 실행하려면 시나리오를 1개 이상 선택해 주세요.
      </MIConfirm>

      <MIConfirm
        open={executionConfirmOpen}
        title="MI 수급모델을 실행하시겠습니까?"
        handleClose={() => setExecutionConfirmOpen(false)}
        width="450px"
        zIndex={1400}
        actions={[
          {
            label: '취소',
            variant: 'outlined',
            color: 'gray',
            onClick: () => setExecutionConfirmOpen(false),
          },
          {
            label: '실행',
            variant: 'filled',
            color: 'primary',
            disabled: isActionLocked,
            onClick: () => {
              void handleExecutionConfirm()
            },
          },
        ]}
      >
        선택한 시나리오와 파라미터 기준으로 수급모델을 실행합니다. 실행 가능한 시나리오만 실행되며, 실패 상태의 시나리오는 제외됩니다.
      </MIConfirm>
    </Stack>
  )
}

export default ScenarioModelExecutionProposalList
