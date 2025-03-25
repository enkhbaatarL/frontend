import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { isEmpty, isEqual, omit } from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'

const checkPaginationKeys = <T,>(initialValue: Partial<T>) => {
  const undefinedPaginationKeys: string[] = []

  if (!('page' in initialValue)) undefinedPaginationKeys.push('page')
  if (!('size' in initialValue)) undefinedPaginationKeys.push('size')

  if (undefinedPaginationKeys.length > 0) {
    console.warn(t('{{keyNames}} 키가 존재하지 않습니다.', { keyNames: undefinedPaginationKeys.join(', ') }))
  }
}

const removeEmptyValues = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === '' ? undefined : value])) as T

type DiffCheckObject<T> = Partial<T> & { page?: number; size?: number }

const diffCheck = <T,>(a: T, b: T) => {
  const restA = omit(a as DiffCheckObject<T>, ['page', 'size'])
  const restB = omit(b as DiffCheckObject<T>, ['page', 'size'])

  return isEqual(removeEmptyValues(restA), removeEmptyValues(restB))
}

const useSearchFilter = <Req, Res>(
  fetchFn: (params: Partial<Req>) => Promise<Res>,
  initialValue: Partial<Req> = {},
  options?: {
    usePagination?: true
  },
) => {
  if (options?.usePagination) {
    checkPaginationKeys(initialValue)
  }

  const [filter, setFilter] = useState<Partial<Req>>(initialValue)
  const [requestParams, setRequestParams] = useState<Partial<Req>>({})

  const [isLoading, setIsLoading] = useState(false)

  const handleChangeItem = useCallback(<K extends keyof Req>(key: K, value?: Req[K]) => {
    setFilter((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleMultipleChange = useCallback((changes: Array<[key: keyof Req, value?: Req[keyof Req]]>) => {
    setFilter((prev) => changes.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), prev))
  }, [])

  const updateFilter = useCallback(
    (...params: [Array<[key: keyof Req, value?: Req[keyof Req]]>] | [key: keyof Req, value?: Req[keyof Req]]) => {
      switch (params.length) {
      case 1:
        return handleMultipleChange(params[0] as Array<[key: keyof Req, value?: Req[keyof Req]]>)
      case 2:
        return handleChangeItem(params[0], params[1])
      default:
        throw new Error(t('잘못된 인자가 전달 되었습니다.'))
      }
    },
    [handleChangeItem, handleMultipleChange],
  )

  const resetFilter = useCallback(() => {
    setFilter(initialValue)
  }, [initialValue])

  const search = useCallback(() => {
    setRequestParams(removeEmptyValues(filter))
  }, [filter])

  const { data } = useQuery({
    queryKey: [fetchFn.name ?? 'searchFilter', JSON.stringify(requestParams)],
    queryFn: async () => {
      setIsLoading(true)
      const response = await fetchFn(requestParams)

      setIsLoading(false)

      return response
    },
    enabled: !isEmpty(requestParams),
  })

  const isInitialState = useMemo(() => diffCheck(filter, initialValue), [filter, initialValue])

  const isSearchedState = useMemo(() => diffCheck(filter, requestParams), [filter, requestParams])

  return { isInitialState, isSearchedState, filter, updateFilter, resetFilter, search, data, isLoading }
}

export default useSearchFilter
