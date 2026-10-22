import { CircularProgress, Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { ModelInputFinalization, ModelInputSection } from '@/service/mi/fundamentalModel/inputDraft'

import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIFileUploadDropzone from '@/components/mi/MIFileUploadDropzone'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelDraftEditor, {
  type FundamentalModelDraftEditorRef,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelDraftEditor'
import {
  FUNDAMENTAL_UPLOAD_MAX_FILE_SIZE_BYTES,
  getFundamentalModelFileKind,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelInputEditorActions from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorActions'
import useModelInputUpload from '@/pages/mi/fundamentalModel/hooks/useModelInputUpload'
import { downloadFile } from '@/utils/file'

interface FileReplacement {
  kind: ModelInputSection['kind']
  resolve: (confirmed: boolean) => void
}

interface Props {
  scope: string
  title: string
  description: string
  onBusyChange: (busy: boolean) => void
  onFinalized: (caseId: number, operation?: ModelInputFinalization) => Promise<void>
}

const FundamentalModelUploadDraftEditor = forwardRef<FundamentalModelDraftEditorRef, Props>(
  ({ scope, title, description, onBusyChange, onFinalized }, ref) => {
    const upload = useModelInputUpload(scope)
    const queryClient = useQueryClient()
    const { showSnackbar } = useSnackbar()
    const editorRef = useRef<FundamentalModelDraftEditorRef>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const targetRef = useRef<ModelInputSection['kind'] | undefined>(undefined)
    const processingRef = useRef(false)
    const mountedRef = useRef(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isEditorBusy, setIsEditorBusy] = useState(false)
    const [replacement, setReplacement] = useState<FileReplacement>()
    const replacementRef = useRef<typeof replacement>(undefined)
    const filesRef = useRef(new Map<ModelInputSection['kind'], File>())
    const busy = isProcessing || isEditorBusy || upload.isUploading || upload.isLoading

    useEffect(() => {
      mountedRef.current = true
      return () => {
        mountedRef.current = false
        replacementRef.current?.resolve(false)
      }
    }, [])
    useEffect(() => {
      onBusyChange(isEditorBusy)
      return () => onBusyChange(false)
    }, [isEditorBusy, onBusyChange])
    useEffect(() => {
      if (upload.error) showSnackbar(upload.error, { variant: 'error' })
    }, [showSnackbar, upload.error])
    useEffect(() => {
      const selection = upload.result?.selection
      if (!selection) return
      queryClient.setQueryData(
        ['fundamentalModel', 'inputDraftTable', scope, selection.draftId, selection.revision, selection.tableData.tableId],
        { pages: [selection], pageParams: [undefined] },
      )
    }, [queryClient, scope, upload.result])
    useImperativeHandle(
      ref,
      () => ({
        flush: async () => {
          if (processingRef.current || upload.isUploading || upload.isLoading) return false
          if (upload.hasPendingRequest && !(await upload.resume())) return false
          return editorRef.current ? editorRef.current.flush() : true
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
      const incoming = Array.from(files ?? [])
      if (processingRef.current || upload.hasPendingRequest || upload.isLoading || upload.isUploading || !files?.length) return
      processingRef.current = true
      setIsProcessing(true)
      try {
        if (editorRef.current && !(await editorRef.current.flush())) return
        for (const file of incoming) {
          if (!mountedRef.current) return
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
          filesRef.current.set(kind, file)
        }
      } finally {
        processingRef.current = false
        targetRef.current = undefined
        if (mountedRef.current) setIsProcessing(false)
      }
    }
    const openFile = useCallback((kind?: ModelInputSection['kind']) => {
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
        {upload.isLoading ? (
          <Stack flex={1} alignItems="center" justifyContent="center">
            <CircularProgress size={24} aria-label="업로드 초안 복구 중" />
          </Stack>
        ) : upload.draft ? (
          <FundamentalModelDraftEditor
            key={`${scope}:${upload.draft.draftId}:${upload.draft.revision}`}
            ref={editorRef}
            scope={scope}
            caseId={null}
            initialDraftId={upload.draft.draftId}
            initialTable={upload.result?.selection}
            title={title}
            description={description}
            externalBusy={isProcessing || upload.isUploading || upload.hasPendingRequest}
            uploadActions={{
              openFile,
              canDownload: (kind) => filesRef.current.has(kind),
              download: (kind) => {
                const file = filesRef.current.get(kind)
                if (file) downloadFile(file, file.name)
              },
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
              disabled={busy || upload.hasPendingRequest}
              isUploading={upload.isUploading || isProcessing}
              onFilesAdd={(files) => {
                targetRef.current = undefined
                void addFiles(files)
              }}
              sx={{ flex: 1, minHeight: '195px', borderRadius: '10px', padding: '40px 20px' }}
            />
          </Stack>
        )}
        {!upload.draft && <FundamentalModelInputEditorActions />}
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
