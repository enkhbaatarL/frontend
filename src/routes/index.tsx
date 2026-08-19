import { omit } from 'lodash-es'
import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom'

import ProtectedRoute from '@/components/common/ProtectedRoute'
import { ResetKeyProvider } from '@/contexts/ResetKeyContext'
import CallbackProcessingPage from '@/pages/common/CallbackProcessingPage'
import LoginPage from '@/pages/common/LoginPage'
import NewsletterRenderPage from '@/pages/common/NewsletterRenderPage'
import PdfViewerPage from '@/pages/common/PdfViewerPage'
import PersonalInformationAgreementPage from '@/pages/common/PersonalInformationAgreementPage'
import ExternalLoginPage from '@/pages/mi/externalLogin/externalLoginPage'
import AdminRoutes from '@/routes/AdminRoutes'
import ErrorRoutes from '@/routes/ErrorRoutes'
import { healthCheckRoutes } from '@/routes/HealthCheckRoutes'
import MIRoutes from '@/routes/MIRoutes'
import { ICustomRouteObject } from '@/types/common'

const NotFoundRedirect = () => <Navigate to="/error/404" replace={true} />

const commonRoutes: ICustomRouteObject[] = [
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: 'login',
    element: <ExternalLoginPage />,
  },
  {
    ...AdminRoutes,
    element: <ProtectedRoute>{AdminRoutes.element}</ProtectedRoute>,
  },
  {
    ...MIRoutes,
    element: <ProtectedRoute>{MIRoutes.element}</ProtectedRoute>,
  },
  {
    path: 'callback',
    element: <CallbackProcessingPage />,
  },
  {
    path: 'saml2/authenticate',
    element: <CallbackProcessingPage />,
  },
  {
    path: 'pdf-viewer/:fileId',
    element: <PdfViewerPage />,
  },
  {
    path: 'newsletter-render',
    element: <NewsletterRenderPage />,
  },
  {
    path: 'terms-agreement',
    element: <PersonalInformationAgreementPage />,
  },
  { ...ErrorRoutes },
  ...healthCheckRoutes,
  {
    path: '/*',
    element: <NotFoundRedirect />,
  },
]

const convertToRouteObject = (route: ICustomRouteObject): RouteObject => {
  const baseRoute = omit(route, ['icon', 'label', 'hidden']) as RouteObject

  if (route.children) {
    baseRoute.children = route.children.map((child) => convertToRouteObject(child))
  }

  return baseRoute
}

export const AppRoutes = () => {
  const routes: RouteObject[] = commonRoutes.map((route) => convertToRouteObject(route))

  const element = createBrowserRouter(routes, {
    basename: '/',
  })

  return (
    <ResetKeyProvider>
      <RouterProvider router={element} />
    </ResetKeyProvider>
  )
}
