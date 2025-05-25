import { useState, useEffect, useCallback } from 'react'

export const useSearchHistory = (storageKey = 'search-history', maxHistory = 10) => {
  const [history, setHistory] = useState<string[]>([])

  // 초기 로드
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem(storageKey)
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [storageKey])

  // 검색어 추가
  const addToHistory = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return

      setHistory((prev) => {
        // 중복 제거 및 최신 항목을 맨 앞으로
        const filtered = prev.filter((item) => item.toLowerCase() !== searchTerm.toLowerCase())
        const newHistory = [searchTerm, ...filtered].slice(0, maxHistory)

        try {
          sessionStorage.setItem(storageKey, JSON.stringify(newHistory))
        } catch (error) {
          console.error('Failed to save search history:', error)
        }

        return newHistory
      })
    },
    [storageKey, maxHistory],
  )

  // 특정 검색어 삭제
  const removeFromHistory = useCallback(
    (searchTerm: string) => {
      setHistory((prev) => {
        const newHistory = prev.filter((item) => item !== searchTerm)
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(newHistory))
        } catch (error) {
          console.error('Failed to update search history:', error)
        }
        return newHistory
      })
    },
    [storageKey],
  )

  // 전체 이력 삭제
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      sessionStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }, [storageKey])

  return { history, addToHistory, removeFromHistory, clearHistory }
}
