import { Navigate, RouteObject } from 'react-router-dom'

import MILayout from '@/layouts/MILayout'
import DataVisualizationPage from '@/pages/mi/dashboard/DataVisualizationPage'
import QaPage from '@/pages/mi/helpCenter/QaPage'
import InsightsPage from '@/pages/mi/insights/InsightsPage'
import MarketDataPage from '@/pages/mi/marketData/MarketDataPage'
import NoticesDetailPage from '@/pages/mi/notice/NoticeDetailPage.tsx'
import NoticesPage from '@/pages/mi/notice/NoticesPage'
import SignalMap from '@/pages/mi/signalMap/SignalMap.tsx'
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
      element: <DataVisualizationPage />,
    },
    {
      path: 'insights',
      element: <InsightsPage />,
    },
    {
      path: 'market-data',
      element: <MarketDataPage />,
    },
    {
      path: 'signal-map',
      element: <SignalMap />,
    },
    {
      path: 'notices',
      children: [
        {
          index: true,
          element: <NoticesPage />,
        },
        {
          path: ':noticeNo',
          element: <NoticesDetailPage />,
        },
      ],
    },
    {
      path: 'help-center',
      element: <QaPage />,
    },
  ],
}

export default MIRoutes
