import { RouteObject } from 'react-router-dom'

import ErrorAccessDeniedPage from '@/pages/error/AccessDenied'
import CommonErrorPage from '@/pages/error/CommonErrorPage'
import ErrorIpVerificationPage from '@/pages/error/IpVerificaiton'
import ErrorUnknownPage from '@/pages/error/unknown'

const ErrorRoutes: RouteObject = {
  path: '/error',
  children: [
    {
      path: '',
      element: <CommonErrorPage />,
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
  ],
}

export default ErrorRoutes
