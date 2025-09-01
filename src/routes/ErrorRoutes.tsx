import { RouteObject } from 'react-router-dom'

import AuthErrorPage from '@/pages/error/auth'
import CommonErrorPage from '@/pages/error/CommonErrorPage'
import ErrorAccessDeniedPage from '@/pages/error/ErrorAccessDeniedPage'
import ErrorUnknownPage from '@/pages/error/ErrorUnknownPage'
import ErrorIpVerificationPage from '@/pages/error/IpVerificaiton'
import SessionExpiredPage from '@/pages/error/SessionExpired'

const ErrorRoutes: RouteObject = {
  path: '/error',
  children: [
    {
      path: '',
      element: <CommonErrorPage />,
    },
    {
      path: '404',
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
