import { t } from 'i18next'

import LockComponent from '@/pages/error/components/LockComponent'

const ErrorAccessDeniedPage = () => (
  <LockComponent
    title="AI Market Insights"
    message={
      <>
        <div>{t('접근 권한이 없습니다')}</div>
        <div>{t('관리자에게 시스템 사용자 등록을 요청해 주세요.')}</div>
      </>
    }
  />
)

export default ErrorAccessDeniedPage
