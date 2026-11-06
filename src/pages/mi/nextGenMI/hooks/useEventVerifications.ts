import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import type { EventVerificationUpdateAttempt } from '@/pages/mi/nextGenMI/hooks/useEventVerificationUpdates'

import { useNextGenMIActiveTab } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import nextGenMIEventService, { type EventVerificationResult } from '@/service/mi/nextGenMI/event'

const getVerificationErrorMessage = (error: Error | null) => {
  if (!error) return ''
  if (!isAxiosError(error)) return error.message

  const status = error.response?.status
  if (status === 401 || status === 403) return ''
  if (status === 400 || status === 422) return '선택한 Event와 요청 조건을 확인해 주세요.'
  if (status === 404) return '선택한 Event가 삭제되었거나 조회할 수 없습니다. 새로고침된 목록에서 선택한 Event를 확인해 주세요.'
  if (status === 504 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return '검증 요청 시간이 초과되었습니다. Event 검증 버튼으로 다시 시도해 주세요.'
  }
  if (status === 500 || status === 502 || status === 503) {
    return '검증 서비스에 오류가 발생했습니다. Event 검증 버튼으로 다시 시도해 주세요.'
  }
  return '검증에 실패했습니다. Event 검증 버튼으로 다시 시도해 주세요.'
}

export const useEventVerifications = (miEventIds: number[]) => {
  const queryClient = useQueryClient()
  const activeTab = useNextGenMIActiveTab()
  const location = useLocation()
  const [data, setData] = useState<EventVerificationResult>()
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const available = activeTab === 'events' && miEventIds.length > 0
  const selectionKey = miEventIds.join(',')

  useLayoutEffect(() => {
    setData(undefined)
    setError(null)
    setIsLoading(false)

    return () => {
      requestRef.current?.abort()
      requestRef.current = null
    }
  }, [available, selectionKey, location.key])

  const verify = async () => {
    if (!available || requestRef.current) return
    if (
      queryClient.isMutating({
        mutationKey: ['nextGenMIEventVerificationUpdate'],
        predicate: (mutation) => miEventIds.includes((mutation.state.variables as EventVerificationUpdateAttempt).miEventId),
      }) > 0
    )
      return

    const controller = new AbortController()
    requestRef.current = controller
    setData(undefined)
    setError(null)
    setIsLoading(true)

    try {
      const result = await nextGenMIEventService.verifyEvents({ miEventIds }, controller.signal)
      if (!controller.signal.aborted && requestRef.current === controller) setData(result)
    } catch (requestError) {
      if (controller.signal.aborted || requestRef.current !== controller) return
      if (isAxiosError(requestError) && requestError.response?.status === 404) {
        void queryClient.invalidateQueries({ queryKey: ['nextGenMIEvents'] })
      }
      setError(requestError instanceof Error ? requestError : new Error('검증에 실패했습니다. Event 검증 버튼으로 다시 시도해 주세요.'))
    } finally {
      if (!controller.signal.aborted && requestRef.current === controller) {
        requestRef.current = null
        setIsLoading(false)
      }
    }
  }

  return {
    data: available ? data : undefined,
    errorMessage: available ? getVerificationErrorMessage(error) : '',
    isLoading: available && isLoading,
    verify,
  }
}
