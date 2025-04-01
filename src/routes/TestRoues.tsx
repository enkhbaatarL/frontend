import { RouteObject } from 'react-router-dom'

import PolicyPage from '@/pages/common/PolicyPage'
import ComponentTestPage from '@/pages/test/ComponentTestPage'
import TestErrorPage from '@/pages/test/TestErrorPage'
import TestFileUploadPage from '@/pages/test/TestFileUploadPage'
import TestPage from '@/pages/test/TestPage'
import TestSkeletonPage from '@/pages/test/TestSkeletonPage'

const TestRoutes: RouteObject = {
  path: 'test',
  children: [
    {
      index: true,
      element: <TestPage />,
    },
    {
      path: 'component',
      element: <ComponentTestPage />,
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
      path: 'policy',
      element: <PolicyPage />,
    },
  ],
}

export default TestRoutes
