import { omit } from 'lodash-es'
import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom'

import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/common/LoginPage'
import AdminRoutes from '@/routes/AdminRoutes'
import ErrorRoutes from '@/routes/ErrorRoutes'
import MIRoutes from '@/routes/MIRoutes'
import TestRoutes from '@/routes/TestRoues'
import { ICustomRouteObject } from '@/types/common'

const commonRoutes: ICustomRouteObject[] = [
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    ...AdminRoutes,
    element: <ProtectedRoute>{AdminRoutes.element}</ProtectedRoute>,
  },
  {
    ...MIRoutes,
    element: <ProtectedRoute>{MIRoutes.element}</ProtectedRoute>,
  },
  { ...ErrorRoutes },
  { ...TestRoutes },
  {
    path: '/*',
    element: <Navigate to="/error/404" replace={true} />,
  },
]

const convertToRouteObject = (route: ICustomRouteObject): RouteObject => {
  const baseRoute = omit(route, ['icon', 'label', 'hidden']) as RouteObject

  if (route.children) {
    baseRoute.children = route.children.map((child) => convertToRouteObject(child))
  }

  return baseRoute
}

export const AppRoutes = () => {
  const routes: RouteObject[] = commonRoutes.map((route) => convertToRouteObject(route))

  const element = createBrowserRouter(routes, {
    basename: '/',
  })

  return <RouterProvider router={element} />
}
