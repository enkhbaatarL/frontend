import { t } from 'i18next'
import { useEffect } from 'react'

import AdminButton from '@/components/admin/AdminButton'
import Flex from '@/components/common/display/Flex'
import { useAdminHeader } from '@/contexts/AdminHeaderContext'

const AdminMemberManagementMangerEditPageHeader = ({ onCancel, onSave }: { onSave: () => void; onCancel: () => void }) => (
  <Flex gap={10}>
    <AdminButton variant="outlined" color="secondary" size="h34" onClick={onCancel}>
      {t('취소')}
    </AdminButton>
    <AdminButton color="primary" variant="contained" size="h34" onClick={onSave}>
      {t('저장')}
    </AdminButton>
  </Flex>
)

export default function AdminMemberManagementMangerEditPage() {
  const { setCustomComponent } = useAdminHeader()

  useEffect(() => {
    setCustomComponent(<AdminMemberManagementMangerEditPageHeader onCancel={() => {}} onSave={() => {}} />)

    return () => {
      setCustomComponent(null)
    }
  }, [setCustomComponent])

  return null
}
