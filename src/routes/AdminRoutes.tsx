import { Apartment, ManageAccounts, AccountTree, NotificationsActive, Dashboard, BarChart } from '@mui/icons-material'
import { Navigate } from 'react-router-dom'

import AdminLayout from '@/layouts/AdminLayout'
import AdminAnalyticsDashboardPage from '@/pages/admin/analytics/AdminAnalyticsDashboardPage'
import AdminAnalyticsTablePage from '@/pages/admin/analytics/AdminAnalyticsTablePage'
import AdminBoardsFaqPage from '@/pages/admin/boards/AdminBoardsFaqPage'
import AdminBoardsNoticesPage from '@/pages/admin/boards/AdminBoardsNoticesPage'
import AdminCustomerCompanyManagementCompaniesPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesPage'
import AdminCustomerCompanyManagementCompaniesRegistrationPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesRegistrationPage'
import AdminDataProvidersDataPage from '@/pages/admin/dataProviders/AdminDataProvidersDataPage'
import AdminDataProvidersListPage from '@/pages/admin/dataProviders/AdminDataProvidersListPage'
import AdminMemberManagementManagersRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementManagerRegistrationPage'
import AdminMemberManagementManagersPage from '@/pages/admin/memberManagement/AdminMemberManagementManagersPage'
import AdminMemberManagementMangerDetailPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerDetailPage'
import AdminMemberManagementMangerEditPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerEditPage'
import AdminMemberManagementUserRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementUserRegistrationPage'
import AdminMemberManagementUsersPage from '@/pages/admin/memberManagement/AdminMemberManagementUsersPage'
import AdminNotificationListPage from '@/pages/admin/notification/AdminNotificationListPage'
import AdminProvider from '@/providers/AdminProvider'
import { ICustomRouteObject } from '@/types/common'

const AdminRoutes: ICustomRouteObject = {
  path: 'admin',
  element: (
    <AdminProvider>
      <AdminLayout />
    </AdminProvider>
  ),
  children: [
    {
      index: true,
      element: <Navigate to="customer-company" replace />,
    },
    {
      path: 'customer-company',
      icon: <Apartment />,
      label: '고객사 관리',
      children: [
        {
          index: true,
          element: <Navigate to="companies" replace />,
        },
        {
          path: 'companies',
          label: '고객사 목록',
          children: [
            {
              index: true,
              element: <AdminCustomerCompanyManagementCompaniesPage />,
            },
            {
              path: 'registration',
              label: '고객사 등록',
              element: <AdminCustomerCompanyManagementCompaniesRegistrationPage />,
              hidden: true,
            },
          ],
        },
      ],
    },
    {
      path: 'member-mgmt',
      icon: <ManageAccounts />,
      label: '사용자 관리',
      children: [
        {
          index: true,
          element: <Navigate to="users" replace />,
        },
        {
          path: 'users',
          label: '서비스 회원',
          children: [
            {
              index: true,
              element: <AdminMemberManagementUsersPage />,
            },
            {
              path: 'registration',
              label: '회원 등록',
              element: <AdminMemberManagementUserRegistrationPage />,
              hidden: true,
            },
          ],
        },
        {
          path: 'managers',
          label: '어드민 관리자',
          children: [
            {
              index: true,
              element: <AdminMemberManagementManagersPage />,
            },
            {
              path: 'registration',
              label: '관리자 등록',
              element: <AdminMemberManagementManagersRegistrationPage />,
              hidden: true,
            },
            {
              path: 'detail',
              label: '관리자 상세',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':userNo',
                  element: <AdminMemberManagementMangerDetailPage />,
                },
              ],
            },
            {
              path: 'edit',
              label: '관리자 수정',
              hidden: true,
              children: [
                {
                  path: ':userNo',
                  element: <AdminMemberManagementMangerEditPage />,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'data-providers',
      icon: <AccountTree />,
      label: '데이터 프로바이더 관리',
      children: [
        {
          index: true,
          element: <Navigate to="list" replace />,
        },
        {
          path: 'list',
          label: '데이터 프로바이더 목록',
          element: <AdminDataProvidersListPage />,
        },
        {
          path: 'data',
          label: '데이터 목록',
          element: <AdminDataProvidersDataPage />,
        },
      ],
    },
    {
      path: 'notification',
      icon: <NotificationsActive />,
      label: '알람 관리',
      children: [
        {
          index: true,
          element: <Navigate to="list" replace />,
        },
        {
          path: 'list',
          label: '알람 발송 목록',
          element: <AdminNotificationListPage />,
        },
      ],
    },
    {
      path: 'boards',
      icon: <Dashboard />,
      label: '게시판 관리',
      children: [
        {
          index: true,
          element: <Navigate to="notices" replace />,
        },
        {
          path: 'notices',
          label: '공지사항',
          element: <AdminBoardsNoticesPage />,
        },
        {
          path: 'faq',
          label: 'FAQ',
          element: <AdminBoardsFaqPage />,
        },
      ],
    },
    {
      path: 'analytics',
      icon: <BarChart />,
      label: '통계 분석',
      children: [
        {
          index: true,
          element: <Navigate to="dashboard" replace />,
        },
        {
          path: 'dashboard',
          label: '대시보드',
          element: <AdminAnalyticsDashboardPage />,
        },
        {
          path: 'table',
          label: '테이블',
          element: <AdminAnalyticsTablePage />,
        },
      ],
    },
  ],
}

export default AdminRoutes
