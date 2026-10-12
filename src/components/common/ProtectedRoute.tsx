import { Box, CircularProgress } from '@mui/material'
import { ReactNode, useEffect, useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { setNavigate } from '@/lib/axios'
import CustomErrorBoundary from '@/pages/error/CustomErrorBoundary'
import { UserRole } from '@/service/admin/members'
import useAuthStore, { usesOwnCompanyInMi } from '@/store/useAuthStore'
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
  const isIndividualInfoAgreed = user?.isIndividualInfoAgreement === true
  // USER 로그인 직후 accessCompanyInfo 로딩 전에는 MI 진입·후속 처리 판단 불가 → 리다이렉트 보류
  // [운영자 서비스 접속] USER → USER·타사접속 운영자 (자기 회사)
  const isCompanyInfoLoading = isIndividualInfoAgreed && usesOwnCompanyInMi(user) && !accessCompanyInfo
  const needsCompanyInfoForMi = location.pathname === '/mi' || location.pathname.startsWith('/mi/')

  // 공유 링크 등에서 전달된 rdcn(redirect company number) 파라미터로 관리자 자동 회사 전환
  const rdcnParam = useMemo(() => {
    const val = new URLSearchParams(location.search).get('rdcn')
    if (!val) return null
    const num = Number(val)
    return !Number.isNaN(num) && num > 0 ? num : null
  }, [location.search])

  const isAdminRdcnSwitch =
    isIndividualInfoAgreed &&
    needsCompanyInfoForMi &&
    user?.userRoleCd === UserRole.ADMIN &&
    rdcnParam !== null &&
    accessCompanyInfo?.customerCompanyNo !== rdcnParam

  useEffect(() => {
    if (!isIndividualInfoAgreed) return
    if (!needsCompanyInfoForMi) return
    // [운영자 서비스 접속] USER → USER·타사접속 운영자 (자기 회사)
    if (!usesOwnCompanyInMi(user)) return
    if (accessCompanyInfo) return
    if (!user?.companyNo) return
    loadAccessCompanyInfo(user.companyNo)
  }, [isIndividualInfoAgreed, needsCompanyInfoForMi, user, accessCompanyInfo, loadAccessCompanyInfo])

  useEffect(() => {
    if (isAdminRdcnSwitch && rdcnParam) {
      loadAccessCompanyInfo(rdcnParam)
    }
  }, [isAdminRdcnSwitch, rdcnParam, loadAccessCompanyInfo])

  useEffect(() => {
    if (!isIndividualInfoAgreed) return
    if (!needsCompanyInfoForMi || user?.userRoleCd !== UserRole.ADMIN || rdcnParam === null) return
    if (accessCompanyInfo?.customerCompanyNo !== rdcnParam) return

    const params = new URLSearchParams(location.search)
    params.delete('rdcn')
    const newSearch = params.toString()
    navigate(location.pathname + (newSearch ? `?${newSearch}` : '') + location.hash, { replace: true })
  }, [
    isIndividualInfoAgreed,
    needsCompanyInfoForMi,
    user?.userRoleCd,
    rdcnParam,
    accessCompanyInfo?.customerCompanyNo,
    navigate,
    location.search,
    location.pathname,
    location.hash,
  ])

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

  if (!isIndividualInfoAgreed) {
    sessionStorage.setItem('redirectAfterAgreement', location.pathname + location.search + location.hash)

    return <Navigate to="/terms-agreement" replace />
  }

  if (needsCompanyInfoForMi && (isCompanyInfoLoading || isAdminRdcnSwitch)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return <CustomErrorBoundary>{children}</CustomErrorBoundary>
}

export default ProtectedRoute
