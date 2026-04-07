import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { updateChartBoxPositions } from '@/pages/mi/newsletter/utils/snapshotUtils'
import useChartEditStore from '@/store/useChartEditStore'

interface LocalDraftData {
  snapshot: INewsletterIssueSnapshotData
  savedAt: string
}

const LOCAL_DRAFT_KEY_PREFIX = 'newsletter-local-draft'

const getStorageKey = (newsletterId: string, issueNo: string) => `${LOCAL_DRAFT_KEY_PREFIX}:${newsletterId}:${issueNo}`

interface UseNewsletterLocalDraftParams {
  newsletterId: string | undefined
  issueNo: string | undefined
  isEditMode: boolean
  currentSnapshot: INewsletterIssueSnapshotData | null
  hasUnsavedChanges: boolean
  debounceMs?: number // 디바운스 지연 시간 (기본 2000ms)
  /** true면 저장 시점에 차트 박스 스토어 좌표를 병합(mouseup 전 드래그 반영) */
  useLiveChartLayoutForPersist?: boolean
}

/**
 * 뉴스레터 편집 중 스냅샷을 로컬스토리지에 자동 저장하는 훅.
 * - 편집 모드에서 변경 사항이 있을 때 디바운스로 로컬스토리지에 저장
 * - 브라우저 종료(beforeunload) 시 즉시 저장
 * - 편집 진입 시 로컬 드래프트 조회·삭제 유틸 제공
 */
export const useNewsletterLocalDraft = ({
  newsletterId,
  issueNo,
  isEditMode,
  currentSnapshot,
  hasUnsavedChanges,
  debounceMs = 2000,
  useLiveChartLayoutForPersist = false,
}: UseNewsletterLocalDraftParams) => {
  const snapshotRef = useRef(currentSnapshot)
  snapshotRef.current = currentSnapshot
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  hasUnsavedChangesRef.current = hasUnsavedChanges

  const storageKey = useMemo(() => (newsletterId && issueNo ? getStorageKey(newsletterId, issueNo) : null), [newsletterId, issueNo])

  const saveToStorage = useCallback((key: string, data: INewsletterIssueSnapshotData) => {
    try {
      const payload: LocalDraftData = {
        snapshot: data,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (e) {
      console.warn('[useNewsletterLocalDraft] localStorage save failed', e)
    }
  }, [])

  const mergeLayoutIfNeeded = useCallback(
    (data: INewsletterIssueSnapshotData) =>
      useLiveChartLayoutForPersist ? updateChartBoxPositions(data, useChartEditStore.getState().boxPositions) : data,
    [useLiveChartLayoutForPersist],
  )

  const debouncedSave = useMemo(
    () =>
      debounce((key: string, data: INewsletterIssueSnapshotData) => {
        saveToStorage(key, mergeLayoutIfNeeded(data))
      }, debounceMs),
    [saveToStorage, debounceMs, mergeLayoutIfNeeded],
  )

  useEffect(() => {
    if (!isEditMode || !storageKey || !currentSnapshot) return

    if (!hasUnsavedChanges) {
      debouncedSave.cancel()
      return
    }

    debouncedSave(storageKey, currentSnapshot)
  }, [isEditMode, storageKey, currentSnapshot, hasUnsavedChanges, debouncedSave])

  useEffect(() => () => debouncedSave.cancel(), [debouncedSave])

  useEffect(() => {
    if (!isEditMode || !storageKey) return undefined
    const handleBeforeUnload = () => {
      debouncedSave.cancel()
      if (snapshotRef.current && hasUnsavedChangesRef.current) {
        saveToStorage(storageKey, mergeLayoutIfNeeded(snapshotRef.current))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEditMode, storageKey, debouncedSave, saveToStorage, mergeLayoutIfNeeded])

  /** 로컬 드래프트 데이터 가져오기 */
  const getLocalDraft = useCallback((): INewsletterIssueSnapshotData | null => {
    if (!storageKey) return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed: LocalDraftData = JSON.parse(raw)
      if (parsed.snapshot && Array.isArray(parsed.snapshot.sections)) {
        return parsed.snapshot
      }
      return null
    } catch {
      return null
    }
  }, [storageKey])

  /** 로컬 드래프트 삭제 및 디바운스 취소 */
  const clearLocalDraft = useCallback(() => {
    debouncedSave.cancel()
    if (!storageKey) return
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey, debouncedSave])

  return { getLocalDraft, clearLocalDraft }
}
