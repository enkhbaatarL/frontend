import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { getMiMenuItemDef, toMiLocationPath } from '@/constants/miScreenElementNav'
import { UserRole } from '@/service/admin/members'
import companiesService from '@/service/mi/companies'
import useAuthStore from '@/store/useAuthStore'

const DEFAULT_MI_LANDING_PATH = toMiLocationPath('forecast')

export const useCompanyCondition = () => {
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const user = useAuthStore((state) => state.user)

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

  /** MI 기본 진입 경로 (`defaultLandingCd` → 레지스트리 상대 `path`를 `/mi/...`로 변환, 없으면 forecast). */
  const miHome = useCallback((): string => {
    const cd = accessCompanyInfo?.defaultLandingCd
    let target = DEFAULT_MI_LANDING_PATH
    if (cd) {
      const rel = getMiMenuItemDef(cd)?.path
      if (rel) {
        target = toMiLocationPath(rel)
      } else {
        console.warn('[MI GNB] Unknown defaultLandingCd:', cd)
      }
    }
    return target
  }, [accessCompanyInfo?.defaultLandingCd])

  return { miHome, allCompanies, companyList }
}
