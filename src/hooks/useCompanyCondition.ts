import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { miPages } from '@/lib/constants'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'
import { MiPagesType } from '@/types/common'

const extractPages: MiPagesType[] = ['signal-map', 'dashboard']

export const useCompanyCondition = () => {
  const { accessCompanyInfo, user } = useAuthStore()

  const comNo = useMemo(
    () => accessCompanyInfo?.customerCompanyNo ?? user?.companyNo,
    [accessCompanyInfo?.customerCompanyNo, user?.companyNo],
  )
  const { data: deniedDashboardPage } = useQuery({
    queryKey: ['getDashboardAccess', comNo],
    queryFn: async () => await dashboardDataService.getDashboardDataExists(comNo!),
    select: (res) => (res === true ? [] : extractPages),
    enabled: !!comNo,
    refetchOnWindowFocus: false,
  })

  const extractPage: MiPagesType[] | undefined = useMemo(() => {
    if (deniedDashboardPage === undefined) return undefined
    return deniedDashboardPage
  }, [deniedDashboardPage])

  /**
   * 홈 주소
   */
  const miHome = () => {
    if (!extractPage) return undefined
    return miPages.find((page) => !extractPage.includes(page))
  }

  return { extractPage, miHome }
}
