import { Box, CircularProgress } from '@mui/material'
import { ReactNode, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import type { IMenuNode } from '@/service/mi/companies'

import { getMiMenuItemScreenElementCdByPathSegment } from '@/constants/miScreenElementNav'
import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import { getFirstNavigableMiLocationFromMenus, isScreenElementInCompanyMenus } from '@/lib/miGnbMenuNav'
import useAuthStore from '@/store/useAuthStore'

/** 레지스트리에 없는 MI 경로 — `menus` 비어 있을 때 리다이렉트 루프 방지 */
const MI_NON_REGISTRY_FALLBACK_PATH = '/mi/notices'

const getMiFirstSegment = (pathname: string): string | null => {
  if (pathname === '/mi' || pathname === '/mi/') return null
  if (!pathname.startsWith('/mi/')) return null
  const segment = pathname.slice(4).split('/')[0] ?? ''
  return segment || null
}

const isMiLocationAllowedByMenus = (pathname: string, menus: IMenuNode[]): boolean => {
  const segment = getMiFirstSegment(pathname)
  if (!segment) return true
  const cd = getMiMenuItemScreenElementCdByPathSegment(segment)
  if (!cd) return true
  return isScreenElementInCompanyMenus(menus, cd)
}

interface MiMenuRegistryAccessGuardProps {
  children: ReactNode
}

const MiMenuRegistryAccessGuard = ({ children }: MiMenuRegistryAccessGuardProps) => {
  const { pathname } = useLocation()
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const { miHome } = useCompanyCondition()

  const redirectTo = useMemo((): string | null => {
    if (!accessCompanyInfo) return null

    const menus = accessCompanyInfo.menus ?? []
    const segment = getMiFirstSegment(pathname)
    if (!segment) return null

    const screenElementCd = getMiMenuItemScreenElementCdByPathSegment(segment)
    if (!screenElementCd) return null

    if (isScreenElementInCompanyMenus(menus, screenElementCd)) return null

    if (!menus.length) return MI_NON_REGISTRY_FALLBACK_PATH

    const home = miHome()
    if (home && isMiLocationAllowedByMenus(home, menus)) return home

    const firstNav = getFirstNavigableMiLocationFromMenus(menus)
    if (firstNav && isMiLocationAllowedByMenus(firstNav, menus)) return firstNav

    return MI_NON_REGISTRY_FALLBACK_PATH
  }, [accessCompanyInfo, miHome, pathname])

  if (!pathname.startsWith('/mi')) {
    return <>{children}</>
  }

  if (!accessCompanyInfo && pathname !== '/mi' && pathname !== '/mi/') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!accessCompanyInfo) {
    return <>{children}</>
  }

  if (redirectTo) {
    if (redirectTo === pathname) {
      return <Navigate to={MI_NON_REGISTRY_FALLBACK_PATH} replace />
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default MiMenuRegistryAccessGuard
