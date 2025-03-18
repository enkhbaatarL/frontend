import { Navigate, RouteObject } from 'react-router-dom'

import Error404Page from '@/pages/error/404'
import AuthErrorPage from '@/pages/error/auth'

const ErrorRoutes: RouteObject = {
  path: '/error',
  children: [
    {
      path: '',
      element: <Navigate to="/error/404" replace={true} />,
    },
    {
      path: '404',
      element: <Error404Page />,
    },
    {
      path: 'auth',
      element: <AuthErrorPage />,
    },
  ],
}

export default ErrorRoutes
