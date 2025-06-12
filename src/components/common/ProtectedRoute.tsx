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
  const { miHome, extractPage = [] } = useCompanyCondition()
  const pathName = useMemo(() => location.pathname.replace('/mi/', ''), [location.pathname])

  useEffect(() => {
    const blockedPage = extractPage.some((prefix) => pathName.startsWith(prefix))
    if (blockedPage) navigate(`/mi/${miHome()}`)
  }, [extractPage, miHome, navigate, pathName])

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <CustomErrorBoundary>{children}</CustomErrorBoundary>
}

export default ProtectedRoute
