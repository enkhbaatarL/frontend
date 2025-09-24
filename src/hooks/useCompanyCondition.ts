import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { miPages } from '@/lib/constants'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import { MiPagesType } from '@/types/common'

const extractPages: MiPagesType[] = ['signal-map', 'forecast']

export const useCompanyCondition = () => {
  const { accessCompanyInfo, user } = useAuthStore()

  const comNo = useMemo(
    () => accessCompanyInfo?.customerCompanyNo ?? user?.companyNo,
    [accessCompanyInfo?.customerCompanyNo, user?.companyNo],
  )
  const { data: deniedDashboardPage } = useQuery({
    queryKey: ['getDashboardAccess', comNo],
    queryFn: async () => await forecastDataService.getForecastDataExists(comNo!),
    select: (res): MiPagesType[] => {
      const baseDenied: MiPagesType[] = res === true ? [] : [...(extractPages ?? [])]

      const allowedCompanies = [
        2020, // 에너지
        // 2013, // E&S
      ]

      const isAllowed = allowedCompanies.includes(comNo ?? 0)

      return isAllowed
        ? baseDenied
        : [
          ...baseDenied,
            'dashboard' as MiPagesType,
            'custom' as MiPagesType,
            'news-list' as MiPagesType,
            'newsletters' as MiPagesType,
            'economic-event' as MiPagesType,
            'parallel-coordinates' as MiPagesType,
        ]
    },
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
    // SKE 의 경우 로그인 후 첫페이지를 신규대시보드로 지정함
    if (comNo === 2020) {
      return 'dashboard'
    }
    return miPages.find((page) => !extractPage.includes(page))
  }

  return { extractPage, miHome }
}
