import { ManageAccounts, Apartment, AccountTree, NotificationsActive, Dashboard, BarChart } from '@mui/icons-material'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface IMenuItem {
  key: string
  label: string
  icon?: ReactNode
  path?: string
  children?: IMenuItem[]
  hidden?: boolean
}

const getPathFromKey = (key: string, items: IMenuItem[]): string | undefined => {
  for (const item of items) {
    if (item.key === key) {
      return item.path
    }
    if (item.children) {
      const childPath = getPathFromKey(key, item.children)

      if (childPath) {
        return childPath
      }
    }
  }

  return undefined
}

const useAdminMenuItems = () => {
  const { t } = useTranslation()

  const adminMenuItems: IMenuItem[] = [
    {
      key: 'customer-company',
      label: t('고객사 관리'),
      icon: <Apartment />,
      path: '/admin/customer-company',
      children: [
        {
          key: 'customer-companies',
          label: t('고객사 목록'),
          path: '/admin/customer-company/companies',
          children: [
            {
              key: 'customer-company-registration',
              label: t('고객사 등록'),
              path: '/admin/customer-company/companies/registration',
              hidden: true,
            },
          ],
        },
      ],
    },
    {
      key: 'member-mgmt',
      label: t('사용자 관리'),
      icon: <ManageAccounts />,
      path: '/admin/member-mgmt',
      children: [
        {
          key: 'service-user',
          label: t('서비스 회원'),
          path: '/admin/member-mgmt/users',
        },
        {
          key: 'admin-managers',
          label: t('어드민 관리자'),
          path: '/admin/member-mgmt/managers',
        },
      ],
    },
    {
      key: 'data-providers',
      label: t('데이터 프로바이더 관리'),
      icon: <AccountTree />,
      path: '/admin/data-providers',
      children: [
        {
          key: 'provider-list',
          label: t('데이터 프로바이더 목록'),
          path: '/admin/data-providers/list',
        },
        {
          key: 'provider-data',
          label: t('데이터 목록'),
          path: '/admin/data-providers/data',
        },
      ],
    },
    {
      key: 'notifications',
      label: t('알람 관리'),
      icon: <NotificationsActive />,
      path: '/admin/notification',
      children: [
        {
          key: 'notification-list',
          label: t('알람 발송 목록'),
          path: '/admin/notification/list',
        },
      ],
    },
    {
      key: 'board-management',
      label: t('게시판 관리'),
      icon: <Dashboard />,
      path: '/admin/boards',
      children: [
        {
          key: 'notices',
          label: t('공지사항'),
          path: '/admin/boards/notices',
        },
        {
          key: 'faq',
          label: t('FAQ'),
          path: '/admin/boards/faq',
        },
      ],
    },
    {
      key: 'analytics',
      label: t('통계 분석'),
      icon: <BarChart />,
      path: '/admin/analytics',
      children: [
        {
          key: 'analytics-dashboard',
          label: t('대시보드'),
          path: '/admin/analytics/dashboard',
        },
        {
          key: 'analytics-table',
          label: t('테이블'),
          path: '/admin/analytics/table',
        },
      ],
    },
  ]

  const getPath = (key: string) => getPathFromKey(key, adminMenuItems) ?? '/admin'

  return { adminMenuItems, getPath }
}

export default useAdminMenuItems
