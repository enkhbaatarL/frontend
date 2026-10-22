import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import modelInputUploadFileStorage from '@/pages/mi/fundamentalModel/hooks/modelInputUploadFileStorage'
import { getModelInputAuthScope, getModelInputErrorMessage } from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'
import inputDraftService, {
  type ModelInputDraftStructure,
  type ModelInputUploadMetadata,
  type ModelInputUploadOperation,
} from '@/service/mi/fundamentalModel/inputDraft'

interface UploadRecovery {
  draftId: string | null
  pending: { draftId?: string; metadata?: ModelInputUploadMetadata; operationId?: string } | null
}

const useModelInputUpload = (scope: string) => {
  const storageKey = `model-input-upload:${scope}`
  const filesRef = useRef(new Map<string, File>())
  const stateRef = useRef<UploadRecovery>({ draftId: null, pending: null })
  const controllerRef = useRef<AbortController | null>(null)
  const runningRef = useRef<Promise<boolean> | null>(null)
  const preparingRef = useRef(false)
  const mountedRef = useRef(false)
  const [draft, setDraft] = useState<ModelInputDraftStructure>()
  const draftRef = useRef<ModelInputDraftStructure | undefined>(undefined)
  const [result, setResult] = useState<ModelInputUploadOperation['result']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [error, setError] = useState('')

  const persist = useCallback(() => {
    if (getModelInputAuthScope() !== scope) throw new Error('사용자 또는 회사가 변경되었습니다.')
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(stateRef.current))
    } catch {
      if (mountedRef.current) setHasPendingRequest(Boolean(stateRef.current.pending))
      return
    }
    if (mountedRef.current) setHasPendingRequest(Boolean(stateRef.current.pending))
  }, [scope, storageKey])

  const resume = useCallback((): Promise<boolean> => {
    if (runningRef.current && !controllerRef.current?.signal.aborted) return runningRef.current
    const pending = stateRef.current.pending
    if (!pending) return Promise.resolve(true)
    const controller = new AbortController()
    controllerRef.current = controller
    const isCurrent = () => mountedRef.current && !controller.signal.aborted && getModelInputAuthScope() === scope
    const run = async () => {
      if (isCurrent()) {
        setIsUploading(true)
        setError('')
      }
      let submitting = false
      try {
        persist()
        let operation: ModelInputUploadOperation
        if (pending.operationId) operation = await inputDraftService.getUpload(pending.operationId, controller.signal)
        else {
          if (!pending.metadata) throw new Error('파일 업로드가 실패했습니다.')
          const file =
            filesRef.current.get(pending.metadata.requestId) ??
            (await modelInputUploadFileStorage(pending.metadata.requestId, 'get').catch(() => undefined))
          if (!isCurrent()) return false
          if (!file) throw new Error('파일 업로드가 실패했습니다.')
          submitting = true
          operation = await inputDraftService.upload(file, pending.metadata, pending.draftId, controller.signal)
          submitting = false
        }
        if (!isCurrent()) return false
        if (
          (pending.operationId && operation.operationId !== pending.operationId) ||
          (pending.metadata && operation.requestId !== pending.metadata.requestId)
        )
          throw new Error('파일 업로드가 실패했습니다.')
        pending.operationId = operation.operationId
        persist()
        while (operation.status === 'QUEUED' || operation.status === 'RUNNING') {
          await new Promise<void>((resolve) => {
            if (controller.signal.aborted) {
              resolve()
              return
            }
            const subscription = new AbortController()
            const timer = setTimeout(() => {
              subscription.abort()
              resolve()
            }, 2000)
            controller.signal.addEventListener(
              'abort',
              () => {
                clearTimeout(timer)
                subscription.abort()
                resolve()
              },
              { once: true, signal: subscription.signal },
            )
          })
          if (!isCurrent()) return false
          operation = await inputDraftService.getUpload(operation.operationId, controller.signal)
          if (operation.operationId !== pending.operationId) throw new Error('요청한 업로드 작업과 응답이 일치하지 않습니다.')
        }
        if (!isCurrent()) return false
        if (operation.status === 'FAILED') {
          stateRef.current.pending = null
          persist()
          if (pending.metadata) void modelInputUploadFileStorage(pending.metadata.requestId, 'delete').catch(() => undefined)
          throw new Error('유효성 검사에 실패했습니다.')
        }
        if (operation.status !== 'SUCCEEDED' || !operation.result || (pending.draftId && operation.result.draftId !== pending.draftId))
          throw new Error('파일 업로드가 실패했습니다.')
        // 이전 작업의 성공 snapshot으로 이후 편집 revision을 덮어쓰지 않는다.
        stateRef.current.draftId = operation.result.draftId
        persist()
        const current = await inputDraftService.getDraft(operation.result.draftId, controller.signal)
        if (!isCurrent()) return false
        if (current.sourceCaseId !== null || current.draftId !== operation.result.draftId)
          throw new Error('업로드 초안 정보가 일치하지 않습니다.')
        stateRef.current.pending = null
        persist()
        draftRef.current = current
        setDraft(current)
        setResult(current.revision === operation.result.revision ? operation.result : null)
        if (pending.metadata) void modelInputUploadFileStorage(pending.metadata.requestId, 'delete').catch(() => undefined)
        return true
      } catch (cause) {
        if (!isCurrent()) return false
        let failure = cause
        try {
          if (submitting && axios.isAxiosError(cause) && cause.response && cause.response.status >= 400 && cause.response.status < 500) {
            stateRef.current.pending = null
            persist()
            if (pending.metadata) void modelInputUploadFileStorage(pending.metadata.requestId, 'delete').catch(() => undefined)
          }
          if (axios.isAxiosError(cause) && cause.response?.status === 404) {
            stateRef.current.pending = null
            persist()
          }
        } catch (storageError) {
          failure = storageError
        }
        setError(getModelInputErrorMessage(failure))
        return false
      } finally {
        if (isCurrent()) {
          setIsUploading(false)
          setHasPendingRequest(Boolean(stateRef.current.pending))
        }
      }
    }
    const promise = run().finally(() => {
      if (runningRef.current === promise) runningRef.current = null
    })
    runningRef.current = promise
    return promise
  }, [persist, scope])

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    controllerRef.current = controller
    const initialize = async () => {
      try {
        let saved: string | null = null
        try {
          saved = sessionStorage.getItem(storageKey)
          if (saved) JSON.parse(saved)
        } catch {
          saved = null
        }
        if (saved) {
          const recovery = JSON.parse(saved) as UploadRecovery
          if (
            !recovery ||
            typeof recovery !== 'object' ||
            (recovery.draftId !== null && typeof recovery.draftId !== 'string') ||
            (recovery.pending && typeof recovery.pending !== 'object') ||
            (recovery.pending && !recovery.pending.operationId && !recovery.pending.metadata?.requestId)
          )
            stateRef.current = { draftId: null, pending: null }
          else stateRef.current = recovery
        }
        if (stateRef.current.draftId) {
          const current = await inputDraftService.getDraft(stateRef.current.draftId, controller.signal)
          if (controller.signal.aborted || getModelInputAuthScope() !== scope) return
          if (current.sourceCaseId !== null) throw new Error('직접 업로드 초안이 아닙니다.')
          if (current.status === 'DISCARDED') stateRef.current = { draftId: null, pending: null }
          else {
            draftRef.current = current
            setDraft(current)
            if (
              !stateRef.current.pending &&
              current.activeOperationEndpoint?.includes('/input-upload-requests/') &&
              current.activeOperationId
            )
              stateRef.current.pending = { draftId: current.draftId, operationId: current.activeOperationId }
          }
        }
        persist()
        if (stateRef.current.pending) await resume()
      } catch (cause) {
        if (!controller.signal.aborted) setError(getModelInputErrorMessage(cause))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void initialize()
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!stateRef.current.pending) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      mountedRef.current = false
      controller.abort()
      controllerRef.current?.abort()
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [persist, resume, scope, storageKey])

  useEffect(() => {
    const retryPending = () => {
      if (stateRef.current.pending) void resume()
    }
    window.addEventListener('online', retryPending)
    window.addEventListener('focus', retryPending)
    return () => {
      window.removeEventListener('online', retryPending)
      window.removeEventListener('focus', retryPending)
    }
  }, [resume])

  const upload = useCallback(
    async (file: File, sourceKey: string, replaceConfirmed: boolean) => {
      if (preparingRef.current || runningRef.current || stateRef.current.pending || getModelInputAuthScope() !== scope) return false
      preparingRef.current = true
      try {
        let current: ModelInputDraftStructure | undefined
        if (stateRef.current.draftId) {
          current = await inputDraftService.getDraft(stateRef.current.draftId, controllerRef.current?.signal)
          if (current.status !== 'DRAFT' || current.activeOperationId) throw new Error('진행 중인 작업 또는 초안 상태를 확인하세요.')
        }
        if (!mountedRef.current || getModelInputAuthScope() !== scope) return false
        const metadata: ModelInputUploadMetadata = {
          sourceKey: current?.sourceKey ?? sourceKey,
          requestId: uuid(),
          ...(current ? { baseRevision: current.revision, ...(replaceConfirmed ? { replaceConfirmed: true } : {}) } : {}),
        }
        filesRef.current.set(metadata.requestId, file)
        await modelInputUploadFileStorage(metadata.requestId, 'put', file).catch(() => undefined)
        if (!mountedRef.current || getModelInputAuthScope() !== scope) {
          void modelInputUploadFileStorage(metadata.requestId, 'delete').catch(() => undefined)
          return false
        }
        stateRef.current.pending = { ...(current ? { draftId: current.draftId } : {}), metadata }
        persist()
        return await resume()
      } catch (cause) {
        if (mountedRef.current) setError(getModelInputErrorMessage(cause))
        return false
      } finally {
        preparingRef.current = false
      }
    },
    [persist, resume, scope],
  )

  const clearCompleted = useCallback(() => {
    stateRef.current = { draftId: null, pending: null }
    try {
      persist()
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause))
    }
  }, [persist])

  return {
    draft,
    getDraft: () => draftRef.current,
    result,
    isLoading,
    isUploading,
    hasPendingRequest,
    error,
    upload,
    resume,
    clearCompleted,
  }
}

export default useModelInputUpload
