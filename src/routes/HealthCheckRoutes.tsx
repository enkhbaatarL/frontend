import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'

const HealthCheck = lazy(() => import('../pages/HealthCheck'))

export const healthCheckRoutes: RouteObject[] = [
  {
    path: '/healthcheck',
    element: <HealthCheck />,
  },
]
