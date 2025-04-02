import { Outlet, RouteObject } from 'react-router-dom'

import PolicyPage from '@/pages/common/PolicyPage'
import TermPage from '@/pages/common/TermPage'
import ComponentTestPage from '@/pages/test/ComponentTestPage'
import TestErrorPage from '@/pages/test/TestErrorPage'
import TestFileUploadPage from '@/pages/test/TestFileUploadPage'
import TestPage from '@/pages/test/TestPage'
import TestSkeletonPage from '@/pages/test/TestSkeletonPage'
import AdminProvider from '@/providers/AdminProvider'

const ComponentTestLayout = () => (
  <AdminProvider>
    <Outlet />
  </AdminProvider>
)

const TestRoutes: RouteObject = {
  path: 'test',
  children: [
    {
      index: true,
      element: <TestPage />,
    },
    {
      path: 'component',
      element: <ComponentTestLayout />,
      children: [
        {
          index: true,
          element: <ComponentTestPage />,
        },
      ],
    },
    {
      path: 'skeleton',
      element: <TestSkeletonPage />,
    },
    {
      path: 'upload',
      element: <TestFileUploadPage />,
    },
    {
      path: 'error',
      element: <TestErrorPage />,
    },
    {
      path: 'privacy-policy',
      element: <PolicyPage />,
    },
    {
      path: 'terms-of-service',
      element: <TermPage />,
    },
  ],
}

export default TestRoutes
