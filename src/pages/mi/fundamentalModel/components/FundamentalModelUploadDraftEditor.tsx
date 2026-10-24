import { Collapse, Divider, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { ModelInputFinalization, ModelInputSection } from '@/service/mi/fundamentalModel/inputDraft'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import WarningIconRed from '@/components/common/icons/WarningIconRed'
import MIFileUploadDropzone from '@/components/mi/MIFileUploadDropzone'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelDraftEditor, {
  type FundamentalModelDraftEditorRef,
  type FundamentalModelUploadQueueRef,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelDraftEditor'
import {
  FUNDAMENTAL_MODEL_FILE_KINDS,
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES,
  getFundamentalModelFileKind,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelInputEditorActions from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorActions'
import { getModelInputSessionSignal, isModelInputSessionCurrent } from '@/pages/mi/fundamentalModel/hooks/modelInputSession'
import useModelInputUpload from '@/pages/mi/fundamentalModel/hooks/useModelInputUpload'
import inputDraftService from '@/service/mi/fundamentalModel/inputDraft'

interface FileReplacement {
  kind: ModelInputSection['kind']
  resolve: (confirmed: boolean) => void
}

interface Props {
  scope: string
  title: string
  description: string
  externalBusy?: boolean
  onBusyChange: (busy: boolean) => void
  onUploadProgressChange: (progress: { current: number; total: number } | null) => void
  onUploadedFilesChange: (hasFiles: boolean) => void
  onFinalized: (caseId: number, operation?: ModelInputFinalization) => Promise<void>
}

const FundamentalModelUploadDraftEditor = forwardRef<FundamentalModelDraftEditorRef, Props>(
  ({ scope, title, description, externalBusy = false, onBusyChange, onUploadProgressChange, onUploadedFilesChange, onFinalized }, ref) => {
    const editorRef = useRef<FundamentalModelDraftEditorRef>(null)
    const uploadQueueRef = useRef<FundamentalModelUploadQueueRef>(null)
    const upload = useModelInputUpload(scope, {
      onBeforeUpload: () => uploadQueueRef.current?.prepareUpload() ?? Promise.resolve(true),
      onUploaded: (draft) => uploadQueueRef.current?.completeUpload(draft) ?? Promise.resolve(),
      onUploadSettled: () => uploadQueueRef.current?.resumeAfterUpload(),
    })
    const queryClient = useQueryClient()
    const sessionRef = useRef(getModelInputSessionSignal())
    const { showSnackbar } = useSnackbar()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const targetRef = useRef<ModelInputSection['kind'] | undefined>(undefined)
    const processingRef = useRef(false)
    const mountedRef = useRef(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
    const [isInitialUpload, setIsInitialUpload] = useState(false)
    const [isEditorBusy, setIsEditorBusy] = useState(false)
    const [replacement, setReplacement] = useState<FileReplacement>()
    const replacementRef = useRef<typeof replacement>(undefined)
    const busy = isProcessing || isEditorBusy || upload.isUploading
    const isUploading = upload.isUploading || (isProcessing && !replacement)
    const visibleDraft = isInitialUpload ? undefined : upload.draft
    const showMissingFilesNotice =
      visibleDraft &&
      !isProcessing &&
      !upload.isUploading &&
      !upload.hasPendingRequest &&
      visibleDraft.uploadedKinds.length > 0 &&
      FUNDAMENTAL_MODEL_FILE_KINDS.some((kind) => !visibleDraft.uploadedKinds.includes(kind))

    useEffect(() => {
      mountedRef.current = true
      return () => {
        mountedRef.current = false
        replacementRef.current?.resolve(false)
      }
    }, [])
    useEffect(() => {
      onBusyChange(isEditorBusy || isProcessing || upload.isUploading)
      return () => onBusyChange(false)
    }, [isEditorBusy, isProcessing, onBusyChange, upload.isUploading])
    useEffect(() => {
      onUploadedFilesChange(Boolean(upload.draft || upload.hasPendingRequest))
      return () => onUploadedFilesChange(false)
    }, [onUploadedFilesChange, upload.draft, upload.hasPendingRequest])
    useEffect(() => {
      onUploadProgressChange(isUploading ? uploadProgress : null)
      return () => onUploadProgressChange(null)
    }, [isUploading, onUploadProgressChange, uploadProgress])
    useEffect(() => {
      if (upload.error) showSnackbar(upload.error, { variant: 'error' })
    }, [showSnackbar, upload.error])
    useEffect(() => {
      const selection = upload.result?.selection
      if (!selection || !isModelInputSessionCurrent(sessionRef.current, scope)) return
      queryClient.setQueryData(
        ['fundamentalModel', 'inputDraftTable', scope, selection.draftId, selection.revision, selection.tableData.tableId],
        { pages: [selection], pageParams: [undefined] },
      )
    }, [queryClient, scope, upload.result])
    useImperativeHandle(
      ref,
      () => ({
        flush: async () => {
          if (processingRef.current || upload.isUploading) return false
          if (upload.hasPendingRequest && !(await upload.resume())) return false
          return editorRef.current ? editorRef.current.flush() : true
        },
        discard: async () => {
          if (processingRef.current || upload.isUploading) return false
          if (upload.hasPendingRequest && !(await upload.resume())) return false
          if (editorRef.current) {
            if (!(await editorRef.current.discard())) return false
          } else {
            const draft = upload.getDraft()
            if (draft) {
              const current = await inputDraftService.getDraft(draft.draftId)
              await inputDraftService.discardUpload(current.draftId, current.revision)
            }
          }
          upload.clearCompleted()
          return true
        },
      }),
      [upload],
    )

    const resolveReplacement = (confirmed: boolean) => {
      replacementRef.current?.resolve(confirmed)
      replacementRef.current = undefined
      setReplacement(undefined)
    }
    const addFiles = async (files: FileList | File[] | null) => {
      const incoming = Array.from(files ?? []).sort((left, right) => {
        const leftKind = getFundamentalModelFileKind(left.name)
        const rightKind = getFundamentalModelFileKind(right.name)
        return (
          (leftKind ? FUNDAMENTAL_MODEL_FILE_KINDS.indexOf(leftKind) : -1) -
          (rightKind ? FUNDAMENTAL_MODEL_FILE_KINDS.indexOf(rightKind) : -1)
        )
      })
      if (externalBusy || processingRef.current || upload.hasPendingRequest || upload.isUploading || !files?.length) return
      processingRef.current = true
      setIsInitialUpload(!upload.getDraft())
      setIsProcessing(true)
      try {
        for (const [index, file] of incoming.entries()) {
          if (!mountedRef.current) return
          setUploadProgress({ current: index + 1, total: incoming.length })
          const kind = getFundamentalModelFileKind(file.name)
          if (
            !/\.(xlsx|xlsm)$/i.test(file.name) ||
            file.size > FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES ||
            !kind ||
            (targetRef.current && kind !== targetRef.current)
          ) {
            showSnackbar('파일 업로드가 실패했습니다.', {
              variant: 'error',
              body: `${file.name}: .xlsx/.xlsm, 파일당 50 MiB까지 지원하며 파일명에 ${targetRef.current ?? 'Demand, Supply, Trade, Output 중 하나'}가 포함되어야 합니다.`,
            })
            return
          }
          const replace = upload.getDraft()?.uploadedKinds.includes(kind) ?? false
          if (replace) {
            const confirmed = await new Promise<boolean>((resolve) => {
              const next = { kind, resolve }
              replacementRef.current = next
              setReplacement(next)
            })
            if (!confirmed || !mountedRef.current) return
          }
          if (!(await upload.upload(file, 'DRAFT_C_STRUCTURE_V1', replace))) return
        }
      } finally {
        processingRef.current = false
        targetRef.current = undefined
        if (mountedRef.current) {
          setIsProcessing(false)
          setIsInitialUpload(false)
        }
      }
    }
    const openFile = useCallback((kind?: ModelInputSection['kind']) => {
      if (processingRef.current) return
      targetRef.current = kind
      fileInputRef.current?.click()
    }, [])

    return (
      <Stack flex={1} minHeight={0}>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept=".xlsx,.xlsm"
          onChange={(event) => {
            void addFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <Collapse in={Boolean(showMissingFilesNotice)} timeout={300} unmountOnExit sx={{ flexShrink: 0 }}>
          <Stack padding="0 20px 20px" flexShrink={0}>
            <Stack
              direction="row"
              alignItems="center"
              gap="8px"
              padding="8px"
              border="1px solid"
              borderColor="contentBorder.Error"
              borderRadius="8px"
              bgcolor="#FFF9F9"
              role="alert"
            >
              <Stack direction="row" alignItems="center" gap="4px" flexShrink={0}>
                <WarningIconRed width="16px" height="16px" aria-hidden />
                <Typography component="span" fontSize="13px" fontWeight={600} lineHeight={1.4} color="contentText.Error">
                  MI Fundamental Model을 실행하려면 파일 4개가 필요합니다.
                </Typography>
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ height: '8px', alignSelf: 'center', borderColor: 'contentBorder.Error' }} />
              <Typography component="span" fontSize="13px" lineHeight={1.4} color="contentText.Error">
                Demand, Supply, Trade, Output이 각각 포함된 4개의 파일을 모두 업로드해주세요.
              </Typography>
            </Stack>
          </Stack>
        </Collapse>
        {visibleDraft ? (
          <FundamentalModelDraftEditor
            key={`${scope}:${visibleDraft.draftId}`}
            ref={editorRef}
            scope={scope}
            caseId={null}
            initialDraftId={visibleDraft.draftId}
            initialTable={upload.result?.selection}
            title={title}
            description={description}
            externalBusy={externalBusy || isProcessing || upload.isUploading || upload.hasPendingRequest}
            uploadActions={{
              queueRef: uploadQueueRef,
              hasPendingRequest: upload.hasPendingRequest,
              openFile,
            }}
            onBusyChange={setIsEditorBusy}
            onFinalized={async (caseId, operation) => {
              upload.clearCompleted()
              await onFinalized(caseId, operation)
            }}
          />
        ) : (
          <Stack flex={1} minHeight={0} padding="0 20px 20px">
            <MIFileUploadDropzone
              accept=".xlsx,.xlsm"
              maxFileSizeMb={50}
              guideText="(Demand, Supply, Trade, Output이 각각 포함된 4개의 파일을 모두 업로드해주세요. 각 파일은 50MB까지 가능합니다.)"
              disabled={externalBusy || busy || upload.hasPendingRequest}
              onFilesAdd={(files) => {
                targetRef.current = undefined
                void addFiles(files)
              }}
              sx={{ flex: 1, minHeight: '195px', borderRadius: '10px', padding: '40px 20px' }}
            />
          </Stack>
        )}
        {!visibleDraft && <FundamentalModelInputEditorActions />}
        <MIConfirm
          open={Boolean(replacement)}
          title="파일 교체"
          zIndex={1501}
          handleClose={() => resolveReplacement(false)}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => resolveReplacement(false) },
            { label: '교체', color: 'red', onClick: () => resolveReplacement(true) },
          ]}
        >
          {replacement?.kind} 파일을 교체하면 해당 파일의 기존 편집 내용이 초기화됩니다. 다른 파일의 편집 내용은 유지됩니다.
          교체하시겠습니까?
        </MIConfirm>
      </Stack>
    )
  },
)

FundamentalModelUploadDraftEditor.displayName = 'FundamentalModelUploadDraftEditor'

export default FundamentalModelUploadDraftEditor
