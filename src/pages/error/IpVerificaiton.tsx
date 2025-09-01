import { t } from 'i18next'

import LockComponent from '@/pages/error/components/LockComponent'

const ErrorIpVerificationPage = () => (
  <LockComponent
    title="AI Market Insights"
    message={
      <>
        <div>{t('허용된 IP가 아닙니다.')}</div>
        <div>{t('관리자에게 문의해 주세요.')}</div>
      </>
    }
  />
)

export default ErrorIpVerificationPage
