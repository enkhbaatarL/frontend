import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'

import type { ICommonResponse } from '@/types/api'

import nextGenMIEventService, {
  type EventDetail,
  type EventVerificationConflict,
  type EventVerificationResult,
  type EventVerificationUpdate,
  isEventVerificationId,
  type StoredEventVerification,
} from '@/service/mi/nextGenMI/event'

export interface EventVerificationUpdateAttempt {
  miEventId: number
  verificationId: string
  expectedUpdatedAt: string | null
}

export interface VerificationUpdateState {
  result: EventVerificationUpdate | undefined
  isApplied: boolean
  snapshotId: number | null
  showUpdate: boolean
  canUpdate: boolean
  message: string
  errorMessage: string
  isRefreshing: boolean
  refreshErrorMessage: string
}

const getUpdateFailure = (error: Error | null, attempt: EventVerificationUpdateAttempt) => {
  if (!error) return undefined
  if (isAxiosError<ICommonResponse<EventVerificationConflict | null>>(error)) {
    const status = error.response?.status
    const body = error.response?.data
    if (status === 401 || status === 403) return { kind: 'auth', message: '' }
    if (status === 409) {
      if (body?.code === 'BIZ-009' && body.data?.verification_id === attempt.verificationId) {
        const snapshotId = body.data.mi_event_snapshot_id
        if (snapshotId !== null && Number.isSafeInteger(snapshotId) && snapshotId > 0) {
          return { kind: 'applied', message: '이미 업데이트된 결과입니다.', snapshotId }
        }
      }
      if (body?.code === 'BIZ-007') {
        return { kind: 'stale', message: '검증 이후 Event가 변경되었습니다. Event 검증 버튼으로 다시 검증해 주세요.' }
      }
      if (body?.code === 'BIZ-008') {
        return { kind: 'expired', message: '검증 결과가 만료되었습니다. Event 검증 버튼으로 다시 검증해 주세요.' }
      }
    }
    if (status === 404 || status === 422 || body?.code === 'API-006') {
      return { kind: 'invalid', message: body?.message || '검증 결과를 사용할 수 없습니다. Event 검증 버튼으로 다시 검증해 주세요.' }
    }
    if (body?.code === 'API-005' || (status !== undefined && status < 500 && status !== 409)) {
      return { kind: 'failed', message: body?.message || 'Event 현행화에 실패했습니다.' }
    }
    return {
      kind: 'uncertain',
      message: body?.message ? `업데이트 결과 확인이 필요합니다. ${body.message}` : '업데이트 결과 확인이 필요합니다.',
    }
  }
  return { kind: 'uncertain', message: '업데이트 결과 확인이 필요합니다.' }
}

export const useEventVerificationUpdates = (
  verification: EventVerificationResult | undefined,
  miEventIds: number[],
  onEventUpdated: (event: EventDetail) => void,
) => {
  const queryClient = useQueryClient()
  const [now, setNow] = useState(Date.now)
  const mutations = useMutationState({
    filters: {
      predicate: (mutation) =>
        mutation.state.variables !== undefined &&
        (mutation.options.mutationKey?.[0] === 'nextGenMIEventVerificationUpdate' ||
          mutation.options.mutationKey?.[0] === 'nextGenMIEventVerificationRefresh'),
    },
    select: (mutation) => ({
      attempt: mutation.state.variables as EventVerificationUpdateAttempt,
      status: mutation.state.status,
      data: mutation.state.data as EventVerificationUpdate | undefined,
      error: mutation.state.error,
      mutationKey: mutation.options.mutationKey?.[0],
    }),
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const updateTime = () => {
      clearTimeout(timer)
      const currentTime = Date.now()
      setNow(currentTime)
      const nextExpiry = Math.min(
        ...(verification?.items.map((item) => Date.parse(item.expiresAt)).filter((time) => time > currentTime) ?? []),
      )
      if (Number.isFinite(nextExpiry)) timer = setTimeout(updateTime, Math.min(nextExpiry - currentTime, 2_147_483_647))
    }
    updateTime()
    window.addEventListener('focus', updateTime)
    document.addEventListener('visibilitychange', updateTime)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', updateTime)
      document.removeEventListener('visibilitychange', updateTime)
    }
  }, [verification])

  const refreshMutation = useMutation({
    mutationKey: ['nextGenMIEventVerificationRefresh'],
    retry: false,
    gcTime: Infinity,
    mutationFn: async ({ miEventId }: EventVerificationUpdateAttempt) => {
      const queryKey = ['nextGenMIEventDetail', String(miEventId)]
      await queryClient.cancelQueries({ queryKey })
      const results = await Promise.allSettled([
        queryClient
          .fetchQuery({ queryKey, queryFn: () => nextGenMIEventService.getEventDetail(String(miEventId)), staleTime: 0, retry: false })
          .then(onEventUpdated),
        queryClient.invalidateQueries({ queryKey: ['nextGenMIEvents'] }, { throwOnError: true }),
        queryClient.invalidateQueries(
          { predicate: (query) => query.queryKey[0] === 'nextGenMIScenarioDesignEvent' && String(query.queryKey[1]) === String(miEventId) },
          { throwOnError: true },
        ),
      ])
      if (results.some((result) => result.status === 'rejected')) throw new Error('최신 Event 내용을 불러오지 못했습니다.')
    },
  })

  const refreshEvent = (attempt: EventVerificationUpdateAttempt) => {
    if (
      queryClient.isMutating({
        mutationKey: ['nextGenMIEventVerificationRefresh'],
        predicate: (entry) => {
          const current = entry.state.variables as EventVerificationUpdateAttempt
          return current.miEventId === attempt.miEventId && current.verificationId === attempt.verificationId
        },
      }) > 0
    )
      return
    refreshMutation.mutate(attempt)
  }

  const mutation = useMutation({
    mutationKey: ['nextGenMIEventVerificationUpdate'],
    retry: false,
    gcTime: Infinity,
    // 화면 이동과 무관하게 요청에 고정한 Event·검증 ID로 완료 상태를 관리한다.
    mutationFn: ({ miEventId, verificationId, expectedUpdatedAt }: EventVerificationUpdateAttempt) =>
      nextGenMIEventService.updateEventFromVerification(miEventId, { verificationId, expectedUpdatedAt }),
    onSuccess: (result, attempt) => {
      // 재조회 오류는 별도 mutation에 남기고, 이미 완료된 저장을 실패로 바꾸지 않는다.
      if (result.updateStatus === 'updated') refreshEvent(attempt)
    },
    onError: (error, attempt) => {
      if (getUpdateFailure(error, attempt)?.kind !== 'auth') refreshEvent(attempt)
    },
  })

  const getState = (item: StoredEventVerification, currentTime: number): VerificationUpdateState => {
    const state = queryClient
      .getMutationCache()
      .findAll({
        mutationKey: ['nextGenMIEventVerificationUpdate'],
        predicate: (entry) => {
          const attempt = entry.state.variables as EventVerificationUpdateAttempt | undefined
          return attempt?.miEventId === item.miEventId && attempt.verificationId === item.verificationId
        },
      })
      .at(-1)?.state
    const failure = state ? getUpdateFailure(state.error, state.variables as EventVerificationUpdateAttempt) : undefined
    const result = state?.data as EventVerificationUpdate | undefined
    const refreshStates = queryClient.getMutationCache().findAll({
      mutationKey: ['nextGenMIEventVerificationRefresh'],
      predicate: (entry) => {
        const attempt = entry.state.variables as EventVerificationUpdateAttempt | undefined
        return attempt?.miEventId === item.miEventId && attempt.verificationId === item.verificationId
      },
    })
    const isRefreshing = refreshStates.at(-1)?.state.status === 'pending'
    const refreshFailed = refreshStates.filter((entry) => entry.state.status !== 'pending').at(-1)?.state.status === 'error'
    const isApplied = result?.updateStatus === 'updated' || failure?.kind === 'applied'
    const hasVerification = isEventVerificationId(item.verificationId) && !!item.expiresAt && Number.isFinite(Date.parse(item.expiresAt))
    const expired = hasVerification && currentTime >= Date.parse(item.expiresAt)
    const status = result?.verification.status ?? item.status
    const showUpdate = !isApplied && (status === 'fail' || status === 'warning')
    let errorMessage = failure?.kind === 'applied' ? '' : (failure?.message ?? '')
    if (!isApplied && state?.status !== 'pending') {
      if (!hasVerification) errorMessage = '검증 결과를 사용할 수 없습니다. Event 검증 버튼으로 다시 검증해 주세요.'
      else if (expired && failure?.kind !== 'auth') {
        errorMessage = `${failure?.kind === 'uncertain' ? '업데이트 결과 확인이 필요합니다. ' : ''}검증 결과가 만료되었습니다. Event 검증 버튼으로 다시 검증해 주세요.`
      }
    }
    return {
      result,
      isApplied,
      snapshotId: isApplied ? (result?.miEventSnapshotId ?? failure?.snapshotId ?? null) : null,
      showUpdate,
      canUpdate:
        showUpdate &&
        hasVerification &&
        !expired &&
        state?.status !== 'pending' &&
        (!failure || (failure.kind === 'uncertain' && !isRefreshing && !refreshFailed)),
      message: result?.message ?? (failure?.kind === 'applied' ? failure.message : ''),
      errorMessage,
      isRefreshing,
      refreshErrorMessage: refreshFailed ? '최신 Event 내용을 불러오지 못했습니다.' : '',
    }
  }

  const isUpdating = mutations.some(
    (entry) =>
      entry.mutationKey === 'nextGenMIEventVerificationUpdate' &&
      entry.status === 'pending' &&
      miEventIds.includes(entry.attempt.miEventId),
  )

  const update = () => {
    if (!verification) return
    const currentTime = Date.now()
    setNow(currentTime)
    for (const item of verification.items) {
      if (!getState(item, currentTime).canUpdate) continue
      if (
        queryClient.isMutating({
          mutationKey: ['nextGenMIEventVerificationUpdate'],
          predicate: (entry) => (entry.state.variables as EventVerificationUpdateAttempt).miEventId === item.miEventId,
        }) > 0
      )
        continue
      // 수정안의 ID가 아닌, 표시 중인 원본 검증 ID와 수정 시각을 고정한다.
      mutation.mutate({ miEventId: item.miEventId, verificationId: item.verificationId, expectedUpdatedAt: item.sourceUpdatedAt })
    }
  }

  return {
    showUpdate: verification?.items.some((item) => getState(item, now).showUpdate) ?? false,
    canUpdate: verification?.items.some((item) => getState(item, now).canUpdate) ?? false,
    isUpdating,
    update,
    retryRefresh: (item: StoredEventVerification) => {
      if (!getState(item, Date.now()).refreshErrorMessage) return
      refreshEvent({ miEventId: item.miEventId, verificationId: item.verificationId, expectedUpdatedAt: item.sourceUpdatedAt })
    },
    getUpdateState: (item: StoredEventVerification) => getState(item, now),
  }
}
