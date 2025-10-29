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

const marketCategoryKey = 'nws_mrkt_ctgr_cd'
const regionCategoryKey = 'nws_rgn_spt_cd'
const industrySectorKey = 'nws_ind_sctr_cd'

/**
 * 코드 데이터를 지연 로딩으로 불러오는 훅
 * 실제로 사용되는 코드만 필요할 때 로드하고 캐싱 처리
 */
const useCodeData = (): UseCodeDataReturn => {
  const marketQuery = useQuery({
    queryKey: ['codeData', marketCategoryKey],
    queryFn: async () => await codeService.getCodeFromKey(marketCategoryKey),
    ...defaultOptions,
  })

  const regionQuery = useQuery({
    queryKey: ['codeData', regionCategoryKey],
    queryFn: async () => await codeService.getCodeFromKey(regionCategoryKey),
    ...defaultOptions,
  })

  const industryQuery = useQuery({
    queryKey: ['codeData', industrySectorKey],
    queryFn: async () => await codeService.getCodeFromKey(industrySectorKey),
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
