import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

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
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <CustomErrorBoundary>{children}</CustomErrorBoundary>
}

export default ProtectedRoute
