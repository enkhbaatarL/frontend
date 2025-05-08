import { t } from 'i18next'
import { useState } from 'react'

import AdminConfirm from '@/components/admin/AdminConfirm'

const SessionExpiredPage = () => {
  const [showPopup, setShowPopup] = useState(true)

  return (
    <AdminConfirm
      open={showPopup}
      title={t('세션이 만료되었습니다.')}
      width={350}
      handleClose={() => setShowPopup(true)}
      actions={[
        {
          label: 'Login',
          variant: 'filled',
          color: 'primary',
          onClick: () => alert('Redirect to login'),
        },
      ]}
    />
  )
}

export default SessionExpiredPage
