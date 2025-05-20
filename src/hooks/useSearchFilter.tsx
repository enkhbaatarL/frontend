import { useQuery, useQueryClient } from '@tanstack/react-query'
import { t } from 'i18next'
import { isEmpty, isEqual, omit } from 'lodash-es'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigationType, useNavigate } from 'react-router-dom'

const removeEmptyValues = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, value === '' ? undefined : value])) as T

type DiffCheckObject<T> = Partial<T> & { page?: number; size?: number }

const diffCheck = <T,>(a: T, b: T) => {
  const restA = omit(a as DiffCheckObject<T>, ['page', 'size'])
  const restB = omit(b as DiffCheckObject<T>, ['page', 'size'])

  return isEqual(removeEmptyValues(restA), removeEmptyValues(restB))
}

const defaultOptions = {
  initialFetch: true,
}

const useSearchFilter = <Req, Res>(
  fetchFn: (params: Partial<Req>) => Promise<Res>,
  initialValue: Partial<Req> = {},
  initialPagination?: {
    page?: number
    size?: number
  },
  options?: {
    initialFetch?: boolean
  },
) => {
  const queryClient = useQueryClient()
  const mergedOptions = { ...defaultOptions, ...(options ?? {}) }
  const navigationType = useNavigationType()
  const location = useLocation()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<Partial<Req>>(initialValue)
  const [pagination, setPagination] = useState(
    initialPagination
      ? {
        page: initialPagination?.page ?? 1,
        size: initialPagination?.size ?? 20,
      }
      : null,
  )
  const [requestParams, setRequestParams] = useState<Partial<Req>>({})

  const [isPureState, setIsPureState] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [searchFlg, setSearchFlg] = useState(false)

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

  const updateFilterWithSearch = useCallback(
    (...params: [Array<[key: keyof Req, value?: Req[keyof Req]]>] | [key: keyof Req, value?: Req[keyof Req]]) => {
      updateFilter(...params)
      setSearchFlg(true)
    },
    [updateFilter],
  )

  const updatePagination = useCallback(
    (page?: number, size?: number) => {
      setPagination({ page: page ?? 1, size: size ?? 20 })
      if (!isPureState) {
        const searchParams = new URLSearchParams(location.search)

        searchParams.set('page', String(page))
        searchParams.set('size', String(size))

        navigate(`${location.pathname}?${searchParams.toString()}`)
      }
    },
    [isPureState, location.pathname, navigate, location.search],
  )

  const updateSize = useCallback(
    (size: number) => {
      updatePagination(1, size)
    },
    [updatePagination],
  )

  const updatePage = useCallback(
    (page: number) => {
      updatePagination(page, pagination?.size)
    },
    [pagination?.size, updatePagination],
  )

  const resetFilter = useCallback(() => {
    setFilter(initialValue)
    setSearchFlg(true)
  }, [initialValue])

  useEffect(() => {
    if (!isPureState || navigationType === 'POP') {
      setIsPureState(false)

      const searchParams = new URLSearchParams(location.search)

      const params: Partial<Req> = {}

      searchParams.forEach((value, key) => {
        try {
          params[key as keyof Req] = value.startsWith('{') ? JSON.parse(value) : value
        } catch {
          params[key as keyof Req] = value as Req[keyof Req]
        }
      })

      setRequestParams(params)

      const { size, page, ...rest } = params as Partial<Req> & { size?: number; page?: number }
      setFilter((prev) => ({ ...prev, ...rest }))
      setPagination((prev) => ({ size: size ?? prev?.size ?? 20, page: page ?? prev?.page ?? 1 }))
    }
  }, [location.search, isPureState, navigationType])

  const search = useCallback(() => {
    const searchParams = new URLSearchParams()

    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value as unknown))
      }
    })

    if (pagination) {
      searchParams.set('page', '1')
      searchParams.set('size', String(pagination.size))
    }

    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: isPureState })
    setIsPureState(false)
  }, [filter, pagination, navigate, location.pathname, isPureState])

  const { data, refetch } = useQuery({
    queryKey: [fetchFn.name ?? 'searchFilter', JSON.stringify(requestParams)],
    queryFn: async () => {
      setIsLoading(true)
      const response = await fetchFn(requestParams)

      setIsLoading(false)

      return response
    },
    enabled: !isEmpty(requestParams),
    refetchOnWindowFocus: false,
  })

  const isInitialState = useMemo(() => diffCheck(filter, initialValue), [filter, initialValue])

  const isSearchedState = useMemo(() => diffCheck(filter, requestParams), [filter, requestParams])

  useEffect(() => {
    if (mergedOptions.initialFetch) {
      setIsPureState(false)

      const searchParams = new URLSearchParams(location.search)
      const isInitPage = searchParams.size === 0

      if (isInitPage) {
        if (pagination) {
          searchParams.set('page', String(pagination.page))
          searchParams.set('size', String(pagination.size))
        }
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true })
      }
    }
  }, [location.pathname, location.search, navigate, mergedOptions.initialFetch, pagination])

  useEffect(
    () => () => {
      queryClient.removeQueries({
        predicate: (query) => {
          const queryKey = query.queryKey[0]
          return queryKey === (fetchFn.name ?? 'searchFilter')
        },
      })
    },
    [queryClient, fetchFn.name],
  )

  useEffect(() => {
    if (searchFlg) {
      search()
      setSearchFlg(false)
    }
  }, [searchFlg, filter, search])

  return {
    isInitialState,
    isSearchedState,
    isPureState,
    filter,
    updateFilter,
    updateFilterWithSearch,
    pagination,
    updateSize,
    updatePage,
    resetFilter,
    search,
    data,
    refetch,
    isLoading,
  }
}

export default useSearchFilter
