import { ReactNode, useEffect, useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import { setNavigate } from '@/lib/axios'
import CustomErrorBoundary from '@/pages/error/CustomErrorBoundary'
import useAuthStore from '@/store/useAuthStore'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()
  const { miHome, extractPage = [], isDeniedDashboardPageLoading } = useCompanyCondition()
  const pathName = useMemo(() => location.pathname.replace('/mi/', ''), [location.pathname])

  useEffect(() => {
    // 권한 데이터 로딩 후 페이지 차단 체크
    if (isDeniedDashboardPageLoading || extractPage === undefined) return

    const blockedPage = extractPage.some((prefix) => pathName.startsWith(prefix))
    if (blockedPage) {
      const homeUrl = miHome()

      if (homeUrl) {
        navigate(`/mi/${homeUrl}`)
      }
    }
  }, [extractPage, miHome, navigate, pathName, isDeniedDashboardPageLoading])

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  if (!user) {
    // data-detail 접근 확인 (메일 접근)
    const dataDetailPattern = /^\/mi\/data-detail\/\d+\/\d+$/
    if (dataDetailPattern.test(location.pathname)) {
      localStorage.setItem('redirectAfterLogin', location.pathname)
    }

    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <CustomErrorBoundary>{children}</CustomErrorBoundary>
}

export default ProtectedRoute
