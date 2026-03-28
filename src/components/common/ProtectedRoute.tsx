import { Box, CircularProgress } from '@mui/material'
import { ReactNode, useEffect, useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import { setNavigate } from '@/lib/axios'
import CustomErrorBoundary from '@/pages/error/CustomErrorBoundary'
import { UserRole } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import useDialog from '@/store/useDialog'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const accessCompanyInfo = useAuthStore((state) => state.accessCompanyInfo)
  const loadAccessCompanyInfo = useAuthStore((state) => state.loadAccessCompanyInfo)
  const location = useLocation()
  const navigate = useNavigate()
  const { miHome, extractPage, isDeniedDashboardPageLoading } = useCompanyCondition()
  const pathName = useMemo(() => location.pathname.replace('/mi/', ''), [location.pathname])

  // USER 로그인 직후 accessCompanyInfo 로딩 중에는 메뉴 권한 판단 불가 → 리다이렉트 보류
  const isCompanyInfoLoading = user?.userRoleCd === UserRole.USER && !accessCompanyInfo
  const needsCompanyInfoForMi = location.pathname === '/mi' || location.pathname.startsWith('/mi/')

  useEffect(() => {
    if (!needsCompanyInfoForMi) return
    if (user?.userRoleCd !== UserRole.USER) return
    if (accessCompanyInfo) return
    if (!user?.companyNo) return
    loadAccessCompanyInfo(user.companyNo)
  }, [needsCompanyInfoForMi, user?.userRoleCd, user?.companyNo, accessCompanyInfo, loadAccessCompanyInfo])

  useEffect(() => {
    // 권한 데이터 로딩 후 페이지 차단 체크
    if (isCompanyInfoLoading || isDeniedDashboardPageLoading || extractPage === undefined) return

    const blockedPage = extractPage.some((prefix) => pathName.startsWith(prefix))
    if (blockedPage) {
      const homeUrl = miHome()
      const targetPath = homeUrl ? `/mi/${homeUrl}` : null

      // 이미 해당 경로에 있거나 무한 리다이렉트 방지
      // 커밋 단계 중 navigate 호출로 인한 React 오류 방지 (다음 틱으로 지연)
      if (targetPath && location.pathname !== targetPath) {
        queueMicrotask(() => navigate(targetPath, { replace: true }))
      }
    }
  }, [extractPage, pathName, isDeniedDashboardPageLoading, isCompanyInfoLoading, navigate])

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  // 라우터 변경 시 다이얼로그 닫기
  useEffect(() => {
    const { visible, onHide } = useDialog.getState()
    if (visible) {
      onHide()
    }
  }, [location.pathname])

  if (!user) {
    // 로그인 후 원래 접속하려던 페이지로 복귀하기 위해 경로 저장 (pathname + search + hash)
    const redirectPath = location.pathname + location.search + location.hash
    localStorage.setItem('redirectAfterLogin', redirectPath)

    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (needsCompanyInfoForMi && isCompanyInfoLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return <CustomErrorBoundary>{children}</CustomErrorBoundary>
}

export default ProtectedRoute
