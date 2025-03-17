import { Navigate, RouteObject } from 'react-router-dom'

import UserLayout from '@/layouts/UserLayout'
import UserChartSamplePage from '@/pages/user/UserChartSamplePage'

const AdminRoutes: RouteObject = {
  path: '/user',
  element: <UserLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="chart-sample" replace />,
    },
    {
      path: 'chart-sample',
      element: <UserChartSamplePage />,
    },
  ],
}

export default AdminRoutes
