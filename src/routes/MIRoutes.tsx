import { Navigate, RouteObject } from 'react-router-dom'

import MILayout from '@/layouts/MILayout'
import MIDashboardPage from '@/pages/mi/dashboard/MIDashboardPage'
import MIHelpCenterPage from '@/pages/mi/helpCenter/MIHelpCenterPage'
import MIInsightsPage from '@/pages/mi/insights/MIInsightsPage'
import MIMarketDataPage from '@/pages/mi/marketData/MIMarketDataPage'
import MINoticesPage from '@/pages/mi/notice/MINoticesPage'
import MISignalMapPage from '@/pages/mi/signalMap/MISignalMapPage'
import UserChartSamplePage from '@/pages/mi/UserChartSamplePage'
import MIProvider from '@/providers/MIProvider'

const MIRoutes: RouteObject = {
  path: '/mi',
  element: (
    <MIProvider>
      <MILayout />
    </MIProvider>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="chart-sample" replace />,
    },
    {
      path: 'chart-sample',
      element: <UserChartSamplePage />,
    },
    {
      path: 'dashboard',
      element: <MIDashboardPage />,
    },
    {
      path: 'insights',
      element: <MIInsightsPage />,
    },
    {
      path: 'market-data',
      element: <MIMarketDataPage />,
    },
    {
      path: 'signal-map',
      element: <MISignalMapPage />,
    },
    {
      path: 'notices',
      element: <MINoticesPage />,
    },
    {
      path: 'help-center',
      element: <MIHelpCenterPage />,
    },
  ],
}

export default MIRoutes
