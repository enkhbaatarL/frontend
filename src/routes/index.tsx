import { omit } from 'lodash-es'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router-dom'

import ProtectedRoute from '@/components/common/ProtectedRoute'
import LoginPage from '@/pages/common/LoginPage'
import PdfViewerPage from '@/pages/common/PdfViewerPage'
import AdminRoutes from '@/routes/AdminRoutes'
import ErrorRoutes from '@/routes/ErrorRoutes'
import MIRoutes from '@/routes/MIRoutes'
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
  {
    path: 'pdf-viewer/:fileId',
    element: <PdfViewerPage />,
  },
  { ...ErrorRoutes },
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
