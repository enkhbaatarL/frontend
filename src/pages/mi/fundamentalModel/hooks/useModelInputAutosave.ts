import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { deleteFundamentalModelRow } from '@/pages/mi/fundamentalModel/components/inputTable/fundamentalModelRowEditing'
import { getModelInputField, validateModelInputValue } from '@/pages/mi/fundamentalModel/components/modelInputEditing'
import { getModelInputExecution } from '@/pages/mi/fundamentalModel/components/modelInputFinalization'
import { getModelInputChangeOperations } from '@/pages/mi/fundamentalModel/components/modelInputRowChanges'
import { getModelInputTableQueryOptions } from '@/pages/mi/fundamentalModel/hooks/modelInputTableQuery'
import inputDraftService, {
  type ModelInputChangeRequest,
  type ModelInputAddRowCommand,
  type ModelInputDraftStructure,
  type ModelInputFinalization,
  type ModelInputFinalizationRequest,
  type ModelInputOperation,
  type ModelInputProblem,
  type ModelInputTablePage,
  serializeModelInputChange,
} from '@/service/mi/fundamentalModel/inputDraft'
import useAuthStore from '@/store/useAuthStore'

export interface ModelInputLocalEdit {
  id: string
  tableId: string
  rowId: string
  fieldKey: string
  text: string
  value: string | number | null
  error: string | null
  type?: 'SET' | 'CLEAR'
}

interface PendingChange {
  kind: 'CHANGE'
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

interface DraftRecovery {
  draftId: string
  revision: number
  edits: ModelInputLocalEdit[]
  addedRows?: ModelInputAddRowCommand[]
  pending: PendingChange | PendingFinalization | null
  revisionConflict?: boolean
  queuedChanges?: PendingChange[]
}

const isCellChange = (pending: DraftRecovery['pending']): pending is PendingChange & { body: ModelInputChangeRequest } =>
  pending?.kind === 'CHANGE' &&
  pending.body !== undefined &&
  pending.body.operations.length > 0 &&
  pending.body.operations.every(
    (operation) => (operation.type === 'SET' || operation.type === 'CLEAR') && 'rowRef' in operation && 'fieldKey' in operation,
  )

export const getModelInputAuthScope = () => {
  const { user, accessCompanyInfo } = useAuthStore.getState()
  return `${user?.userNo ?? ''}:${user?.isOtherServiceAccessPossible ? (accessCompanyInfo?.customerCompanyNo ?? user.companyNo) : (user?.companyNo ?? '')}`
}

const describeFailure = (problem: ModelInputProblem | null) => {
  if (problem?.reason === 'REVISION_CONFLICT')
    return '다른 작업에서 입력값이 변경되었습니다. 최신값을 불러오거나 내 변경을 재적용해 주세요.'
  return problem?.reason === 'VALIDATION_FAILED' ? '유효성 검사에 실패했습니다.' : '입력 정보를 처리하지 못했습니다.'
}

export const getModelInputErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string; data?: ModelInputProblem | null }>(error)) {
    if (error.response?.data.data?.reason === 'REVISION_CONFLICT') return describeFailure(error.response.data.data)
    return error.response?.data.message || '서버 응답을 확인할 수 없습니다.'
  }
  return error instanceof Error ? error.message : '입력 정보를 처리하지 못했습니다.'
}

const isLocalEdit = (value: unknown): value is ModelInputLocalEdit => {
  if (!value || typeof value !== 'object') return false
  const edit = value as Record<string, unknown>
  return (
    ['id', 'tableId', 'rowId', 'fieldKey', 'text'].every((key) => typeof edit[key] === 'string') &&
    (edit.value === null || typeof edit.value === 'string' || typeof edit.value === 'number') &&
    (edit.error === null || typeof edit.error === 'string') &&
    (edit.type === undefined || edit.type === 'SET' || edit.type === 'CLEAR')
  )
}

const readRecovery = (key: string): DraftRecovery | null => {
  const text = sessionStorage.getItem(key)
  if (!text) return null
  const value = JSON.parse(text) as DraftRecovery
  if (
    typeof value.draftId !== 'string' ||
    !Number.isSafeInteger(value.revision) ||
    !Array.isArray(value.edits) ||
    !value.edits.every(isLocalEdit) ||
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
            Object.values(row.values).some((item) => typeof item !== 'string' && (typeof item !== 'number' || !Number.isFinite(item))),
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
        ))) ||
    (value.revisionConflict !== undefined && typeof value.revisionConflict !== 'boolean')
  ) {
    return null
  }
  return value
}

const useModelInputAutosave = (caseId: number | null, scope: string, initialDraftId: string | null) => {
  const queryClient = useQueryClient()
  const storageKey = `model-input-draft:${scope}:${caseId ?? `upload:${initialDraftId}`}`
  // Case별로 마운트된 편집 세션은 목록 재조회로 draftId가 바뀌어도 초기화하지 않는다.
  const initialDraftIdRef = useRef(initialDraftId)
  const [draft, setDraft] = useState<ModelInputDraftStructure>()
  const [edits, setEdits] = useState<ModelInputLocalEdit[]>([])
  const [addedRows, setAddedRows] = useState<ModelInputAddRowCommand[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const originalValuesRef = useRef(new Map<string, Array<ModelInputLocalEdit & { isSubmitted?: boolean; isReset?: boolean }>>())
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [hasRevisionConflict, setHasRevisionConflict] = useState(false)
  const [finalization, setFinalization] = useState<ModelInputFinalization>()
  const finalizationRef = useRef<ModelInputFinalization | undefined>(undefined)
  const stateRef = useRef<DraftRecovery | null>(null)
  const draftRef = useRef<ModelInputDraftStructure | undefined>(undefined)
  const mountedRef = useRef(false)
  const saveRef = useRef<Promise<boolean> | null>(null)
  const savePreparationRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const commandRef = useRef(false)

  const persist = useCallback(() => {
    if (getModelInputAuthScope() !== scope || !stateRef.current) return
    try {
      if (
        !stateRef.current.pending &&
        !stateRef.current.queuedChanges?.length &&
        !stateRef.current.edits.length &&
        !stateRef.current.addedRows?.length &&
        !stateRef.current.revisionConflict
      ) {
        sessionStorage.removeItem(storageKey)
        return
      }
      sessionStorage.setItem(storageKey, JSON.stringify(stateRef.current))
    } catch {
      // 브라우저 저장소를 사용할 수 없어도 현재 화면의 요청과 변경은 메모리에 유지한다.
      return
    }
  }, [scope, storageKey])

  const publish = useCallback(() => {
    if (!mountedRef.current) return
    setEdits([...(stateRef.current?.edits ?? [])])
    setAddedRows([...(stateRef.current?.addedRows ?? [])])
    setHasPendingRequest(Boolean(stateRef.current?.pending || stateRef.current?.queuedChanges?.length))
    setHasRevisionConflict(Boolean(stateRef.current?.revisionConflict))
  }, [])

  const markRevisionConflict = useCallback(() => {
    if (stateRef.current) stateRef.current.revisionConflict = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    persist()
    publish()
  }, [persist, publish])

  const loadDraft = useCallback(
    async (draftId: string, signal?: AbortSignal) => {
      if (getModelInputAuthScope() !== scope) throw new Error('사용자 또는 회사가 변경되었습니다.')
      const next = await inputDraftService.getDraft(draftId, signal)
      signal?.throwIfAborted()
      if (getModelInputAuthScope() !== scope) throw new Error('사용자 또는 회사가 변경되었습니다.')
      if (mountedRef.current && next.status === 'DRAFT') {
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
      if (getModelInputAuthScope() !== scope) throw new Error('사용자 또는 회사가 변경되었습니다.')
      draftRef.current = next
      if (mountedRef.current) setDraft(next)
      return next
    },
    [queryClient, scope],
  )

  const enqueueChanges = useCallback(
    (operations: ModelInputChangeRequest['operations'] = []) => {
      const state = stateRef.current
      if (!state || state.revisionConflict || getModelInputAuthScope() !== scope) return false
      const queued = [state.pending?.kind === 'CHANGE' ? state.pending : null, ...(state.queuedChanges ?? [])]
      const editIds = new Set(queued.flatMap((change) => change?.editIds ?? []))
      const rowKeys = new Set(queued.flatMap((change) => change?.addedRowKeys ?? []))
      const nextEdits = state.edits.filter((edit) => !editIds.has(edit.id))
      const nextRows = (state.addedRows ?? []).filter((row) => !rowKeys.has(row.clientRowKey))
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
    [persist, publish, scope],
  )

  const isTableChanging = useCallback((tableId: string) => {
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
    (keepalive = false, drain = true): Promise<boolean> => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = undefined
      if (saveRef.current) {
        persist()
        return drain ? saveRef.current.then((saved) => (saved ? flush(keepalive) : false)) : saveRef.current
      }
      const state = stateRef.current
      if (!state || getModelInputAuthScope() !== scope) return Promise.resolve(false)
      // 입력 중에는 메모리에만 보관하고, 저장 시도 직전에 복구용 백업을 기록한다.
      persist()
      if (state.revisionConflict && !state.pending) return Promise.resolve(false)
      if (!state.pending && !state.queuedChanges?.length && !state.edits.length && !state.addedRows?.length) return Promise.resolve(true)
      if (
        !state.pending &&
        !state.queuedChanges?.length &&
        state.edits.some((edit) => edit.error || (edit.type !== 'CLEAR' && edit.value === null))
      ) {
        return Promise.resolve(false)
      }

      const run = async () => {
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
              if (current.activeOperationId && current.activeOperationEndpoint) {
                if (current.activeOperationEndpoint.includes('/input-upload-requests/'))
                  throw new Error(describeFailure({ reason: 'DRAFT_BUSY', currentRevision: current.revision, issues: [] }))
                state.pending = current.activeOperationEndpoint.includes('/finalizations/')
                  ? { kind: 'FINALIZE', operationId: current.activeOperationId }
                  : { kind: 'CHANGE', operationId: current.activeOperationId, editIds: [] }
                publish()
              } else if (current.revision !== state.revision) {
                markRevisionConflict()
                throw new Error(describeFailure({ reason: 'REVISION_CONFLICT', currentRevision: current.revision, issues: [] }))
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
          if (getModelInputAuthScope() !== scope) return false
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
            if (pending.operationId) operation = await inputDraftService.getChange(state.draftId, pending.operationId)
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
          pending.operationId = operation.operationId
          persist()
          while (processing) {
            if (!mountedRef.current || getModelInputAuthScope() !== scope) return false
            await new Promise((resolve) => setTimeout(resolve, 2000))
            if (!mountedRef.current || getModelInputAuthScope() !== scope) return false
            operation =
              pending.kind === 'CHANGE'
                ? await inputDraftService.getChange(state.draftId, operation.operationId)
                : await inputDraftService.getFinalization(state.draftId, operation.operationId)
            processing = isProcessing(operation)
          }
          if (operation.status === 'FAILED') {
            if (operation.failure?.reason === 'REVISION_CONFLICT') markRevisionConflict()
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
          if (controller.signal.aborted) return true
          // 접수 여부가 불명확한 통신/5xx와 조회 오류는 동일 요청을 보관한다.
          if (submitting && axios.isAxiosError(cause) && cause.response && cause.response.status >= 400 && cause.response.status < 500) {
            state.pending = null
          }
          if (axios.isAxiosError<{ data?: ModelInputProblem | null }>(cause)) {
            if (cause.response?.status === 404) {
              state.pending = null
              draftRef.current = undefined
              if (mountedRef.current) setDraft(undefined)
            } else if (cause.response?.data.data?.reason === 'REVISION_CONFLICT') {
              markRevisionConflict()
              // 화면은 최신 성공값으로 갱신하되 미저장 변경의 기준 revision은 유지한다.
              await loadDraft(state.draftId).catch(() => undefined)
            }
          }
          try {
            persist()
          } catch (storageError) {
            if (mountedRef.current) setError(getModelInputErrorMessage(storageError))
          }
          if (mountedRef.current) setError(getModelInputErrorMessage(cause))
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
        if (drain) return flush(keepalive)
        if (
          mountedRef.current &&
          !commandRef.current &&
          !state.pending &&
          (state.queuedChanges?.length || state.edits.length || state.addedRows?.length)
        ) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            timerRef.current = undefined
            void flush(false, false)
          }, 0)
        }
        return true
      })
    },
    [enqueueChanges, loadDraft, markRevisionConflict, persist, publish, scope],
  )

  const flushBeforeLeaving = useCallback(async () => {
    const state = stateRef.current
    if (!state || getModelInputAuthScope() !== scope) return false
    if (state.revisionConflict && !state.pending) {
      persist()
      return true
    }
    if ((state.pending || saveRef.current) && !(await flush(false, false))) return false
    if (!state.edits.some((edit) => edit.error || (edit.type !== 'CLEAR' && edit.value === null))) return flush()
    try {
      persist()
      return true
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause))
      return false
    }
  }, [flush, persist, scope])

  const discardDraft = useCallback(async () => {
    const state = stateRef.current
    if (!state || commandRef.current || getModelInputAuthScope() !== scope) return false
    commandRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = undefined
    savePreparationRef.current?.abort()
    try {
      // 이미 접수된 작업만 완료하고, 아직 전송하지 않은 편집은 저장하지 않는다.
      if (saveRef.current) await saveRef.current
      if (state.pending && !(await flush(false, false))) return false
      const current = await loadDraft(state.draftId)
      await inputDraftService.discardUpload(current.draftId, current.revision)
      state.edits = []
      state.addedRows = []
      state.pending = null
      state.queuedChanges = []
      state.revisionConflict = false
      persist()
      stateRef.current = null
      draftRef.current = undefined
      originalValuesRef.current.clear()
      queryClient.removeQueries({ queryKey: ['fundamentalModel', 'inputDraftTable', scope, current.draftId] })
      void queryClient.invalidateQueries({ queryKey: ['fundamentalModel', 'inputSourceCases', scope] })
      publish()
      return true
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause))
      return false
    } finally {
      commandRef.current = false
    }
  }, [flush, loadDraft, persist, publish, queryClient, scope])

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    const initialize = async () => {
      try {
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
            recovery?.revisionConflict,
        )
        let current: ModelInputDraftStructure | undefined
        // 미확정 요청/미저장 변경만 우선 복구한다. 완료된 로컬 Draft ID를 편집 진입점으로 재사용하지 않는다.
        if (recovery && needsRecovery) current = await inputDraftService.getDraft(recovery.draftId, controller.signal)
        else if (initialDraftIdRef.current) {
          const existing = await inputDraftService.getDraft(initialDraftIdRef.current, controller.signal)
          if (existing.sourceCaseId !== caseId) throw new Error('선택한 Case와 편집 초안이 일치하지 않습니다.')
          current = existing
        }
        if (!current) {
          if (caseId === null) throw new Error('업로드 초안을 찾을 수 없습니다.')
          const source = await inputDraftService.getSource(caseId, controller.signal)
          const created = await inputDraftService.createDraft(caseId, source.sourceVersion, controller.signal)
          current = await inputDraftService.getDraft(created.draftId, controller.signal)
        }
        if (controller.signal.aborted) return
        if (current.sourceCaseId !== caseId) throw new Error('선택한 Case와 편집 초안이 일치하지 않습니다.')
        const state =
          needsRecovery && recovery?.draftId === current.draftId
            ? recovery
            : { draftId: current.draftId, revision: current.revision, edits: [], pending: null }
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
        persist()
        draftRef.current = current
        setDraft(current)
        publish()
        if (state.pending || state.queuedChanges?.length) await flush()
        else if ((state.edits.length || state.addedRows?.length) && state.revision !== current.revision) {
          markRevisionConflict()
          setError(describeFailure({ reason: 'REVISION_CONFLICT', currentRevision: current.revision, issues: [] }))
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(getModelInputErrorMessage(cause))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void initialize()
    return () => {
      controller.abort()
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      void flush(true)
    }
  }, [caseId, flush, markRevisionConflict, persist, publish, storageKey])

  const updateEdit = useCallback(
    (edit: Omit<ModelInputLocalEdit, 'id'>, originalValue: unknown) => {
      const state = stateRef.current
      if (
        !state ||
        state.revisionConflict ||
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
      if (
        changesPendingCell ||
        (isAddedRow && edit.error) ||
        (edit.text !== String(originalValue ?? '') && (edit.error || edit.value !== originalValue))
      ) {
        const originals = originalValuesRef.current.get(edit.tableId) ?? []
        if (!isAddedRow && !originals.some((item) => item.rowId === edit.rowId && item.fieldKey === edit.fieldKey)) {
          originals.push({
            ...edit,
            id: uuid(),
            text: String(originalValue ?? ''),
            value: typeof originalValue === 'string' || typeof originalValue === 'number' ? originalValue : null,
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
      if (original) original.isReset = !edit.error && edit.value === original.value
      setError('')
      publish()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined
        void flush(false, false)
      }, 8000)
    },
    [flush, isTableChanging, publish],
  )

  const stageRow = useCallback(
    async (command: ModelInputAddRowCommand, initialEdits: Omit<ModelInputLocalEdit, 'id'>[]) => {
      const state = stateRef.current
      if (
        !state ||
        state.revisionConflict ||
        commandRef.current ||
        isTableChanging(command.tableId) ||
        draftRef.current?.status !== 'DRAFT' ||
        getModelInputAuthScope() !== scope
      )
        return false
      state.addedRows = [...(state.addedRows ?? []), command]
      state.edits.push(...initialEdits.map((edit) => ({ ...edit, id: uuid() })))
      persist()
      publish()
      if (!state.edits.some((edit) => edit.error)) void flush(false, false)
      return true
    },
    [flush, isTableChanging, persist, publish, scope],
  )

  const removeStagedRow = useCallback(
    (clientRowKey: string) => {
      const state = stateRef.current
      if (
        !state ||
        getModelInputAuthScope() !== scope ||
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
    [flush, publish, scope],
  )

  const finalize = useCallback(
    async (title: string, description: string) => {
      if (!(await flush())) return false
      const state = stateRef.current
      if (!state || getModelInputAuthScope() !== scope) return null
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
      if (current.status !== 'DRAFT' || current.activeOperationId || current.revision !== state.revision) {
        const reason = current.activeOperationId
          ? 'DRAFT_BUSY'
          : current.revision !== state.revision
            ? 'REVISION_CONFLICT'
            : 'DRAFT_NOT_EDITABLE'
        if (reason === 'REVISION_CONFLICT') markRevisionConflict()
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
    [flush, loadDraft, markRevisionConflict, persist, publish, scope],
  )

  const executeCommands = useCallback(
    async (operations: ModelInputChangeRequest['operations']) => {
      if (commandRef.current || !operations.length || operations.some((operation) => isTableChanging(operation.tableId))) return false
      try {
        if (!enqueueChanges(operations)) return false
        // 호출한 표의 명령까지만 기다린다. 이후 다른 표의 변경은 백그라운드에서 이어간다.
        const commandIds = new Set(operations.map((operation) => operation.commandId))
        while (
          [stateRef.current?.pending, ...(stateRef.current?.queuedChanges ?? [])].some(
            (change) => change?.kind === 'CHANGE' && change.body?.operations.some((operation) => commandIds.has(operation.commandId)),
          )
        ) {
          if (!(await flush(false, false))) return false
        }
        return true
      } catch (cause) {
        if (mountedRef.current) setError(getModelInputErrorMessage(cause))
        return false
      }
    },
    [enqueueChanges, flush, isTableChanging],
  )

  const resolveRevisionConflict = useCallback(
    async (reapply: boolean) => {
      const state = stateRef.current
      if (!state?.revisionConflict || state.pending || saveRef.current || commandRef.current || getModelInputAuthScope() !== scope)
        return false
      commandRef.current = true
      setIsSaving(true)
      try {
        const current = await loadDraft(state.draftId)
        if (current.status !== 'DRAFT' || current.activeOperationId) {
          throw new Error('진행 중인 작업 또는 초안 상태를 확인한 후 다시 시도해 주세요.')
        }
        if (reapply && state.queuedChanges?.some((change) => !isCellChange(change))) {
          throw new Error('대기 중인 행·열 또는 모드 변경은 최신값에 자동 재적용할 수 없습니다. 최신값을 불러와 다시 편집해 주세요.')
        }
        const originals = new Map<string, Array<ModelInputLocalEdit & { isSubmitted?: boolean; isReset?: boolean }>>()
        const nextEdits = reapply ? state.edits.map((edit) => ({ ...edit })) : []
        if (reapply) {
          const tableIds = new Set([...nextEdits.map((edit) => edit.tableId), ...(state.addedRows ?? []).map((row) => row.tableId)])
          for (const tableId of tableIds) {
            if (!current.sections.some((section) => section.sheets.some((sheet) => sheet.tables.some((table) => table.id === tableId)))) {
              throw new Error('변경한 표가 삭제되어 재적용할 수 없습니다. 최신값을 불러와 다시 편집해 주세요.')
            }
            const remaining = new Set(
              nextEdits.filter((edit) => edit.tableId === tableId && !state.addedRows?.some((row) => row.clientRowKey === edit.rowId)),
            )
            let startRow: number | undefined
            while (remaining.size) {
              const page = await inputDraftService.getTable(current.draftId, current.revision, tableId, startRow)
              if (!mountedRef.current || getModelInputAuthScope() !== scope) return false
              if (page.draftId !== current.draftId || page.revision !== current.revision || page.tableData.tableId !== tableId) {
                throw new Error('최신 셀 값을 확인할 수 없습니다.')
              }
              for (const edit of remaining) {
                const binding = page.editing.rowBindings.find((row) => row.rowId === edit.rowId)
                if (!binding) continue
                const field = page.editing.fields.find((item) => item.fieldKey === edit.fieldKey)
                if (
                  !field ||
                  typeof field.columnField !== 'string' ||
                  !getModelInputField(page, binding.rowNumber, field.columnField, edit.type === 'CLEAR' ? 'CLEAR' : 'SET')
                ) {
                  throw new Error('일부 셀을 더 이상 편집할 수 없습니다. 최신값을 불러와 다시 편집해 주세요.')
                }
                const value = page.editing.editValues.find((row) => row.rowId === edit.rowId)?.values[edit.fieldKey]
                const tableOriginals = originals.get(tableId) ?? []
                tableOriginals.push({
                  ...edit,
                  text: String(value ?? ''),
                  value: typeof value === 'string' || typeof value === 'number' ? value : null,
                  type: value === null || value === undefined ? 'CLEAR' : 'SET',
                  error: null,
                })
                originals.set(tableId, tableOriginals)
                if (edit.type !== 'CLEAR') Object.assign(edit, validateModelInputValue(edit.text, field))
                remaining.delete(edit)
              }
              if (!remaining.size || !page.page.hasNext) break
              const next = page.page.nextStartRow
              if (next === null || next <= (page.page.endRow ?? startRow ?? 0)) throw new Error('최신 셀 값을 확인할 수 없습니다.')
              startRow = next
            }
            if (remaining.size) throw new Error('변경한 행이 삭제되어 재적용할 수 없습니다. 최신값을 불러와 다시 편집해 주세요.')
          }
        }
        if (!mountedRef.current || getModelInputAuthScope() !== scope) return false
        state.revision = current.revision
        state.edits = nextEdits
        state.queuedChanges = []
        if (!reapply) state.addedRows = []
        state.revisionConflict = false
        originalValuesRef.current = originals
        persist()
        publish()
        setError('')
        // 사용자가 확인한 변경만 최신 버전을 기준으로 저장하며 서버가 다시 검증한다.
        if (reapply && !state.edits.some((edit) => edit.error)) return await flush()
        return true
      } catch (cause) {
        if (axios.isAxiosError<{ data?: ModelInputProblem | null }>(cause) && cause.response?.data.data?.reason === 'REVISION_CONFLICT') {
          markRevisionConflict()
        }
        if (mountedRef.current) setError(getModelInputErrorMessage(cause))
        return false
      } finally {
        commandRef.current = false
        publish()
        if (mountedRef.current) setIsSaving(false)
      }
    },
    [flush, loadDraft, markRevisionConflict, persist, publish, scope],
  )

  const discard = useCallback(
    async (tableId: string) => {
      const state = stateRef.current
      if (
        !state ||
        state.revisionConflict ||
        commandRef.current ||
        isTableChanging(tableId) ||
        draftRef.current?.status !== 'DRAFT' ||
        getModelInputAuthScope() !== scope
      )
        return false
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = undefined
      // 초기화 역시 최신 셀 변경으로 대기한다. 전송한 변경은 완료 후 복원하고, 미전송 변경은 합친다.
      state.edits = state.edits.filter(
        (edit) => edit.tableId !== tableId || state.addedRows?.some((row) => row.tableId === tableId && row.clientRowKey === edit.rowId),
      )
      for (const original of originalValuesRef.current.get(tableId) ?? []) {
        const queued = [state.pending, ...(state.queuedChanges ?? [])].some(
          (change) =>
            change?.kind === 'CHANGE' &&
            change.body?.operations.some(
              (operation) =>
                operation.tableId === tableId &&
                'rowRef' in operation &&
                'fieldKey' in operation &&
                operation.rowRef.rowId === original.rowId &&
                operation.fieldKey === original.fieldKey,
            ),
        )
        if (original.isSubmitted || queued) state.edits.push({ ...original, id: uuid(), error: null })
        original.isReset = true
      }
      setError('')
      persist()
      publish()
      void flush(false, false)
      return true
    },
    [flush, isTableChanging, persist, publish, scope],
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

  return {
    draft,
    edits,
    addedRows,
    error,
    isLoading,
    isSaving,
    hasPendingRequest,
    hasRevisionConflict,
    isTableChanging,
    resettableTableIds: [...originalValuesRef.current]
      .filter(([, originals]) => originals.some((edit) => !edit.isReset))
      .map(([tableId]) => tableId),
    originalEdits: [...originalValuesRef.current.values()].flat(),
    finalization,
    getFinalization: () => finalizationRef.current,
    updateEdit,
    stageRow,
    removeStagedRow,
    executeCommands,
    resolveRevisionConflict,
    flush,
    flushBeforeLeaving,
    discardDraft,
    finalize,
    discard,
  }
}

export default useModelInputAutosave
