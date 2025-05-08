import { ManageAccountsSharp, SupervisorAccount, Notifications, Settings } from '@mui/icons-material'
import { Navigate } from 'react-router-dom'

import DataExplorationIcon from '@/components/common/icons/DataExploration'
import VolumeDownAlt from '@/components/common/icons/VolumeDownAlt'
import AdminLayout from '@/layouts/AdminLayout'
import AdminBoardsFaqDetailPage from '@/pages/admin/boards/AdminBoardsFaqDetailPage'
import AdminBoardsFaqEditPage from '@/pages/admin/boards/AdminBoardsFaqEditPage'
import AdminBoardsFaqPage from '@/pages/admin/boards/AdminBoardsFaqPage'
import AdminBoardsFaqRegistrationPage from '@/pages/admin/boards/AdminBoardsFaqRegistrationPage'
import AdminBoardsNoticeDetailPage from '@/pages/admin/boards/AdminBoardsNoticeDetailPage'
import AdminBoardsNoticeEditPage from '@/pages/admin/boards/AdminBoardsNoticeEditPage'
import AdminBoardsNoticePage from '@/pages/admin/boards/AdminBoardsNoticePage'
import AdminBoardsNoticeRegistrationPage from '@/pages/admin/boards/AdminBoardsNoticeRegistrationPage'
import AdminCustomerCompanyDataProviderDetailPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyDataProviderDetailPage'
import AdminCustomerCompanyDetailPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyDetailPage'
import AdminCustomerCompanyManagementCompaniesPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesPage'
import AdminCustomerCompanyManagementCompaniesRegistrationPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementCompaniesRegistrationPage'
import AdminCustomerCompanyProductDetailPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyProductDetailPage'
import AdminDataProvidersDataPage from '@/pages/admin/dataProviders/AdminDataProvidersDataPage'
import AdminDataProvidersListPage from '@/pages/admin/dataProviders/AdminDataProvidersListPage'
import AdminMemberManagementManagersRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementManagerRegistrationPage'
import AdminMemberManagementManagersPage from '@/pages/admin/memberManagement/AdminMemberManagementManagersPage'
import AdminMemberManagementMangerDetailPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerDetailPage'
import AdminMemberManagementMangerEditPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerEditPage'
import AdminMemberManagementUserRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementUserRegistrationPage'
import AdminMemberManagementUsersPage from '@/pages/admin/memberManagement/AdminMemberManagementUsersPage'
import AdminNotificationListPage from '@/pages/admin/notification/AdminNotificationListPage'
import AdminApiPage from '@/pages/admin/system/AdminApiPage'
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
      icon: (props) => <SupervisorAccount {...props} />,
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
            {
              path: 'detail',
              label: '고객사 상세',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':companyNo',
                  element: <AdminCustomerCompanyDetailPage />,
                },
              ],
            },
            {
              path: 'provider-detail',
              label: '데이터 프로바이더 상세',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':companyNo/:providerNo',
                  element: <AdminCustomerCompanyDataProviderDetailPage />,
                },
                {
                  path: ':companyNo/:providerNo/:goodsNo',
                  element: <AdminCustomerCompanyProductDetailPage />,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'member-mgmt',
      icon: (props) => <ManageAccountsSharp {...props} />,
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
      icon: (props) => <DataExplorationIcon {...props} />,
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
      icon: (props) => <Notifications {...props} />,
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
      icon: (props) => <VolumeDownAlt {...props} />,
      label: '게시판 관리',
      children: [
        {
          index: true,
          element: <Navigate to="notice" replace />,
        },
        {
          path: 'notice',
          label: '공지사항',
          children: [
            {
              index: true,
              element: <AdminBoardsNoticePage />,
            },
            {
              path: 'registration',
              label: '공지사항 등록',
              element: <AdminBoardsNoticeRegistrationPage />,
              hidden: true,
            },
            {
              path: 'detail',
              label: '공지사항 상세',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':noticeNo',
                  element: <AdminBoardsNoticeDetailPage />,
                },
              ],
            },
            {
              path: 'edit',
              label: '공지사항 수정',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':noticeNo',
                  element: <AdminBoardsNoticeEditPage />,
                },
              ],
            },
          ],
        },
        {
          path: 'faq',
          label: 'FAQ',
          children: [
            {
              index: true,
              element: <AdminBoardsFaqPage />,
            },
            {
              path: 'registration',
              label: 'FAQ 등록',
              element: <AdminBoardsFaqRegistrationPage />,
              hidden: true,
            },
            {
              path: 'detail',
              label: 'FAQ 상세',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':faqNo',
                  element: <AdminBoardsFaqDetailPage />,
                },
              ],
            },
            {
              path: 'edit',
              label: 'FAQ 수정',
              hidden: true,
              hasBack: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':faqNo',
                  element: <AdminBoardsFaqEditPage />,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'system',
      icon: (props) => <Settings {...props} />,
      label: '시스템 관리',
      children: [
        {
          index: true,
          element: <Navigate to="api" replace />,
        },
        {
          path: 'api',
          label: 'API 관리',
          element: <AdminApiPage />,
        },
      ],
    },
  ],
}

export default AdminRoutes
