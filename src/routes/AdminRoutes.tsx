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
import AdminCustomerCompanyManagementOwnerCompaniesPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyManagementOwnerCompaniesPage'
import AdminCustomerCompanyProductDetailPage from '@/pages/admin/customerCompanyManagement/AdminCustomerCompanyProductDetailPage'
import AdminDataProviderProductDetailPage from '@/pages/admin/dataProviders/AdminDataProviderProductDetailPage'
import AdminDataProviderRegistrationPage from '@/pages/admin/dataProviders/AdminDataProviderRegistrationPage'
import AdminDataProvidersDetailPage from '@/pages/admin/dataProviders/AdminDataProvidersDetailPage'
import AdminDataProvidersListPage from '@/pages/admin/dataProviders/AdminDataProvidersListPage'
import AdminDataRegistration from '@/pages/admin/dataProviders/AdminDataRegistration'
import AdminMemberManagementManagersRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementManagerRegistrationPage'
import AdminMemberManagementManagersPage from '@/pages/admin/memberManagement/AdminMemberManagementManagersPage'
import AdminMemberManagementMangerDetailPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerDetailPage'
import AdminMemberManagementMangerEditPage from '@/pages/admin/memberManagement/AdminMemberManagementMangerEditPage'
import AdminMemberManagementUserRegistrationPage from '@/pages/admin/memberManagement/AdminMemberManagementUserRegistrationPage'
import AdminMemberManagementUsersPage from '@/pages/admin/memberManagement/AdminMemberManagementUsersPage'
import AdminNotificationListPage from '@/pages/admin/notification/AdminNotificationListPage'
import AdminApiPage from '@/pages/admin/system/AdminApiPage'
import AdminCompanyInfoPage from '@/pages/admin/system/AdminCompanyInfoPage'
import AdminMcpAuthPage from '@/pages/admin/system/AdminMcpAuthPage'
import AdminTokenManagementPage from '@/pages/admin/tokens/AdminTokenManagementPage'
import AdminProvider from '@/providers/AdminProvider'
import { UserRole } from '@/service/admin/members'
import useAuthStore from '@/store/useAuthStore'
import { ICustomRouteObject } from '@/types/common'

const AdminSystemIndexPage = () => {
  const userRoleCd = useAuthStore((state) => state.user?.userRoleCd)

  return <Navigate to={userRoleCd === UserRole.OPERATOR ? 'company' : 'api'} replace />
}

const AdminOnlyApiPage = () => {
  const userRoleCd = useAuthStore((state) => state.user?.userRoleCd)

  return userRoleCd === UserRole.ADMIN ? <AdminApiPage /> : <Navigate to="/admin/system/company" replace />
}

// [MCP 인증] API 관리와 같이 ADMIN 전용, 운영자는 화이트라벨 설정으로 이동
const AdminOnlyMcpAuthPage = () => {
  const userRoleCd = useAuthStore((state) => state.user?.userRoleCd)

  return userRoleCd === UserRole.ADMIN ? <AdminMcpAuthPage /> : <Navigate to="/admin/system/company" replace />
}

const OperatorCompanyInfoPage = () => <AdminCompanyInfoPage useCurrentCompanyLogoApi />

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
              label: '고객사 목록',
            },
            {
              path: 'registration',
              element: <AdminCustomerCompanyManagementCompaniesRegistrationPage />,
              label: '고객사 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/customer-company/companies',
            },
            {
              path: 'detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':companyNo',
                  element: <AdminCustomerCompanyDetailPage />,
                  label: '고객사 상세',
                  hasBack: true,
                  parentPath: '/admin/customer-company/companies',
                },
              ],
            },
            {
              path: 'provider-detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':companyNo/:providerNo',
                  element: <AdminCustomerCompanyDataProviderDetailPage />,
                  label: '데이터 프로바이더 상세',
                  hasBack: true,
                  parentPath: '/admin/customer-company/companies/detail/:companyNo',
                },
                {
                  path: ':companyNo/:providerNo/:goodsNo',
                  element: <AdminCustomerCompanyProductDetailPage />,
                  label: '상품 상세',
                  hasBack: true,
                  parentPath: '/admin/customer-company/companies/provider-detail/:companyNo/:providerNo',
                },
              ],
            },
          ],
        },
        {
          path: 'owner-companies',
          label: '관리사 목록',
          element: <AdminCustomerCompanyManagementOwnerCompaniesPage />,
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
              label: '서비스 회원',
            },
            {
              path: 'registration',
              element: <AdminMemberManagementUserRegistrationPage />,
              label: '회원 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/member-mgmt/users',
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
              label: '어드민 관리자',
            },
            {
              path: 'registration',
              element: <AdminMemberManagementManagersRegistrationPage />,
              label: '관리자 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/member-mgmt/managers',
            },
            {
              path: 'detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':userNo',
                  element: <AdminMemberManagementMangerDetailPage />,
                  label: '관리자 상세',
                  hasBack: true,
                  parentPath: '/admin/member-mgmt/managers',
                },
              ],
            },
            {
              path: 'edit',
              hidden: true,
              children: [
                {
                  path: ':userNo',
                  element: <AdminMemberManagementMangerEditPage />,
                  label: '관리자 수정',
                  hasBack: true,
                  parentPath: '/admin/member-mgmt/managers/detail/:userNo',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'tokens',
      icon: (props) => <DataExplorationIcon {...props} />,
      label: '사용 현황',
      children: [
        {
          index: true,
          element: <Navigate to="tokens" replace />,
        },
        {
          path: 'providers',
          label: '사용 현황 조회',
          children: [
            {
              index: true,
              element: <AdminTokenManagementPage />,
              label: '사용 현황 조회',
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
          element: <Navigate to="providers" replace />,
        },
        {
          path: 'providers',
          label: '데이터 프로바이더 목록',
          children: [
            {
              index: true,
              element: <AdminDataProvidersListPage />,
              label: '데이터 프로바이더 목록',
            },
            {
              path: 'registration',
              element: <AdminDataProviderRegistrationPage />,
              label: '데이터 프로바이더 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/data-providers/providers',
            },
            {
              path: 'detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':providerNo',
                  element: <AdminDataProvidersDetailPage />,
                  label: '데이터 프로바이더 상세',
                  hasBack: true,
                  parentPath: '/admin/data-providers/providers',
                },
              ],
            },
            {
              path: 'product-detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':providerNo/:goodsNo',
                  element: <AdminDataProviderProductDetailPage />,
                  label: '상품 상세',
                  hidden: true,
                  hasBack: true,
                  parentPath: '/admin/data-providers/providers/detail/:providerNo',
                },
                {
                  path: ':providerNo/:goodsNo/data-registration',
                  element: <AdminDataRegistration />,
                  label: '데이터 등록',
                  hasBack: true,
                  parentPath: '/admin/data-providers/providers/product-detail/:providerNo/:goodsNo',
                },
                {
                  path: ':providerNo/:goodsNo/data-detail/:dataNo',
                  label: '데이터 등록',
                  element: <AdminDataRegistration />,
                  parentPath: '/admin/data-providers/providers/product-detail/:providerNo/:goodsNo',
                },
              ],
            },
          ],
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
              label: '공지사항',
            },
            {
              path: 'registration',
              element: <AdminBoardsNoticeRegistrationPage />,
              label: '공지사항 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/boards/notice',
            },
            {
              path: 'detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':noticeNo',
                  element: <AdminBoardsNoticeDetailPage />,
                  label: '공지사항 상세',
                  hasBack: true,
                  parentPath: '/admin/boards/notice',
                },
              ],
            },
            {
              path: 'edit',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':noticeNo',
                  element: <AdminBoardsNoticeEditPage />,
                  label: '공지사항 수정',
                  hasBack: true,
                  parentPath: '/admin/boards/notice/detail/:noticeNo',
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
              label: 'FAQ',
            },
            {
              path: 'registration',
              element: <AdminBoardsFaqRegistrationPage />,
              label: 'FAQ 등록',
              hidden: true,
              hasBack: true,
              parentPath: '/admin/boards/faq',
            },
            {
              path: 'detail',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':faqNo',
                  element: <AdminBoardsFaqDetailPage />,
                  label: 'FAQ 상세',
                  hasBack: true,
                  parentPath: '/admin/boards/faq',
                },
              ],
            },
            {
              path: 'edit',
              hidden: true,
              children: [
                {
                  index: true,
                  element: <Navigate to=".." replace />,
                },
                {
                  path: ':faqNo',
                  element: <AdminBoardsFaqEditPage />,
                  label: 'FAQ 수정',
                  hasBack: true,
                  parentPath: '/admin/boards/faq/detail/:faqNo',
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
          element: <AdminSystemIndexPage />,
        },
        {
          path: 'api',
          label: 'API 관리',
          element: <AdminOnlyApiPage />,
        },
        {
          // [MCP 인증] 시스템 관리 > MCP API 인증관리 (API 관리와 같은 레벨)
          path: 'mcp-auth',
          label: 'MCP API 인증관리',
          element: <AdminOnlyMcpAuthPage />,
        },
        {
          path: 'company',
          label: '화이트라벨 설정',
          element: <OperatorCompanyInfoPage />,
        },
      ],
    },
  ],
}

export default AdminRoutes
