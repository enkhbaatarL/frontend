import { useQueryClient } from '@tanstack/react-query'
import { compare } from 'fast-json-patch'
import { cloneDeep } from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'

import useSnackbar from '@/hooks/useSnackbar'
import {
  chartBoxPositionsEqual,
  getChartBoxPositions,
  sortNewsFlowNewsCardsByTimeForSave,
  stripChartBoxPositions,
  updateChartBoxPositions,
} from '@/pages/mi/newsletter/utils/snapshotUtils'
import newsletterService, {
  SaveRevisionConcurrencyError,
  SaveRevisionNetworkError,
  SaveRevisionValidationError,
  type INewsletterIssueSnapshotData,
} from '@/service/mi/newsletter'
import useChartEditStore from '@/store/useChartEditStore'
import { canonicalizeSnapshotLikeServer } from '@/utils/newsletterSnapshotCanonicalize'

export interface UseSaveNewsletterRevisionParams {
  newsletterId: string | undefined
  issueNo: string | undefined
  baseSnapshot: INewsletterIssueSnapshotData | null
  currentState: INewsletterIssueSnapshotData | null
  /** 상세 `snapshot.revisionNo` — 있으면 서버 낙관적 잠금에 전달 */
  revisionNo?: number | null
  /** 상세 `deltaCount` — 임계치 초과 시에만 최종저장에 `snapshotPayload` 포함 */
  deltaCount?: number | null
}

/**
 * 뉴스레터 최종저장(Delta 기반 리비전 저장) 훅.
 * baseSnapshot과 currentState를 비교하여 변경분만 추출 후 API 호출.
 */
export const useSaveNewsletterRevision = (params: UseSaveNewsletterRevisionParams) => {
  const { newsletterId, issueNo, baseSnapshot, currentState, revisionNo, deltaCount } = params
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  /** 드래그 중(mouseup 전) 레이아웃만 바뀐 경우 — 스냅샷에는 아직 없을 수 있음 */
  const storeBoxPositions = useChartEditStore((s) => s.boxPositions)

  /** 레이아웃 제외 변경분 — `storeBoxPositions` 갱신마다 전체 diff를 돌리지 않음 */
  const hasNonLayoutUnsavedChanges = useMemo(() => {
    if (!baseSnapshot || !currentState) return false
    const baseStripped = stripChartBoxPositions(baseSnapshot)
    const currentStripped = stripChartBoxPositions(currentState)
    const baseSorted = sortNewsFlowNewsCardsByTimeForSave(baseStripped)
    const currentSorted = sortNewsFlowNewsCardsByTimeForSave(currentStripped)
    const baseNorm = canonicalizeSnapshotLikeServer(baseSorted)
    const currentNorm = canonicalizeSnapshotLikeServer(currentSorted)
    const deltas = compare(cloneDeep(baseNorm) as object, cloneDeep(currentNorm) as object)
    return deltas.length > 0
  }, [baseSnapshot, currentState])

  const hasLayoutUnsavedChanges = useMemo(() => {
    if (!baseSnapshot) return false
    return !chartBoxPositionsEqual(getChartBoxPositions(baseSnapshot), storeBoxPositions)
  }, [baseSnapshot, storeBoxPositions])

  const hasUnsavedChanges = hasNonLayoutUnsavedChanges || hasLayoutUnsavedChanges

  const saveFinalRevision = useCallback(async (): Promise<{ success: boolean }> => {
    if (!newsletterId || !issueNo || !baseSnapshot || !currentState) {
      showSnackbar('저장할 데이터가 없습니다.', { variant: 'error' })
      return { success: false }
    }

    /** mouseup 전 저장 대비: 스토어의 최신 박스 좌표를 병합 */
    const merged = updateChartBoxPositions(currentState, useChartEditStore.getState().boxPositions)
    const stateToSave = sortNewsFlowNewsCardsByTimeForSave(merged)

    setIsSaving(true)
    try {
      await newsletterService.saveFinalRevision({
        baseSnapshot,
        currentState: stateToSave,
        newsletterId,
        issueNo,
        revisionNo,
        deltaCount,
      })

      showSnackbar('저장되었습니다.', { variant: 'success' })

      /** 저장 후 발행호 상세 GET을 반드시 다시 호출 */
      await queryClient.refetchQueries({
        queryKey: ['newsletterIssueDetail', newsletterId, issueNo],
        type: 'active',
      })

      /** 수정 이력 목록 GET …/revisions/{id}/changes — 저장 직후 캐시만 있으면 드롭다운이 갱신되지 않음 */
      await queryClient.invalidateQueries({
        queryKey: ['revisionChanges', newsletterId, issueNo],
      })

      /** 수정 이력 상세(델타 리플레이) — baseSnapshot·histories가 달라질 수 있으므로 캐시 제거 */
      await queryClient.invalidateQueries({
        queryKey: ['revisionChangeDetail', newsletterId, issueNo],
      })

      return { success: true }
    } catch (err) {
      if (err instanceof SaveRevisionConcurrencyError) {
        showSnackbar(err.message, { variant: 'error', body: '페이지를 새로고침한 뒤 다시 시도해 주세요.' })
      } else if (err instanceof SaveRevisionValidationError) {
        const msg = (err.responseData?.message as string) || err.message
        showSnackbar(msg, { variant: 'error' })
      } else if (err instanceof SaveRevisionNetworkError) {
        showSnackbar(err.message, { variant: 'error' })
      } else {
        showSnackbar('저장 중 오류가 발생했습니다. 다시 시도해 주세요.', { variant: 'error' })
        console.error('[useSaveNewsletterRevision]', err)
      }
      return { success: false }
    } finally {
      setIsSaving(false)
    }
  }, [newsletterId, issueNo, baseSnapshot, currentState, revisionNo, deltaCount, showSnackbar, queryClient])

  const saveDraftRevision = useCallback(async (): Promise<{ success: boolean }> => {
    if (!newsletterId || !issueNo || !baseSnapshot || !currentState) {
      showSnackbar('임시저장할 데이터가 없습니다.', { variant: 'error' })
      return { success: false }
    }

    const merged = updateChartBoxPositions(currentState, useChartEditStore.getState().boxPositions)
    const stateToSave = sortNewsFlowNewsCardsByTimeForSave(merged)

    setIsSavingDraft(true)
    try {
      await newsletterService.saveDraftRevision({
        baseSnapshot,
        currentState: stateToSave,
        newsletterId,
        issueNo,
        revisionNo,
      })

      showSnackbar('임시저장되었습니다.', { variant: 'success' })

      await queryClient.refetchQueries({
        queryKey: ['newsletterIssueDetail', newsletterId, issueNo],
        type: 'active',
      })

      return { success: true }
    } catch (err) {
      if (err instanceof SaveRevisionConcurrencyError) {
        showSnackbar(err.message, { variant: 'error', body: '페이지를 새로고침한 뒤 다시 시도해 주세요.' })
      } else if (err instanceof SaveRevisionValidationError) {
        const msg = (err.responseData?.message as string) || err.message
        showSnackbar(msg, { variant: 'error' })
      } else if (err instanceof SaveRevisionNetworkError) {
        showSnackbar(err.message, { variant: 'error' })
      } else {
        showSnackbar('임시저장 중 오류가 발생했습니다. 다시 시도해 주세요.', { variant: 'error' })
        console.error('[useSaveNewsletterRevision] saveDraftRevision', err)
      }
      return { success: false }
    } finally {
      setIsSavingDraft(false)
    }
  }, [newsletterId, issueNo, baseSnapshot, currentState, revisionNo, showSnackbar, queryClient])

  return { saveFinalRevision, saveDraftRevision, isSaving, isSavingDraft, hasUnsavedChanges }
}
