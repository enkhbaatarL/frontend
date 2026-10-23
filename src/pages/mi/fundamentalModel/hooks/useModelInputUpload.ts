import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { getModelInputAuthScope, getModelInputErrorMessage } from '@/pages/mi/fundamentalModel/hooks/useModelInputAutosave'
import inputDraftService, {
  type ModelInputDraftStructure,
  type ModelInputUploadMetadata,
  type ModelInputUploadOperation,
} from '@/service/mi/fundamentalModel/inputDraft'

interface UploadState {
  draftId: string | null
  pending: { draftId?: string; metadata?: ModelInputUploadMetadata; operationId?: string } | null
}

const useModelInputUpload = (
  scope: string,
  callbacks: {
    onBeforeUpload: () => Promise<boolean>
    onUploaded: (draft: ModelInputDraftStructure) => Promise<void>
    onUploadSettled: () => void
  },
) => {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  const filesRef = useRef(new Map<string, File>())
  const stateRef = useRef<UploadState>({ draftId: null, pending: null })
  const controllerRef = useRef<AbortController | null>(null)
  const runningRef = useRef<Promise<boolean> | null>(null)
  const preparingRef = useRef(false)
  const mountedRef = useRef(false)
  const [draft, setDraft] = useState<ModelInputDraftStructure>()
  const draftRef = useRef<ModelInputDraftStructure | undefined>(undefined)
  const [result, setResult] = useState<ModelInputUploadOperation['result']>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [error, setError] = useState('')

  const publish = useCallback(() => {
    if (getModelInputAuthScope() !== scope) throw new Error('사용자 또는 회사가 변경되었습니다.')
    if (mountedRef.current) setHasPendingRequest(Boolean(stateRef.current.pending))
  }, [scope])

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
        if (!(await callbacksRef.current.onBeforeUpload()) || !isCurrent()) return false
        publish()
        let operation: ModelInputUploadOperation
        if (pending.operationId) operation = await inputDraftService.getUpload(pending.operationId, controller.signal)
        else {
          if (!pending.metadata) throw new Error('파일 업로드가 실패했습니다.')
          const file = filesRef.current.get(pending.metadata.requestId)
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
        publish()
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
          publish()
          if (pending.metadata) filesRef.current.delete(pending.metadata.requestId)
          throw new Error('유효성 검사에 실패했습니다.')
        }
        if (operation.status !== 'SUCCEEDED' || !operation.result || (pending.draftId && operation.result.draftId !== pending.draftId))
          throw new Error('파일 업로드가 실패했습니다.')
        // 이전 작업의 성공 snapshot으로 이후 편집 revision을 덮어쓰지 않는다.
        stateRef.current.draftId = operation.result.draftId
        publish()
        const current = await inputDraftService.getDraft(operation.result.draftId, controller.signal)
        if (!isCurrent()) return false
        if (current.sourceCaseId !== null || current.draftId !== operation.result.draftId)
          throw new Error('업로드 초안 정보가 일치하지 않습니다.')
        await callbacksRef.current.onUploaded(current)
        if (!isCurrent()) return false
        stateRef.current.pending = null
        publish()
        draftRef.current = current
        setDraft(current)
        setResult(current.revision === operation.result.revision ? operation.result : null)
        if (pending.metadata) filesRef.current.delete(pending.metadata.requestId)
        return true
      } catch (cause) {
        if (!isCurrent()) return false
        let failure = cause
        try {
          if (submitting && axios.isAxiosError(cause) && cause.response && cause.response.status >= 400 && cause.response.status < 500) {
            stateRef.current.pending = null
            publish()
            if (pending.metadata) filesRef.current.delete(pending.metadata.requestId)
          }
          if (axios.isAxiosError(cause) && cause.response?.status === 404) {
            stateRef.current.pending = null
            publish()
            if (pending.metadata) filesRef.current.delete(pending.metadata.requestId)
          }
        } catch (stateError) {
          failure = stateError
        }
        setError(getModelInputErrorMessage(failure))
        return false
      } finally {
        if (isCurrent()) {
          setIsUploading(false)
          setHasPendingRequest(Boolean(stateRef.current.pending))
          if (!stateRef.current.pending) {
            callbacksRef.current.onUploadSettled()
          }
        }
      }
    }
    const promise = run().finally(() => {
      if (runningRef.current === promise) runningRef.current = null
    })
    runningRef.current = promise
    return promise
  }, [publish, scope])

  useEffect(() => {
    mountedRef.current = true
    const controller = new AbortController()
    controllerRef.current = controller
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
  }, [scope])

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
        if (!(await callbacksRef.current.onBeforeUpload())) return false
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
        stateRef.current.pending = { ...(current ? { draftId: current.draftId } : {}), metadata }
        publish()
        return await resume()
      } catch (cause) {
        if (mountedRef.current) setError(getModelInputErrorMessage(cause))
        return false
      } finally {
        preparingRef.current = false
        if (mountedRef.current && !stateRef.current.pending) {
          callbacksRef.current.onUploadSettled()
        }
      }
    },
    [publish, resume, scope],
  )

  const clearCompleted = useCallback(() => {
    stateRef.current = { draftId: null, pending: null }
    draftRef.current = undefined
    filesRef.current.clear()
    setDraft(undefined)
    setResult(null)
    try {
      publish()
    } catch (cause) {
      if (mountedRef.current) setError(getModelInputErrorMessage(cause))
    }
  }, [publish])

  return {
    draft,
    getDraft: () => draftRef.current,
    result,
    isUploading,
    hasPendingRequest,
    error,
    upload,
    resume,
    clearCompleted,
  }
}

export default useModelInputUpload
