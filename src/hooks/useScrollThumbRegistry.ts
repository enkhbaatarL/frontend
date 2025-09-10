import { RefObject, useCallback, useRef } from 'react'

interface ThumbRegistry {
  [key: string]: RefObject<HTMLDivElement | null>
}

const thumbRegistry: ThumbRegistry = {}

export const useScrollThumbRegistry = () => {
  const thumbRef = useRef<HTMLDivElement>(null)

  const registerThumb = useCallback((id: string) => {
    thumbRegistry[id] = thumbRef
    return thumbRef
  }, [])

  const unregisterThumb = useCallback((id: string) => {
    delete thumbRegistry[id]
  }, [])

  /**
   * 특정 ID의 thumb 요소를 가져옴
   * @param id - ScrollWrapper의 고유 식별자
   * @returns HTMLDivElement | null
   */
  const getThumb = useCallback((id: string): HTMLDivElement | null => thumbRegistry[id]?.current || null, [])

  return {
    thumbRef,
    registerThumb,
    unregisterThumb,
    getThumb,
  }
}

export const getScrollThumb = (id: string): HTMLDivElement | null => thumbRegistry[id]?.current || null
