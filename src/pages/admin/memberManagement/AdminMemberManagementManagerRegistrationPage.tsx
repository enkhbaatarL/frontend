import { t } from 'i18next'
import { useEffect } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const AdminMemberManagementManagersRegistrationPageHeader = ({
  registrationInfo,
  onCancel,
  onRegistration,
}: {
  registrationInfo: {
    admin: null
    allowExternalService: boolean
    adminIps: string[]
  }
  onCancel: () => void
  onRegistration: () => void
}) => (
  <Flex gap={4}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton disabled={!registrationInfo.admin} color="primary" variant="contained" size="h34" onClick={onRegistration}>
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementManagersRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(
      <AdminMemberManagementManagersRegistrationPageHeader
        onRegistration={() => {}}
        onCancel={() => {}}
        registrationInfo={{
          admin: null,
          adminIps: [],
          allowExternalService: false,
        }}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return null
}

export default AdminMemberManagementManagersRegistrationPage
