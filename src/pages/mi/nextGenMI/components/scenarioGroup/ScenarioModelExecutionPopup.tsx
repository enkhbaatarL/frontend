import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'

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
import nextGenMIModelExecutionService, {
  type ModelExecutionParameter,
  type ModelExecutionSubmit,
} from '@/service/mi/nextGenMI/modelExecution'

export interface ScenarioModelExecutionPopupRef {
  open: () => void
  openFor: (scenarioId: number) => void
}

interface ScenarioModelExecutionPopupProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  parameterProposalTarget: boolean
  executingScenarioIds: Set<number>
  onAccepted: (scenarioId: number) => void
}

type ModelExecutionConfirmType = 'close' | 'reset' | 'scenarioChange' | 'submit'

const cloneModelExecutionParameter = (parameters: ModelExecutionParameter): ModelExecutionParameter => ({
  scenarioId: parameters.scenarioId,
  title: parameters.title,
  tables: parameters.tables.map((table) => ({
    tableId: table.tableId,
    tableLabel: table.tableLabel,
    timeAxisType: table.timeAxisType,
    timePeriods: [...table.timePeriods],
    rows: table.rows.map((row) => ({
      rowId: row.rowId,
      target: row.target,
      values: { ...row.values },
    })),
  })),
})

const buildModelExecutionSubmit = (parameters: ModelExecutionParameter): ModelExecutionSubmit => ({
  tables: parameters.tables.map((table) => ({
    tableId: table.tableId,
    rows: table.rows.map((row) => ({
      rowId: row.rowId,
      values: { ...row.values },
    })),
  })),
})

const isExecutionValidationError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const responseData = error.response?.data as { code?: string; message?: string } | undefined
  const code = responseData?.code?.toUpperCase() ?? ''
  const message = responseData?.message ?? ''

  return status === 400 || status === 422 || code.includes('VALID') || message.includes('유효성')
}

const ScenarioModelExecutionPopup = forwardRef<ScenarioModelExecutionPopupRef, ScenarioModelExecutionPopupProps>(
  ({ scenarioOptions, parameterProposalTarget, executingScenarioIds, onAccepted }, ref) => {
    const { showSnackbar } = useSnackbar()
    const [open, setOpen] = useState(false)
    const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [parameters, setParameters] = useState<ModelExecutionParameter | null>(null)
    const [initialParameters, setInitialParameters] = useState<ModelExecutionParameter | null>(null)
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
    const [confirmType, setConfirmType] = useState<ModelExecutionConfirmType | null>(null)
    const [pendingScenarioId, setPendingScenarioId] = useState<number | null>(null)
    const activeParameterGenerationScenarioIdRef = useRef<number | null>(null)

    const isParameterProposalMode = parameterProposalTarget
    const isFileUploadMode = !parameterProposalTarget
    const hasGeneratedParameters = isParameterProposalMode && Boolean(parameters && parameters.tables.length > 0)

    const clearParameters = useCallback(() => {
      setParameters(null)
      setInitialParameters(null)
      setSelectedTableId(null)
    }, [])

    const reset = useCallback(() => {
      activeParameterGenerationScenarioIdRef.current = null
      setSelectedScenarioId(null)
      setFiles([])
      clearParameters()
      setConfirmType(null)
      setPendingScenarioId(null)
    }, [clearParameters])

    const closePopup = useCallback(() => {
      setOpen(false)
      reset()
    }, [reset])

    const handleClose = useCallback(() => {
      if (isParameterProposalMode && parameters) {
        setConfirmType('close')
        return
      }
      closePopup()
    }, [closePopup, isParameterProposalMode, parameters])

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

    const { mutate: generateParameters, isPending: isGenerating } = useMutation({
      mutationFn: async (scenarioId: number) => {
        const [data] = await Promise.all([
          nextGenMIModelExecutionService.getModelExecutionParameters(scenarioId),
          // TODO: 파라미터 생성 UI 확인 완료 후 임시 지연을 제거합니다.
          new Promise<void>((resolve) => globalThis.setTimeout(resolve, 1000)),
        ])

        return data
      },
      onSuccess: (data, scenarioId) => {
        if (activeParameterGenerationScenarioIdRef.current !== scenarioId) return
        activeParameterGenerationScenarioIdRef.current = null
        setParameters(cloneModelExecutionParameter(data))
        setInitialParameters(cloneModelExecutionParameter(data))
        setSelectedTableId(data.tables[0]?.tableId ?? null)
      },
      onError: (_error, scenarioId) => {
        if (activeParameterGenerationScenarioIdRef.current !== scenarioId) return
        activeParameterGenerationScenarioIdRef.current = null
        showSnackbar('파라미터 생성에 실패했습니다.', { variant: 'error' })
      },
    })

    const { mutate: submitParameterExecution, isPending: isSubmittingParameters } = useMutation({
      mutationFn: ({ scenarioId, payload }: { scenarioId: number; payload: ModelExecutionSubmit }) =>
        nextGenMIModelExecutionService.submitModelExecution(scenarioId, payload),
      onSuccess: (_data, variables) => {
        onAccepted(variables.scenarioId)
        closePopup()
      },
      onError: (error) => {
        if (isExecutionValidationError(error)) {
          showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파라미터 내용을 확인해 주세요.' })
          return
        }
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
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

    const isSubmitting = isSubmittingParameters || isSubmittingFiles

    const handleSelectScenario = useCallback(
      (scenarioId: number) => {
        if (selectedScenarioId === scenarioId) return
        if (parameters) {
          setPendingScenarioId(scenarioId)
          setConfirmType('scenarioChange')
          return
        }

        setSelectedScenarioId(scenarioId)
        clearParameters()
      },
      [clearParameters, parameters, selectedScenarioId],
    )

    const handleGenerateParameters = useCallback(() => {
      if (
        !isParameterProposalMode ||
        selectedScenarioId === null ||
        activeParameterGenerationScenarioIdRef.current !== null ||
        isGenerating ||
        isSubmitting
      )
        return
      if (executingScenarioIds.has(selectedScenarioId)) return
      activeParameterGenerationScenarioIdRef.current = selectedScenarioId
      generateParameters(selectedScenarioId)
    }, [executingScenarioIds, generateParameters, isGenerating, isParameterProposalMode, isSubmitting, selectedScenarioId])

    const handleParameterValueChange = useCallback((tableId: string, rowId: string, timePeriod: string, value: number) => {
      setParameters((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.tableId !== tableId) return table

            return {
              ...table,
              rows: table.rows.map((row) => {
                if (row.rowId !== rowId) return row

                return {
                  ...row,
                  values: { ...row.values, [timePeriod]: value },
                }
              }),
            }
          }),
        }
      })
    }, [])

    const handleReset = useCallback(() => {
      if (!initialParameters) return
      setConfirmType('reset')
    }, [initialParameters])

    const handleParameterSubmitRequest = useCallback(() => {
      if (!isParameterProposalMode || isSubmitting || selectedScenarioId === null || !parameters || parameters.tables.length === 0) return
      if (executingScenarioIds.has(selectedScenarioId)) return
      setConfirmType('submit')
    }, [executingScenarioIds, isParameterProposalMode, isSubmitting, parameters, selectedScenarioId])

    const handleParameterSubmitConfirm = useCallback(() => {
      if (
        !isParameterProposalMode ||
        isSubmitting ||
        selectedScenarioId === null ||
        !parameters ||
        executingScenarioIds.has(selectedScenarioId)
      ) {
        setConfirmType(null)
        return
      }
      setConfirmType(null)
      submitParameterExecution({ scenarioId: selectedScenarioId, payload: buildModelExecutionSubmit(parameters) })
    }, [executingScenarioIds, isParameterProposalMode, isSubmitting, parameters, selectedScenarioId, submitParameterExecution])

    const handleFileSubmit = useCallback(() => {
      if (!isFileUploadMode || isSubmitting || selectedScenarioId === null || !hasRequiredFundamentalModelFiles(files)) return
      if (executingScenarioIds.has(selectedScenarioId)) return
      submitFileExecution({ scenarioId: selectedScenarioId, files })
    }, [executingScenarioIds, files, isFileUploadMode, isSubmitting, selectedScenarioId, submitFileExecution])

    const handleResetConfirm = useCallback(() => {
      if (initialParameters) {
        const nextParameters = cloneModelExecutionParameter(initialParameters)
        setParameters(nextParameters)
        setSelectedTableId(nextParameters.tables[0]?.tableId ?? null)
      }
      setConfirmType(null)
    }, [initialParameters])

    const handleScenarioChangeConfirm = useCallback(() => {
      if (pendingScenarioId === null) return
      setSelectedScenarioId(pendingScenarioId)
      clearParameters()
      setPendingScenarioId(null)
      setConfirmType(null)
    }, [clearParameters, pendingScenarioId])

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
          disableClose={isSubmitting || isGenerating}
          disableBackdropClick={isSubmitting || isGenerating}
          paperSx={
            isParameterProposalMode
              ? {
                border: '1px solid',
                borderColor: 'contentBorder.Normal',
                borderRadius: '10px',
                boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.1)',
                width: '1200px',
                maxWidth: 'calc(100dvw - 32px)',
                height: hasGeneratedParameters ? 'auto' : 'min(604px, calc(100dvh - 32px))',
                maxHeight: hasGeneratedParameters ? 'calc(100dvh - 96px)' : 'calc(100dvh - 32px)',
                margin: hasGeneratedParameters ? '48px 16px' : '16px',
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
              parameters={parameters}
              selectedTableId={selectedTableId}
              isGenerating={isGenerating}
              isSubmitting={isSubmitting}
              onSelectScenario={handleSelectScenario}
              onGenerateParameters={handleGenerateParameters}
              onSelectTable={setSelectedTableId}
              onParameterValueChange={handleParameterValueChange}
              onReset={handleReset}
              onSubmit={handleParameterSubmitRequest}
              onCancel={handleClose}
            />
          ) : (
            <ScenarioModelExecutionFileUploadContent
              scenarioOptions={scenarioOptions}
              selectedScenarioId={selectedScenarioId}
              executingScenarioIds={executingScenarioIds}
              onSelectScenario={handleSelectScenario}
              files={files}
              isSubmitting={isSubmitting}
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
          현재 입력 및 수정한 파라미터는 저장되지 않습니다.
        </MIConfirm>

        <MIConfirm
          open={confirmType === 'reset'}
          title="직전 데이터로 초기화하시겠습니까?"
          width={450}
          handleClose={() => setConfirmType(null)}
          zIndex={1400}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setConfirmType(null) },
            { label: '초기화', color: 'red', onClick: handleResetConfirm },
          ]}
        />

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
          시나리오를 변경하면 현재 입력·수정한 파라미터가 초기화됩니다.
          {'\n'}변경 후 파라미터를 다시 생성해야 합니다.
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
              onClick: handleParameterSubmitConfirm,
            },
          ]}
        >
          현재 설정된 파라미터를 기준으로 수급모델을 실행합니다.
        </MIConfirm>
      </>
    )
  },
)

ScenarioModelExecutionPopup.displayName = 'ScenarioModelExecutionPopup'

export default ScenarioModelExecutionPopup
