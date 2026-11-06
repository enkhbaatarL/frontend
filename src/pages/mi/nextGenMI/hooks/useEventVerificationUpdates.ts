import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import nextGenMIEventService, {
  type EventDetail,
  type EventVerificationItem,
  type EventVerificationResult,
  type EventVerificationUpdate,
} from '@/service/mi/nextGenMI/event'

interface VerificationUpdateVariables {
  item: EventVerificationItem
  checkedAt: string
}

const getUpdateErrorMessage = (error: Error | null) => {
  if (!error) return ''
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) return ''
    if (error.response?.data?.message) return error.response.data.message
  }
  return 'Event 현행화에 실패했습니다.'
}

export const useEventVerificationUpdates = (
  verification: EventVerificationResult | undefined,
  miEventIds: number[],
  onEventUpdated: (event: EventDetail) => void,
) => {
  const queryClient = useQueryClient()
  const mutations = useMutationState({
    filters: {
      mutationKey: ['nextGenMIEventVerificationUpdate'],
      predicate: (mutation) => mutation.state.variables !== undefined,
    },
    select: (mutation) => ({
      variables: mutation.state.variables as VerificationUpdateVariables,
      status: mutation.state.status,
      data: mutation.state.data as EventVerificationUpdate | undefined,
      error: mutation.state.error,
    }),
  })

  const refreshEvent = async (miEventId: number) => {
    const queryKey = ['nextGenMIEventDetail', String(miEventId)]
    await queryClient.cancelQueries({ queryKey })
    await Promise.allSettled([
      queryClient
        .fetchQuery({
          queryKey,
          queryFn: () => nextGenMIEventService.getEventDetail(String(miEventId)),
          staleTime: 0,
        })
        .then(onEventUpdated),
      queryClient.invalidateQueries({ queryKey: ['nextGenMIEvents'] }),
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'nextGenMIScenarioDesignEvent' && String(query.queryKey[1]) === String(miEventId),
      }),
    ])
  }

  const mutation = useMutation({
    mutationKey: ['nextGenMIEventVerificationUpdate'],
    retry: false,
    // 여러 Event의 처리 결과가 관찰자 교체 후 GC되어 이전 검증 결과로 돌아가지 않도록 유지한다.
    gcTime: Infinity,
    // 선택 변경/화면 이동은 쓰기 요청을 취소하지 않는다. 완료 후 원래 Event의 캐시만 갱신한다.
    mutationFn: ({ item }: VerificationUpdateVariables) =>
      nextGenMIEventService.updateEventFromVerification(item.miEventId, {
        expectedUpdatedAt: item.sourceUpdatedAt ?? undefined,
      }),
    onSuccess: async (result) => {
      if (result.updateStatus === 'updated') await refreshEvent(result.miEventId)
    },
    onError: async (error, { item }) => {
      if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) return
      // 충돌 및 응답 유실 시 최신 상태를 조회하되 쓰기 요청은 자동 재시도하지 않는다.
      await refreshEvent(item.miEventId)
    },
  })

  const getState = (miEventId: number) =>
    mutations
      .filter((entry) => entry.variables.item.miEventId === miEventId && entry.variables.checkedAt === verification?.checkedAt)
      .at(-1)

  const eligibleItems =
    verification?.items.filter((item) => {
      const state = getState(item.miEventId)
      if (state?.status === 'error' || state?.data?.updateStatus === 'updated') return false
      const status = state?.data?.verification.status ?? item.status
      return status === 'fail' || status === 'warning'
    }) ?? []

  const isUpdating = mutations.some((entry) => entry.status === 'pending' && miEventIds.includes(entry.variables.item.miEventId))

  const update = () => {
    if (!verification) return
    for (const item of eligibleItems) {
      if (
        queryClient.isMutating({
          mutationKey: ['nextGenMIEventVerificationUpdate'],
          predicate: (entry) => (entry.state.variables as VerificationUpdateVariables).item.miEventId === item.miEventId,
        }) > 0
      ) {
        continue
      }
      mutation.mutate({ item: getState(item.miEventId)?.data?.verification ?? item, checkedAt: verification.checkedAt })
    }
  }

  return {
    canUpdate: eligibleItems.length > 0,
    isUpdating,
    update,
    getResult: (miEventId: number) => getState(miEventId)?.data,
    getErrorMessage: (miEventId: number) => getUpdateErrorMessage(getState(miEventId)?.error ?? null),
  }
}
