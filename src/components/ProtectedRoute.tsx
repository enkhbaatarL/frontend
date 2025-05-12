import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import useAuthStore from '@/store/useAuthStore'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
