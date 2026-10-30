import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { deleteFundamentalModelRow } from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelRowEditing'
import { getModelInputExecution } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import { getModelInputChangeOperations } from '@/pages/mi/fundamentalModel/components/modelInputRowChanges'
import { getModelInputSessionSignal, isModelInputSessionCurrent } from '@/pages/mi/fundamentalModel/hooks/modelInputSession'
import { getModelInputTableQueryOptions } from '@/pages/mi/fundamentalModel/hooks/modelInputTableQuery'
import inputDraftService, {
  type ModelInputChangeRequest,
  type ModelInputCellRestore,
  type ModelInputAddRowCommand,
  type ModelInputDraftStructure,
  type ModelInputFinalization,
  type ModelInputFinalizationRequest,
  type ModelInputOperation,
  type ModelInputProblem,
  type ModelInputTablePage,
  type ModelInputSetCommand,
  serializeModelInputChange,
} from '@/service/mi/fundamentalModel/inputDraft'
import { parseModelInputJson, stringifyModelInputJson } from '@/utils/modelInputJson'
import { areModelInputValuesEqual, isModelInputValue } from '@/utils/modelInputValidation'

export interface ModelInputLocalEdit {
  id: string
  tableId: string
  rowId: string
  fieldKey: string
  text: string
  value: ModelInputSetCommand['value'] | null
  error: string | null
  dataType?: 'DECIMAL'
  type?: 'SET' | 'CLEAR'
}

interface PendingChange {
  kind: 'CHANGE'
  statusEndpoint?: string
  body?: ModelInputChangeRequest
  operationId?: string
  editIds: string[]
  addedRowKeys?: string[]
}

interface PendingFinalization {
  kind: 'FINALIZE'
  body?: ModelInputFinalizationRequest
  operationId?: string
}

interface ModelInputOriginalEdit extends ModelInputLocalEdit {
  isSubmitted?: boolean
  isReset?: boolean
}

interface DraftRecovery {
  numericEncoding: 'lossless'
  draftId: string
  revision: number
  edits: ModelInputLocalEdit[]
  addedRows?: ModelInputAddRowCommand[]
  pending: PendingChange | PendingFinalization | null
  queuedChanges?: PendingChange[]
  blockedRevision?: number
  originalEdits?: ModelInputOriginalEdit[]
}

export { getModelInputAuthScope } from '@/pages/mi/fundamentalModel/hooks/modelInputSession'

const describeFailure = (problem: ModelInputProblem | null) =>
  problem?.reason === 'VALIDATION_FAILED' ? '유효성 검사에 실패했습니다.' : '입력 정보를 처리하지 못했습니다.'

export const getModelInputErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string; data?: ModelInputProblem | null }>(error)) {
    return error.response?.data.message || '서버 응답을 확인할 수 없습니다.'
  }
  return error instanceof Error ? error.message : '입력 정보를 처리하지 못했습니다.'
}

const isLocalEdit = (value: unknown): value is ModelInputLocalEdit => {
  if (!value || typeof value !== 'object') return false
  const edit = value as Record<string, unknown>
  return (
    ['id', 'tableId', 'rowId', 'fieldKey', 'text'].every((key) => typeof edit[key] === 'string') &&
    (edit.value === null || isModelInputValue(edit.value)) &&
    (edit.error === null || typeof edit.error === 'string') &&
    (edit.dataType === undefined || edit.dataType === 'DECIMAL') &&
    (edit.type === undefined || edit.type === 'SET' || edit.type === 'CLEAR')
  )
}

const readRecovery = (key: string): DraftRecovery | null => {
  const text = sessionStorage.getItem(key)
  if (!text) return null
  const value = parseModelInputJson(text) as DraftRecovery
  if (
    value.numericEncoding !== 'lossless' ||
    typeof value.draftId !== 'string' ||
    !Number.isSafeInteger(value.revision) ||
    !Array.isArray(value.edits) ||
    !value.edits.every(isLocalEdit) ||
    (value.blockedRevision !== undefined && !Number.isSafeInteger(value.blockedRevision)) ||
    (value.originalEdits !== undefined &&
      (!Array.isArray(value.originalEdits) ||
        !value.originalEdits.every(
          (edit) =>
            isLocalEdit(edit) &&
            (edit.isSubmitted === undefined || typeof edit.isSubmitted === 'boolean') &&
            (edit.isReset === undefined || typeof edit.isReset === 'boolean'),
        ))) ||
    (value.addedRows !== undefined &&
      (!Array.isArray(value.addedRows) ||
        value.addedRows.some(
          (row) =>
            !row ||
            row.type !== 'ADD_ROW' ||
            typeof row.commandId !== 'string' ||
            typeof row.tableId !== 'string' ||
            typeof row.clientRowKey !== 'string' ||
            !row.values ||
            typeof row.values !== 'object' ||
            Array.isArray(row.values) ||
            Object.values(row.values).some((item) => !isModelInputValue(item)),
        ))) ||
    (value.pending && !['CHANGE', 'FINALIZE'].includes(value.pending.kind)) ||
    (value.queuedChanges !== undefined &&
      (!Array.isArray(value.queuedChanges) ||
        value.queuedChanges.some(
          (change) =>
            !change ||
            change.kind !== 'CHANGE' ||
            !Array.isArray(change.body?.operations) ||
            !Array.isArray(change.editIds) ||
            !Array.isArray(change.addedRowKeys),
        )))
  ) {
    return null
  }
  return {
    numericEncoding: value.numericEncoding,
    draftId: value.draftId,
    revision: value.revision,
    edits: value.edits,
    addedRows: value.addedRows,
    pending: value.pending,
    queuedChanges: value.queuedChanges,
    blockedRevision: value.blockedRevision,
    originalEdits: value.originalEdits,
  }
}

const useModelInputAutosave = (
  caseId: number | null,
  scope: string,
  initialDraftId: string | null,
  uploadPending = false,
  active = true,
) => {
  const queryClient = useQueryClient()
  const session = useRef(getModelInputSessionSignal()).current
  const isCurrentSession = useCallback(() => isModelInputSessionCurrent(session, scope), [scope, session])
  const storageKey = `model-input-draft:${scope}:${caseId ?? `upload:${initialDraftId}`}`
  // Case별로 마운트된 편집 세션은 목록 재조회로 draftId가 바뀌어도 초기화하지 않는다.
  const initialDraftIdRef = useRef(initialDraftId)
  const [draft, setDraft] = useState<ModelInputDraftStructure>()
  const [edits, setEdits] = useState<ModelInputLocalEdit[]>([])
  const [addedRows, setAddedRows] = useState<ModelInputAddRowCommand[]>([])
  const [error, setErrorState] = useState('')
  const notificationsRef = useRef({ active, epoch: 0 })
  notificationsRef.current.active = active
  const setError = useCallback((message: string, epoch = notificationsRef.current.epoch) => {
    if (!message || (notificationsRef.current.active && epoch === notificationsRef.current.epoch)) setErrorState(message)
  }, [])
  const [isLoading, setIsLoading] = useState(true)
  const [initializationVersion, setInitializationVersion] = useState(0)
  const previousActiveRef = useRef(active)
  const [isSaving, setIsSaving] = useState(false)
  const originalValuesRef = useRef(new Map<string, ModelInputOriginalEdit[]>())
  const [originalEdits, setOriginalEdits] = useState<ModelInputOriginalEdit[]>([])
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [finalization, setFinalization] = useState<ModelInputFinalization>()
  const finalizationRef = useRef<ModelInputFinalization | undefined>(undefined)
  const stateRef = useRef<DraftRecovery | null>(null)
  const draftRef = useRef<ModelInputDraftStructure | undefined>(undefined)
  const mountedRef = useRef(false)
  const saveRef = useRef<Promise<boolean> | null>(null)
  const savePreparationRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const resettingTablesRef = useRef(new Map<string, Promise<boolean>>())
  const commandRef = useRef(false)
  const serverResetCountRef = useRef(0)
  const uploadRef = useRef<{ promise: Promise<void>; resolve(): void } | undefined>(undefined)

  const pauseForUpload = useCallback(() => {
    if (uploadRef.current) return
    let resolve!: () => void
    const promise = new Promise<void>((done) => {
      resolve = done
    })
    uploadRef.current = { promise, resolve }
  }, [])

  useEffect(() => {
    if (uploadPending) pauseForUpload()
  }, [pauseForUpload, uploadPending])

  const persist = useCallback(() => {
    if (!isCurrentSession() || !stateRef.current) return false
    try {
      stateRef.current.originalEdits = [...originalValuesRef.current.values()].flat()
      if (
        !stateRef.current.pending &&
        !stateRef.current.queuedChanges?.length &&
        !stateRef.current.edits.length &&
        !stateRef.current.addedRows?.length &&
        stateRef.current.blockedRevision === undefined
      ) {
        sessionStorage.removeItem(storageKey)
        return true
      }
      sessionStorage.setItem(storageKey, stringifyModelInputJson(stateRef.current))
      return true
    } catch {
      // 브라우저 저장소를 사용할 수 없어도 현재 화면의 요청과 변경은 메모리에 유지한다.
      return false
    }
  }, [isCurrentSession, storageKey])

  const publish = useCallback(() => {
    if (!mountedRef.current || !isCurrentSession()) return
    setEdits([...(stateRef.current?.edits ?? [])])
    setAddedRows((current) => {
      const next = stateRef.current?.addedRows ?? []
      return current.length === next.length && current.every((row, index) => row === next[index]) ? current : [...next]
    })
    setOriginalEdits((current) => {
      const next = [...originalValuesRef.current.values()].flat()
      return current.length === next.length && current.every((edit, index) => edit === next[index]) ? current : next
    })
    setHasPendingRequest(Boolean(stateRef.current?.pending || stateRef.current?.queuedChanges?.length || resettingTablesRef.current.size))
  }, [isCurrentSession])

  const loadDraft = useCallback(
    async (draftId: string, signal?: AbortSignal, uploadedDraft?: ModelInputDraftStructure) => {
      if (!isCurrentSession()) throw new Error('사용자 또는 회사가 변경되었습니다.')
      const next = uploadedDraft ?? (await inputDraftService.getDraft(draftId, signal ? AbortSignal.any([signal, session]) : session))
      signal?.throwIfAborted()
      if (!isCurrentSession()) throw new Error('사용자 또는 회사가 변경되었습니다.')
      if (mountedRef.current && notificationsRef.current.active && next.status === 'DRAFT') {
        const visibleTables = queryClient.getQueryCache().findAll({
          queryKey: ['fundamentalModel', 'inputDraftTable', scope, draftId],
          type: 'active',
        })
        for (const query of visibleTables) {
          const data = query.state.data as InfiniteData<ModelInputTablePage> | undefined
          const tableId = query.queryKey[5]
          if (!data?.pages.length || query.queryKey[4] === next.revision || typeof tableId !== 'string') continue
          if (!next.sections.some((section) => section.sheets.some((sheet) => sheet.tables.some((table) => table.id === tableId)))) continue
          // 기존 표를 유지한 채 이미 조회한 페이지까지 준비해야 스크롤 높이와 DOM이 유지된다.
          await queryClient.fetchInfiniteQuery({
            ...getModelInputTableQueryOptions(scope, draftId, next.revision, tableId),
            pages: data.pages.length,
          })
        }
      }
      signal?.throwIfAborted()
      if (!isCurrentSession()) throw new Error('사용자 또는 회사가 변경되었습니다.')
      draftRef.current = next
      if (mountedRef.current) setDraft(next)
      return next
    },
    [isCurrentSession, queryClient, scope, session],
  )

  const preserveOnRevisionConflict = useCallback(
    async (draftId: string, signal?: AbortSignal, serverDraft?: ModelInputDraftStructure, epoch = notificationsRef.current.epoch) => {
      const state = stateRef.current
      if (!state || state.draftId !== draftId) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = undefined
      // 기준 revision, 전송 snapshot, 재편집 delta를 유지하고 자동 rebase/재전송하지 않는다.
      state.blockedRevision = serverDraft?.revision ?? state.revision
      persist()
      publish()
      if (mountedRef.current && isCurrentSession()) setError(describeFailure(null), epoch)
      const next = await loadDraft(draftId, signal, serverDraft)
      state.blockedRevision = next.revision
      persist()
    },
    [isCurrentSession, loadDraft, persist, publish, setError],
  )

  const enqueueChanges = useCallback(
    (operations: ModelInputChangeRequest['operations'] = []) => {
      const state = stateRef.current
      if (!state || !isCurrentSession() || state.blockedRevision !== undefined) return false
      const queued = [state.pending?.kind === 'CHANGE' ? state.pending : null, ...(state.queuedChanges ?? [])]
      const editIds = new Set(queued.flatMap((change) => change?.editIds ?? []))
      const rowKeys = new Set(queued.flatMap((change) => change?.addedRowKeys ?? []))
      const nextEdits = state.edits.filter((edit) => !editIds.has(edit.id) && !resettingTablesRef.current.has(edit.tableId))
      const nextRows = (state.addedRows ?? []).filter(
        (row) => !rowKeys.has(row.clientRowKey) && !resettingTablesRef.current.has(row.tableId),
      )
      if (nextEdits.some((edit) => edit.error || (edit.type !== 'CLEAR' && edit.value === null))) return false
      const commands = [...getModelInputChangeOperations(nextEdits, nextRows), ...operations]
      if (!commands.length) return true
      const batches: PendingChange[] = []
      let batch: PendingChange = {
        kind: 'CHANGE',
        body: { requestId: uuid(), baseRevision: state.revision, operations: [] },
        editIds: [],
        addedRowKeys: [],
      }
      const envelopeBytes = new TextEncoder().encode(
        serializeModelInputChange({ ...batch.body!, baseRevision: Number.MAX_SAFE_INTEGER }),
      ).length
      let batchBytes = envelopeBytes
      let addedRowCount = 0
      for (const command of commands) {
        const commandBytes =
          new TextEncoder().encode(
            serializeModelInputChange({ ...batch.body!, baseRevision: Number.MAX_SAFE_INTEGER, operations: [command] }),
          ).length - envelopeBytes
        if (envelopeBytes + commandBytes > 1_048_576) throw new Error('한 번에 저장할 수 있는 범위를 초과했습니다.')
        if (
          batch.body!.operations.length >= 500 ||
          (command.type === 'ADD_ROW' && addedRowCount >= 100) ||
          batchBytes + commandBytes + (batch.body!.operations.length ? 1 : 0) > 1_048_576
        ) {
          batches.push(batch)
          batch = {
            kind: 'CHANGE',
            body: { requestId: uuid(), baseRevision: state.revision, operations: [] },
            editIds: [],
            addedRowKeys: [],
          }
          batchBytes = envelopeBytes
          addedRowCount = 0
        }
        batchBytes += commandBytes + (batch.body!.operations.length ? 1 : 0)
        batch.body!.operations.push(command)
        if (command.type === 'ADD_ROW') addedRowCount++
        if (command.type === 'ADD_ROW') {
          batch.addedRowKeys!.push(command.clientRowKey)
          batch.editIds.push(
            ...nextEdits.filter((edit) => edit.tableId === command.tableId && edit.rowId === command.clientRowKey).map((edit) => edit.id),
          )
        } else {
          const edit = nextEdits.find(
            (item) => command.commandId === `${item.type === 'CLEAR' ? 'clear' : 'set'}_${item.id.replaceAll('-', '')}`,
          )
          if (edit) batch.editIds.push(edit.id)
        }
      }
      batches.push(batch)
      state.queuedChanges = [...(state.queuedChanges ?? []), ...batches]
      persist()
      publish()
      return true
    },
    [isCurrentSession, persist, publish],
  )

  const isTableChanging = useCallback((tableId: string) => {
    if (resettingTablesRef.current.has(tableId)) return true
    const state = stateRef.current
    if (state?.pending && (state.pending.kind === 'FINALIZE' || !state.pending.body)) return true
    return [state?.pending, ...(state?.queuedChanges ?? [])].some(
      (change) =>
        change?.kind === 'CHANGE' &&
        change.body?.operations.some(
          (operation) =>
            operation.tableId === tableId &&
            !('rowRef' in operation && 'fieldKey' in operation && (operation.type === 'SET' || operation.type === 'CLEAR')),
        ),
    )
  }, [])

  const flush = useCallback(
    (
      keepalive = false,
      drain = true,
      beforeUpload = false,
      notificationEpoch = notificationsRef.current.active ? notificationsRef.current.epoch : -1,
    ): Promise<boolean> => {
      if (!isCurrentSession()) return Promise.resolve(false)
      if (drain && resettingTablesRef.current.size) {
        return Promise.all([...resettingTablesRef.current.values()]).then((results) =>
          results.every(Boolean) ? flush(keepalive, drain, beforeUpload, notificationEpoch) : false,
        )
      }
      if (uploadRef.current && !beforeUpload) {
        persist()
        return uploadRef.current.promise.then(() => flush(keepalive, drain, beforeUpload, notificationEpoch))
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = undefined
      if (saveRef.current) {
        persist()
        return drain
          ? saveRef.current.then((saved) => (saved ? flush(keepalive, true, beforeUpload, notificationEpoch) : false))
          : saveRef.current
      }
      const state = stateRef.current
      if (!state || !isCurrentSession()) return Promise.resolve(false)
      if (state.blockedRevision !== undefined) return Promise.resolve(false)
      // 입력 중에는 메모리에만 보관하고, 저장 시도 직전에 복구용 백업을 기록한다.
      persist()
      if (
        !state.pending &&
        !state.queuedChanges?.length &&
        !state.edits.some((edit) => !resettingTablesRef.current.has(edit.tableId)) &&
        !state.addedRows?.some((row) => !resettingTablesRef.current.has(row.tableId))
      )
        return Promise.resolve(true)
      if (
        !state.pending &&
        !state.queuedChanges?.length &&
        state.edits.some(
          (edit) => !resettingTablesRef.current.has(edit.tableId) && (edit.error || (edit.type !== 'CLEAR' && edit.value === null)),
        )
      ) {
        return Promise.resolve(false)
      }

      const run = async () => {
        const epoch = notificationEpoch
        let submitting = false
        const controller = new AbortController()
        savePreparationRef.current = state.pending ? null : controller
        if (mountedRef.current) {
          setError('')
          setIsSaving(true)
        }
        try {
          if (!state.pending) {
            if (draftRef.current?.status !== 'DRAFT') throw new Error('편집이 종료되었습니다.')
            // 이전 성공 버전을 자동으로 최신 버전에 덮어쓰지 않는다.
            // 종료 시에는 재조회보다 변경 접수를 우선하며 서버가 revision을 검증한다.
            if (!keepalive) {
              const current = await loadDraft(state.draftId, controller.signal)
              if (current.status !== 'DRAFT') throw new Error('편집이 종료되었습니다.')
              if (current.revision !== state.revision) {
                await preserveOnRevisionConflict(state.draftId, controller.signal, current, epoch)
                return false
              }
              if (current.activeOperationId && current.activeOperationEndpoint) {
                if (current.activeOperationEndpoint.includes('/input-upload-requests/'))
                  throw new Error(describeFailure({ reason: 'DRAFT_BUSY', currentRevision: current.revision, issues: [] }))
                state.pending = current.activeOperationEndpoint.includes('/finalizations/')
                  ? { kind: 'FINALIZE', operationId: current.activeOperationId }
                  : { kind: 'CHANGE', operationId: current.activeOperationId, editIds: [] }
                publish()
              }
            }
            if (!state.pending) {
              if (!state.queuedChanges?.length && !enqueueChanges()) return false
              state.pending = state.queuedChanges?.shift() ?? null
              // 대기 중인 요청은 직전 요청이 완료한 revision으로 처음 전송한다.
              if (state.pending?.body) state.pending.body.baseRevision = state.revision
              publish()
            }
          }
          const pending = state.pending
          if (!pending) return true
          savePreparationRef.current = null
          if (!isCurrentSession()) return false
          if (pending.kind === 'CHANGE' && pending.body) {
            if (
              pending.body.operations.length > 500 ||
              pending.body.operations.filter((command) => command.type === 'ADD_ROW').length > 100 ||
              new TextEncoder().encode(serializeModelInputChange(pending.body)).length > 1_048_576
            ) {
              state.pending = null
              throw new Error('한 번에 저장할 수 있는 범위를 초과했습니다.')
            }
          }
          persist()
          submitting = !pending.operationId
          let operation: ModelInputOperation | ModelInputFinalization | null = null
          if (pending.kind === 'CHANGE') {
            if (pending.operationId)
              operation = await inputDraftService.getChange(state.draftId, pending.operationId, pending.statusEndpoint)
            else if (pending.body) {
              for (const [tableId, originals] of originalValuesRef.current) {
                for (const original of originals) {
                  if (
                    pending.body.operations.some(
                      (command) =>
                        (command.type === 'SET' || command.type === 'CLEAR') &&
                        'rowRef' in command &&
                        'fieldKey' in command &&
                        command.tableId === tableId &&
                        command.rowRef.rowId === original.rowId &&
                        command.fieldKey === original.fieldKey,
                    )
                  )
                    original.isSubmitted = true
                }
              }
              operation = await inputDraftService.change(
                state.draftId,
                pending.body,
                keepalive && new TextEncoder().encode(serializeModelInputChange(pending.body)).length < 60_000,
              )
            }
          } else {
            if (pending.operationId) operation = await inputDraftService.getFinalization(state.draftId, pending.operationId)
            else if (pending.body) operation = await inputDraftService.finalize(state.draftId, pending.body)
          }
          submitting = false
          if (!operation) throw new Error('입력 정보를 처리하지 못했습니다.')
          const isProcessing = (result: ModelInputOperation | ModelInputFinalization) => {
            if (!isCurrentSession()) throw new axios.CanceledError()
            // 최종저장은 새 requestId여도 같은 완료 내용이면 원래 작업을 반환한다.
            if (
              result.draftId !== state.draftId ||
              (pending.operationId && result.operationId !== pending.operationId) ||
              (pending.kind === 'CHANGE' && pending.body && result.requestId !== pending.body.requestId) ||
              !['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'].includes(result.status)
            ) {
              throw new Error('저장 상태를 확인할 수 없습니다.')
            }
            if (pending.kind === 'FINALIZE') {
              if (!('finalizedCaseId' in result)) throw new Error('최종저장 상태를 확인할 수 없습니다.')
              finalizationRef.current = result
              if (mountedRef.current) setFinalization(result)
              if (result.status === 'SUCCEEDED') {
                const execution = getModelInputExecution(result)
                if (execution === undefined) throw new Error('실행 상태를 확인할 수 없습니다.')
                // 저장과 실행 접수가 끝나면 목록에서 모델 실행 상태를 추적한다.
                return false
              }
            }
            return result.status === 'QUEUED' || result.status === 'RUNNING'
          }
          let processing = isProcessing(operation)
          if (pending.kind === 'CHANGE') pending.statusEndpoint = operation.statusEndpoint
          pending.operationId = operation.operationId
          persist()
          while (processing) {
            if (!mountedRef.current || !isCurrentSession()) return false
            await new Promise((resolve) => setTimeout(resolve, 2000))
            if (!mountedRef.current || !isCurrentSession()) return false
            operation =
              pending.kind === 'CHANGE'
                ? await inputDraftService.getChange(state.draftId, operation.operationId, operation.statusEndpoint)
                : await inputDraftService.getFinalization(state.draftId, operation.operationId)
            processing = isProcessing(operation)
          }
          if (operation.status === 'FAILED') {
            if (operation.failure?.reason === 'REVISION_CONFLICT') {
              await preserveOnRevisionConflict(state.draftId, undefined, undefined, epoch)
              return false
            }
            if (pending.kind === 'CHANGE') {
              for (const issue of operation.failure?.issues ?? []) {
                const command = pending.body?.operations.find((item) => item.commandId === issue.commandId)
                if (!command || !('rowRef' in command) || !('fieldKey' in command)) continue
                const edit = state.edits.find(
                  (item) =>
                    pending.editIds.includes(item.id) &&
                    item.tableId === command.tableId &&
                    item.rowId === command.rowRef.rowId &&
                    item.fieldKey === command.fieldKey,
                )
                if (edit) edit.error = describeFailure({ reason: 'VALIDATION_FAILED', currentRevision: null, issues: [] })
              }
            }
            state.pending = null
            persist()
            throw new Error(describeFailure(operation.failure))
          }
          const next = await loadDraft(state.draftId)
          if (pending.kind === 'CHANGE' && !pending.body) {
            if (state.edits.length || state.addedRows?.length || state.queuedChanges?.length || originalValuesRef.current.size) {
              await preserveOnRevisionConflict(state.draftId, undefined, next, epoch)
              return false
            }
          }
          if (pending.kind === 'CHANGE') {
            state.edits = state.edits.filter((edit) => !pending.editIds.includes(edit.id))
            state.addedRows = (state.addedRows ?? []).filter((row) => !pending.addedRowKeys?.includes(row.clientRowKey))
            // 삭제한 행/열의 셀을 이후 초기화 요청에 포함하지 않는다.
            for (const command of pending.body?.operations ?? []) {
              if (command.type !== 'DELETE_ROW' && command.type !== 'DELETE_COLUMN') continue
              const originals = (originalValuesRef.current.get(command.tableId) ?? []).filter((edit) =>
                command.type === 'DELETE_ROW' ? edit.rowId !== command.rowRef.rowId : edit.fieldKey !== command.fieldKey,
              )
              if (originals.length) originalValuesRef.current.set(command.tableId, originals)
              else originalValuesRef.current.delete(command.tableId)
            }
          }
          state.revision = next.revision
          state.pending = null
          persist()
          return true
        } catch (cause) {
          if (!isCurrentSession()) return false
          if (controller.signal.aborted) return true
          let failure = cause
          // 접수 여부가 불명확한 통신/5xx와 조회 오류는 동일 요청을 보관한다.
          const revisionConflict =
            axios.isAxiosError<{ data?: ModelInputProblem | null }>(cause) && cause.response?.data.data?.reason === 'REVISION_CONFLICT'
          if (
            submitting &&
            state.blockedRevision === undefined &&
            !revisionConflict &&
            axios.isAxiosError(cause) &&
            cause.response &&
            cause.response.status >= 400 &&
            cause.response.status < 500
          ) {
            state.pending = null
          }
          if (axios.isAxiosError<{ data?: ModelInputProblem | null }>(cause)) {
            if (cause.response?.status === 404 && state.blockedRevision === undefined) {
              state.pending = null
              draftRef.current = undefined
              if (mountedRef.current) setDraft(undefined)
            } else if (revisionConflict) {
              try {
                await preserveOnRevisionConflict(state.draftId, undefined, undefined, epoch)
                return false
              } catch (reloadError) {
                failure = reloadError
              }
            }
          }
          try {
            persist()
          } catch (storageError) {
            if (mountedRef.current) setError(getModelInputErrorMessage(storageError), epoch)
          }
          if (mountedRef.current) setError(getModelInputErrorMessage(failure), epoch)
          return false
        } finally {
          if (savePreparationRef.current === controller) savePreparationRef.current = null
          publish()
          if (mountedRef.current) {
            setIsSaving(false)
          }
        }
      }
      saveRef.current = run().finally(() => {
        saveRef.current = null
      })
      return saveRef.current.then((saved) => {
        if (!saved) return false
        // 실행과 화면 종료는 대기열을 모두 비우고, 자동저장은 현재 요청 이후 모인 변경을 다음 묶음으로 전송한다.
        if (drain) return flush(keepalive, true, beforeUpload, notificationEpoch)
        if (
          mountedRef.current &&
          !commandRef.current &&
          !state.pending &&
          (state.queuedChanges?.length ||
            state.edits.some((edit) => !resettingTablesRef.current.has(edit.tableId)) ||
            state.addedRows?.some((row) => !resettingTablesRef.current.has(row.tableId)))
        ) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            timerRef.current = undefined
            void flush(false, false, false, notificationEpoch)
          }, 0)
        }
        return true
      })
    },
    [enqueueChanges, isCurrentSession, loadDraft, persist, publish, preserveOnRevisionConflict, setError],
  )

  const resumeAfterUpload = useCallback(() => {
    const upload = uploadRef.current
    if (!upload) return
    uploadRef.current = undefined
    upload.resolve()
    if (mountedRef.current) void flush(false, false)
  }, [flush])

  const prepareUpload = useCallback(async () => {
    if (!isCurrentSession()) return false
    if (uploadRef.current) return true
    if (!stateRef.current || commandRef.current || draftRef.current?.status !== 'DRAFT') return false
    // 접수된 저장을 마친 뒤 업로드를 시작하고, 이후 편집은 기존 큐에 보관한다.
    pauseForUpload()
    const resetCount = serverResetCountRef.current
    const saved = await flush(false, true, true)
    const ready = saved || serverResetCountRef.current !== resetCount
    if (!ready) resumeAfterUpload()
    return ready
  }, [flush, isCurrentSession, pauseForUpload, resumeAfterUpload])

  const completeUpload = useCallback(
    async (uploadedDraft: ModelInputDraftStructure) => {
      const state = stateRef.current
      if (!state) return
      if (uploadedDraft.draftId !== state.draftId || uploadedDraft.sourceCaseId !== caseId)
        throw new Error('업로드 초안 정보가 일치하지 않습니다.')
      // 편집기와 미저장 변경을 유지한 채, 업로드가 완료한 revision부터 저장을 이어간다.
      await loadDraft(uploadedDraft.draftId, undefined, uploadedDraft)
      if (state.blockedRevision === undefined) state.revision = uploadedDraft.revision
      else state.blockedRevision = uploadedDraft.revision
      persist()
      publish()
    },
    [caseId, loadDraft, persist, publish],
  )

  const flushBeforeLeaving = useCallback(async () => {
    const epoch = notificationsRef.current.active ? notificationsRef.current.epoch : -1
    const state = stateRef.current
    if (!state || !isCurrentSession()) return false
    if (state.blockedRevision !== undefined) return persist()
    if ((state.pending || saveRef.current) && !(await flush(false, false, false, epoch))) return false
    if (!state.edits.some((edit) => edit.error || (edit.type !== 'CLEAR' && edit.value === null))) return flush(false, true, false, epoch)
    try {
      return persist()
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause), epoch)
      return false
    }
  }, [flush, isCurrentSession, persist, setError])

  const discardDraft = useCallback(async () => {
    const epoch = notificationsRef.current.active ? notificationsRef.current.epoch : -1
    const state = stateRef.current
    if (!state || commandRef.current || !isCurrentSession()) return false
    commandRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    savePreparationRef.current?.abort()
    try {
      // 이미 접수된 작업만 완료하고, 아직 전송하지 않은 편집은 저장하지 않는다.
      if (saveRef.current) await saveRef.current
      if (state.pending && !(await flush(false, false, false, epoch))) return false
      const current = await loadDraft(state.draftId)
      await inputDraftService.discardUpload(current.draftId, current.revision)
      state.edits = []
      state.addedRows = []
      state.pending = null
      state.queuedChanges = []
      persist()
      stateRef.current = null
      draftRef.current = undefined
      originalValuesRef.current.clear()
      queryClient.removeQueries({ queryKey: ['fundamentalModel', 'inputDraftTable', scope, current.draftId] })
      void queryClient.invalidateQueries({
        queryKey: ['fundamentalModel', 'inputSourceCases', scope],
        refetchType: epoch < 0 ? 'none' : 'active',
      })
      publish()
      return true
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause), epoch)
      return false
    } finally {
      commandRef.current = false
    }
  }, [flush, isCurrentSession, loadDraft, persist, publish, queryClient, scope, setError])

  useEffect(() => {
    mountedRef.current = true
    setIsLoading(true)
    const controller = new AbortController()
    const initialize = async () => {
      const epoch = notificationsRef.current.active ? notificationsRef.current.epoch : -1
      try {
        if (!isCurrentSession()) return
        let recovery: DraftRecovery | null = null
        try {
          recovery = readRecovery(storageKey)
        } catch {
          recovery = null
        }
        const needsRecovery = Boolean(
          recovery?.pending ||
            recovery?.queuedChanges?.length ||
            recovery?.edits.length ||
            recovery?.addedRows?.length ||
            recovery?.blockedRevision !== undefined,
        )
        let current: ModelInputDraftStructure | undefined
        // 미확정 요청/미저장 변경만 우선 복구한다. 완료된 로컬 Draft ID를 편집 진입점으로 재사용하지 않는다.
        if (recovery && needsRecovery)
          current = await inputDraftService.getDraft(recovery.draftId, AbortSignal.any([controller.signal, session]))
        else if (initialDraftIdRef.current) {
          const existing = await inputDraftService.getDraft(initialDraftIdRef.current, AbortSignal.any([controller.signal, session]))
          if (existing.sourceCaseId !== caseId) throw new Error('선택한 Case와 편집 초안이 일치하지 않습니다.')
          current = existing
        }
        if (!current) {
          if (caseId === null) throw new Error('업로드 초안을 찾을 수 없습니다.')
          const source = await inputDraftService.getSource(caseId, AbortSignal.any([controller.signal, session]))
          if (!isCurrentSession()) return
          const created = await inputDraftService.createDraft(caseId, source.sourceVersion, AbortSignal.any([controller.signal, session]))
          if (!isCurrentSession()) return
          current = await inputDraftService.getDraft(created.draftId, AbortSignal.any([controller.signal, session]))
        }
        if (controller.signal.aborted || !isCurrentSession()) return
        if (current.sourceCaseId !== caseId) throw new Error('선택한 Case와 편집 초안이 일치하지 않습니다.')
        const state: DraftRecovery =
          needsRecovery && recovery?.draftId === current.draftId
            ? recovery
            : { numericEncoding: 'lossless', draftId: current.draftId, revision: current.revision, edits: [], pending: null }
        if (
          current.activeOperationId &&
          current.activeOperationEndpoint &&
          !state.pending &&
          !current.activeOperationEndpoint.includes('/input-upload-requests/')
        ) {
          state.pending = current.activeOperationEndpoint.includes('/finalizations/')
            ? { kind: 'FINALIZE', operationId: current.activeOperationId }
            : { kind: 'CHANGE', operationId: current.activeOperationId, editIds: [] }
        }
        stateRef.current = state
        originalValuesRef.current.clear()
        for (const edit of state.originalEdits ?? []) {
          const originals = originalValuesRef.current.get(edit.tableId) ?? []
          originals.push(edit)
          originalValuesRef.current.set(edit.tableId, originals)
        }
        persist()
        draftRef.current = current
        setDraft(current)
        publish()
        if (state.blockedRevision !== undefined) {
          setError(describeFailure(null))
        } else if (
          state.revision !== current.revision &&
          !state.pending?.operationId &&
          (state.pending || state.queuedChanges?.length || state.edits.length || state.addedRows?.length)
        ) {
          await preserveOnRevisionConflict(state.draftId, controller.signal, current, epoch)
        } else if (state.pending || state.queuedChanges?.length) await flush(false, true, false, epoch)
        else if ((state.edits.length || state.addedRows?.length) && state.revision !== current.revision) {
          await preserveOnRevisionConflict(state.draftId, controller.signal, current, epoch)
        }
      } catch (cause) {
        if (!controller.signal.aborted && isCurrentSession()) setError(getModelInputErrorMessage(cause), epoch)
      } finally {
        if (!controller.signal.aborted && isCurrentSession()) setIsLoading(false)
      }
    }
    void initialize()
    return () => {
      controller.abort()
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      void flush(true)
    }
  }, [caseId, flush, initializationVersion, isCurrentSession, persist, publish, preserveOnRevisionConflict, session, storageKey, setError])

  useEffect(() => {
    const wasActive = previousActiveRef.current
    previousActiveRef.current = active
    if (!active || wasActive) return
    const state = stateRef.current
    if (!state) {
      if (!isLoading) setInitializationVersion((current) => current + 1)
      return
    }
    // 재진입 시 미확정 요청을 같은 requestId로 이어간다. 과거 요청의 오류는 알리지 않는다.
    if (!saveRef.current && !commandRef.current && state.blockedRevision === undefined && (state.pending || state.queuedChanges?.length))
      void flush(false, false, false, -1)
  }, [active, flush, isLoading])

  const updateEdit = useCallback(
    (edit: Omit<ModelInputLocalEdit, 'id'>, originalValue: unknown) => {
      const state = stateRef.current
      if (
        !state ||
        !isCurrentSession() ||
        commandRef.current ||
        state.pending?.kind === 'FINALIZE' ||
        isTableChanging(edit.tableId) ||
        draftRef.current?.status !== 'DRAFT'
      )
        return
      state.edits = state.edits.filter(
        (existing) => existing.tableId !== edit.tableId || existing.rowId !== edit.rowId || existing.fieldKey !== edit.fieldKey,
      )
      const isAddedRow = state.addedRows?.some((row) => row.tableId === edit.tableId && row.clientRowKey === edit.rowId)
      const changesPendingCell = [state.pending, ...(state.queuedChanges ?? [])].some(
        (change) =>
          change?.kind === 'CHANGE' &&
          change.body?.operations.some(
            (operation) =>
              'rowRef' in operation &&
              'fieldKey' in operation &&
              operation.tableId === edit.tableId &&
              operation.rowRef.rowId === edit.rowId &&
              operation.fieldKey === edit.fieldKey,
          ),
      )
      if (changesPendingCell || edit.error || !areModelInputValuesEqual(edit.value, originalValue)) {
        const originals = originalValuesRef.current.get(edit.tableId) ?? []
        if (!isAddedRow && !originals.some((item) => item.rowId === edit.rowId && item.fieldKey === edit.fieldKey)) {
          originals.push({
            ...edit,
            id: uuid(),
            text: String(originalValue ?? ''),
            value: isModelInputValue(originalValue) ? originalValue : null,
            type: originalValue === null || originalValue === undefined ? 'CLEAR' : 'SET',
            error: null,
          })
          originalValuesRef.current.set(edit.tableId, originals)
        }
        state.edits.push({ ...edit, id: uuid() })
      }
      const original = originalValuesRef.current
        .get(edit.tableId)
        ?.find((item) => item.rowId === edit.rowId && item.fieldKey === edit.fieldKey)
      if (original) original.isReset = !edit.error && areModelInputValuesEqual(edit.value, original.value)
      if (state.blockedRevision === undefined) setError('')
      publish()
      if (state.blockedRevision !== undefined) {
        persist()
        return
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined
        void flush(false, false)
      }, 8000)
    },
    [flush, isCurrentSession, isTableChanging, persist, publish, setError],
  )

  const stageRow = useCallback(
    async (command: ModelInputAddRowCommand, initialEdits: Omit<ModelInputLocalEdit, 'id'>[]) => {
      const state = stateRef.current
      if (!state || commandRef.current || isTableChanging(command.tableId) || draftRef.current?.status !== 'DRAFT' || !isCurrentSession())
        return false
      state.addedRows = [...(state.addedRows ?? []), command]
      state.edits.push(...initialEdits.map((edit) => ({ ...edit, id: uuid() })))
      persist()
      publish()
      if (!state.edits.some((edit) => edit.error)) void flush(false, false)
      return true
    },
    [flush, isCurrentSession, isTableChanging, persist, publish],
  )

  const removeStagedRow = useCallback(
    (clientRowKey: string) => {
      const state = stateRef.current
      if (
        !state ||
        !isCurrentSession() ||
        [state.pending, ...(state.queuedChanges ?? [])].some(
          (change) => change?.kind === 'CHANGE' && change.addedRowKeys?.includes(clientRowKey),
        )
      )
        return
      state.addedRows = deleteFundamentalModelRow(state.addedRows ?? [], clientRowKey, (row) => row.clientRowKey)
      state.edits = state.edits.filter((edit) => edit.rowId !== clientRowKey)
      publish()
      void flush()
    },
    [flush, isCurrentSession, publish],
  )

  const finalize = useCallback(
    async (title: string, description: string) => {
      if (!(await flush())) return false
      const state = stateRef.current
      if (!state || !isCurrentSession()) return null
      if (draftRef.current?.status === 'FINALIZED') return draftRef.current.finalizedCaseId
      const current = await loadDraft(state.draftId).catch((cause: unknown) => {
        if (mountedRef.current) setError(getModelInputErrorMessage(cause))
        return undefined
      })
      if (!current) return null
      if (current.status === 'FINALIZED') return current.finalizedCaseId
      // 기존 Case 초안은 현재 서버에서 업로드 준비 상태를 생략한다. 직접 업로드만 true를 필수로 확인한다.
      if (current.canFinalize === false || (current.sourceCaseId === null && current.canFinalize !== true)) {
        setError('파일 업로드가 완료되지 않았습니다.')
        return null
      }
      if (current.revision !== state.revision) {
        await preserveOnRevisionConflict(state.draftId, undefined, current)
        return null
      }
      if (current.status !== 'DRAFT' || current.activeOperationId) {
        const reason = current.activeOperationId ? 'DRAFT_BUSY' : 'DRAFT_NOT_EDITABLE'
        setError(
          describeFailure({
            reason,
            currentRevision: current.revision,
            issues: [],
          }),
        )
        return null
      }
      finalizationRef.current = undefined
      setFinalization(undefined)
      state.pending = {
        kind: 'FINALIZE',
        body: { requestId: uuid(), baseRevision: state.revision, title: title.trim(), description },
      }
      try {
        persist()
      } catch {
        state.pending = null
        setError('입력 정보를 처리하지 못했습니다.')
        return false
      }
      publish()
      if (!(await flush())) return null
      return draftRef.current?.finalizedCaseId ?? null
    },
    [flush, isCurrentSession, loadDraft, persist, publish, preserveOnRevisionConflict, setError],
  )

  const executeCommands = useCallback(
    async (operations: ModelInputChangeRequest['operations']) => {
      if (commandRef.current || !operations.length || operations.some((operation) => isTableChanging(operation.tableId))) return false
      const epoch = notificationsRef.current.epoch
      try {
        if (!enqueueChanges(operations)) return false
        // 호출한 표의 명령까지만 기다린다. 이후 다른 표의 변경은 백그라운드에서 이어간다.
        const commandIds = new Set(operations.map((operation) => operation.commandId))
        while (
          [stateRef.current?.pending, ...(stateRef.current?.queuedChanges ?? [])].some(
            (change) => change?.kind === 'CHANGE' && change.body?.operations.some((operation) => commandIds.has(operation.commandId)),
          )
        ) {
          if (!(await flush(false, false, false, epoch))) return false
        }
        return true
      } catch (cause) {
        if (mountedRef.current) setError(getModelInputErrorMessage(cause), epoch)
        return false
      }
    },
    [enqueueChanges, flush, isTableChanging, setError],
  )

  const discard = useCallback(
    async (tableId: string) => {
      const state = stateRef.current
      if (
        !state ||
        commandRef.current ||
        uploadRef.current ||
        isTableChanging(tableId) ||
        draftRef.current?.status !== 'DRAFT' ||
        state.blockedRevision !== undefined ||
        !isCurrentSession()
      )
        return false
      const epoch = notificationsRef.current.epoch
      let resolve!: (saved: boolean) => void
      const promise = new Promise<boolean>((done) => {
        resolve = done
      })
      resettingTablesRef.current.set(tableId, promise)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = undefined
      publish()
      let completed = false
      try {
        // 이미 접수되거나 큐에 들어간 요청의 본문은 바꾸지 않고, 성공한 revision의 원본 정보를 조회한다.
        while (
          [state.pending, ...(state.queuedChanges ?? [])].some(
            (change) => change?.kind === 'CHANGE' && change.body?.operations.some((operation) => operation.tableId === tableId),
          )
        ) {
          if (!(await flush(false, false, true, epoch))) return false
        }
        let restores: ModelInputCellRestore[]
        while (true) {
          if (
            !mountedRef.current ||
            !isCurrentSession() ||
            stateRef.current !== state ||
            commandRef.current ||
            state.blockedRevision !== undefined
          )
            return false
          const revision = state.revision
          restores = []
          const options = getModelInputTableQueryOptions(scope, state.draftId, revision, tableId)
          const cached = queryClient.getQueryData<InfiniteData<ModelInputTablePage, number | undefined>>(options.queryKey)
          let startRow: number | undefined
          try {
            do {
              const cachedIndex = cached?.pageParams.findIndex((parameter) => parameter === startRow) ?? -1
              const page =
                cachedIndex >= 0
                  ? cached!.pages[cachedIndex]
                  : await inputDraftService.getTable(state.draftId, revision, tableId, startRow, session)
              if (!mountedRef.current || !isCurrentSession() || stateRef.current !== state) return false
              if (
                page.draftId !== state.draftId ||
                page.revision !== revision ||
                page.tableData.tableId !== tableId ||
                (page.page.hasNext &&
                  (page.page.returnedBodyRows === 0 ||
                    page.page.nextStartRow === null ||
                    page.page.nextStartRow <= (page.page.endRow ?? startRow ?? 0)))
              )
                throw new Error('표 데이터를 불러오지 못했습니다.')
              restores.push(...(page.editing.cellRestores ?? []))
              startRow = page.page.hasNext ? page.page.nextStartRow! : undefined
            } while (startRow !== undefined && state.revision === revision)
          } catch (cause) {
            if (state.revision !== revision) continue
            if (axios.isAxiosError<{ data?: ModelInputProblem }>(cause) && cause.response?.data.data?.reason === 'REVISION_CONFLICT') {
              await preserveOnRevisionConflict(state.draftId, undefined, undefined, epoch)
              return false
            }
            throw cause
          }
          // 다른 표의 저장이 끝났으면 새 revision으로 다시 모은다. 이전 revision의 원본으로 저장하지 않는다.
          if (state.revision === revision) break
        }
        if (
          !mountedRef.current ||
          !isCurrentSession() ||
          stateRef.current !== state ||
          commandRef.current ||
          state.blockedRevision !== undefined ||
          draftRef.current?.status !== 'DRAFT'
        )
          return false
        const sourceCells = new Map<string, Set<string>>()
        for (const cell of restores) {
          const fields = sourceCells.get(cell.rowId) ?? new Set<string>()
          fields.add(cell.fieldKey)
          sourceCells.set(cell.rowId, fields)
        }
        // 미전송 원본 셀 입력만 취소한다. 추가 행·열의 입력과 다른 표의 작업은 유지한다.
        state.edits = state.edits.filter((edit) => edit.tableId !== tableId || !sourceCells.get(edit.rowId)?.has(edit.fieldKey))
        for (const cell of restores) {
          if (cell.restoreStatus !== 'READY') continue
          state.edits.push({
            id: uuid(),
            tableId,
            rowId: cell.rowId,
            fieldKey: cell.fieldKey,
            type: cell.baseline.kind === 'EMPTY' ? 'CLEAR' : 'SET',
            text: cell.baseline.kind === 'EMPTY' ? '' : String(cell.baseline.value),
            value: cell.baseline.kind === 'EMPTY' ? null : cell.baseline.value,
            error: null,
          })
        }
        for (const original of originalValuesRef.current.get(tableId) ?? []) {
          if (sourceCells.get(original.rowId)?.has(original.fieldKey)) original.isReset = true
        }
        setError('')
        persist()
        completed = true
        return true
      } catch (cause) {
        if (mountedRef.current && isCurrentSession()) setError(getModelInputErrorMessage(cause), epoch)
        return false
      } finally {
        resettingTablesRef.current.delete(tableId)
        resolve(completed)
        publish()
        // 생성한 복원 입력과 다른 표의 대기 변경은 기존 저장 큐로 처리한다.
        if (completed && !commandRef.current && mountedRef.current && isCurrentSession()) void flush(false, false, false, epoch)
      }
    },
    [flush, isCurrentSession, isTableChanging, persist, publish, preserveOnRevisionConflict, queryClient, scope, session, setError],
  )

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        !stateRef.current?.pending &&
        !stateRef.current?.queuedChanges?.length &&
        !stateRef.current?.edits.length &&
        !stateRef.current?.addedRows?.length &&
        !saveRef.current
      )
        return
      void flush(true)
      event.preventDefault()
      event.returnValue = ''
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void flush(true)
    }
    const onPageHide = () => {
      void flush(true)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [flush])

  const background = useCallback(
    (discardUpload = false) => {
      // 전환 직후부터 알림을 막고, 재진입해도 이전 요청의 오류를 뒤늦게 알리지 않는다.
      notificationsRef.current.active = false
      notificationsRef.current.epoch++
      setErrorState('')
      return discardUpload ? discardDraft() : flushBeforeLeaving()
    },
    [discardDraft, flushBeforeLeaving],
  )

  return {
    background,
    draft,
    edits,
    addedRows,
    error,
    isLoading,
    isSaving,
    hasPendingRequest,
    serverResetCount: serverResetCountRef.current,
    isTableChanging,
    resettableTableIds: [...originalValuesRef.current]
      .filter(([, originals]) => originals.some((edit) => !edit.isReset))
      .map(([tableId]) => tableId),
    originalEdits,
    finalization,
    getFinalization: () => finalizationRef.current,
    updateEdit,
    stageRow,
    removeStagedRow,
    executeCommands,
    flush,
    prepareUpload,
    completeUpload,
    resumeAfterUpload,
    flushBeforeLeaving,
    discardDraft,
    finalize,
    discard,
  }
}

export default useModelInputAutosave
