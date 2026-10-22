import { CircularProgress, Divider, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

import type {
  ModelInputChangeRequest,
  ModelInputFinalization,
  ModelInputSection,
  ModelInputTableInfo,
  ModelInputTablePage,
} from '@/service/mi/fundamentalModel/inputDraft'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import UploadIcon from '@/components/common/icons/UploadIcon'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelDraftTable from '@/pages/mi/fundamentalModel/components/FundamentalModelDraftTable'
import FundamentalModelInputEditorActions from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorActions'
import { getModelInputExecution } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import useModelInputAutosave from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'

export interface FundamentalModelDraftEditorRef {
  flush: () => Promise<boolean>
}

interface Props {
  caseId: number | null
  initialDraftId: string | null
  scope: string
  title: string
  description: string
  onFinalized: (caseId: number, operation?: ModelInputFinalization) => Promise<void>
  onBusyChange: (busy: boolean) => void
  initialTable?: ModelInputTablePage | null
  externalBusy?: boolean
  uploadActions?: {
    openFile: (kind?: ModelInputSection['kind']) => void
    download: (kind: ModelInputSection['kind']) => void
    canDownload: (kind: ModelInputSection['kind']) => boolean
  }
}

const FundamentalModelDraftEditor = forwardRef<FundamentalModelDraftEditorRef, Props>(
  (
    { caseId, initialDraftId, scope, title, description, onFinalized, onBusyChange, initialTable, externalBusy = false, uploadActions },
    ref,
  ) => {
    const queryClient = useQueryClient()
    const autosave = useModelInputAutosave(caseId, scope, initialDraftId)
    const {
      draft,
      edits,
      addedRows,
      error,
      isLoading,
      isSaving,
      isSavingStructure,
      hasPendingRequest,
      hasRevisionConflict,
      isCellSavePending,
      originalEdits,
      flushBeforeLeaving,
      finalize,
      discard,
      resolveRevisionConflict,
      updateEdit,
      executeCommands,
      stageRow,
      removeStagedRow,
    } = autosave
    const { showSnackbar } = useSnackbar()
    const [selection, setSelection] = useState<{ kind: ModelInputSection['kind']; sheetName: string; tableId: string }>()
    const [isSwitching, setIsSwitching] = useState(false)
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
    const [conflictAction, setConflictAction] = useState<'reload' | 'reapply' | null>(null)
    const actionRef = useRef(false)
    const handledFinalizationRef = useRef<string | undefined>(undefined)
    const selectedTableId = selection?.tableId ?? initialTable?.tableData.tableId
    const section =
      draft?.sections.find((item) => item.kind === selection?.kind) ??
      draft?.sections.find((item) =>
        item.sheets.some((sourceSheet) => sourceSheet.tables.some((candidate) => candidate.id === selectedTableId)),
      ) ??
      draft?.sections[0]
    const sheet =
      section?.sheets.find((item) => item.sheetName === selection?.sheetName) ??
      section?.sheets.find((item) => item.tables.some((candidate) => candidate.id === selectedTableId)) ??
      section?.sheets[0]
    const table = sheet?.tables.find((item) => item.id === selectedTableId) ?? sheet?.tables[0]
    const busy = isSaving || isFinalizing || isSwitching || externalBusy
    useEffect(() => {
      if (!initialTable || initialTable.draftId !== draft?.draftId || initialTable.revision !== draft.revision) return
      for (const item of draft.sections)
        for (const sourceSheet of item.sheets) {
          if (sourceSheet.tables.some((candidate) => candidate.id === initialTable.tableData.tableId)) {
            setSelection({ kind: item.kind, sheetName: sourceSheet.sheetName, tableId: initialTable.tableData.tableId })
            return
          }
        }
    }, [draft, initialTable])
    const needsSave = edits.length > 0 || addedRows.length > 0 || hasPendingRequest || busy
    useEffect(() => {
      if (error) showSnackbar(error, { variant: 'error' })
    }, [error, showSnackbar])
    useEffect(() => {
      const operation = autosave.finalization
      if (
        !operation ||
        operation.status !== 'SUCCEEDED' ||
        !operation.finalizedCaseId ||
        busy ||
        hasPendingRequest ||
        actionRef.current ||
        draft?.status !== 'FINALIZED' ||
        handledFinalizationRef.current === operation.operationId
      )
        return
      const execution = getModelInputExecution(operation)
      if (execution === undefined) return
      handledFinalizationRef.current = operation.operationId
      actionRef.current = true
      setIsFinalizing(true)
      void onFinalized(operation.finalizedCaseId, operation).finally(() => {
        actionRef.current = false
        setIsFinalizing(false)
      })
    }, [autosave.finalization, busy, draft?.status, hasPendingRequest, onFinalized])

    useEffect(() => {
      if (
        isLoading ||
        busy ||
        hasPendingRequest ||
        autosave.finalization ||
        draft?.status !== 'FINALIZED' ||
        !draft.finalizedCaseId ||
        handledFinalizationRef.current === draft.draftId
      )
        return
      handledFinalizationRef.current = draft.draftId
      void onFinalized(draft.finalizedCaseId)
    }, [autosave.finalization, busy, draft, hasPendingRequest, isLoading, onFinalized])

    const saveBeforeLeaving = useCallback(
      () => (externalBusy ? Promise.resolve(false) : draft ? flushBeforeLeaving() : Promise.resolve(!isLoading)),
      [draft, externalBusy, flushBeforeLeaving, isLoading],
    )
    useImperativeHandle(ref, () => ({ flush: saveBeforeLeaving }), [saveBeforeLeaving])
    useEffect(() => {
      onBusyChange(isFinalizing || isSwitching)
      return () => onBusyChange(false)
    }, [isFinalizing, isSwitching, onBusyChange])

    const blocker = useBlocker(
      ({ currentLocation, nextLocation }) =>
        needsSave &&
        (currentLocation.pathname !== nextLocation.pathname ||
          currentLocation.search !== nextLocation.search ||
          currentLocation.hash !== nextLocation.hash),
    )
    useEffect(() => {
      if (blocker.state !== 'blocked') return undefined
      let current = true
      void saveBeforeLeaving().then((saved) => {
        if (!current) return
        if (saved) blocker.proceed()
        else blocker.reset()
      })
      return () => {
        current = false
      }
    }, [blocker, saveBeforeLeaving])

    const selectTable = async (kind: ModelInputSection['kind'], sheetName: string, next?: ModelInputTableInfo) => {
      if (actionRef.current) return
      actionRef.current = true
      setIsSwitching(true)
      try {
        if (await saveBeforeLeaving()) setSelection({ kind, sheetName, tableId: next?.id ?? '' })
      } finally {
        actionRef.current = false
        setIsSwitching(false)
      }
    }

    const submit = async () => {
      if (actionRef.current || (!title.trim() && !hasPendingRequest) || !draft) return
      actionRef.current = true
      setIsFinalizing(true)
      try {
        const finalizedCaseId = await finalize(title, description)
        if (typeof finalizedCaseId === 'number') await onFinalized(finalizedCaseId, autosave.getFinalization())
      } finally {
        actionRef.current = false
        setIsFinalizing(false)
      }
    }

    const changeStructure = async (operations: ModelInputChangeRequest['operations']) => {
      if (actionRef.current) return false
      actionRef.current = true
      setIsSwitching(true)
      try {
        return await executeCommands(operations)
      } finally {
        actionRef.current = false
        setIsSwitching(false)
      }
    }

    const resetTable = async () => {
      if (actionRef.current || !table) return
      actionRef.current = true
      setIsSwitching(true)
      try {
        await discard(table.id)
      } finally {
        actionRef.current = false
        setIsSwitching(false)
      }
    }

    const recoverConflict = async () => {
      if (actionRef.current || !conflictAction) return
      actionRef.current = true
      setIsSwitching(true)
      setConflictAction(null)
      try {
        await resolveRevisionConflict(conflictAction === 'reapply')
      } finally {
        actionRef.current = false
        setIsSwitching(false)
      }
    }

    return (
      <Stack flex={1} minHeight={0} overflow="hidden">
        {hasRevisionConflict && (
          <Stack gap="8px" padding="12px 20px" flexShrink={0}>
            <Typography variant="body2SB14" color="contentText.Normal" role="alert">
              다른 작업에서 입력값이 변경되어 저장을 멈췄습니다. 내 변경 내용은 보관되어 있습니다.
            </Typography>
            <Stack direction="row" gap="8px" flexWrap="wrap">
              <MIBaseButton variant="outlined" disabled={busy} onClick={() => setConflictAction('reload')}>
                최신값 불러오기
              </MIBaseButton>
              <MIBaseButton variant="contained" disabled={busy} onClick={() => setConflictAction('reapply')}>
                내 변경 재적용
              </MIBaseButton>
            </Stack>
          </Stack>
        )}
        {isFinalizing ? (
          <Stack flex={1} minHeight={0} alignItems="center" justifyContent="center" gap="10px" role="status" aria-live="polite">
            <MIAgentSpinner size={40} tone="gray" />
            <Stack gap="4px" alignItems="center">
              <Typography variant="body2SB14" color="contentText.Black">
                MI 수급모델 결과 생성 중...
              </Typography>
              <Typography variant="body3M12" color="contentText.Subtext">
                잠시 기다려 주세요.
              </Typography>
            </Stack>
          </Stack>
        ) : isLoading ? (
          <Stack flex={1} alignItems="center" justifyContent="center" padding="40px">
            <CircularProgress size={24} aria-label="편집 초안 조회 중" />
          </Stack>
        ) : (
          <>
            {Boolean(draft?.sections.length) && (
              <>
                <Stack direction="row" alignItems="center" justifyContent="space-between" padding="0 24px" flexShrink={0}>
                  <Tabs
                    value={section?.kind ?? false}
                    aria-label="수급모델 입력 파일"
                    sx={{ minHeight: '54px', '& .MuiTabs-indicator': { height: '2px', bgcolor: 'commonColor.Black' } }}
                    onChange={(_event, kind: ModelInputSection['kind']) => {
                      if (uploadActions && !draft?.uploadedKinds.includes(kind)) return
                      const next = draft?.sections.find((item) => item.kind === kind)?.sheets[0]
                      void selectTable(kind, next?.sheetName ?? '', next?.tables[0])
                    }}
                  >
                    {(uploadActions
                      ? (['DEMAND', 'SUPPLY', 'TRADE', 'OUTPUT'] as const).map((kind) => ({ kind }))
                      : (draft?.sections ?? [])
                    ).map((item) => (
                      <Tab
                        key={item.kind}
                        value={item.kind}
                        disabled={busy}
                        onClick={() => {
                          if (uploadActions && !draft?.uploadedKinds.includes(item.kind)) uploadActions.openFile(item.kind)
                        }}
                        label={
                          <Typography
                            fontSize="16px"
                            fontWeight={section?.kind === item.kind ? 700 : 600}
                            lineHeight={1.4}
                            color={
                              uploadActions && !draft?.uploadedKinds.includes(item.kind) ? 'contentText.Disabled' : 'contentText.Black'
                            }
                          >
                            {item.kind}
                            {uploadActions && !draft?.uploadedKinds.includes(item.kind) && <UploadIcon width="16px" height="16px" />}
                          </Typography>
                        }
                        sx={{ minHeight: '54px', minWidth: 0, padding: '16px 20px', textTransform: 'none' }}
                      />
                    ))}
                  </Tabs>
                  {uploadActions && section && (
                    <MIBaseButton
                      variant="outlined"
                      prefix={<ChartDownloadIcon />}
                      disabled={!uploadActions.canDownload(section.kind)}
                      onClick={() => uploadActions.download(section.kind)}
                      sx={{ height: '36px', padding: '8px 10px 8px 6px', borderRadius: '8px', flexShrink: 0 }}
                    >
                      인풋 파일 다운로드
                    </MIBaseButton>
                  )}
                </Stack>
                <Divider />
              </>
            )}
            {Boolean(section?.sheets.length) && (
              <Stack padding="10px 20px" bgcolor="gray.10" borderBottom="1px solid" borderColor="contentBorder.Normal" flexShrink={0}>
                <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                  {section?.sheets.map((item) => (
                    <MIBaseButton
                      key={item.sheetName}
                      variant="outlined"
                      disabled={busy || item === sheet}
                      onClick={() => {
                        void selectTable(section.kind, item.sheetName, item.tables[0])
                      }}
                      sx={{
                        maxWidth: '260px',
                        minWidth: 0,
                        flexShrink: 0,
                        height: '32px',
                        padding: '6px 10px',
                        borderRadius: '100px',
                        bgcolor: busy ? 'contentBG.Disabled' : item === sheet ? 'contentBG.PrimaryFade' : 'commonColor.White',
                        borderColor: busy
                          ? 'contentBorder.Disabled'
                          : item === sheet
                            ? 'contentBorder.Primaryactive'
                            : 'contentBorder.Normal',
                        '&.Mui-disabled':
                          item === sheet && !busy
                            ? { bgcolor: 'contentBG.PrimaryFade', borderColor: 'contentBorder.Primaryactive' }
                            : undefined,
                      }}
                    >
                      <Typography
                        variant={item === sheet ? 'body2SB14' : 'body2M14'}
                        color={busy ? 'contentText.Disabled' : 'contentText.Normal'}
                        noWrap
                      >
                        {item.sheetName}
                      </Typography>
                    </MIBaseButton>
                  ))}
                </HorizontalScrollContainer>
              </Stack>
            )}
            {Boolean(sheet?.tables.length) && (
              <Stack padding="12px 20px" bgcolor="gray.5" borderBottom="1px solid" borderColor="contentBorder.Normal" flexShrink={0}>
                <HorizontalScrollContainer alignItems="center" gap="5px" gradientWidth={63} scrollAmount={0.85}>
                  {sheet?.tables.map((item) => (
                    <MIBaseButton
                      key={item.id}
                      variant="outlined"
                      disabled={isFinalizing || isSwitching}
                      onClick={() => {
                        if (draft && item === table) {
                          void queryClient.refetchQueries({
                            queryKey: ['fundamentalModel', 'inputDraftTable', scope, draft.draftId, draft.revision, item.id],
                            exact: true,
                          })
                          return
                        }
                        if (section) void selectTable(section.kind, sheet.sheetName, item)
                      }}
                      sx={{
                        maxWidth: '260px',
                        minWidth: '0px',
                        flexShrink: 0,
                        height: '28px',
                        padding: '6px 10px',
                        borderRadius: '100px',
                        bgcolor: busy ? 'contentBG.Disabled' : item === table ? 'contentBG.PrimaryFade' : 'commonColor.White',
                        borderColor: busy
                          ? 'contentBorder.Disabled'
                          : item === table
                            ? 'contentBorder.Primaryactive'
                            : 'contentBorder.Normal',
                        '&.Mui-disabled':
                          item === table && !busy
                            ? { bgcolor: 'contentBG.PrimaryFade', borderColor: 'contentBorder.Primaryactive' }
                            : undefined,
                        '&:hover:not(:disabled)': {
                          bgcolor: item === table ? 'contentBG.PrimaryFade' : 'contentBG.Active',
                          borderColor: item === table ? 'contentBorder.Primaryactive' : 'contentBorder.Normal',
                        },
                      }}
                    >
                      <Typography
                        variant={item === table ? 'body2SB14' : 'body2M14'}
                        color={busy ? 'contentText.Disabled' : 'contentText.Normal'}
                        noWrap
                      >
                        {item.name}
                      </Typography>
                    </MIBaseButton>
                  ))}
                </HorizontalScrollContainer>
              </Stack>
            )}
            <Stack flex={1} minWidth={0} minHeight={0} padding="20px" bgcolor="gray.5">
              <Stack
                flex={1}
                minWidth={0}
                minHeight={0}
                border="1px solid"
                borderColor="contentBorder.Normal"
                borderRadius="10px"
                overflow="hidden"
                bgcolor="commonColor.White"
              >
                {draft && table ? (
                  <FundamentalModelDraftTable
                    key={`${draft.draftId}:${table.id}`}
                    scope={scope}
                    draft={draft}
                    table={table}
                    edits={edits}
                    originalEdits={originalEdits}
                    addedRows={addedRows.filter((row) => row.tableId === table.id)}
                    onStageRow={stageRow}
                    onRemoveStagedRow={removeStagedRow}
                    disabled={
                      hasRevisionConflict ||
                      isFinalizing ||
                      isSwitching ||
                      externalBusy ||
                      isSavingStructure ||
                      (hasPendingRequest && !isCellSavePending)
                    }
                    structureDisabled={busy || hasPendingRequest}
                    isSavingStructure={isSavingStructure || isSwitching}
                    onEdit={updateEdit}
                    onCommands={changeStructure}
                  />
                ) : (
                  <Stack flex={1} />
                )}
              </Stack>
            </Stack>
          </>
        )}
        <FundamentalModelInputEditorActions
          canReset={
            !busy &&
            !hasRevisionConflict &&
            !isLoading &&
            !hasPendingRequest &&
            Boolean(
              table &&
                (originalEdits.some((edit) => edit.tableId === table.id) ||
                  edits.some((edit) => edit.tableId === table.id && !addedRows.some((row) => row.clientRowKey === edit.rowId))),
            )
          }
          canSubmit={
            !busy &&
            !hasRevisionConflict &&
            !isLoading &&
            Boolean(draft) &&
            Boolean(title.trim()) &&
            draft?.status !== 'DISCARDED' &&
            (hasPendingRequest ||
              (draft?.canFinalize !== false && (typeof draft?.sourceCaseId === 'number' || draft?.canFinalize === true))) &&
            !edits.some((edit) => edit.error)
          }
          onReset={() => setIsResetConfirmOpen(true)}
          onSubmit={() => {
            void submit()
          }}
        />
        <MIConfirm
          open={isResetConfirmOpen}
          title="현재 표의 셀 값 초기화"
          width="480px"
          zIndex={1402}
          handleClose={() => setIsResetConfirmOpen(false)}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setIsResetConfirmOpen(false) },
            {
              label: '셀 값 초기화',
              variant: 'filled',
              color: 'red',
              onClick: () => {
                setIsResetConfirmOpen(false)
                void resetTable()
              },
            },
          ]}
        >
          현재 표에서 이번 편집 중 변경한 기존 셀 값을 되돌립니다. 추가·삭제한 행과 열, 새 행의 입력값, 모드 설정은 유지됩니다. 다른 표에는
          적용되지 않습니다. 계속하시겠습니까?
        </MIConfirm>
        <MIConfirm
          open={conflictAction !== null}
          title={conflictAction === 'reapply' ? '내 변경을 최신값에 재적용할까요?' : '최신값을 불러올까요?'}
          width="480px"
          zIndex={1402}
          handleClose={() => setConflictAction(null)}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setConflictAction(null) },
            {
              label: conflictAction === 'reapply' ? '재적용' : '불러오기',
              variant: 'filled',
              color: conflictAction === 'reapply' ? 'primary' : 'red',
              onClick: recoverConflict,
            },
          ]}
        >
          {conflictAction === 'reapply'
            ? '보관된 미저장 변경을 최신 입력값에 적용하고 저장합니다. 같은 셀의 서버 값은 내 입력값으로 바뀝니다. 삭제된 행이나 편집할 수 없는 셀은 재적용할 수 없습니다.'
            : '보관된 미저장 셀 변경과 미저장 새 행을 버리고 서버의 최신 입력값을 불러옵니다. 계속하시겠습니까?'}
        </MIConfirm>
      </Stack>
    )
  },
)

FundamentalModelDraftEditor.displayName = 'FundamentalModelDraftEditor'

export default FundamentalModelDraftEditor
