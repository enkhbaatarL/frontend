import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { INewsletterIssueSnapshotData } from '@/service/mi/newsletter'

import { chartBoxPositionsEqual, getChartBoxPositions, updateChartBoxPositions } from '@/pages/mi/newsletter/utils/snapshotUtils'
import { getLatestChartBoxPositions } from '@/store/useChartEditStore'
import { canonicalizeSnapshotLikeServer } from '@/utils/newsletterSnapshotCanonicalize'

export const NEWSLETTER_LOCAL_DRAFT_KEY_PREFIX = 'newsletter-local-draft'
export const NEWSLETTER_LOCAL_DRAFT_TTL_MS = 604800000 // 7 * 24 * 60 * 60 * 1000 = 일주일

interface LocalDraftData {
  snapshot: INewsletterIssueSnapshotData
  savedAt: string
  expiresAt: number
  baseRevisionNo: number | null
  baseSnapshotFingerprint: string | null
}

export interface NewsletterLocalDraft {
  snapshot: INewsletterIssueSnapshotData
  savedAt: string
  expiresAt?: number
  baseRevisionNo?: number | null
  baseSnapshotFingerprint?: string | null
}

export type NewsletterLocalDraftRestoreResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'expired'; draft: NewsletterLocalDraft }
  | {
      status: 'stale'
      draft: NewsletterLocalDraft
      reason: 'revision-mismatch' | 'fingerprint-mismatch' | 'missing-baseline'
      currentRevisionNo: number | null
      currentBaseSnapshotFingerprint: string | null
    }
  | { status: 'found'; draft: NewsletterLocalDraft }

interface LocalDraftRestoreBaseline {
  baseSnapshot: INewsletterIssueSnapshotData | null
  baseRevisionNo?: number | null
}

const getStorageKey = (newsletterId: string, issueNo: string) => `${NEWSLETTER_LOCAL_DRAFT_KEY_PREFIX}:${newsletterId}:${issueNo}`

const normalizeRevisionNo = (revisionNo: number | null | undefined): number | null =>
  typeof revisionNo === 'number' && Number.isFinite(revisionNo) ? revisionNo : null

const isSnapshotData = (value: unknown): value is INewsletterIssueSnapshotData =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as { sections?: unknown }).sections)

const stableStringify = (value: unknown): string => {
  if (value === undefined) return 'null'
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(',')}}`
}

const hashString64 = (value: string): string => {
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n

  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i))
    hash = BigInt.asUintN(64, hash * prime)
  }

  return hash.toString(16).padStart(16, '0')
}

export const getNewsletterSnapshotFingerprint = (snapshot: INewsletterIssueSnapshotData): string =>
  hashString64(stableStringify(canonicalizeSnapshotLikeServer(snapshot)))

const toLocalDraft = (parsed: unknown): NewsletterLocalDraft | null => {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const candidate = parsed as Partial<NewsletterLocalDraft>
  if (!isSnapshotData(candidate.snapshot)) return null

  return {
    snapshot: candidate.snapshot,
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : '',
    expiresAt: typeof candidate.expiresAt === 'number' ? candidate.expiresAt : undefined,
    baseRevisionNo: normalizeRevisionNo(candidate.baseRevisionNo),
    baseSnapshotFingerprint:
      typeof candidate.baseSnapshotFingerprint === 'string' && candidate.baseSnapshotFingerprint.length > 0
        ? candidate.baseSnapshotFingerprint
        : null,
  }
}

const isDraftExpired = (draft: NewsletterLocalDraft, now = Date.now()): boolean => {
  if (typeof draft.expiresAt === 'number') return draft.expiresAt <= now

  const savedAtMs = Date.parse(draft.savedAt)
  return Number.isFinite(savedAtMs) && savedAtMs + NEWSLETTER_LOCAL_DRAFT_TTL_MS <= now
}

const validateDraftBaseline = (
  draft: NewsletterLocalDraft,
  baseline: LocalDraftRestoreBaseline,
): Extract<NewsletterLocalDraftRestoreResult, { status: 'found' | 'stale' }> => {
  const currentRevisionNo = normalizeRevisionNo(baseline.baseRevisionNo)
  const currentBaseSnapshotFingerprint = baseline.baseSnapshot ? getNewsletterSnapshotFingerprint(baseline.baseSnapshot) : null

  if (currentRevisionNo === null && currentBaseSnapshotFingerprint === null) {
    return {
      status: 'stale',
      draft,
      reason: 'missing-baseline',
      currentRevisionNo,
      currentBaseSnapshotFingerprint,
    }
  }

  if (currentRevisionNo !== null && normalizeRevisionNo(draft.baseRevisionNo) !== currentRevisionNo) {
    return {
      status: 'stale',
      draft,
      reason: 'revision-mismatch',
      currentRevisionNo,
      currentBaseSnapshotFingerprint,
    }
  }

  if (currentBaseSnapshotFingerprint !== null && draft.baseSnapshotFingerprint !== currentBaseSnapshotFingerprint) {
    return {
      status: 'stale',
      draft,
      reason: 'fingerprint-mismatch',
      currentRevisionNo,
      currentBaseSnapshotFingerprint,
    }
  }

  return { status: 'found', draft }
}

interface UseNewsletterLocalDraftParams {
  newsletterId: string | undefined
  issueNo: string | undefined
  isEditMode: boolean
  currentSnapshot: INewsletterIssueSnapshotData | null
  baseSnapshot: INewsletterIssueSnapshotData | null
  baseRevisionNo?: number | null
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
  baseSnapshot,
  baseRevisionNo,
  hasUnsavedChanges,
  debounceMs = 2000,
  useLiveChartLayoutForPersist = false,
}: UseNewsletterLocalDraftParams) => {
  const snapshotRef = useRef(currentSnapshot)
  snapshotRef.current = currentSnapshot
  const baseSnapshotRef = useRef(baseSnapshot)
  baseSnapshotRef.current = baseSnapshot
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  hasUnsavedChangesRef.current = hasUnsavedChanges
  const baseSnapshotFingerprint = useMemo(() => (baseSnapshot ? getNewsletterSnapshotFingerprint(baseSnapshot) : null), [baseSnapshot])
  const draftMetadataRef = useRef({
    baseRevisionNo: normalizeRevisionNo(baseRevisionNo),
    baseSnapshotFingerprint,
  })
  draftMetadataRef.current = {
    baseRevisionNo: normalizeRevisionNo(baseRevisionNo),
    baseSnapshotFingerprint,
  }

  const storageKey = useMemo(() => (newsletterId && issueNo ? getStorageKey(newsletterId, issueNo) : null), [newsletterId, issueNo])

  const saveToStorage = useCallback((key: string, data: INewsletterIssueSnapshotData) => {
    try {
      const now = Date.now()
      const metadata = draftMetadataRef.current
      const payload: LocalDraftData = {
        snapshot: data,
        savedAt: new Date(now).toISOString(),
        expiresAt: now + NEWSLETTER_LOCAL_DRAFT_TTL_MS,
        baseRevisionNo: metadata.baseRevisionNo,
        baseSnapshotFingerprint: metadata.baseSnapshotFingerprint,
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {
      return
    }
  }, [])

  const mergeLayoutIfNeeded = useCallback(
    (data: INewsletterIssueSnapshotData) =>
      useLiveChartLayoutForPersist ? updateChartBoxPositions(data, getLatestChartBoxPositions()) : data,
    [useLiveChartLayoutForPersist],
  )

  const hasLiveLayoutChanges = useCallback(() => {
    if (!useLiveChartLayoutForPersist || !baseSnapshotRef.current) return false
    return !chartBoxPositionsEqual(getChartBoxPositions(baseSnapshotRef.current), getLatestChartBoxPositions())
  }, [useLiveChartLayoutForPersist])

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
      if (snapshotRef.current && (hasUnsavedChangesRef.current || hasLiveLayoutChanges())) {
        saveToStorage(storageKey, mergeLayoutIfNeeded(snapshotRef.current))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isEditMode, storageKey, debouncedSave, saveToStorage, mergeLayoutIfNeeded, hasLiveLayoutChanges])

  /** 로컬 드래프트 데이터 가져오기 */
  const getLocalDraft = useCallback(
    (baseline?: LocalDraftRestoreBaseline): NewsletterLocalDraftRestoreResult => {
      if (!storageKey) return { status: 'missing' }
      try {
        const raw = localStorage.getItem(storageKey)
        if (!raw) return { status: 'missing' }
        const draft = toLocalDraft(JSON.parse(raw))
        if (!draft) return { status: 'invalid' }
        if (isDraftExpired(draft)) {
          return { status: 'expired', draft }
        }
        if (baseline) return validateDraftBaseline(draft, baseline)
        return { status: 'found', draft }
      } catch {
        return { status: 'invalid' }
      }
    },
    [storageKey],
  )

  /** 로컬 드래프트 삭제 및 디바운스 취소 */
  const clearLocalDraft = useCallback(() => {
    debouncedSave.cancel()
    if (!storageKey) return
    try {
      localStorage.removeItem(storageKey)
    } catch {
      return
    }
  }, [storageKey, debouncedSave])

  return { getLocalDraft, clearLocalDraft }
}
