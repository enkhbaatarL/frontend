import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { miPages } from '@/lib/constants'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'
import { MiPagesType } from '@/types/common'

export type DataRow = {
  id: string
  model: string
  [key: string]: string | number | null
}

/** 대시보드 외에 제외할 페이지 리스트
 *  대시보드 : deniedDashboardPage쿼리를 호출하여 확인
 */
const companyBlockedPage: Record<number, MiPagesType[]> = {
  2014: ['signal-map'], // 가스
}

export const useCompanyCondition = () => {
  const { accessCompanyInfo, user } = useAuthStore()

  const comNo = useMemo(
    () => accessCompanyInfo?.customerCompanyNo ?? user?.companyNo,
    [accessCompanyInfo?.customerCompanyNo, user?.companyNo],
  )
  const { data: deniedDashboardPage } = useQuery({
    queryKey: ['getDashboardAccess', comNo],
    queryFn: async () => await dashboardDataService.getDashboardAccess(comNo!),
    select: (res) => (res === true ? null : 'dashboard'),
    enabled: !!comNo,
    refetchOnWindowFocus: false,
  })

  const extractPage: MiPagesType[] | undefined = useMemo(() => {
    if (deniedDashboardPage === undefined) return undefined
    const baseList = companyBlockedPage[comNo!] ?? []
    return !deniedDashboardPage ? baseList : [...baseList, 'dashboard']
  }, [comNo, deniedDashboardPage])

  /**
   * 홈 주소
   */
  const miHome = () => {
    if (!extractPage) return undefined
    return miPages.find((page) => !extractPage.includes(page))
  }

  return { extractPage, miHome }
}
