import { CircularProgress, Divider, Stack, Tab, Tabs, Typography } from '@mui/material'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { useBlocker } from 'react-router-dom'

import type {
  ModelInputChangeRequest,
  ModelInputDraftStructure,
  ModelInputFinalization,
  ModelInputSection,
  ModelInputSetControlCommand,
  ModelInputTableInfo,
  ModelInputTablePage,
} from '@/service/mi/fundamentalModel/inputDraft'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import MIConfirm from '@/components/common/confirm/MIConfirm'
import UploadIcon from '@/components/common/icons/UploadIcon'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import useSnackbar from '@/hooks/useSnackbar'
import FundamentalModelDraftTable, {
  type FundamentalModelDraftTableRef,
} from '@/pages/mi/fundamentalModel/components/FundamentalModelDraftTable'
import { FUNDAMENTAL_MODEL_FILE_KINDS } from '@/pages/mi/fundamentalModel/components/fundamentalModelFileUploadUtils'
import FundamentalModelInputEditorActions from '@/pages/mi/fundamentalModel/components/FundamentalModelInputEditorActions'
import { getModelInputExecution } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import useModelInputAutosave from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'

export interface FundamentalModelDraftEditorRef {
  flush: () => Promise<boolean>
  discard: () => Promise<boolean>
  background: (discard?: boolean) => Promise<boolean>
}

export interface FundamentalModelUploadQueueRef {
  prepareUpload: () => Promise<boolean>
  completeUpload: (draft: ModelInputDraftStructure) => Promise<void>
  resumeAfterUpload: () => void
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
  active?: boolean
  uploadActions?: {
    queueRef: Ref<FundamentalModelUploadQueueRef>
    hasPendingRequest: boolean
    openFile: (kind?: ModelInputSection['kind']) => void
  }
}

// 비활성 출처는 저장 큐만 유지하고 화면 이동 차단기는 현재 편집기에만 연결한다.
const FundamentalModelDraftNavigationGuard = ({
  needsSave,
  saveBeforeLeaving,
}: {
  needsSave: boolean
  saveBeforeLeaving: () => Promise<boolean>
}) => {
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

  return null
}

const FundamentalModelDraftEditor = forwardRef<FundamentalModelDraftEditorRef, Props>(
  (
    {
      caseId,
      initialDraftId,
      scope,
      title,
      description,
      onFinalized,
      onBusyChange,
      initialTable,
      externalBusy = false,
      active = true,
      uploadActions,
    },
    ref,
  ) => {
    const tableRef = useRef<FundamentalModelDraftTableRef>(null)
    const autosave = useModelInputAutosave(caseId, scope, initialDraftId, uploadActions?.hasPendingRequest, active)
    const {
      draft,
      edits,
      addedRows,
      error,
      isLoading,
      isSaving,
      hasPendingRequest,
      isTableChanging,
      flush,
      flushBeforeLeaving,
      finalize,
      discard,
      updateEdit,
      executeCommands,
      stageRow,
      removeStagedRow,
    } = autosave
    const { showSnackbar } = useSnackbar()
    const [selection, setSelection] = useState<{ kind: ModelInputSection['kind']; sheetName: string; tableId: string }>()
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [restorableTable, setRestorableTable] = useState<{ draftId: string; revision: number; tableId: string; canRestore: boolean }>()
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
    const actionRef = useRef(false)
    const originalControlValuesRef = useRef(new Map<string, Map<string, string | number>>())
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
    const tableAddedRows = useMemo(() => addedRows.filter((row) => row.tableId === table?.id), [addedRows, table?.id])
    const busy = isFinalizing || externalBusy
    useEffect(() => {
      originalControlValuesRef.current.clear()
    }, [autosave.serverResetCount])
    useEffect(() => {
      if (!initialTable || initialTable.draftId !== draft?.draftId || initialTable.revision !== draft.revision) return
      for (const item of draft.sections)
        for (const sourceSheet of item.sheets) {
          if (sourceSheet.tables.some((candidate) => candidate.id === initialTable.tableData.tableId)) {
            setSelection(
              (current) => current ?? { kind: item.kind, sheetName: sourceSheet.sheetName, tableId: initialTable.tableData.tableId },
            )
            return
          }
        }
    }, [draft, initialTable])
    const needsSave = edits.length > 0 || addedRows.length > 0 || hasPendingRequest || isSaving || busy
    const previousErrorRef = useRef(error)
    useEffect(() => {
      const previous = previousErrorRef.current
      previousErrorRef.current = error
      if (active && error && error !== previous) showSnackbar(error, { variant: 'error' })
    }, [active, error, showSnackbar])
    useEffect(() => {
      const operation = autosave.finalization
      if (
        !active ||
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
    }, [active, autosave.finalization, busy, draft?.status, hasPendingRequest, onFinalized])

    useEffect(() => {
      if (
        !active ||
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
    }, [active, autosave.finalization, busy, draft, hasPendingRequest, isLoading, onFinalized])

    const saveBeforeLeaving = useCallback(
      () => (externalBusy ? Promise.resolve(false) : draft ? flushBeforeLeaving() : Promise.resolve(!isLoading)),
      [draft, externalBusy, flushBeforeLeaving, isLoading],
    )
    useImperativeHandle(ref, () => ({ flush: saveBeforeLeaving, discard: autosave.discardDraft, background: autosave.background }), [
      autosave.discardDraft,
      autosave.background,
      saveBeforeLeaving,
    ])
    useImperativeHandle(
      uploadActions?.queueRef,
      () => ({
        prepareUpload: autosave.prepareUpload,
        completeUpload: autosave.completeUpload,
        resumeAfterUpload: autosave.resumeAfterUpload,
      }),
      [autosave.completeUpload, autosave.prepareUpload, autosave.resumeAfterUpload],
    )
    useEffect(() => {
      if (!active) return undefined
      onBusyChange(isFinalizing)
      return () => onBusyChange(false)
    }, [active, isFinalizing, onBusyChange])

    const selectTable = (kind: ModelInputSection['kind'], sheetName: string, next?: ModelInputTableInfo) => {
      if (actionRef.current || externalBusy) return
      setSelection({ kind, sheetName, tableId: next?.id ?? '' })
      void flush(false, false)
    }

    const submit = async () => {
      if (actionRef.current || externalBusy || (!title.trim() && !hasPendingRequest) || !draft) return
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

    const changeStructure = (operations: ModelInputChangeRequest['operations']) => {
      if (actionRef.current || busy) return Promise.resolve(false)
      return executeCommands(operations)
    }

    const changeControl = (command: ModelInputSetControlCommand, originalValue: string | number) => {
      if (actionRef.current) return Promise.resolve(false)
      const originals = originalControlValuesRef.current.get(command.tableId) ?? new Map<string, string | number>()
      if (!originals.has(command.controlId)) originals.set(command.controlId, originalValue)
      originalControlValuesRef.current.set(command.tableId, originals)
      return changeStructure([command])
    }

    const resetTable = () => {
      if (actionRef.current || busy || !table) return
      void discard(table.id)
    }

    if (!active) return null

    return (
      <Stack flex={1} minHeight={0} overflow="hidden">
        <FundamentalModelDraftNavigationGuard needsSave={needsSave} saveBeforeLeaving={saveBeforeLeaving} />
        {isFinalizing ? (
          <Stack flex={1} minHeight={0} alignItems="center" justifyContent="center" gap="10px" role="status" aria-live="polite">
            <MIAgentSpinner size={40} tone="gray" />
            <Stack gap="4px" alignItems="center">
              <Typography variant="body2SB14" color="contentText.Black">
                MI 수급모델 인풋을 생성 중입니다.
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
                    {(uploadActions ? FUNDAMENTAL_MODEL_FILE_KINDS.map((kind) => ({ kind })) : (draft?.sections ?? [])).map((item) => (
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
                      disabled={busy}
                      onClick={() => {
                        if (draft && item === table) {
                          tableRef.current?.refresh()
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
                    onRestoresChange={setRestorableTable}
                    refreshRef={tableRef}
                    scope={scope}
                    draft={draft}
                    table={table}
                    edits={edits}
                    addedRows={tableAddedRows}
                    onStageRow={stageRow}
                    onRemoveStagedRow={removeStagedRow}
                    disabled={busy || isTableChanging(table.id)}
                    structureDisabled={busy || isTableChanging(table.id)}
                    isSavingStructure={isTableChanging(table.id)}
                    onEdit={updateEdit}
                    onCommands={changeStructure}
                    onControlChange={changeControl}
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
            !isLoading &&
            Boolean(
              table &&
                !isTableChanging(table.id) &&
                restorableTable?.draftId === draft?.draftId &&
                restorableTable?.revision === draft?.revision &&
                restorableTable?.tableId === table.id &&
                restorableTable.canRestore,
            )
          }
          canSubmit={
            !busy &&
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
          title="현재 표 초기화"
          width="480px"
          zIndex={1402}
          handleClose={() => setIsResetConfirmOpen(false)}
          actions={[
            { label: '취소', variant: 'outlined', color: 'gray', onClick: () => setIsResetConfirmOpen(false) },
            {
              label: '초기화',
              variant: 'filled',
              color: 'red',
              onClick: () => {
                setIsResetConfirmOpen(false)
                void resetTable()
              },
            },
          ]}
        >
          현재 표에서 복원 가능한 기존 셀 값을 원본 파일 값으로 되돌립니다. 추가·삭제한 행과 열, 새 행의 입력값, 모드 설정은 유지됩니다.
          다른 표에는 적용되지 않습니다. 계속하시겠습니까?
        </MIConfirm>
      </Stack>
    )
  },
)

FundamentalModelDraftEditor.displayName = 'FundamentalModelDraftEditor'

export default FundamentalModelDraftEditor
