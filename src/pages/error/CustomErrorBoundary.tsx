import { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useLocation } from 'react-router-dom'

import ErrorUnknownPage from '@/pages/error/ErrorUnknownPage'

const onError = (_error: unknown, _info: ErrorInfo): void => undefined

type CustomErrorBoundaryProps = {
  children?: React.ReactNode
  fallbackComponent?: React.ReactNode
}

const CustomErrorBoundary = ({ children, fallbackComponent = <ErrorUnknownPage /> }: CustomErrorBoundaryProps) => {
  const { pathname } = useLocation()

  return (
    <ErrorBoundary fallback={fallbackComponent} onError={onError} resetKeys={[pathname]}>
      {children}
    </ErrorBoundary>
  )
}

export default CustomErrorBoundary
