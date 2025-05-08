import { Navigate, RouteObject } from 'react-router-dom'

import MILayout from '@/layouts/MILayout.tsx'
import MIDashboardPage from '@/pages/mi/dashboard/MIDashboardPage.tsx'
import MIHelpCenterPage from '@/pages/mi/helpCenter/MIHelpCenterPage.tsx'
import MIInsightsPage from '@/pages/mi/insights/MIInsightsPage.tsx'
import MIMarketDataPage from '@/pages/mi/marketData/MIMarketDataPage.tsx'
import MINoticePage from '@/pages/mi/notice/MINoticePage.tsx'
import MISignalMapPage from '@/pages/mi/signalMap/MISignalMapPage.tsx'
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
      path: 'notice',
      element: <MINoticePage />,
    },
    {
      path: 'help-center',
      element: <MIHelpCenterPage />,
    },
  ],
}

export default MIRoutes
