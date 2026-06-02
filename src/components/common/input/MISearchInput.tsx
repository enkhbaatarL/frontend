import { AutocompleteChangeReason } from '@mui/material'
import { t } from 'i18next'
import { useCallback, SyntheticEvent } from 'react'

import AsyncAutocomplete from '@/components/common/input/AsyncAutocomplete'

interface Props {
  storageKey: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch: (value: string) => void
  onClear: () => void
  width?: number | string
  height?: number | string
}

const getHistory = (storageKey: string) => {
  if (!storageKey) return []

  const savedHistory = localStorage.getItem(`${storageKey}-search-history`)
  if (savedHistory) {
    try {
      return JSON.parse(savedHistory) as string[]
    } catch {
      return []
    }
  }
  return []
}

const MISearchInput = ({ storageKey, value, onChange, placeholder, onSearch, onClear, width, height }: Props) => {
  const addHistory = useCallback(
    (newValue: string) => {
      if (!newValue?.trim() || !storageKey) return

      const history = getHistory(storageKey)
      const uniqueHistory = Array.from(new Set([...history, newValue.trim()]))
      const sortedHistory = [...uniqueHistory].sort((a, b) => a.localeCompare(b))

      localStorage.setItem(`${storageKey}-search-history`, JSON.stringify(sortedHistory))
    },
    [storageKey],
  )

  // 비동기 검색 함수: localStorage 히스토리에서 필터링
  const asyncFunction = useCallback(
    (keyword: string): Promise<string[]> =>
      new Promise((resolve) => {
        const history = getHistory(storageKey)
        if (!keyword.trim()) {
          resolve(history)
          return
        }

        const result = history.filter((item: string) => item.toLowerCase().includes(keyword.toLowerCase()))

        // 길이순으로 정렬하고 최대 10개 반환
        const sortedResult = [...result].sort((a: string, b: string) => a.length - b.length)
        resolve(sortedResult.slice(0, 10))
      }),
    [storageKey],
  )

  const handleChange = useCallback(
    (_event: SyntheticEvent<Element>, newValue: string | null, _reason: AutocompleteChangeReason) => {
      onChange(newValue ?? '')
    },
    [onChange],
  )

  const handleInputChange = useCallback(
    (_event: SyntheticEvent<Element>, newValue: string, _reason: string) => {
      onChange(newValue)
    },
    [onChange],
  )

  const handleSearch = useCallback(
    (searchValue?: string) => {
      const valueToSearch = searchValue ?? value
      const trimmedValue = valueToSearch.trim()

      if (trimmedValue) {
        addHistory(valueToSearch)
      }

      onSearch(trimmedValue)
    },
    [value, addHistory, onSearch],
  )

  // AsyncAutocomplete의 onChange에서 호출되는 핸들러
  const handleChangeWithHistory = useCallback(
    (event: SyntheticEvent<Element>, newValue: string | null, reason: AutocompleteChangeReason) => {
      handleChange(event, newValue, reason)
      if (reason === 'selectOption' && newValue?.trim()) {
        addHistory(newValue)
      }
    },
    [handleChange, addHistory],
  )

  const handleClear = useCallback(() => {
    onChange('')
    onClear()
  }, [onChange, onClear])

  return (
    <AsyncAutocomplete
      value={value}
      onChange={handleChangeWithHistory}
      onInputChange={handleInputChange}
      asyncFunction={asyncFunction}
      onSearch={handleSearch}
      onClear={handleClear}
      showSearchIcon={true}
      showOptionsOnFocus={true}
      width={width ?? 360}
      height={height ?? 40}
      disableCache={true}
      textFieldProps={{
        placeholder: placeholder ?? t('입력하세요.'),
      }}
    />
  )
}

export default MISearchInput
