import { t } from 'i18next'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const AdminManagementManagersPageHeader = () => {
  const navigate = useNavigate()

  return (
    <Flex gap={4}>
      <AdminButton variant="contained" color="primary" size="h34" onClick={() => navigate('/admin/member-mgmt/managers/registration')}>
        {t('관리자 등록')}
      </AdminButton>
    </Flex>
  )
}

const AdminMemberManagementManagersPage = () => {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(<AdminManagementManagersPageHeader />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return null
}

export default AdminMemberManagementManagersPage
