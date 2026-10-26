import { Box, Stack, Typography } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type RefObject,
} from 'react'

import type { ModelInputFinalization } from '@/service/mi/fundamentalModel/inputDraft'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import MIMorphingPopup, { type MIMorphingPopupRef } from '@/components/mi/MIMorphingPopup'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelDraftEditor, {
  type FundamentalModelDraftEditorRef,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelDraftEditor'
import {
  FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH,
  FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH,
} from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelInputEditorActions from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorActions'
import FundamentalModelInputSourceMenu from '@/pages/mi/fundamentalModel/components/FundamentalModelInputSourceMenu'
import FundamentalModelUploadDraftEditor from '@/pages/mi/fundamentalModel/components/FundamentalModelUploadDraftEditor'
import { getModelInputExecution, getModelInputExecutionFailure } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import { getModelInputSourceQueryOptions } from '@/pages/mi/fundamentalModel/hooks/modelInputTableQuery'
import fundamentalModelCaseService, { type FundamentalModelCaseStatus } from '@/service/mi/fundamentalModel/case'
import useAuthStore from '@/store/useAuthStore'

export interface FundamentalModelInputEditorPopupRef {
  open: () => void
}

interface Props {
  children: ReactNode
  onCreated: (caseId: string, status: FundamentalModelCaseStatus, operation?: ModelInputFinalization) => void
}

const FundamentalModelInputEditorPopup = forwardRef<FundamentalModelInputEditorPopupRef, Props>(({ children, onCreated }, ref) => {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const popupRef = useRef<MIMorphingPopupRef>(null)
  const [sourceSessions, setSourceSessions] = useState<
    Array<{
      source: string
      scope: string
      draftId: string | null
      ref: RefObject<FundamentalModelDraftEditorRef | null>
    }>
  >([])
  const sourceSwitchRef = useRef(false)
  const closingRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [pendingSource, setPendingSource] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedSource, setSelectedSource] = useState('')
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
  const [isDraftBusy, setIsDraftBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showTitleValidationError, setShowTitleValidationError] = useState(false)
  const isUploadingFiles = uploadProgress !== null
  const authScope = useAuthStore(
    ({ user, accessCompanyInfo }) =>
      `${user?.userNo ?? ''}:${user?.isOtherServiceAccessPossible ? (accessCompanyInfo?.customerCompanyNo ?? user.companyNo) : (user?.companyNo ?? '')}`,
  )
  const sourceCases = useQuery({
    ...getModelInputSourceQueryOptions(authScope),
    enabled: isOpen,
  })
  useEffect(() => {
    if (sourceCases.isError) showSnackbar('입력값 출처 목록을 불러오지 못했습니다.', { variant: 'error' })
  }, [sourceCases.isError, showSnackbar])
  const getDraftEditor = () => sourceSessions.find((item) => item.scope === authScope && item.source === selectedSource)?.ref.current
  useImperativeHandle(ref, () => ({ open: () => popupRef.current?.open() }), [])
  const cancelClose = () => {
    if (closingRef.current || sourceSwitchRef.current) return
    setIsCloseConfirmOpen(false)
    setPendingSource(null)
  }
  const confirmClose = async () => {
    if (closingRef.current || sourceSwitchRef.current || isDraftBusy) return
    closingRef.current = true
    setIsClosing(true)
    let closed = false
    try {
      const draftEditor = getDraftEditor()
      if (draftEditor) {
        const completed = await (selectedSource === 'EXCEL_UPLOAD' ? draftEditor.discard() : draftEditor.flush())
        if (!completed) throw new Error('입력값 처리를 완료하지 못했습니다.')
      }
      setIsCloseConfirmOpen(false)
      popupRef.current?.close()
      closed = true
    } catch {
      showSnackbar(
        selectedSource === 'EXCEL_UPLOAD'
          ? '작업 중인 내용을 삭제하지 못했습니다. 처리 상태를 확인한 후 다시 시도해주세요.'
          : '입력값 저장을 완료하지 못했습니다. 처리 상태를 확인한 후 다시 닫아주세요.',
        { variant: 'error' },
      )
    } finally {
      if (!closed) {
        closingRef.current = false
        setIsClosing(false)
      }
    }
  }
  const changeSource = (source: string) => {
    if (closingRef.current || sourceSwitchRef.current || isDraftBusy) return
    sourceSwitchRef.current = true
    // 세션은 유지하고 화면만 바꾼다. 기존 출처의 저장/폐기는 알림 없이 이어간다.
    void getDraftEditor()
      ?.background(selectedSource === 'EXCEL_UPLOAD')
      .catch(() => false)
    setSourceSessions((current) => {
      if (current.some((item) => item.scope === authScope && item.source === source)) return current
      const sourceCase =
        sourceCases.data?.miBase?.caseId === Number(source)
          ? sourceCases.data.miBase
          : sourceCases.data?.cases.find((item) => String(item.caseId) === source)
      return [
        ...current,
        { source, scope: authScope, draftId: sourceCase?.draftId ?? null, ref: createRef<FundamentalModelDraftEditorRef>() },
      ]
    })
    setSelectedSource(source)
    if (selectedSource === 'EXCEL_UPLOAD') {
      setTitle('')
      setDescription('')
      setShowTitleValidationError(false)
    }
    setPendingSource(null)
    sourceSwitchRef.current = false
  }
  const handleSourceChange = (source: string) => {
    if (closingRef.current || sourceSwitchRef.current || isDraftBusy || source === selectedSource) return
    if (selectedSource === 'EXCEL_UPLOAD' && hasUploadedFiles) {
      setPendingSource(source)
      return
    }
    void changeSource(source)
  }
  const handleFinalized = useCallback(
    async (caseId: number, operation?: ModelInputFinalization) => {
      const execution = operation && getModelInputExecution(operation)
      let status: FundamentalModelCaseStatus = execution?.status === 'QUEUED' || execution?.status === 'RUNNING' ? 'RUNNING' : 'PENDING'
      try {
        status = (await fundamentalModelCaseService.getCaseStatus(caseId)).status
      } catch {
        if (execution?.status === 'COMPLETED' || (execution?.status === 'FAILED' && execution.runId !== null)) status = execution.status
      }
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel'] })
      onCreated(String(caseId), status, operation)
      if (execution?.status !== 'FAILED' || execution.runId !== null) {
        showSnackbar(
          execution?.status === 'FAILED'
            ? getModelInputExecutionFailure(execution.failureReason)
            : execution?.status === 'COMPLETED'
              ? '실행 완료되었습니다.'
              : execution?.status === 'QUEUED' || execution?.status === 'RUNNING'
                ? '실행이 접수되었습니다. 목록에서 진행 상태를 확인할 수 있습니다.'
                : '입력값 저장이 완료되었습니다.',
          { variant: execution?.status === 'FAILED' ? 'error' : 'success' },
        )
      }
      setIsCloseConfirmOpen(false)
      setPendingSource(null)
      closingRef.current = true
      popupRef.current?.close()
    },
    [onCreated, queryClient, showSnackbar],
  )
  const editorHeight = 'max(447px, calc(100dvh - 188px))'
  const editorContent = (
    <Stack position="relative" flex={1} minHeight={0} height={editorHeight} width="100%" aria-busy={isUploadingFiles}>
      <Stack flex={1} minHeight={0} inert={isUploadingFiles}>
        <Stack padding="0 20px 20px" flexShrink={0}>
          <Stack gap="10px" padding="20px" borderRadius="8px" bgcolor="contentBG.Primaryactive">
            <Stack direction="row" alignItems="center" gap="12px">
              <Typography component="span" variant="body2SB14" color="contentText.Normal" flexShrink={0}>
                입력값 출처
              </Typography>
              <FundamentalModelInputSourceMenu
                selected={selectedSource}
                onSelected={(source: string) => {
                  void handleSourceChange(source)
                }}
                disabled={isDraftBusy || isClosing}
                sources={sourceCases.data}
                loading={sourceCases.isPending}
              />
            </Stack>

            <Stack direction="row" alignItems="flex-start" gap="30px" width="100%">
              <Stack width="476px" flexShrink={0} minWidth={0}>
                <Stack direction="row" alignItems="center" gap="12px">
                  <Stack direction="row" alignItems="center" width="64px" flexShrink={0}>
                    <Typography component="label" htmlFor="fundamental-model-title" variant="body2SB14" color="contentText.Normal" noWrap>
                      케이스명
                    </Typography>
                    <Box component="span" width="4px" height="4px" borderRadius="50%" bgcolor="point.red1" margin="0 0 8px 4px" />
                  </Stack>
                  <Box
                    id="fundamental-model-title"
                    component="input"
                    value={title}
                    disabled={isDraftBusy || isClosing}
                    maxLength={FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
                    placeholder="케이스명을 입력하세요 (예: 미국-이란 긴장 고조 시나리오)"
                    aria-invalid={showTitleValidationError}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setTitle(event.target.value)
                      setShowTitleValidationError(false)
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: '36px',
                      border: '1px solid',
                      borderColor: showTitleValidationError ? 'point.red1' : 'contentBorder.Normal',
                      borderRadius: '8px',
                      bgcolor: 'commonColor.White',
                      boxSizing: 'border-box',
                      color: 'contentText.Black',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      outline: 'none',
                      padding: '8px 12px',
                      '&::placeholder': { color: 'contentText.Placeholder', opacity: 1 },
                    }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" minHeight="18px" paddingTop="2px">
                  {showTitleValidationError && (
                    <Typography variant="body3R12" color="point.red1">
                      필수 입력 항목입니다.
                    </Typography>
                  )}
                  <Typography variant="body3R12" color="contentText.Subtext" marginLeft="auto">
                    {title.length} / {FUNDAMENTAL_UPLOAD_TITLE_MAX_LENGTH}
                  </Typography>
                </Stack>
              </Stack>

              <Stack flex={1} minWidth={0}>
                <Stack direction="row" alignItems="center" gap="12px">
                  <Typography
                    component="label"
                    htmlFor="fundamental-model-description"
                    variant="body2SB14"
                    color="contentText.Normal"
                    flexShrink={0}
                  >
                    설명
                  </Typography>
                  <Box
                    id="fundamental-model-description"
                    component="input"
                    value={description}
                    disabled={isDraftBusy || isClosing}
                    maxLength={FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
                    placeholder="케이스에 대한 설명을 입력하세요 (선택)"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: '36px',
                      border: '1px solid',
                      borderColor: 'contentBorder.Normal',
                      borderRadius: '8px',
                      bgcolor: 'commonColor.White',
                      boxSizing: 'border-box',
                      color: 'contentText.Black',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      outline: 'none',
                      padding: '8px 12px',
                      '&::placeholder': { color: 'contentText.Placeholder', opacity: 1 },
                    }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="flex-end" minHeight="18px" paddingTop="2px">
                  <Typography variant="body3R12" color="contentText.Subtext">
                    {description.length} / {FUNDAMENTAL_UPLOAD_DESCRIPTION_MAX_LENGTH}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {!selectedSource && (
          <Stack flex={1} minHeight={0}>
            <Stack flex={1} alignItems="center" justifyContent="center">
              <Typography variant="body2M14" color="contentText.Subtext">
                입력값 출처를 선택해주세요.
              </Typography>
            </Stack>
            <FundamentalModelInputEditorActions />
          </Stack>
        )}
        {sourceSessions
          .filter((item) => item.scope === authScope)
          .map((item) =>
            item.source === 'EXCEL_UPLOAD' ? (
              <FundamentalModelUploadDraftEditor
                key={`${item.scope}:upload`}
                ref={item.ref}
                active={isOpen && selectedSource === item.source}
                scope={authScope}
                title={title}
                description={description}
                externalBusy={isClosing}
                onBusyChange={setIsDraftBusy}
                onUploadProgressChange={setUploadProgress}
                onUploadedFilesChange={setHasUploadedFiles}
                onFinalized={handleFinalized}
              />
            ) : (
              <FundamentalModelDraftEditor
                key={`${item.scope}:${item.source}`}
                ref={item.ref}
                active={isOpen && selectedSource === item.source}
                caseId={Number(item.source)}
                initialDraftId={item.draftId}
                scope={authScope}
                title={title}
                description={description}
                externalBusy={isClosing}
                onBusyChange={setIsDraftBusy}
                onFinalized={handleFinalized}
              />
            ),
          )}
      </Stack>
      {uploadProgress && (
        <Stack
          position="absolute"
          top="0px"
          right="0px"
          bottom="0px"
          left="0px"
          zIndex={8}
          bgcolor="rgba(255, 255, 255, 0.7)"
          alignItems="center"
          justifyContent="center"
          gap="12px"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <MIAgentSpinner size={32} tone="gray" />
          <Typography variant="body2SB14" color="contentText.Normal">
            파일을 업로드 중입니다 {uploadProgress.current}/{uploadProgress.total}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
  return (
    <>
      <MIMorphingPopup
        ref={popupRef}
        display="inline-flex"
        onClick={() => popupRef.current?.open()}
        popup={{
          title: 'MI 수급모델 실행',
          hideHeaderLine: true,
          disableClose: isDraftBusy || isClosing,
          content: editorContent,
          measureContent: <Box height={editorHeight} />,
          showSkeleton: false,
          minWidth: Math.min(1376, window.innerWidth - 32),
          maxWidth: Number.POSITIVE_INFINITY,
          useInternalScroll: true,
          closeOnBackdropClick: false,
          onOpen: () => {
            closingRef.current = false
            setIsClosing(false)
            setIsCloseConfirmOpen(false)
            setPendingSource(null)
            setSelectedSource('')
            setSourceSessions([])
            setHasUploadedFiles(false)
            setTitle('')
            setDescription('')
            setShowTitleValidationError(false)
            setIsOpen(true)
          },
          onClose: () => {
            closingRef.current = false
            setIsClosing(false)
            setIsCloseConfirmOpen(false)
            setPendingSource(null)
            setIsOpen(false)
          },
          onCloseRequest: () => {
            if (!closingRef.current && !sourceSwitchRef.current && !isDraftBusy && pendingSource === null) setIsCloseConfirmOpen(true)
          },
        }}
      >
        {children}
      </MIMorphingPopup>
      <MIConfirm
        open={isCloseConfirmOpen || pendingSource !== null}
        title={pendingSource !== null ? '입력값 출처를 변경하시겠습니까?' : 'MI 수급모델 진행을 종료하시겠습니까?'}
        width="450px"
        zIndex={1402}
        disableClose={isClosing}
        handleClose={cancelClose}
        actions={[
          { label: '취소', variant: 'outlined', color: 'gray', disabled: isClosing, onClick: cancelClose },
          {
            label: pendingSource !== null ? '변경' : '종료',
            variant: 'filled',
            color: 'red',
            disabled: isClosing || isDraftBusy,
            onClick: () => (pendingSource !== null ? changeSource(pendingSource) : confirmClose()),
          },
        ]}
      >
        {selectedSource === 'EXCEL_UPLOAD'
          ? '업로드한 파일과 작업 중인 내용이 모두 삭제됩니다.'
          : '입력값 변경 사항은 유지되며, 케이스명과 설명은 저장되지 않습니다.'}
      </MIConfirm>
    </>
  )
})

FundamentalModelInputEditorPopup.displayName = 'FundamentalModelInputEditorPopup'
export default FundamentalModelInputEditorPopup
