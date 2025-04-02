import { Navigate, RouteObject } from 'react-router-dom'

import MiLayout from '@/layouts/MiLayout'
import UserChartSamplePage from '@/pages/mi/UserChartSamplePage'

const MiRoutes: RouteObject = {
  path: '/mi',
  element: <MiLayout />,
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

export default MiRoutes
