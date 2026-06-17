import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

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
import ScenarioModelExecutionPopupContent, {
  type ScenarioModelExecutionOption,
} from '@/pages/mi/nextGenMI/components/scenarioGroup/ScenarioModelExecutionPopupContent'
import nextGenMIModelExecutionService from '@/service/mi/nextGenMI/modelExecution'

export interface ScenarioModelExecutionPopupRef {
  open: () => void
  openFor: (scenarioId: number) => void
}

interface ScenarioModelExecutionPopupProps {
  scenarioOptions: ScenarioModelExecutionOption[]
  onAccepted: () => void
}

const isExecutionValidationError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const responseData = error.response?.data as { code?: string; message?: string } | undefined
  const code = responseData?.code?.toUpperCase() ?? ''
  const message = responseData?.message ?? ''

  return status === 400 || status === 422 || code.includes('VALID') || message.includes('유효성')
}

const ScenarioModelExecutionPopup = forwardRef<ScenarioModelExecutionPopupRef, ScenarioModelExecutionPopupProps>(
  ({ scenarioOptions, onAccepted }, ref) => {
    const { showSnackbar } = useSnackbar()
    const [open, setOpen] = useState(false)
    const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)
    const [files, setFiles] = useState<File[]>([])

    const reset = useCallback(() => {
      setSelectedScenarioId(null)
      setFiles([])
    }, [])

    const handleClose = useCallback(() => {
      setOpen(false)
      reset()
    }, [reset])

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

    const { mutate: submitExecution, isPending: isSubmitting } = useMutation({
      mutationFn: ({ scenarioId, files: uploadFiles }: { scenarioId: number; files: File[] }) =>
        nextGenMIModelExecutionService.submitModelExecution(scenarioId, uploadFiles),
      onSuccess: () => {
        onAccepted()
        handleClose()
      },
      onError: (error) => {
        if (isExecutionValidationError(error)) {
          showSnackbar('유효성 검사에 실패했습니다.', { variant: 'error', body: '파일 내용을 확인해 주세요.' })
          return
        }
        showSnackbar('MI 수급모델 실행에 실패했습니다.', { variant: 'error' })
      },
    })

    const handleSubmit = useCallback(() => {
      if (isSubmitting || selectedScenarioId === null || !hasRequiredFundamentalModelFiles(files)) return
      submitExecution({ scenarioId: selectedScenarioId, files })
    }, [files, isSubmitting, selectedScenarioId, submitExecution])

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
      <MIConfirm
        open={open}
        title="MI 수급모델"
        handleClose={handleClose}
        width={600}
        hideFooter
        disableClose={isSubmitting}
        disableBackdropClick={isSubmitting}
        paperSx={{ borderRadius: '10px' }}
        titleSx={{ padding: '12px 20px', fontSize: '18px', color: 'contentText.Black' }}
        contentSx={{ padding: 0 }}
      >
        <ScenarioModelExecutionPopupContent
          scenarioOptions={scenarioOptions}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
          files={files}
          isSubmitting={isSubmitting}
          onFilesAdd={handleFilesAdd}
          onRemoveFile={handleRemoveFile}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </MIConfirm>
    )
  },
)

ScenarioModelExecutionPopup.displayName = 'ScenarioModelExecutionPopup'

export default ScenarioModelExecutionPopup
