import { useEffect } from 'react'
import { Navigate, RouteObject, useLocation } from 'react-router-dom'

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
import NewsletterDetailPage from '@/pages/mi/newsletter/NewsletterDetailPage'
import NewsletterPage from '@/pages/mi/newsletter/NewsletterPage'
import NoticesDetailPage from '@/pages/mi/notice/NoticeDetailPage'
import NoticesPage from '@/pages/mi/notice/NoticesPage'
import NotificationPage from '@/pages/mi/notification/NotificationPage'
import ParallelCoordinatesPage from '@/pages/mi/parallelCoordinates/ParallelCoordinatesPage'
import SignalMapPage from '@/pages/mi/signalMap/SignalMapPage'
import MIProvider from '@/providers/MIProvider'
import useAuthStore from '@/store/useAuthStore'

const MIMainRedirect = () => {
  const { miHome, isDeniedDashboardPageLoading } = useCompanyCondition()

  const location = useLocation()
  const targetCompanyNo = (location.state as { targetCompanyNo?: number } | null)?.targetCompanyNo
  const { accessCompanyInfo, user, loadAccessCompanyInfo } = useAuthStore()
  const currentCompanyNo = accessCompanyInfo?.customerCompanyNo ?? user?.companyNo
  const needsCompanySwitch = !!targetCompanyNo && currentCompanyNo !== targetCompanyNo

  const homeUrl = miHome()

  useEffect(() => {
    if (needsCompanySwitch && targetCompanyNo) {
      loadAccessCompanyInfo(targetCompanyNo)
    }
  }, [needsCompanySwitch, targetCompanyNo, loadAccessCompanyInfo])

  // 권한 데이터 로딩 중이거나 회사 전환이 필요한 경우 대기
  if (isDeniedDashboardPageLoading || needsCompanySwitch) {
    return <></>
  }

  if (!homeUrl) {
    const fallbackUrl = accessCompanyInfo?.isFuture ? 'dashboard' : 'forecast'
    return <Navigate to={`/mi/${fallbackUrl}`} replace />
  }

  // 리다이렉트 시 state를 초기화하여 targetCompanyNo 잔존 방지
  return <Navigate to={homeUrl} replace />
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
      children: [
        {
          index: true,
          element: <NewsletterPage />,
        },
        {
          path: ':newsletterId/:issueNo',
          element: <NewsletterDetailPage />,
        },
      ],
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
