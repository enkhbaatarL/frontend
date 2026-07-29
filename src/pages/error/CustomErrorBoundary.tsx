import { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import ErrorUnknownPage from './ErrorUnknownPage'

const onError = (_error: unknown, _info: ErrorInfo): void => undefined

type CustomErrorBoundaryProps = {
  children?: React.ReactNode
  fallbackComponent?: React.ReactNode
}

const CustomErrorBoundary = ({ children, fallbackComponent = <ErrorUnknownPage /> }: CustomErrorBoundaryProps) => (
  <ErrorBoundary fallback={fallbackComponent} onError={onError} key={location.pathname}>
    {children}
  </ErrorBoundary>
)

export default CustomErrorBoundary
