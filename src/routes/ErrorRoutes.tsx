import { RouteObject } from 'react-router-dom'

import ErrorAccessDeniedPage from '@/pages/error/AccessDenied'
import AuthErrorPage from '@/pages/error/auth'
import CommonErrorPage from '@/pages/error/CommonErrorPage'
import ErrorIpVerificationPage from '@/pages/error/IpVerificaiton'
import SessionExpiredPage from '@/pages/error/SessionExpired'
import ErrorUnknownPage from '@/pages/error/unknown'

const ErrorRoutes: RouteObject = {
  path: '/error',
  children: [
    {
      path: '',
      element: <CommonErrorPage />,
    },
    {
      path: 'auth',
      element: <AuthErrorPage />,
    },
    {
      path: 'unknown',
      element: <ErrorUnknownPage />,
    },
    {
      path: 'access-denied',
      element: <ErrorAccessDeniedPage />,
    },
    {
      path: 'ip-verification',
      element: <ErrorIpVerificationPage />,
    },
    {
      path: 'session-expired',
      element: <SessionExpiredPage />,
    },
  ],
}

export default ErrorRoutes
