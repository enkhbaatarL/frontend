import { t } from 'i18next'
import { useEffect } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const AdminCustomerCompanyManagementUserPageHeader = ({
  registeredUsers,
  setIsOpenCancel,
  setIsOpenRegistration,
}: {
  registeredUsers: []
  setIsOpenCancel: (value: boolean) => void
  setIsOpenRegistration: (value: boolean) => void
}) => (
  <Flex gap={4}>
    <AdminButton
      variant="outlined"
      color="secondary"
      size="h34"
      onClick={() => {
        setIsOpenCancel(true)
      }}
    >
      {t('취소')}
    </AdminButton>
    <AdminButton
      disabled={registeredUsers.length === 0}
      color="primary"
      variant="contained"
      size="h34"
      onClick={() => setIsOpenRegistration(true)}
    >
      {t('등록')}
    </AdminButton>
  </Flex>
)

const AdminMemberManagementUserRegistrationPage = () => {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(
      <AdminCustomerCompanyManagementUserPageHeader
        setIsOpenRegistration={(value: boolean) => value}
        setIsOpenCancel={(value: boolean) => value}
        registeredUsers={[]}
      />,
    )

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return null
}

export default AdminMemberManagementUserRegistrationPage
