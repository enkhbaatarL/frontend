import { Navigate, RouteObject } from 'react-router-dom'

import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import MILayout from '@/layouts/MILayout'
import PolicyPage from '@/pages/common/PolicyPage'
import CustomPage from '@/pages/mi/custom/CustomPage'
import DashboardPage from '@/pages/mi/dashboard/DashboardPage'
import DataDetailPage from '@/pages/mi/dataDetail/DataDetailPage'
import EconomicEventPage from '@/pages/mi/economicEvent/EconomicEventPage'
import ForecastPage from '@/pages/mi/forecast/ForecastPage'
import QaPage from '@/pages/mi/helpCenter/QaPage'
import InsightsPage from '@/pages/mi/insights/InsightsPage'
import MarketDataPage from '@/pages/mi/marketData/MarketDataPage'
import NewsPage from '@/pages/mi/news/NewsPage'
import NewsletterPage from '@/pages/mi/newsletter/NewsletterPage'
import NoticesDetailPage from '@/pages/mi/notice/NoticeDetailPage'
import NoticesPage from '@/pages/mi/notice/NoticesPage'
import NotificationPage from '@/pages/mi/notification/NotificationPage'
import ParallelCoordinatesPage from '@/pages/mi/parallelCoordinates/ParallelCoordinatesPage'
import SignalMapPage from '@/pages/mi/signalMap/SignalMapPage'
import MIProvider from '@/providers/MIProvider'

const MIMainRedirect = () => {
  const { miHome } = useCompanyCondition()
  const homeUrl = miHome()
  if (!homeUrl) return <></>
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
      element: <DashboardPage />,
    },
    {
      path: 'newsletters',
      element: <NewsletterPage />,
    },
    {
      path: 'economic-event',
      element: <EconomicEventPage />,
    },
    {
      path: 'forecast',
      element: <ForecastPage />,
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
      path: 'custom',
      element: <CustomPage />,
    },
    {
      path: 'news-list',
      element: <NewsPage />,
    },
    {
      path: 'parallel-coordinates',
      element: <ParallelCoordinatesPage />,
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
