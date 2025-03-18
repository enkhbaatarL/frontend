import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom'

import ComponentTestPage from '@/pages/ComponentTestPage.tsx'
import TempLoginPassPage from '@/pages/TempLoginPassPage'
import TestPage from '@/pages/TestPage'
import AdminRoutes from '@/routes/AdminRoutes'
import ErrorRoutes from '@/routes/ErrorRoutes'
import UserRoutes from '@/routes/UserRoutes'

const commonRoutes: RouteObject[] = [
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

export const AppRoutes = () => {
  const element = createBrowserRouter(commonRoutes, {
    basename: '/',
  })

  return <RouterProvider router={element} />
}
