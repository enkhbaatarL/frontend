import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useLayoutEffect, useRef, useState } from 'react'

import { useNextGenMIActiveTab } from '@/pages/mi/nextGenMI/nextGenMIStickyLayout'
import nextGenMIEventService, { type EventRecommendations } from '@/service/mi/nextGenMI/event'

const getRecommendationErrorMessage = (error: Error | null) => {
  if (!error) return ''
  if (!isAxiosError(error)) return '추천에 실패했습니다'

  const status = error.response?.status
  if (status === 401 || status === 403) return ''
  if (status === 400 || status === 422) return '선택한 Event와 요청 조건을 확인해 주세요.'
  if (status === 404) return '선택한 Event가 삭제되었거나 조회할 수 없습니다.'
  if (status === 502) return 'Agent 연결 또는 응답에 오류가 발생했습니다. Event 추천 버튼으로 다시 시도해 주세요.'
  if (status === 504 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return '추천 요청 시간이 초과되었습니다. Event 추천 버튼으로 다시 시도해 주세요.'
  }
  return '추천에 실패했습니다'
}

export const useEventRecommendations = (miEventIds: number[]) => {
  const queryClient = useQueryClient()
  const activeTab = useNextGenMIActiveTab()
  const [data, setData] = useState<EventRecommendations>()
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const available = activeTab === 'events' && miEventIds.length > 0
  const selectionKey = miEventIds.join(',')

  useLayoutEffect(() => {
    setIsLoading(false)
    setError(null)
    // 완료된 추천 목록은 유지해 다른 추천 항목도 이어서 선택할 수 있게 한다.
    if (!available) setData(undefined)

    return () => {
      requestRef.current?.abort()
      requestRef.current = null
    }
  }, [available, selectionKey])

  const recommend = async () => {
    if (!available || requestRef.current) return

    const controller = new AbortController()
    requestRef.current = controller
    setData(undefined)
    setError(null)
    setIsLoading(true)

    try {
      const recommendations = await nextGenMIEventService.getEventRecommendations({ miEventIds }, controller.signal)
      if (!controller.signal.aborted) setData(recommendations)
    } catch (requestError) {
      if (controller.signal.aborted) return
      if (isAxiosError(requestError) && requestError.response?.status === 404) {
        void queryClient.invalidateQueries({ queryKey: ['nextGenMIEvents'] })
      }
      setError(requestError instanceof Error ? requestError : new Error('추천에 실패했습니다'))
    } finally {
      if (!controller.signal.aborted && requestRef.current === controller) {
        requestRef.current = null
        setIsLoading(false)
      }
    }
  }

  return {
    data: available ? data : undefined,
    isLoading: available && isLoading,
    errorMessage: available ? getRecommendationErrorMessage(error) : '',
    recommend,
  }
}
