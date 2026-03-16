import { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import ErrorUnknownPage from './ErrorUnknownPage'

/* 에러 로깅 함수 */
const onError = (error: unknown, info: ErrorInfo): void => {
  /* 에러 로깅 서비스로 에러 정보 전송 */
  console.error('Debug - :', error, info)
}

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
