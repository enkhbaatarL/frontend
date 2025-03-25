import { omit } from 'lodash-es'
import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom'

import ComponentTestPage from '@/pages/ComponentTestPage.tsx'
import TempLoginPassPage from '@/pages/TempLoginPassPage'
import TestPage from '@/pages/TestPage'
import AdminRoutes from '@/routes/AdminRoutes'
import ErrorRoutes from '@/routes/ErrorRoutes'
import UserRoutes from '@/routes/UserRoutes'
import { ICustomRouteObject } from '@/types/common'

const commonRoutes: ICustomRouteObject[] = [
  {
    path: '/',
    element: <TempLoginPassPage />,
    // children: [{ index: true, loader: pathLoader }, ...routes]
    // errorElement: <ErrorPage />
  },
  { ...AdminRoutes },
  { ...UserRoutes },
  { ...ErrorRoutes },
  {
    // TODO: 테스트 페이지 제거 필요
    path: 'test',
    element: <TestPage />,
  },
  {
    path: 'component-test',
    element: <ComponentTestPage />,
  },
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
