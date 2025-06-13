import { Navigate, RouteObject } from 'react-router-dom'

import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import MILayout from '@/layouts/MILayout'
import PolicyPage from '@/pages/common/PolicyPage'
import MIDashboardPage from '@/pages/mi/dashboard/MIDashboardPage'
import DataDetailPage from '@/pages/mi/dataDetail/DataDetailPage'
import QaPage from '@/pages/mi/helpCenter/QaPage'
import InsightsPage from '@/pages/mi/insights/InsightsPage'
import MarketDataPage from '@/pages/mi/marketData/MarketDataPage'
import NoticesDetailPage from '@/pages/mi/notice/NoticeDetailPage'
import NoticesPage from '@/pages/mi/notice/NoticesPage'
import NotificationPage from '@/pages/mi/notification/NotificationPage'
import SignalMapPage from '@/pages/mi/signalMap/SignalMapPage'
import MIProvider from '@/providers/MIProvider'

const MIMainRedirect = () => {
  const { miHome } = useCompanyCondition()
  const homeUrl = miHome()
  if (!homeUrl) return <></> // TODO: 스켈레톤 필요할거같음

  return <Navigate to={homeUrl} state={{ noticePopup: true }} replace />
}

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
      element: <MIMainRedirect />,
    },
    {
      path: 'dashboard',
      element: <MIDashboardPage />,
    },
    {
      path: 'signal-map',
      element: <SignalMapPage />,
    },
    {
      path: 'market-data',
      element: <MarketDataPage />,
    },

    {
      path: 'insights',
      element: <InsightsPage />,
    },
    {
      path: 'data-detail/:goodsNo/:goodsDataNo',
      element: <DataDetailPage />,
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
    {
      path: 'privacy-policy',
      element: <PolicyPage />,
    },
    {
      path: 'notifications',
      element: <NotificationPage />,
    },
  ],
}

export default MIRoutes
