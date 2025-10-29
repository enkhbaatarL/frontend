import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import codeService, { ICode } from '@/service/common/code'

interface UseCodeDataReturn {
  marketCategoryCodeList: ICode[] | undefined
  regionCategoryCodeList: ICode[] | undefined
  industrySectorCodeList: ICode[] | undefined
  isLoading: boolean
  error: Error | null
}

const defaultOptions = {
  staleTime: 60 * 60 * 1000, // 1시간 캐시 유지
  gcTime: 60 * 60 * 1000, // 1시간 메모리에 보관
  retry: 3,
  enabled: false,
}

/**
 * 코드 데이터를 지연 로딩으로 불러오는 훅
 * 실제로 사용되는 코드만 필요할 때 로드하고 캐싱 처리
 */
const useCodeData = (): UseCodeDataReturn => {
  const marketQuery = useQuery({
    queryKey: ['codeData', 'marketCategory'],
    queryFn: async () => await codeService.getNewsMarketCategoryCode(),
    ...defaultOptions,
  })

  const regionQuery = useQuery({
    queryKey: ['codeData', 'regionCategory'],
    queryFn: async () => await codeService.getNewsRegionCategoryCode(),
    ...defaultOptions,
  })

  const industryQuery = useQuery({
    queryKey: ['codeData', 'industrySector'],
    queryFn: async () => await codeService.getNewsIndustrySectorCode(),
    ...defaultOptions,
  })

  // 접근할 때 해당 쿼리를 활성화하는 프록시 객체
  const proxy = useMemo(
    () => ({
      get marketCategoryCodeList() {
        if (!marketQuery.data && !marketQuery.isLoading) {
          marketQuery.refetch().then()
        }
        return marketQuery.data
      },
      get regionCategoryCodeList() {
        if (!regionQuery.data && !regionQuery.isLoading) {
          regionQuery.refetch().then()
        }
        return regionQuery.data
      },
      get industrySectorCodeList() {
        if (!industryQuery.data && !industryQuery.isLoading) {
          industryQuery.refetch().then()
        }
        return industryQuery.data
      },
      get isLoading() {
        return marketQuery.isLoading || regionQuery.isLoading || industryQuery.isLoading
      },
      get error() {
        return marketQuery.error || regionQuery.error || industryQuery.error
      },
    }),
    [marketQuery, regionQuery, industryQuery],
  )

  return proxy
}

export default useCodeData
