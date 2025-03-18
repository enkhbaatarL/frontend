import { Navigate, RouteObject } from 'react-router-dom'

import AdminLayout from '@/layouts/AdminLayout'
import AdminAnalyticsDashboardPage from '@/pages/admin/analytics/AdminAnalyticsDashboardPage'
import AdminAnalyticsTablePage from '@/pages/admin/analytics/AdminAnalyticsTablePage'
import AdminBoardsFaqPage from '@/pages/admin/boards/AdminBoardsFaqPage'
import AdminBoardsNoticesPage from '@/pages/admin/boards/AdminBoardsNoticesPage'
import AdminCustomerCompanyManagementCompaniesPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesPage'
import AdminCustomerCompanyManagementCompaniesRegistrationPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesRegistrationPage'
import AdminDataProvidersDataPage from '@/pages/admin/dataProviders/AdminDataProvidersDataPage'
import AdminDataProvidersListPage from '@/pages/admin/dataProviders/AdminDataProvidersListPage'
import AdminMemberManagementManagersPage from '@/pages/admin/memberManagement/AdminMemberManagementManagersPage'
import AdminMemberManagementUsersPage from '@/pages/admin/memberManagement/AdminMemberManagementUsersPage'
import AdminNotificationListPage from '@/pages/admin/notification/AdminNotificationListPage'

const AdminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="customer-company" replace />,
    },
    {
      path: 'customer-company',
      children: [
        {
          index: true,
          element: <Navigate to="companies" replace />,
        },
        {
          path: 'companies',
          children: [
            {
              index: true,
              element: <AdminCustomerCompanyManagementCompaniesPage />,
            },
            {
              path: 'registration',
              element: <AdminCustomerCompanyManagementCompaniesRegistrationPage />,
            },
          ],
        },
      ],
    },
    {
      path: 'member-mgmt',
      children: [
        {
          index: true,
          element: <Navigate to="users" replace />,
        },
        {
          path: 'users',
          element: <AdminMemberManagementUsersPage />,
        },
        {
          path: 'managers',
          element: <AdminMemberManagementManagersPage />,
        },
      ],
    },
    {
      path: 'data-providers',
      children: [
        {
          index: true,
          element: <Navigate to="list" replace />,
        },
        {
          path: 'list',
          element: <AdminDataProvidersListPage />,
        },
        {
          path: 'data',
          element: <AdminDataProvidersDataPage />,
        },
      ],
    },
    {
      path: 'notification',
      children: [
        {
          index: true,
          element: <Navigate to="list" replace />,
        },
        {
          path: 'list',
          element: <AdminNotificationListPage />,
        },
      ],
    },
    {
      path: 'boards',
      children: [
        {
          index: true,
          element: <Navigate to="notices" replace />,
        },
        {
          path: 'notices',
          element: <AdminBoardsNoticesPage />,
        },
        {
          path: 'faq',
          element: <AdminBoardsFaqPage />,
        },
      ],
    },
    {
      path: 'analytics',
      children: [
        {
          index: true,
          element: <Navigate to="dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <AdminAnalyticsDashboardPage />,
        },
        {
          path: 'table',
          element: <AdminAnalyticsTablePage />,
        },
      ],
    },
  ],
}

export default AdminRoutes
