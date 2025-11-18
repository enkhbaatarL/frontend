import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { ACTIVE_MENU_PATHS, MiPagesType } from '@/constants/menu'
import { UserRole } from '@/service/admin/members'
import companiesService from '@/service/mi/companies'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const DEFAULT_PAGES: MiPagesType[] = ['market-data', 'insights']
const EXTRA_PAGES: MiPagesType[] = ['signal-map', 'forecast']

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
      const baseDenied: MiPagesType[] = res === true ? [] : [...(EXTRA_PAGES ?? [])]

      const deniedFuturePages: MiPagesType[] = accessCompanyInfo?.isFuture
        ? []
        : [
          'dashboard',
          'custom',
          'market-news',
          'ai-market-summary',
          'topic-tracker',
          'economic-calendar',
          'newsletters',
          'parallel-coordinates',
        ]

      if (!accessCompanyInfo?.isQualitative) {
        deniedFuturePages.push('custom')
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

  const activeMenu = useMemo(() => {
    if (extractPage === undefined) return DEFAULT_PAGES
    return ACTIVE_MENU_PATHS.filter((item) => !extractPage.includes(item))
  }, [extractPage])

  /**
   * 홈 주소
   */
  const miHome = () => {
    if (!extractPage) return undefined

    // future 메뉴 사용인 고객사의 경우, 로그인 후 첫페이지를 신규대시보드로 지정함
    if (accessCompanyInfo?.isFuture) {
      return 'dashboard'
    }

    return activeMenu.find((page) => !extractPage.includes(page))
  }

  return { extractPage, activeMenu, miHome, allCompanies, companyList, isDeniedDashboardPageLoading }
}
