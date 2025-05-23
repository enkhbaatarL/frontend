import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isEqual, omit } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import useBlocker from './useBlocker'

import { removeObjectEmptyValues } from '@/utils/dataUtil'

type DiffCheckObject<T> = Partial<T> & { page?: number; size?: number }

type PageFilter = { page?: number; size?: number }

const removeEmptyValues = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, v]),
  ) as Partial<T>

const diffCheck = <T,>(a: T, b: T) =>
  isEqual(
    removeEmptyValues(omit(a as DiffCheckObject<T>, ['page', 'size'])),
    removeEmptyValues(omit(b as DiffCheckObject<T>, ['page', 'size'])),
  )

const defaultOptions = { initialFetch: true }

const useSearchFilter = <Req, Res>(
  fetchFn: (params: Partial<Req> & PageFilter) => Promise<Res>,
  initialFilter: Partial<Req> = {},
  initialPagination = { page: 1, size: 20 },
  options = defaultOptions,
) => {
  const queryClient = useQueryClient()

  const { state } = useLocation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Partial<Req>>(initialFilter)
  const [pagination, setPagination] = useState(initialPagination)
  const [fetchParams, setFetchParams] = useState<Partial<Req> | null>(null)
  const isPureState = isEqual(initialFilter, filter)

  const isInitialState = useMemo(() => diffCheck(filter, initialFilter), [filter, initialFilter])
  const isSearchedState = useMemo(() => {
    if (fetchParams === null) return false
    return diffCheck(filter, fetchParams)
  }, [filter, fetchParams])

  const fetchKey = useMemo(() => fetchFn.name || 'searchFilter', [fetchFn])

  const blockerAction = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        navigate('.', { state: { params: fetchParams }, replace: true })
        resolve(false)
      }),
    [navigate, fetchParams],
  )

  useBlocker({ onSave: blockerAction })

  const updateFilter = useCallback((key: string, value?: Req[keyof Req]) => {
    setFilter((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updateMultiFilter = useCallback((entries: [string, Req[keyof Req]][]) => {
    setFilter((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
  }, [])

  const resetFilter = useCallback(() => {
    setFilter(initialFilter)
    setPagination({ page: 1, size: initialPagination.size ?? 20 })
  }, [initialFilter, initialPagination.size])

  const updateFilterWithSearch = useCallback(
    (key: string, value?: Req[keyof Req]) => {
      updateFilter(key, value)
      setFetchParams({ ...(fetchParams ?? {}), [key]: value })
      setPagination((prev) => ({ ...prev, page: 1 }))
    },
    [fetchParams, updateFilter],
  )

  const search = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setFetchParams(removeObjectEmptyValues(filter))
  }, [filter])

  const { data, refetch, isLoading } = useQuery({
    queryKey: [fetchKey, JSON.stringify(fetchParams), pagination.page, pagination.size],
    queryFn: () =>
      fetchFn({
        ...(fetchParams as Partial<Req>),
        ...(pagination as Partial<PageFilter>),
      }),
    enabled: !!fetchParams,
    refetchOnWindowFocus: false,
  })

  const runInitialize = useCallback((initialVal: Partial<Req>) => {
    setFilter(initialVal)
    setFetchParams(initialVal)
  }, [])

  const savedParams = useMemo(() => state?.params, [state])

  useEffect(() => {
    if (fetchParams !== null) return
    if (savedParams) runInitialize(savedParams)
    else if (options.initialFetch) setFilter(initialFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialFetch, savedParams])

  useEffect(
    () => () => {
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === fetchKey,
      })
    },
    [queryClient, fetchKey],
  )
  return {
    filter,
    pagination,
    isInitialState,
    isSearchedState,
    isLoading,
    data,
    isPureState,
    updateFilter,
    updateFilterWithSearch,
    updateMultiFilter,
    updatePage: (page?: number) => setPagination((prev) => ({ ...prev, page: page ?? 1 })),
    updateSize: (size: number) => setPagination({ page: 1, size }),
    resetFilter,
    search,
    refetch,
  }
}

export default useSearchFilter
