import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { miPages } from '@/lib/constants'
import { UserRole } from '@/service/admin/members'
import companiesService from '@/service/mi/companies'
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
  const { data: deniedDashboardPage, isLoading: isDeniedDashboardPageLoading } = useQuery({
    queryKey: ['getDashboardAccess', comNo],
    queryFn: async () => await forecastDataService.getForecastDataExists(comNo!),
    select: (res): MiPagesType[] => {
      const baseDenied: MiPagesType[] = res === true ? [] : [...(extractPages ?? [])]

      const deniedFuturePages = !accessCompanyInfo?.isFuture
        ? [
            'dashboard' as MiPagesType,
            'custom' as MiPagesType,
            'market-news' as MiPagesType,
            'newsletters' as MiPagesType,
            'economic-event' as MiPagesType,
            'parallel-coordinates' as MiPagesType,
        ]
        : []

      if (!accessCompanyInfo?.isQualitative) {
        deniedFuturePages.push('custom' as MiPagesType)
      }

      return [...baseDenied, ...deniedFuturePages]
    },
    enabled: !!comNo,
    refetchOnWindowFocus: false,
  })

  const { data: allCompanies } = useQuery({
    queryKey: ['getAllCompanies'],
    queryFn: async () => await companiesService.getAllCompanies(),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: user?.userRoleCd === UserRole.ADMIN && !!user?.isOtherServiceAccessPossible,
  })

  const companyList = useMemo(
    () =>
      allCompanies?.map(({ customerCompanyNo, customerCompanyNm, customerCompanyMipUrl }) => ({
        label: customerCompanyNm,
        value: customerCompanyNo,
        customerCompanyMipUrl,
      })) ?? [],
    [allCompanies],
  )

  const extractPage: MiPagesType[] | undefined = useMemo(() => {
    if (deniedDashboardPage === undefined) return undefined
    return deniedDashboardPage
  }, [deniedDashboardPage])

  /**
   * 홈 주소
   */
  const miHome = () => {
    if (!extractPage) return undefined

    // future 메뉴 사용인 고객사의 경우, 로그인 후 첫페이지를 신규대시보드로 지정함
    if (accessCompanyInfo?.isFuture) {
      return 'dashboard'
    }

    return miPages.find((page) => !extractPage.includes(page))
  }

  return { extractPage, miHome, allCompanies, companyList, isDeniedDashboardPageLoading }
}
