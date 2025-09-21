import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isEqual, omit } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
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

const diffCheck = <T>(a: T, b: T) =>
  isEqual(
    removeEmptyValues(omit(a as DiffCheckObject<T>, ['page', 'size'])),
    removeEmptyValues(omit(b as DiffCheckObject<T>, ['page', 'size'])),
  )

const defaultOptions = { initialFetch: true, useAbortController: false }

interface SearchFilterOptions {
  initialFetch?: boolean
  useAbortController?: boolean
}

interface OptimisticUpdateOptions<T> {
  optimisticData: T
  rollbackOnError?: boolean
}

const useSearchFilter = <Req, Res>(
  fetchFn: (params: Partial<Req> & PageFilter, signal?: AbortSignal) => Promise<Res>,
  initialFilter: Partial<Req> = {},
  initialPagination = { page: 1, size: 20 },
  options: SearchFilterOptions = defaultOptions,
) => {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  const { state } = useLocation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Partial<Req>>(initialFilter)
  const [pagination, setPagination] = useState((state?.pagination as PageFilter) ?? initialPagination)
  const [fetchParams, setFetchParams] = useState<Partial<Req> | null>(null)
  const [isPureState, setIsPureState] = useState(true)
  const [optimisticData, setOptimisticData] = useState<Res | null>(null)
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false)

  const isInitialState = useMemo(() => diffCheck(filter, initialFilter), [filter, initialFilter])
  const isSearchedState = useMemo(() => {
    if (fetchParams === null) return false
    return diffCheck(filter, fetchParams)
  }, [filter, fetchParams])

  const fetchKey = useMemo(() => fetchFn.name || 'searchFilter', [fetchFn])

  const blockerAction = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (!isEqual(initialFilter, fetchParams) || !isEqual(initialPagination, pagination)) {
          navigate('.', { state: { params: fetchParams, pagination }, replace: true })
        }
        resolve(false)
      }),
    [initialFilter, fetchParams, initialPagination, pagination, navigate],
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
      setIsPureState(false)
      setFetchParams({ ...(fetchParams ?? {}), [key]: value })
      setPagination((prev) => ({ ...prev, page: 1 }))
    },
    [fetchParams, updateFilter],
  )

  const search = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setIsPureState(false)
    setFetchParams(removeObjectEmptyValues(filter))
  }, [filter])

  const optimisticUpdate = useCallback(
    async (
      updateFn: (params: Partial<Req> & PageFilter, signal?: AbortSignal) => Promise<Res | null>,
      updateOptions: OptimisticUpdateOptions<Res>,
    ) => {
      const rollbackOptimisticUpdate = () => {
        setOptimisticData(null)
        setIsOptimisticUpdate(false)
      }

      const currentParams = {
        ...(fetchParams as Partial<Req>),
        ...(pagination as Partial<PageFilter>),
      }

      // 낙관적 업데이트 시작
      setIsOptimisticUpdate(true)
      setOptimisticData(updateOptions.optimisticData)

      try {
        // 업데이트 요청 실행
        const result = await updateFn(currentParams, abortControllerRef.current?.signal)

        // 반환값이 null이면 현재 상태 유지 (서버 통신 없이 화면만 갱신)
        if (result === null) {
          // 낙관적 데이터를 그대로 유지하고 쿼리 캐시는 업데이트하지 않음
          return result
        }

        setOptimisticData(null)
        setIsOptimisticUpdate(false)

        queryClient.setQueryData([fetchKey, JSON.stringify(fetchParams), pagination.page, pagination.size], result)

        return result
      } catch (error) {
        if (updateOptions.rollbackOnError !== false) {
          rollbackOptimisticUpdate()
        }
        throw error
      }
    },
    [fetchParams, pagination, fetchKey, queryClient],
  )

  const rollbackOptimisticUpdate = useCallback(() => {
    setOptimisticData(null)
    setIsOptimisticUpdate(false)
  }, [])

  // 기존 요청 abort
  const fetchWithAbort = useCallback(
    async (params: Partial<Req> & PageFilter) => {
      if (options.useAbortController) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()
        return await fetchFn(params, abortControllerRef.current.signal)
      } else {
        return await fetchFn(params)
      }
    },
    [fetchFn, options.useAbortController],
  )

  const { data, refetch, isLoading } = useQuery({
    queryKey: [fetchKey, JSON.stringify(fetchParams), pagination.page, pagination.size],
    queryFn: () =>
      fetchWithAbort({
        ...(fetchParams as Partial<Req>),
        ...(pagination as Partial<PageFilter>),
      }),
    enabled: !!fetchParams,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 낙관적 업데이트 데이터가 있으면 우선 반환, 없으면 실제 데이터 반환
  const displayData = optimisticData ?? data

  const runInitialize = useCallback(
    (initialVal: Partial<Req>) => {
      // React 18의 startTransition을 사용하여 배치 업데이트
      startTransition(() => {
        setFilter(initialVal)
        setFetchParams(initialVal)
        setPagination(initialPagination)
      })
    },
    [initialPagination],
  )

  const savedParams = useMemo(() => state?.params, [state])

  useEffect(() => {
    if (fetchParams !== null) return
    if (savedParams) {
      // 뒤로가기 시 기존 정보 세팅
      setIsPureState(false)
      runInitialize(savedParams)
    } else if (options.initialFetch) {
      runInitialize(initialFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialFetch, savedParams])

  useEffect(
    () => () => {
      if (options.useAbortController && abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === fetchKey,
      })
    },
    [queryClient, fetchKey, options.useAbortController],
  )

  return {
    filter,
    pagination,
    isInitialState,
    isSearchedState,
    isLoading,
    data: displayData,
    isPureState,
    isOptimisticUpdate,
    updateFilter,
    updateFilterWithSearch,
    updateMultiFilter,
    updatePage: (page?: number) => setPagination((prev) => ({ ...prev, page: page ?? 1 })),
    updateSize: (size: number) => setPagination({ page: 1, size }),
    resetFilter,
    search,
    refetch,
    optimisticUpdate,
    rollbackOptimisticUpdate,
  }
}

export default useSearchFilter
