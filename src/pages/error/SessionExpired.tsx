import { t } from 'i18next'
import { useState } from 'react'

import MIConfirm from '@/components/common/confirm/MIConfirm'

const SessionExpiredPage = () => {
  const [showPopup, setShowPopup] = useState(true)

  return (
    <MIConfirm
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
