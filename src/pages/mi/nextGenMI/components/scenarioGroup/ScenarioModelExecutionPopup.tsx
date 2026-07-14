import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import useSnackbar from '@/hooks/useSnackbar'
import {
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB,
  FUNDAMENTAL_UPLOAD_MAX_FILES,
  hasRequiredFundamentalModelFiles,
  isFundamentalUploadExcelFile,
  isSameFundamentalUploadFile,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import ScenarioModelExecutionFileUploadContent from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionFileUploadContent'
import ScenarioModelExecutionPopupContent, {
  type ScenarioModelExecutionOption,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'
import fileService, { type IFileDownloadRequest } from '@/service/admin/file'
import nextGenMIModelExecutionService, {
  type FileModelExecutionAccept,
  type CurrentModelParamProposal,
  type ModelParamPayloadItem,
} from '@/service/mi/nextGenMI/modelExecution'
import { downloadFile } from '@/utils/file'

export interface ScenarioModelExecutionPopupRef {
  open: () => void
  openFor: (scenarioId: number) => void
}

interface ScenarioModelExecutionPopupProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  parameterProposalTarget: boolean
  executingScenarioIds: Set<number>
  onAccepted: (scenarioId: number) => void
  onCompleted: (scenarioId: number) => void
}

type ModelExecutionConfirmType = 'close' | 'scenarioChange' | 'submit'
type ModelParamProposalResetSource = 'confirmed' | 'proposed'

const isExecutionValidationError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const responseData = error.response?.data as { code?: string; message?: string } | undefined
  const code = responseData?.code?.toUpperCase() ?? ''
  const message = responseData?.message ?? ''

  return status === 400 || status === 422 || code.includes('VALID') || message.includes('유효성')
}

const isClientRequestError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  return status !== undefined && status >= 400 && status < 500
}

const isModelParamProposalFailure = (currentState: CurrentModelParamProposal['currentState']) =>
  currentState === 'PROPOSAL_FAILED' || currentState === 'EXECUTION_FAILED'

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
    )
      return []

    return [{ fileNo: file.fileNo, fileNm: file.fileNm, fileSize: file.fileSize }]
  })

  return downloadableFiles.length === executionInputFiles.files.length ? downloadableFiles : []
}

const ScenarioModelExecutionPopup = forwardRef<ScenarioModelExecutionPopupRef, ScenarioModelExecutionPopupProps>(
  ({ scenarioOptions, parameterProposalTarget, executingScenarioIds, onAccepted, onCompleted }, ref) => {
    const { showSnackbar } = useSnackbar()
    const [open, setOpen] = useState(false)
    const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [parameterProposal, setParameterProposal] = useState<CurrentModelParamProposal | null>(null)
    const [currentProposalState, setCurrentProposalState] = useState<CurrentModelParamProposal['currentState']>()
    const [isProposalGenerationPending, setIsProposalGenerationPending] = useState(false)
    const [isCurrentProposalLoading, setIsCurrentProposalLoading] = useState(false)
    const [isCurrentProposalLoadFailed, setIsCurrentProposalLoadFailed] = useState(false)
    const [modelExecution, setModelExecution] = useState<FileModelExecutionAccept | null>(null)
    const [confirmType, setConfirmType] = useState<ModelExecutionConfirmType | null>(null)
    const [pendingScenarioId, setPendingScenarioId] = useState<number | null>(null)
    const modelParamProposalFailureKeyRef = useRef<string | null>(null)
    const initialModelParamProposalRef = useRef<CurrentModelParamProposal | null>(null)
    const currentProposalRequestIdRef = useRef(0)
    const proposalSessionIdRef = useRef(0)
    const resettingModelParamProposalRef = useRef(false)
    const refreshingScenarioIdsRef = useRef(new Set<number>())
    const queuedRefreshScenarioIdsRef = useRef(new Set<number>())
    const queuedFailureNotificationScenarioIdsRef = useRef(new Set<number>())

    const isParameterProposalMode = parameterProposalTarget
    const isFileUploadMode = !parameterProposalTarget
    const hasGeneratedParameters = isParameterProposalMode && (parameterProposal?.modelFiles?.length ?? 0) > 0
    const downloadableExecutionInputFiles = useMemo(() => getDownloadableExecutionInputFiles(parameterProposal), [parameterProposal])

    const notifyModelParamProposalFailure = useCallback(
      (scenarioId: number | undefined, state: string, failureReason?: string) => {
        const failureKey = `${scenarioId ?? ''}:${state}:${failureReason ?? ''}`
        if (modelParamProposalFailureKeyRef.current === failureKey) return

        modelParamProposalFailureKeyRef.current = failureKey
        showSnackbar('파라미터 생성에 실패했습니다.', {
          variant: 'error',
          body: failureReason?.trim() || '잠시 후 다시 시도해 주세요.',
        })
      },
      [showSnackbar],
    )

    const applyCurrentModelParamProposal = useCallback(
      (proposal: CurrentModelParamProposal, notifyFailure = false) => {
        setParameterProposal(proposal)
        setCurrentProposalState(proposal.currentState)

        if (
          proposal.modelParamProposalId !== undefined &&
          proposal.modelFiles.length > 0 &&
          (proposal.parameterSource === 'PROPOSAL_PARAMETERS' ||
            (proposal.parameterSource === undefined && proposal.currentState === 'PROPOSAL_READY')) &&
          initialModelParamProposalRef.current?.modelParamProposalId !== proposal.modelParamProposalId
        ) {
          initialModelParamProposalRef.current = structuredClone(proposal)
        }

        if (proposal.currentState === 'GENERATING') {
          setIsProposalGenerationPending(true)
          return
        }

        setIsProposalGenerationPending(false)
        if (!isModelParamProposalFailure(proposal.currentState)) {
          modelParamProposalFailureKeyRef.current = null
          return
        }
        if (notifyFailure) {
          notifyModelParamProposalFailure(proposal.scenarioId, proposal.currentState ?? 'FAILED', proposal.failureReason)
        }
      },
      [notifyModelParamProposalFailure],
    )

    const loadCurrentModelParamProposal = useCallback(
      async (scenarioId: number, notifyFailure = false, showLoading = false) => {
        const requestId = ++currentProposalRequestIdRef.current
        if (showLoading) setIsCurrentProposalLoading(true)

        try {
          const proposal = await nextGenMIModelExecutionService.getCurrentModelParamProposal(scenarioId)
          if (requestId !== currentProposalRequestIdRef.current) return
          setIsCurrentProposalLoadFailed(false)
          applyCurrentModelParamProposal(proposal, notifyFailure)
        } catch (error) {
          if (requestId !== currentProposalRequestIdRef.current) return
          if (isClientRequestError(error)) {
            setIsCurrentProposalLoadFailed(true)
            showSnackbar('파라미터 상태 조회에 실패했습니다.', { variant: 'error' })
            return
          }
          if (notifyFailure) return
          showSnackbar('파라미터 상태 조회에 실패했습니다.', { variant: 'error' })
        } finally {
          if (requestId === currentProposalRequestIdRef.current) setIsCurrentProposalLoading(false)
        }
      },
      [applyCurrentModelParamProposal, showSnackbar],
    )

    const refreshModelParamProposal = useCallback(
      async (scenarioId: number, notifyFailure = false) => {
        if (resettingModelParamProposalRef.current) return
        if (refreshingScenarioIdsRef.current.has(scenarioId)) {
          queuedRefreshScenarioIdsRef.current.add(scenarioId)
          if (notifyFailure) queuedFailureNotificationScenarioIdsRef.current.add(scenarioId)
          return
        }
        refreshingScenarioIdsRef.current.add(scenarioId)
        const sessionId = proposalSessionIdRef.current

        try {
          let shouldNotifyFailure = notifyFailure
          do {
            if (sessionId !== proposalSessionIdRef.current) return
            queuedRefreshScenarioIdsRef.current.delete(scenarioId)
            shouldNotifyFailure = queuedFailureNotificationScenarioIdsRef.current.delete(scenarioId) || shouldNotifyFailure

            await loadCurrentModelParamProposal(scenarioId, shouldNotifyFailure)
            if (sessionId !== proposalSessionIdRef.current) return
          } while (queuedRefreshScenarioIdsRef.current.delete(scenarioId))
        } finally {
          refreshingScenarioIdsRef.current.delete(scenarioId)
        }
      },
      [loadCurrentModelParamProposal],
    )

    const reset = useCallback(() => {
      proposalSessionIdRef.current += 1
      currentProposalRequestIdRef.current += 1
      modelParamProposalFailureKeyRef.current = null
      initialModelParamProposalRef.current = null
      resettingModelParamProposalRef.current = false
      refreshingScenarioIdsRef.current.clear()
      queuedRefreshScenarioIdsRef.current.clear()
      queuedFailureNotificationScenarioIdsRef.current.clear()
      setSelectedScenarioId(null)
      setFiles([])
      setParameterProposal(null)
      setCurrentProposalState(undefined)
      setIsProposalGenerationPending(false)
      setIsCurrentProposalLoading(false)
      setIsCurrentProposalLoadFailed(false)
      setModelExecution(null)
      setConfirmType(null)
      setPendingScenarioId(null)
    }, [])

    const closePopup = useCallback(() => {
      setOpen(false)
      reset()
    }, [reset])

    const handleClose = useCallback(() => {
      if (isParameterProposalMode && hasGeneratedParameters) {
        setConfirmType('close')
        return
      }
      closePopup()
    }, [closePopup, hasGeneratedParameters, isParameterProposalMode])

    const handleFilesAdd = useCallback(
      (selectedFiles: FileList | File[] | null) => {
        const incomingFiles = Array.from(selectedFiles ?? [])
        if (incomingFiles.length === 0) return

        let failureBody = ''
        const nextFiles = [...files]

        incomingFiles.forEach((file) => {
          if (nextFiles.length >= FUNDAMENTAL_UPLOAD_MAX_FILES) {
            failureBody = `최대 ${FUNDAMENTAL_UPLOAD_MAX_FILES}개의 Excel 파일만 업로드할 수 있습니다.`
            return
          }
          if (!isFundamentalUploadExcelFile(file)) {
            failureBody = `${file.name}은(는) Excel 파일이 아닙니다.`
            return
          }
          if (file.size > FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES) {
            failureBody = `${file.name}은(는) ${FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_MB}MB를 초과합니다.`
            return
          }
          if (nextFiles.some((uploadedFile) => isSameFundamentalUploadFile(uploadedFile, file))) return

          nextFiles.push(file)
        })

        setFiles(nextFiles)

        if (failureBody) {
          showSnackbar('파일 업로드가 실패했습니다.', { variant: 'error', body: failureBody })
        }
      },
      [files, showSnackbar],
    )

    const handleRemoveFile = useCallback((targetFile: File) => {
      setFiles((prev) => prev.filter((file) => !isSameFundamentalUploadFile(file, targetFile)))
    }, [])

    const { mutate: createModelParamProposal, isPending: isCreatingModelParamProposal } = useMutation({
      mutationFn: (scenarioId: number) => nextGenMIModelExecutionService.createModelParamProposal(scenarioId),
      onSuccess: (accepted, scenarioId) => {
        setIsCurrentProposalLoadFailed(false)
        if (accepted.status === 'FAILED') {
          setIsProposalGenerationPending(false)
          setCurrentProposalState('PROPOSAL_FAILED')
          notifyModelParamProposalFailure(accepted.scenarioId ?? scenarioId, accepted.status)
          return
        }

        if (accepted.status === 'PROPOSED') {
          setCurrentProposalState('PROPOSAL_READY')
          setIsProposalGenerationPending(false)
        } else if (accepted.status === 'CONFIRMED') {
          setCurrentProposalState('CONFIRMED_PENDING_EXECUTION')
          setIsProposalGenerationPending(false)
        } else {
          setCurrentProposalState('GENERATING')
          setIsProposalGenerationPending(true)
        }
        void refreshModelParamProposal(scenarioId, true)
      },
      onError: () => {
        setIsProposalGenerationPending(false)
        setCurrentProposalState('PROPOSAL_FAILED')
        setIsCurrentProposalLoadFailed(true)
        showSnackbar('파라미터 생성에 실패했습니다.', { variant: 'error' })
      },
    })

    const { mutate: submitFileExecution, isPending: isSubmittingFiles } = useMutation({
      mutationFn: ({ scenarioId, files: uploadFiles }: { scenarioId: number; files: File[] }) =>
        nextGenMIModelExecutionService.submitModelExecutionFiles(scenarioId, uploadFiles),
      onSuccess: (_data, variables) => {
        onAccepted(variables.scenarioId)
        closePopup()
      },
      onError: (error) => {
        if (isExecutionValidationError(error)) {
          showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파일 내용을 확인해 주세요.' })
          return
        }
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
      },
    })

    const { mutate: submitModelParamProposalExecution, isPending: isSubmittingModelParamProposal } = useMutation({
      mutationFn: ({
        scenarioId,
        modelParamProposalId,
        confirmationParameters,
      }: {
        scenarioId: number
        modelParamProposalId: number
        confirmationParameters: ModelParamPayloadItem[]
      }) =>
        nextGenMIModelExecutionService.submitModelParamProposalExecution(scenarioId, {
          modelParamProposalId,
          confirmationParameters,
        }),
      onSuccess: (data, variables) => {
        if (data.status === 'COMPLETED') {
          onCompleted(variables.scenarioId)
          closePopup()
          return
        }
        if (data.status === 'FAILED') {
          setCurrentProposalState('EXECUTION_FAILED')
          showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
          return
        }

        setCurrentProposalState('EXECUTING')
        setModelExecution(data)
      },
      onError: (error) => {
        if (isExecutionValidationError(error)) {
          showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파라미터 내용을 확인해 주세요.' })
          return
        }
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
      },
    })

    const { mutate: resetModelParamProposal, isPending: isResettingModelParamProposal } = useMutation({
      mutationFn: ({
        scenarioId,
        source,
      }: {
        scenarioId: number
        source: ModelParamProposalResetSource
        proposal: CurrentModelParamProposal
        sessionId: number
      }) =>
        source === 'confirmed'
          ? nextGenMIModelExecutionService.getLatestConfirmedParameters(scenarioId)
          : nextGenMIModelExecutionService.getLatestProposedParameters(scenarioId),
      onSuccess: (data, variables) => {
        if (variables.sessionId !== proposalSessionIdRef.current) return

        if (
          (data.scenarioId !== undefined && data.scenarioId !== variables.scenarioId) ||
          (variables.source === 'proposed' && data.modelParamProposalId !== variables.proposal.modelParamProposalId)
        ) {
          showSnackbar('파라미터 초기화에 실패했습니다.', {
            variant: 'error',
            body: '현재 파라미터 제안과 초기화 데이터가 일치하지 않습니다.',
          })
          return
        }

        if (data.modelFiles.length === 0) {
          showSnackbar('파라미터 초기화에 실패했습니다.', {
            variant: 'error',
            body: '초기화할 파라미터 정보를 확인할 수 없습니다.',
          })
          return
        }

        setParameterProposal({
          ...variables.proposal,
          parameterSource: data.parameterSource,
          modelFiles: data.modelFiles,
        })
        showSnackbar(variables.source === 'confirmed' ? '직전 데이터로 초기화되었습니다.' : '최초 생성 데이터로 초기화되었습니다.', {
          variant: 'success',
        })
      },
      onError: (_error, variables) => {
        if (variables.sessionId !== proposalSessionIdRef.current) return
        showSnackbar('파라미터 초기화에 실패했습니다.', {
          variant: 'error',
          body: '초기화 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      },
      onSettled: () => {
        resettingModelParamProposalRef.current = false
      },
    })

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

    const isGenerating = isCreatingModelParamProposal || isProposalGenerationPending || currentProposalState === 'GENERATING'
    const isExecuting = modelExecution?.status === 'RUNNING'
    const isSubmitting = isSubmittingFiles || isSubmittingModelParamProposal
    const isBusy = isGenerating || isCurrentProposalLoading || isExecuting || isSubmitting || isResettingModelParamProposal
    const isCloseDisabled = isCreatingModelParamProposal || isExecuting || isSubmitting || isResettingModelParamProposal
    const canGenerate =
      currentProposalState === 'NOT_REQUESTED' || currentProposalState === 'PROPOSAL_FAILED' || currentProposalState === 'EXECUTION_FAILED'
    const canUseCurrentParameters =
      (currentProposalState === 'PROPOSAL_READY' ||
        currentProposalState === 'EXECUTED_CONFIRMED' ||
        currentProposalState === 'EXECUTION_FAILED') &&
      hasGeneratedParameters &&
      parameterProposal?.modelParamProposalId !== undefined

    const changeScenario = useCallback((scenarioId: number) => {
      proposalSessionIdRef.current += 1
      currentProposalRequestIdRef.current += 1
      modelParamProposalFailureKeyRef.current = null
      initialModelParamProposalRef.current = null
      resettingModelParamProposalRef.current = false
      setSelectedScenarioId(scenarioId)
      setParameterProposal(null)
      setCurrentProposalState(undefined)
      setIsProposalGenerationPending(false)
      setIsCurrentProposalLoading(false)
      setIsCurrentProposalLoadFailed(false)
      setModelExecution(null)
    }, [])

    const handleSelectScenario = useCallback(
      (scenarioId: number) => {
        if (selectedScenarioId === scenarioId) return
        if (isParameterProposalMode && hasGeneratedParameters) {
          setPendingScenarioId(scenarioId)
          setConfirmType('scenarioChange')
          return
        }
        changeScenario(scenarioId)
      },
      [changeScenario, hasGeneratedParameters, isParameterProposalMode, selectedScenarioId],
    )

    const handleScenarioChangeConfirm = useCallback(() => {
      if (pendingScenarioId === null) return
      changeScenario(pendingScenarioId)
      setPendingScenarioId(null)
      setConfirmType(null)
    }, [changeScenario, pendingScenarioId])

    const handleGenerateParameters = useCallback(() => {
      if (!isParameterProposalMode || selectedScenarioId === null || isBusy || !canGenerate) return
      if (executingScenarioIds.has(selectedScenarioId)) return

      initialModelParamProposalRef.current = null
      setParameterProposal(null)
      setCurrentProposalState('GENERATING')
      setIsProposalGenerationPending(true)
      createModelParamProposal(selectedScenarioId)
    }, [canGenerate, createModelParamProposal, executingScenarioIds, isBusy, isParameterProposalMode, selectedScenarioId])

    const handleResetParameters = useCallback(
      (source: ModelParamProposalResetSource) => {
        if (!isParameterProposalMode || selectedScenarioId === null || !parameterProposal || !canUseCurrentParameters || isBusy) return
        if (executingScenarioIds.has(selectedScenarioId)) return

        const selectedScenarioExecuted = scenarioOptions.some((option) => option.scenarioId === selectedScenarioId && option.executed)
        if (source === 'confirmed' && !selectedScenarioExecuted) return

        const initialProposal = initialModelParamProposalRef.current
        if (
          source === 'proposed' &&
          initialProposal !== null &&
          initialProposal.modelParamProposalId !== undefined &&
          initialProposal.modelParamProposalId === parameterProposal.modelParamProposalId &&
          (initialProposal.scenarioId === undefined || initialProposal.scenarioId === selectedScenarioId)
        ) {
          setParameterProposal(structuredClone(initialProposal))
          showSnackbar('최초 생성 데이터로 초기화되었습니다.', { variant: 'success' })
          return
        }

        if (source === 'proposed' && !selectedScenarioExecuted) {
          showSnackbar('파라미터 초기화에 실패했습니다.', {
            variant: 'error',
            body: '초기화할 최초 생성 데이터를 확인할 수 없습니다.',
          })
          return
        }

        resettingModelParamProposalRef.current = true
        proposalSessionIdRef.current += 1
        currentProposalRequestIdRef.current += 1
        queuedRefreshScenarioIdsRef.current.delete(selectedScenarioId)
        queuedFailureNotificationScenarioIdsRef.current.delete(selectedScenarioId)

        resetModelParamProposal({
          scenarioId: selectedScenarioId,
          source,
          proposal: parameterProposal,
          sessionId: proposalSessionIdRef.current,
        })
      },
      [
        canUseCurrentParameters,
        executingScenarioIds,
        isBusy,
        isParameterProposalMode,
        parameterProposal,
        resetModelParamProposal,
        scenarioOptions,
        selectedScenarioId,
        showSnackbar,
      ],
    )

    const handleChangeParameterValue = useCallback(
      (
        modelFileIndex: number,
        modelSheetIndex: number,
        modelTableIndex: number,
        parameterIndex: number,
        rowIndex: number,
        value: number,
      ) => {
        setParameterProposal((currentProposal) => {
          if (!currentProposal) return currentProposal

          return {
            ...currentProposal,
            modelFiles: currentProposal.modelFiles.map((modelFile, currentModelFileIndex) => ({
              ...modelFile,
              modelSheets: modelFile.modelSheets.map((modelSheet, currentModelSheetIndex) => ({
                ...modelSheet,
                modelTables: modelSheet.modelTables.map((modelTable, currentModelTableIndex) => ({
                  ...modelTable,
                  parameters: modelTable.parameters.map((modelParameter, currentParameterIndex) => {
                    if (
                      currentModelFileIndex !== modelFileIndex ||
                      currentModelSheetIndex !== modelSheetIndex ||
                      currentModelTableIndex !== modelTableIndex ||
                      currentParameterIndex !== parameterIndex
                    )
                      return modelParameter

                    return {
                      ...modelParameter,
                      parameter: {
                        ...modelParameter.parameter,
                        values: modelParameter.parameter.values.map((row, index) =>
                          index === rowIndex ? { ...row, proposedValue: value } : row,
                        ),
                      },
                    }
                  }),
                })),
              })),
            })),
          }
        })
      },
      [],
    )

    const handleFileSubmit = useCallback(() => {
      if (!isFileUploadMode || isSubmittingFiles || selectedScenarioId === null || !hasRequiredFundamentalModelFiles(files)) return
      if (executingScenarioIds.has(selectedScenarioId)) return
      submitFileExecution({ scenarioId: selectedScenarioId, files })
    }, [executingScenarioIds, files, isFileUploadMode, isSubmittingFiles, selectedScenarioId, submitFileExecution])

    const handleDownloadInputFiles = useCallback(() => {
      if (selectedScenarioId === null || downloadableExecutionInputFiles.length === 0 || isDownloadingInputFiles) return

      downloadExecutionInputFiles({
        prefix: `scenario-${selectedScenarioId}-model-input-files`,
        files: downloadableExecutionInputFiles,
      })
    }, [downloadExecutionInputFiles, downloadableExecutionInputFiles, isDownloadingInputFiles, selectedScenarioId])

    const handleModelParamProposalSubmitRequest = useCallback(() => {
      if (
        !isParameterProposalMode ||
        isSubmitting ||
        selectedScenarioId === null ||
        parameterProposal?.modelParamProposalId === undefined ||
        !canUseCurrentParameters ||
        executingScenarioIds.has(selectedScenarioId)
      )
        return

      setConfirmType('submit')
    }, [canUseCurrentParameters, executingScenarioIds, isParameterProposalMode, isSubmitting, parameterProposal, selectedScenarioId])

    const handleModelParamProposalSubmitConfirm = useCallback(() => {
      if (selectedScenarioId === null || parameterProposal?.modelParamProposalId === undefined || isSubmitting) return
      setConfirmType(null)
      submitModelParamProposalExecution({
        scenarioId: selectedScenarioId,
        modelParamProposalId: parameterProposal.modelParamProposalId,
        confirmationParameters: parameterProposal.modelFiles.flatMap((modelFile) =>
          modelFile.modelSheets.flatMap((modelSheet) =>
            modelSheet.modelTables.flatMap((modelTable) =>
              modelTable.parameters.map(({ parameter }) => ({
                parameterName: parameter.parameterName,
                modelTarget: parameter.modelTarget,
                rationale: parameter.rationale,
                values: parameter.values,
              })),
            ),
          ),
        ),
      })
    }, [isSubmitting, parameterProposal, selectedScenarioId, submitModelParamProposalExecution])

    useEffect(() => {
      if (!open || !isParameterProposalMode || selectedScenarioId === null) return
      void loadCurrentModelParamProposal(selectedScenarioId, false, true)
    }, [isParameterProposalMode, loadCurrentModelParamProposal, open, selectedScenarioId])

    useEffect(() => {
      if (
        !open ||
        !isParameterProposalMode ||
        selectedScenarioId === null ||
        (currentProposalState !== undefined && parameterProposal !== null) ||
        isCurrentProposalLoadFailed ||
        isCurrentProposalLoading ||
        isCreatingModelParamProposal
      )
        return undefined

      const timeoutId = globalThis.setTimeout(() => {
        void loadCurrentModelParamProposal(selectedScenarioId, true, true)
      }, 3000)

      return () => globalThis.clearTimeout(timeoutId)
    }, [
      currentProposalState,
      isCreatingModelParamProposal,
      isCurrentProposalLoading,
      isCurrentProposalLoadFailed,
      isParameterProposalMode,
      loadCurrentModelParamProposal,
      open,
      parameterProposal,
      selectedScenarioId,
    ])

    useEffect(() => {
      if (!open || !isParameterProposalMode || selectedScenarioId === null) return undefined

      let hasConnected = false
      const controller = new AbortController()
      void nextGenMIModelExecutionService
        .streamModelParamProposal(
          selectedScenarioId,
          ({ event }) => {
            if (event === 'connected') {
              if (hasConnected) void refreshModelParamProposal(selectedScenarioId)
              hasConnected = true
              return
            }
            if (event !== 'model-parameter-proposal') return
            void refreshModelParamProposal(selectedScenarioId, true)
          },
          controller.signal,
        )
        .catch(() => undefined)

      return () => {
        controller.abort()
      }
    }, [isParameterProposalMode, open, refreshModelParamProposal, selectedScenarioId])

    useEffect(() => {
      if (!open || !isParameterProposalMode || !modelExecution || modelExecution.status !== 'RUNNING') return undefined

      const execution = modelExecution
      let isActive = true
      let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined
      const pollModelExecutionStatus = async () => {
        try {
          const status = await nextGenMIModelExecutionService.getModelExecutionStatus(execution.scenarioId, execution.runId)
          if (!isActive) return
          if (status.status === 'RUNNING') {
            timeoutId = globalThis.setTimeout(() => {
              void pollModelExecutionStatus()
            }, 5000)
            return
          }

          setModelExecution(null)
          if (status.status === 'COMPLETED') {
            onCompleted(execution.scenarioId)
            closePopup()
            return
          }

          setCurrentProposalState('EXECUTION_FAILED')
          showSnackbar('MI 수급모델 실행에 실패했습니다.', {
            variant: 'error',
            body: status.errorMessage || status.failureReason || '잠시 후 다시 시도해 주세요.',
          })
        } catch {
          // 실행 상태 API의 일시적 실패는 다음 폴링에서 재시도합니다.
          if (isActive) {
            timeoutId = globalThis.setTimeout(() => {
              void pollModelExecutionStatus()
            }, 5000)
          }
        }
      }

      void pollModelExecutionStatus()

      return () => {
        isActive = false
        if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId)
      }
    }, [closePopup, isParameterProposalMode, modelExecution, onCompleted, open, showSnackbar])

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          reset()
          setOpen(true)
        },
        openFor: (scenarioId: number) => {
          reset()
          setSelectedScenarioId(scenarioId)
          setOpen(true)
        },
      }),
      [reset],
    )

    return (
      <>
        <MIConfirm
          open={open}
          title="MI 수급모델"
          handleClose={handleClose}
          width={isParameterProposalMode ? 1200 : 600}
          hideFooter
          disableClose={isCloseDisabled}
          disableBackdropClick={isCloseDisabled}
          paperSx={
            isParameterProposalMode
              ? {
                border: '1px solid',
                borderColor: 'contentBorder.Normal',
                borderRadius: '10px',
                boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
                width: '1200px',
                maxWidth: 'calc(100dvw - 32px)',
                height: hasGeneratedParameters && !isSubmitting && !isExecuting ? 'auto' : 'min(604px, calc(100dvh - 32px))',
                maxHeight: hasGeneratedParameters && !isSubmitting && !isExecuting ? 'calc(100dvh - 96px)' : 'calc(100dvh - 32px)',
                margin: hasGeneratedParameters && !isSubmitting && !isExecuting ? '48px 16px' : '16px',
                overflow: 'hidden',
              }
              : { borderRadius: '10px' }
          }
          titleSx={
            isParameterProposalMode
              ? {
                height: '60px',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                fontSize: '18px',
                color: 'contentText.Black',
                '& > span:first-of-type': {
                  fontWeight: '600 !important',
                },
                '& > span:last-of-type button': {
                  width: '36px',
                  height: '36px',
                  padding: '8px',
                },
              }
              : { padding: '12px 20px', fontSize: '18px', color: 'contentText.Black' }
          }
          contentSx={
            isParameterProposalMode
              ? {
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 auto',
                minHeight: 0,
                '& .MuiDialogContentText-root': {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 auto',
                  minHeight: 0,
                },
              }
              : { padding: 0 }
          }
        >
          {isParameterProposalMode ? (
            <ScenarioModelExecutionPopupContent
              scenarioOptions={scenarioOptions}
              selectedScenarioId={selectedScenarioId}
              executingScenarioIds={executingScenarioIds}
              parameterProposal={parameterProposal}
              isLoading={isCurrentProposalLoading}
              isGenerating={isGenerating}
              isExecuting={isExecuting}
              isSubmitting={isSubmitting}
              isResetting={isResettingModelParamProposal}
              isDownloadingInputFiles={isDownloadingInputFiles}
              isCloseDisabled={isCloseDisabled}
              canGenerate={canGenerate}
              canReset={canUseCurrentParameters}
              canDownloadInputFiles={downloadableExecutionInputFiles.length > 0}
              canSubmit={canUseCurrentParameters}
              onSelectScenario={handleSelectScenario}
              onGenerateParameters={handleGenerateParameters}
              onChangeParameterValue={handleChangeParameterValue}
              onDownloadInputFiles={handleDownloadInputFiles}
              onReset={handleResetParameters}
              onSubmit={handleModelParamProposalSubmitRequest}
              onCancel={handleClose}
            />
          ) : (
            <ScenarioModelExecutionFileUploadContent
              scenarioOptions={scenarioOptions}
              selectedScenarioId={selectedScenarioId}
              executingScenarioIds={executingScenarioIds}
              onSelectScenario={handleSelectScenario}
              files={files}
              isSubmitting={isSubmittingFiles}
              onFilesAdd={handleFilesAdd}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleFileSubmit}
              onCancel={handleClose}
            />
          )}
        </MIConfirm>

        <MIConfirm
          open={confirmType === 'close'}
          title="MI 수급모델 진행을 종료하시겠습니까?"
          width={450}
          handleClose={() => setConfirmType(null)}
          zIndex={1400}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setConfirmType(null) },
            { label: '종료', color: 'red', onClick: closePopup },
          ]}
        >
          현재 생성된 파라미터 제안을 닫습니다.
        </MIConfirm>

        <MIConfirm
          open={confirmType === 'scenarioChange'}
          title="시나리오를 변경하시겠습니까?"
          width={450}
          handleClose={() => setConfirmType(null)}
          zIndex={1400}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setConfirmType(null) },
            { label: '변경', color: 'primary', onClick: handleScenarioChangeConfirm },
          ]}
        >
          시나리오를 변경하면 현재 생성된 파라미터 제안이 초기화됩니다.
        </MIConfirm>

        <MIConfirm
          open={confirmType === 'submit'}
          title="MI 수급모델을 실행하시겠습니까?"
          width={450}
          handleClose={() => setConfirmType(null)}
          zIndex={1400}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setConfirmType(null) },
            {
              label: '실행',
              color: 'primary',
              disabled: isSubmitting || selectedScenarioId === null || executingScenarioIds.has(selectedScenarioId),
              onClick: handleModelParamProposalSubmitConfirm,
            },
          ]}
        >
          현재 제안된 파라미터를 기준으로 수급모델을 실행합니다.
        </MIConfirm>
      </>
    )
  },
)

ScenarioModelExecutionPopup.displayName = 'ScenarioModelExecutionPopup'

export default ScenarioModelExecutionPopup
