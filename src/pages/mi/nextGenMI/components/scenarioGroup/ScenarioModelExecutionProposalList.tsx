import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Checkbox, CircularProgress, Collapse, Stack, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ScenarioModelExecutionOption } from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'
import type {
  CurrentModelParamProposal,
  ModelExecutionAccept,
  ScenarioGroupModelParamCompare,
  ScenarioGroupModelParamProposals,
} from '@/service/mi/nextGenMI/modelExecution'
import type { ScenarioRole } from '@/service/mi/nextGenMI/scenarioGroup'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import InfoOutlineIcon from '@/components/common/icons/InfoOutlineIcon'
import ReplayIcon from '@/components/common/icons/ReplayIcon'
import VisibilityIcon from '@/components/common/icons/VisibilityIcon'
import VisibilityOffIcon from '@/components/common/icons/VisibilityOffIcon'
import useSnackbar from '@/hooks/useSnackbar'
import { NextGenMIBaseCaseChip } from '@/pages/mi/nextGenMI/components/common/ClassificationTag'
import NextGenMIDisplayOrderBadge from '@/pages/mi/nextGenMI/components/common/NextGenMIDisplayOrderBadge'
import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import NextGenMITableBodyText from '@/pages/mi/nextGenMI/components/common/NextGenMITableBodyText'
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

/** 8c8e9629 기준 - executionInputFiles 가 완전할 때만 다운로드 가능 */
const getDownloadableExecutionInputFiles = (proposal: CurrentModelParamProposal | null): IFileDownloadRequest[] => {
  const executionInputFiles = proposal?.executionInputFiles
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

interface ScenarioModelExecutionProposalListProps {
  scenarioGroupId: number
  scenarioOptions: ScenarioModelExecutionOption[]
  executingScenarioIds: Set<number>
  fillsViewportHeight?: boolean
  onFillsViewportHeightChange?: (fillsViewportHeight: boolean) => void
  onCancel: () => void
  onAccepted: (scenarioId: number) => void
  onCompleted: (scenarioId: number) => void
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
  failureReason?: string
  discarded: boolean
}

const DimensionInfoIcon = ({ title }: { title: string }) => (
  <NextGenMIFollowCursorTooltip title={title}>
    <Stack
      component="span"
      alignItems="center"
      justifyContent="center"
      width="16px"
      height="16px"
      flexShrink={0}
      color="contentIcon.Enabled"
    >
      <InfoOutlinedIcon aria-hidden sx={{ fontSize: '16px', color: 'inherit' }} />
    </Stack>
  </NextGenMIFollowCursorTooltip>
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
  failureReason,
  disabled,
  onGenerate,
  onRetry,
}: {
  status: ModelParamProposalRowStatus
  failureReason?: string
  disabled?: boolean
  onGenerate: () => void
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
    return (
      <Typography variant="body2SB14" color="contentText.Subtext" textAlign="center" width="100%">
        완료
      </Typography>
    )
  }

  if (status === 'failed') {
    const label = (
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" minWidth={0}>
        <WarningAmberRoundedIcon sx={{ fontSize: '16px', color: '#ea580c' }} />
        <Typography variant="body2SB14" color="#ea580c" noWrap>
          실패
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
  scenarioOptions,
  executingScenarioIds,
  fillsViewportHeight = false,
  onFillsViewportHeightChange,
  onCancel,
  onAccepted,
  onCompleted,
}: ScenarioModelExecutionProposalListProps) => {
  const { showSnackbar } = useSnackbar()
  const [expanded, setExpanded] = useState(true)
  const [groupProposals, setGroupProposals] = useState<ScenarioGroupModelParamProposals | null>(null)
  const [compare, setCompare] = useState<ScenarioGroupModelParamCompare | null>(null)
  const [pendingGenerateIds, setPendingGenerateIds] = useState<Set<number>>(() => new Set())
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<number[]>([])
  const [visibleScenarioIds, setVisibleScenarioIds] = useState<number[]>([])
  const [paramResetToken, setParamResetToken] = useState(0)
  const [hasParamEdits, setHasParamEdits] = useState(false)
  const [emptySelectionConfirmOpen, setEmptySelectionConfirmOpen] = useState(false)
  const [executionConfirmOpen, setExecutionConfirmOpen] = useState(false)
  const [isSubmittingExecution, setIsSubmittingExecution] = useState(false)
  const [runningExecutions, setRunningExecutions] = useState<ModelExecutionAccept[]>([])
  const [downloadableExecutionInputFiles, setDownloadableExecutionInputFiles] = useState<IFileDownloadRequest[]>([])
  const failureKeyRef = useRef<Map<number, string>>(new Map())
  const groupStreamControllerRef = useRef<AbortController | null>(null)
  const inputFilesRequestIdRef = useRef(0)

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
    const optionById = new Map(scenarioOptions.map((option) => [option.scenarioId, option]))

    const rowsFromDetail = detailRows
      .filter((row) => row.status !== 'discarded')
      .map((row) => {
        const proposal = proposalByScenarioId.get(row.scenarioId)
        const option = optionById.get(row.scenarioId)
        const status = pendingGenerateIds.has(row.scenarioId)
          ? ('generating' as const)
          : mapProposalStateToRowStatus(proposal?.currentState, compareScenarioIds.has(row.scenarioId), proposal?.failureReason)

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
          failureReason: proposal?.failureReason ?? undefined,
          discarded: option?.disabled === true,
        }
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)

    if (rowsFromDetail.length > 0) return rowsFromDetail

    return scenarioOptions
      .filter((option) => !option.disabled)
      .map((option, index) => {
        const proposal = proposalByScenarioId.get(option.scenarioId)
        const status = pendingGenerateIds.has(option.scenarioId)
          ? ('generating' as const)
          : mapProposalStateToRowStatus(proposal?.currentState, compareScenarioIds.has(option.scenarioId), proposal?.failureReason)

        return {
          scenarioId: option.scenarioId,
          displayOrder: index + 1,
          scenarioName: option.scenarioName,
          baseCase: false,
          scenarioRole: null,
          scenarioRoleLabel: null,
          scenarioType: null,
          dimensionCells: [],
          possibility: 0,
          status,
          failureReason: proposal?.failureReason ?? undefined,
          discarded: option.disabled,
        }
      })
  }, [compareScenarioIds, dimensionColumns, groupQuery.data?.scenarios, pendingGenerateIds, proposalByScenarioId, scenarioOptions])

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
  const showParamPanel = hasCompleted

  useEffect(() => {
    onFillsViewportHeightChange?.(showParamPanel)
  }, [onFillsViewportHeightChange, showParamPanel])

  const downloadTargetScenarioIds = useMemo(() => {
    const selectedCompleted = selectedScenarioIds.filter((scenarioId) => completedScenarioIds.includes(scenarioId))
    return selectedCompleted.length > 0 ? selectedCompleted : completedScenarioIds
  }, [completedScenarioIds, selectedScenarioIds])

  const refreshDownloadableExecutionInputFiles = useCallback(async () => {
    const requestId = ++inputFilesRequestIdRef.current
    if (!showParamPanel || downloadTargetScenarioIds.length === 0) {
      if (requestId === inputFilesRequestIdRef.current) setDownloadableExecutionInputFiles([])
      return
    }

    const proposals = await Promise.all(
      downloadTargetScenarioIds.map((scenarioId) =>
        nextGenMIModelExecutionService.getCurrentModelParamProposal(scenarioId).catch(() => null),
      ),
    )
    if (requestId !== inputFilesRequestIdRef.current) return

    const files = proposals.flatMap((proposal) => getDownloadableExecutionInputFiles(proposal))
    // 시나리오별 fileNo 중복 제거
    const uniqueFiles = Array.from(new Map(files.map((file) => [file.fileNo, file])).values())
    setDownloadableExecutionInputFiles(uniqueFiles)
  }, [downloadTargetScenarioIds, showParamPanel])

  useEffect(() => {
    void refreshDownloadableExecutionInputFiles()
  }, [refreshDownloadableExecutionInputFiles, groupProposals, compare])

  const { mutate: downloadExecutionInputFiles, isPending: isDownloadingInputFiles } = useMutation({
    mutationFn: ({ prefix, files: inputFiles }: { prefix: string; files: IFileDownloadRequest[] }) =>
      fileService.downloadFiles(prefix, inputFiles),
    onSuccess: (fileBlob, { prefix }) => {
      downloadFile(fileBlob, `${prefix}.zip`)
    },
    onError: () => {
      showSnackbar('인풋 파일 다운로드에 실패했습니다.', { variant: 'error' })
    },
  })

  const handleDownloadInputFiles = useCallback(() => {
    if (downloadableExecutionInputFiles.length === 0 || isDownloadingInputFiles) return
    downloadExecutionInputFiles({
      prefix: `scenario-group-${scenarioGroupId}-model-input-files`,
      files: downloadableExecutionInputFiles,
    })
  }, [downloadExecutionInputFiles, downloadableExecutionInputFiles, isDownloadingInputFiles, scenarioGroupId])

  const visibleScenarios = useMemo(
    () =>
      scenarios
        .filter(
          (scenario) =>
            (scenario.status === 'completed' || scenario.status === 'generating') && visibleScenarioIds.includes(scenario.scenarioId),
        )
        .map((scenario) => ({
          scenarioId: scenario.scenarioId,
          scenarioName: scenario.scenarioName,
          status: scenario.status === 'generating' ? ('generating' as const) : ('completed' as const),
        })),
    [scenarios, visibleScenarioIds],
  )
  const selectedCompletedCount = selectedScenarioIds.filter((scenarioId) => completedScenarioIds.includes(scenarioId)).length
  const allSelectableChecked = selectableScenarioIds.length > 0 && selectableScenarioIds.every((id) => selectedScenarioIds.includes(id))
  const someSelectableChecked = selectableScenarioIds.some((id) => selectedScenarioIds.includes(id))

  const applyGroupProposals = useCallback(
    (nextProposals: ScenarioGroupModelParamProposals, notifyFailure = false) => {
      setGroupProposals(nextProposals)

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
      try {
        const proposals = await nextGenMIModelExecutionService.getGroupModelParamProposals(scenarioGroupId)
        applyGroupProposals(proposals, notifyFailure)
      } catch (error) {
        if (isClientRequestError(error)) {
          showSnackbar('파라미터 상태 조회에 실패했습니다.', { variant: 'error' })
        }
      }
    },
    [applyGroupProposals, scenarioGroupId, showSnackbar],
  )

  const loadCompareProposals = useCallback(async () => {
    try {
      const nextCompare = await nextGenMIModelExecutionService.getGroupModelParamProposalsCompare(scenarioGroupId)
      setCompare(nextCompare)
    } catch (error) {
      if (isClientRequestError(error)) {
        showSnackbar('파라미터 비교 조회에 실패했습니다.', { variant: 'error' })
      }
    }
  }, [scenarioGroupId, showSnackbar])

  const refreshProposals = useCallback(
    async (notifyFailure = false) => {
      await loadGroupProposals(notifyFailure)
      await loadCompareProposals()
    },
    [loadCompareProposals, loadGroupProposals],
  )

  useEffect(() => {
    if (!scenarioGroupId) return undefined

    let cancelled = false
    void (async () => {
      if (cancelled) return
      await loadGroupProposals()
      if (cancelled) return
      await loadCompareProposals()
    })()

    return () => {
      cancelled = true
    }
    // groupQuery.dataUpdatedAt 에 묶지 않음 - 상세 갱신마다 proposals 재조회로 중복/취소 요청이 생김
  }, [loadCompareProposals, loadGroupProposals, scenarioGroupId])

  useEffect(() => {
    setSelectedScenarioIds((prev) => prev.filter((scenarioId) => completedScenarioIds.includes(scenarioId)))
    setVisibleScenarioIds((prev) => {
      const next = prev.filter((scenarioId) => columnScenarioIds.includes(scenarioId))
      const missing = columnScenarioIds.filter((scenarioId) => !next.includes(scenarioId))
      return missing.length === 0 ? next : [...next, ...missing]
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
          onCompleted(execution.scenarioId)
          return
        }

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
  }, [onCompleted, runningExecutions, showSnackbar])

  const { mutate: createModelParamProposal } = useMutation({
    mutationFn: (scenarioId: number) => nextGenMIModelExecutionService.createModelParamProposal(scenarioId),
    onSuccess: (accepted, scenarioId) => {
      if (accepted.status === 'FAILED') {
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
    onError: (_error, scenarioId) => {
      setPendingGenerateIds((current) => {
        const next = new Set(current)
        next.delete(scenarioId)
        return next
      })
      showSnackbar('파라미터 생성에 실패했습니다.', { variant: 'error' })
      void refreshProposals(true)
    },
  })

  const startGeneration = (scenarioId: number) => {
    if (executingScenarioIds.has(scenarioId) || pendingGenerateIds.has(scenarioId)) return
    setPendingGenerateIds((current) => new Set(current).add(scenarioId))
    setVisibleScenarioIds((prev) => (prev.includes(scenarioId) ? prev : [...prev, scenarioId]))
    createModelParamProposal(scenarioId)
  }

  const handleToggleVisibility = (scenarioId: number) => {
    setVisibleScenarioIds((prev) => {
      if (prev.includes(scenarioId)) return prev.filter((id) => id !== scenarioId)
      return [...prev, scenarioId]
    })
  }

  const handleToggleScenario = (scenarioId: number, checked: boolean) => {
    if (!selectableScenarioIds.includes(scenarioId)) return
    setSelectedScenarioIds((prev) => {
      if (checked) return prev.includes(scenarioId) ? prev : [...prev, scenarioId]
      return prev.filter((id) => id !== scenarioId)
    })
  }

  const handleToggleAll = (checked: boolean) => {
    setSelectedScenarioIds(checked ? [...selectableScenarioIds] : [])
  }

  const handleExecuteClick = () => {
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

      accepted.results.forEach((result) => {
        if (!result.success || !result.execution) {
          showSnackbar('MI 수급모델 실행에 실패했습니다.', {
            variant: 'error',
            body: result.errorMessage?.trim() || '잠시 후 다시 시도해 주세요.',
          })
          return
        }

        const execution = result.execution
        onAccepted(execution.scenarioId)

        if (execution.status === 'COMPLETED') {
          onCompleted(execution.scenarioId)
          return
        }
        if (execution.status === 'FAILED') {
          showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
          return
        }
        running.push(execution)
      })

      if (running.length > 0) {
        setRunningExecutions((current) => [...current, ...running])
      }

      if (accepted.successCount > 0) {
        showSnackbar(`선택한 시나리오 ${accepted.successCount}개로 MI 수급모델 실행을 요청했습니다.`, { variant: 'success' })
        if (running.length === 0) onCancel()
      }
    } catch (error) {
      if (isExecutionValidationError(error)) {
        showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파라미터 내용을 확인해 주세요.' })
      } else {
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
      }
    } finally {
      setIsSubmittingExecution(false)
    }
  }

  const handleResetParameters = () => {
    setParamResetToken((token) => token + 1)
    // 편집값을 서버 제안값으로 되돌리기 위해 비교 그리드를 재조회
    void loadCompareProposals()
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
    [],
  )

  return (
    <Stack width="100%" height={fillsViewportHeight ? '100%' : 'auto'} minHeight={fillsViewportHeight ? 0 : undefined} overflow="hidden">
      <Stack flex={fillsViewportHeight ? '1 1 0' : '0 0 auto'} minHeight={fillsViewportHeight ? 0 : undefined} overflow="hidden">
        <Stack flexShrink={0} overflow="auto" padding="10px 20px 0">
          <Stack
            direction="row"
            alignItems="flex-start"
            gap="8px"
            padding="10px 12px"
            borderRadius="8px"
            bgcolor="gray.5"
            border="1px solid"
            borderColor="contentBorder.Normal"
          >
            <InfoOutlineIcon width="16px" height="16px" aria-hidden />
            <Typography variant="body2M14" color="contentText.Normal" lineHeight={1.4}>
              {BANNER_MESSAGE}
            </Typography>
          </Stack>

          <Stack paddingTop="12px">
            <Stack
              component="button"
              type="button"
              direction="row"
              alignItems="center"
              gap="0"
              width="100%"
              height="48px"
              padding="0"
              border="1px solid"
              borderColor="contentBorder.Normal"
              borderRadius={expanded ? '8px 8px 0 0' : '8px'}
              bgcolor={expanded ? 'gray.5' : 'commonColor.White'}
              onClick={() => setExpanded((prev) => !prev)}
              sx={{
                cursor: 'pointer',
                textAlign: 'left',
                '&:hover': { bgcolor: expanded ? 'gray.5' : 'gray.10' },
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
              <Typography variant="body2M14" color="contentText.Subtext" width="110px" flexShrink={0} noWrap>
                {createdAtLabel}
              </Typography>
              <Box width="10px" flexShrink={0} />
              <Box flex="1 1 0" minWidth={0} paddingRight="12px">
                <NextGenMITableBodyText value={groupName} variant="body2SB14" color="contentText.Black" tooltipWhenTruncated />
              </Box>
            </Stack>

            <Collapse in={expanded} timeout={180} unmountOnExit={false}>
              <Box border="1px solid" borderTop="none" borderColor="contentBorder.Normal" borderRadius="0 0 8px 8px" overflow="hidden">
                <Stack
                  direction="row"
                  alignItems="center"
                  height="48px"
                  bgcolor="gray.5"
                  borderBottom="1px solid"
                  borderColor="contentBorder.Normal"
                >
                  <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center">
                    {selectableScenarioIds.length > 0 ? (
                      <Checkbox
                        size="small"
                        checked={allSelectableChecked}
                        indeterminate={!allSelectableChecked && someSelectableChecked}
                        onChange={(_, checked) => handleToggleAll(checked)}
                        sx={{ padding: '4px' }}
                      />
                    ) : null}
                  </Stack>
                  <Box width="64px" flexShrink={0} />
                  <Typography variant="body3SB12" color="contentText.Subtext" width="300px" flexShrink={0} padding="0 8px">
                    시나리오
                  </Typography>
                  <Stack direction="row" flex="1 1 0" minWidth={0}>
                    {dimensionColumns.map((column) => {
                      const headerTooltipTitle = column.description?.trim() || column.rationale?.trim()
                      return (
                        <Stack key={column.key} direction="row" alignItems="center" gap="4px" flex="1 1 0" minWidth={0} padding="0 8px">
                          <Box flex="1 1 0" minWidth={0}>
                            <NextGenMITableBodyText
                              value={column.label}
                              variant="body3SB12"
                              color="contentText.Subtext"
                              tooltipWhenTruncated
                            />
                          </Box>
                          {headerTooltipTitle ? <DimensionInfoIcon title={headerTooltipTitle} /> : null}
                        </Stack>
                      )
                    })}
                  </Stack>
                  <Typography variant="body3SB12" color="contentText.Subtext" width="100px" flexShrink={0} textAlign="center">
                    실행가능성
                  </Typography>
                  <Typography variant="body3SB12" color="contentText.Subtext" width="92px" flexShrink={0} textAlign="center">
                    상태
                  </Typography>
                </Stack>

                {scenarios.map((scenario) => {
                  const selectable = scenario.status === 'completed'
                  const checked = selectedScenarioIds.includes(scenario.scenarioId)
                  const dimmed = isDimmedStatus(scenario.status)
                  // 생성 중만 있을 때는 눈 아이콘 없음. 파라미터 표가 열릴 때만 컬럼 On/Off
                  const showEye = showParamPanel && canShowVisibilityToggle(scenario.status)
                  const textColor = dimmed ? 'contentText.Disabled' : 'contentText.Black'
                  const bodyColor = dimmed ? 'contentText.Disabled' : 'contentText.Normal'
                  const generateDisabled = executingScenarioIds.has(scenario.scenarioId) || isSubmittingExecution
                  const hasRoleBadge = Boolean(scenario.scenarioRole || scenario.scenarioType || scenario.scenarioRoleLabel)

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
                      <Stack width="36px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                        {selectable ? (
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={(_, nextChecked) => handleToggleScenario(scenario.scenarioId, nextChecked)}
                            sx={{ padding: '4px' }}
                          />
                        ) : null}
                      </Stack>
                      <Stack width="64px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                        <ScenarioRoleBadge role={scenario.scenarioRole} type={scenario.scenarioType} label={scenario.scenarioRoleLabel} />
                        {!hasRoleBadge && scenario.baseCase ? <NextGenMIBaseCaseChip disabled={dimmed} /> : null}
                      </Stack>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap="8px"
                        width="300px"
                        flexShrink={0}
                        minWidth={0}
                        padding="0 8px"
                        sx={{ opacity: dimmed ? 0.5 : 1 }}
                      >
                        <NextGenMIDisplayOrderBadge value={scenario.displayOrder} disabled={dimmed} />
                        <Box flex="1 1 0" minWidth={0}>
                          <NextGenMITableBodyText value={scenario.scenarioName} variant="body2M14" color={textColor} tooltipWhenTruncated />
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
                              cursor: scenario.status === 'completed' || scenario.status === 'generating' ? 'pointer' : 'default',
                              opacity: scenario.status === 'completed' || scenario.status === 'generating' ? 1 : 0.5,
                            }}
                            aria-label={visibleScenarioIds.includes(scenario.scenarioId) ? '파라미터 컬럼 숨기기' : '파라미터 컬럼 표시'}
                            onClick={(event) => {
                              event.stopPropagation()
                              if (scenario.status !== 'completed' && scenario.status !== 'generating') return
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
                          <Stack
                            key={`${scenario.scenarioId}-${dimensionColumns[index]?.key ?? index}`}
                            direction="row"
                            alignItems="center"
                            gap="4px"
                            flex="1 1 0"
                            minWidth={0}
                            padding="0 8px"
                          >
                            <NextGenMITableBodyText
                              value={cell.value}
                              variant="body2M14"
                              color={bodyColor}
                              tooltipWhenTruncated
                              sx={{ flex: '1 1 0%', minWidth: 0 }}
                            />
                            {cell.rationale ? <DimensionInfoIcon title={cell.rationale} /> : null}
                          </Stack>
                        ))}
                      </Stack>
                      <Stack width="100px" flexShrink={0} alignItems="center" justifyContent="center" sx={{ opacity: dimmed ? 0.5 : 1 }}>
                        <ScenarioPossibilityGauge probability={scenario.possibility} disabled={dimmed} hideHoverBackground />
                      </Stack>
                      <Stack width="92px" flexShrink={0} alignItems="center" justifyContent="center" padding="0 6px">
                        <StatusCell
                          status={scenario.status}
                          failureReason={scenario.failureReason}
                          disabled={generateDisabled}
                          onGenerate={() => startGeneration(scenario.scenarioId)}
                          onRetry={() => startGeneration(scenario.scenarioId)}
                        />
                      </Stack>
                    </Stack>
                  )
                })}
              </Box>
            </Collapse>
          </Stack>
        </Stack>

        {showGeneratingPlaceholder && (
          <Stack flexShrink={0} height="400px" alignItems="center" justifyContent="center" gap="10px" padding="0 20px">
            <MIAgentSpinner size={24} tone="gray" sx={{ '& svg': { width: '24px', height: '24px' } }} />
            <Typography variant="body3SB12" color="gray.60" lineHeight={1.4} textAlign="center">
              {GENERATING_MESSAGE}
            </Typography>
          </Stack>
        )}

        {showParamPanel && (
          <Stack flex="1 1 0" minHeight={0} overflow="hidden">
            <ScenarioModelExecutionProposalParamPanel
              visibleScenarios={visibleScenarios}
              compare={compare}
              resetToken={paramResetToken}
              canDownloadInputFiles={downloadableExecutionInputFiles.length > 0}
              isDownloadingInputFiles={isDownloadingInputFiles}
              onDownloadInputFiles={handleDownloadInputFiles}
              onHasEditsChange={setHasParamEdits}
              onChangeScenarioValue={handleChangeScenarioValue}
            />
          </Stack>
        )}
      </Stack>

      <Stack
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
          disabled={!hasCompleted || !hasParamEdits || isSubmittingExecution}
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
            disabled={!hasCompleted || isSubmittingExecution}
            onClick={handleExecuteClick}
            sx={{ height: '36px', bgcolor: 'mari.Primary', borderRadius: '8px' }}
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
            disabled: isSubmittingExecution,
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
