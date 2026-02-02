import { useEffect } from 'react'
import { Navigate, RouteObject, useLocation } from 'react-router-dom'

import { useCompanyCondition } from '@/hooks/useCompanyCondition'
import MILayout from '@/layouts/MILayout'
import PolicyPage from '@/pages/common/PolicyPage'
import AIMarketSummaryPage from '@/pages/mi/aiMarketSummary/AIMarketSummaryPage'
import CustomPage from '@/pages/mi/custom/CustomPage'
import DashboardPage from '@/pages/mi/dashboard/DashboardPage'
import DataDetailPage from '@/pages/mi/dataDetail/DataDetailPage'
import EconomicCalendarDetailPage from '@/pages/mi/economicCalendar/EconomicCalendarDetailPage'
import EconomicCalendarPage from '@/pages/mi/economicCalendar/EconomicCalendarPage'
import ForecastPage from '@/pages/mi/forecast/ForecastPage'
import NewForecastPage from '@/pages/mi/forecast/NewForecastPage'
import QaPage from '@/pages/mi/helpCenter/QaPage'
import InsightsPage from '@/pages/mi/insights/InsightsPage'
import MarketDataPage from '@/pages/mi/marketData/MarketDataPage'
import MarketMapPage from '@/pages/mi/marketMap/MarketMapPage'
import MIActivityLogPage from '@/pages/mi/miActivityLog/MIActivityLogPage'
import NewsDetailPage from '@/pages/mi/news/NewsDetailPage'
import NewsPage from '@/pages/mi/news/NewsPage'
import NewsletterDetailPage from '@/pages/mi/newsletter/NewsletterDetailPage'
import NewsletterPage from '@/pages/mi/newsletter/NewsletterPage'
import NoticesDetailPage from '@/pages/mi/notice/NoticeDetailPage'
import NoticesPage from '@/pages/mi/notice/NoticesPage'
import NotificationPage from '@/pages/mi/notification/NotificationPage'
import ParallelCoordinatesPage from '@/pages/mi/parallelCoordinates/ParallelCoordinatesPage'
import SalesActivityLogPage from '@/pages/mi/salesActivityLog/SalesActivityLogPage'
import SalesAnalysisPage from '@/pages/mi/salesAnalysis/SalesAnalysisPage'
import SignalMapPage from '@/pages/mi/signalMap/SignalMapPage'
import TopicTrackerPage from '@/pages/mi/topicTracker/TopicTrackerPage'
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

  // USER 로그인 시 accessCompanyInfo가 아직 로드되지 않았는지 확인
  const isUserLoginWithoutAccessInfo = user?.userRoleCd === 'USER' && !accessCompanyInfo

  useEffect(() => {
    if (needsCompanySwitch && targetCompanyNo) {
      loadAccessCompanyInfo(targetCompanyNo)
    }
  }, [needsCompanySwitch, targetCompanyNo, loadAccessCompanyInfo])

  useEffect(() => {
    // USER 로그인 시 accessCompanyInfo가 없으면 로드
    if (isUserLoginWithoutAccessInfo && user?.companyNo) {
      loadAccessCompanyInfo(user.companyNo)
    }
  }, [isUserLoginWithoutAccessInfo, user?.companyNo, loadAccessCompanyInfo])

  // 권한 데이터 로딩 중이거나 회사 전환이 필요한 경우 대기
  // homeUrl이 undefined이거나 accessCompanyInfo가 로드되지 않은 경우 대기
  if (isDeniedDashboardPageLoading || needsCompanySwitch || !homeUrl || isUserLoginWithoutAccessInfo) {
    return <></>
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
      path: 'ai-market-summary',
      element: <AIMarketSummaryPage />,
    },
    {
      path: 'topic-tracker',
      element: <TopicTrackerPage />,
    },
    {
      path: 'economic-calendar',
      children: [
        {
          index: true,
          element: <EconomicCalendarPage />,
        },
        {
          path: ':economicCalendarCode',
          element: <EconomicCalendarDetailPage />,
        },
      ],
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
      path: 'new-forecast',
      element: <NewForecastPage />,
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
      path: 'market-news',
      children: [
        {
          index: true,
          element: <NewsPage />,
        },
        {
          path: ':newsSummaryId',
          element: <NewsDetailPage />,
        },
      ],
    },
    {
      path: 'sales-analysis',
      element: <SalesAnalysisPage />,
    },
    {
      path: 'market-map',
      element: <MarketMapPage />,
    },
    {
      path: 'mi-activity-log',
      element: <MIActivityLogPage />,
    },
    {
      path: 'sales-activity-log',
      element: <SalesActivityLogPage />,
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
